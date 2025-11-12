// backend/models/estadisticasModel.js
const db = require('../config/database');
const pool = db.pool || db;

/**
 * MODELO: Estadísticas para integración SpeakLexi 2.0
 * Funciones para estudiantes y profesores
 */

/**
 * Actualizar estadísticas de un estudiante basado en su progreso
 * @param {number} usuarioId - ID del usuario
 */
exports.actualizarDesdeProgreso = async (usuarioId) => {
    try {
        // Calcular estadísticas desde progreso_lecciones
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(DISTINCT leccion_id) as lecciones_iniciadas,
                SUM(CASE WHEN completada = 1 THEN 1 ELSE 0 END) as lecciones_completadas,
                AVG(progreso) as promedio_progreso,
                SUM(CASE WHEN completada = 1 THEN l.duracion_minutos ELSE 0 END) as tiempo_total_minutos
            FROM progreso_lecciones pl
            LEFT JOIN lecciones l ON pl.leccion_id = l.id
            WHERE pl.usuario_id = ?
        `, [usuarioId]);

        if (!stats.length) return false;

        const {
            lecciones_iniciadas,
            lecciones_completadas,
            promedio_progreso,
            tiempo_total_minutos
        } = stats[0];

        // Actualizar o crear registro en estadisticas_estudiante
        await pool.execute(`
            INSERT INTO estadisticas_estudiante (
                usuario_id,
                lecciones_completadas,
                lecciones_en_progreso,
                promedio_general,
                tiempo_total_estudio,
                ultima_actualizacion
            ) VALUES (?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                lecciones_completadas = VALUES(lecciones_completadas),
                lecciones_en_progreso = VALUES(lecciones_en_progreso),
                promedio_general = VALUES(promedio_general),
                tiempo_total_estudio = VALUES(tiempo_total_estudio),
                ultima_actualizacion = VALUES(ultima_actualizacion)
        `, [
            usuarioId,
            lecciones_completadas || 0,
            lecciones_iniciadas - lecciones_completadas || 0,
            promedio_progreso || 0,
            tiempo_total_minutos || 0
        ]);

        return true;

    } catch (error) {
        console.error('Error al actualizar estadísticas desde progreso:', error);
        // No lanzar error para que no bloquee el flujo principal
        return false;
    }
};

/**
 * Obtener estadísticas generales del profesor (compatible con UC-13)
 */
exports.obtenerEstadisticasGenerales = async (profesorId) => {
    try {
        // Total de alumnos del profesor
        const [totalAlumnos] = await pool.execute(
            `SELECT COUNT(DISTINCT u.id) as total
             FROM usuarios u
             INNER JOIN progreso_lecciones pl ON u.id = pl.usuario_id
             INNER JOIN lecciones l ON pl.leccion_id = l.id
             WHERE l.creado_por = ? AND u.rol = 'estudiante'`,
            [profesorId]
        );

        // Alumnos activos (última actividad en 7 días)
        const [alumnosActivos] = await pool.execute(
            `SELECT COUNT(DISTINCT u.id) as activos
             FROM usuarios u
             INNER JOIN progreso_lecciones pl ON u.id = pl.usuario_id
             INNER JOIN lecciones l ON pl.leccion_id = l.id
             WHERE l.creado_por = ? 
             AND u.rol = 'estudiante'
             AND pl.actualizado_en >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [profesorId]
        );

        // Lecciones completadas totales
        const [leccionesCompletadas] = await pool.execute(
            `SELECT COUNT(*) as total
             FROM progreso_lecciones pl
             INNER JOIN lecciones l ON pl.leccion_id = l.id
             WHERE l.creado_por = ? AND pl.completada = true`,
            [profesorId]
        );

        // Tasa de completitud general
        const [tasaCompletitud] = await pool.execute(
            `SELECT 
                COUNT(CASE WHEN pl.completada = true THEN 1 END) as completadas,
                COUNT(*) as total,
                (COUNT(CASE WHEN pl.completada = true THEN 1 END) / COUNT(*)) * 100 as tasa
             FROM progreso_lecciones pl
             INNER JOIN lecciones l ON pl.leccion_id = l.id
             WHERE l.creado_por = ?`,
            [profesorId]
        );

        return {
            total_alumnos: totalAlumnos[0].total,
            alumnos_activos: alumnosActivos[0].activos,
            lecciones_completadas: leccionesCompletadas[0].total,
            tasa_completitud: Math.round(tasaCompletitud[0].tasa || 0)
        };

    } catch (error) {
        console.error('Error al obtener estadísticas generales:', error);
        throw error;
    }
};

/**
 * Obtener lista de alumnos con su progreso
 */
exports.obtenerListaAlumnos = async (profesorId, filtros = {}) => {
    try {
        const { nivel, idioma, ordenar = 'nombre', limite = 50 } = filtros;
        
        let query = `
            SELECT 
                u.id,
                u.nombre,
                u.primer_apellido,
                u.correo,
                COUNT(DISTINCT pl.leccion_id) as lecciones_iniciadas,
                COUNT(DISTINCT CASE WHEN pl.completada = true THEN pl.leccion_id END) as lecciones_completadas,
                COALESCE(AVG(pl.progreso), 0) as progreso_promedio,
                MAX(pl.actualizado_en) as ultima_actividad,
                COALESCE(pe.total_xp, 0) as xp_total,
                COALESCE(pe.nivel_actual, 'A1') as nivel_estudiante
            FROM usuarios u
            INNER JOIN progreso_lecciones pl ON u.id = pl.usuario_id
            INNER JOIN lecciones l ON pl.leccion_id = l.id
            LEFT JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
            WHERE l.creado_por = ? AND u.rol = 'estudiante'
        `;
        
        const params = [profesorId];
        
        if (nivel) {
            query += ` AND l.nivel = ?`;
            params.push(nivel);
        }
        
        if (idioma) {
            query += ` AND l.idioma = ?`;
            params.push(idioma);
        }
        
        query += ` GROUP BY u.id, u.nombre, u.primer_apellido, u.correo, pe.total_xp, pe.nivel_actual`;
        
        // Ordenamiento
        switch (ordenar) {
            case 'progreso':
                query += ` ORDER BY progreso_promedio DESC`;
                break;
            case 'actividad':
                query += ` ORDER BY ultima_actividad DESC`;
                break;
            case 'xp':
                query += ` ORDER BY xp_total DESC`;
                break;
            default:
                query += ` ORDER BY u.nombre ASC`;
        }
        
        query += ` LIMIT ?`;
        params.push(limite);
        
        const [alumnos] = await pool.execute(query, params);
        
        // Formatear datos
        return alumnos.map(alumno => ({
            id: alumno.id,
            nombre_completo: `${alumno.nombre} ${alumno.primer_apellido || ''}`.trim(),
            correo: alumno.correo,
            lecciones_iniciadas: alumno.lecciones_iniciadas,
            lecciones_completadas: alumno.lecciones_completadas,
            progreso_promedio: Math.round(alumno.progreso_promedio),
            ultima_actividad: alumno.ultima_actividad,
            xp_total: alumno.xp_total,
            nivel: alumno.nivel_estudiante
        }));

    } catch (error) {
        console.error('Error al obtener lista de alumnos:', error);
        throw error;
    }
};

/**
 * Obtener progreso individual detallado de un alumno
 */
exports.obtenerProgresoIndividual = async (alumnoId, profesorId) => {
    try {
        // Información básica del alumno
        const [alumno] = await pool.execute(
            `SELECT u.id, u.nombre, u.primer_apellido, u.correo,
                    COALESCE(pe.total_xp, 0) as xp_total,
                    COALESCE(pe.nivel_actual, 'A1') as nivel,
                    COALESCE(pe.racha_dias, 0) as racha
             FROM usuarios u
             LEFT JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
             WHERE u.id = ?`,
            [alumnoId]
        );

        if (!alumno.length) {
            throw new Error('Alumno no encontrado');
        }

        // Progreso por lección
        const [progresoLecciones] = await pool.execute(
            `SELECT 
                l.id as leccion_id,
                l.titulo,
                l.nivel,
                l.idioma,
                pl.progreso,
                pl.completada,
                pl.actualizado_en as fecha_ultima_actividad
             FROM progreso_lecciones pl
             INNER JOIN lecciones l ON pl.leccion_id = l.id
             WHERE pl.usuario_id = ? AND l.creado_por = ?
             ORDER BY pl.actualizado_en DESC`,
            [alumnoId, profesorId]
        );

        // Análisis de fortalezas (lecciones con >80% progreso)
        const fortalezas = progresoLecciones
            .filter(l => l.progreso >= 80)
            .map(l => ({
                leccion: l.titulo,
                nivel: l.nivel,
                progreso: l.progreso
            }));

        // Análisis de debilidades (lecciones con <50% progreso)
        const debilidades = progresoLecciones
            .filter(l => l.progreso < 50 && l.progreso > 0)
            .map(l => ({
                leccion: l.titulo,
                nivel: l.nivel,
                progreso: l.progreso
            }));

        // Estadísticas generales del alumno
        const totalLecciones = progresoLecciones.length;
        const leccionesCompletadas = progresoLecciones.filter(l => l.completada).length;
        const progresoPromedio = totalLecciones > 0
            ? Math.round(progresoLecciones.reduce((sum, l) => sum + l.progreso, 0) / totalLecciones)
            : 0;

        return {
            alumno: {
                id: alumno[0].id,
                nombre: `${alumno[0].nombre} ${alumno[0].primer_apellido || ''}`.trim(),
                correo: alumno[0].correo,
                xp_total: alumno[0].xp_total,
                nivel: alumno[0].nivel,
                racha: alumno[0].racha
            },
            estadisticas: {
                total_lecciones: totalLecciones,
                lecciones_completadas: leccionesCompletadas,
                progreso_promedio: progresoPromedio,
                tasa_completitud: totalLecciones > 0 
                    ? Math.round((leccionesCompletadas / totalLecciones) * 100)
                    : 0
            },
            progreso_lecciones: progresoLecciones,
            fortalezas: fortalezas,
            debilidades: debilidades
        };

    } catch (error) {
        console.error('Error al obtener progreso individual:', error);
        throw error;
    }
};

/**
 * Obtener estadísticas personales del estudiante
 */
exports.obtenerEstadisticasPersonales = async (usuarioId) => {
    try {
        const [estadisticas] = await pool.execute(`
            SELECT 
                es.lecciones_completadas,
                es.lecciones_en_progreso,
                es.promedio_general,
                es.tiempo_total_estudio,
                es.ultima_actualizacion,
                pe.total_xp,
                pe.nivel_actual,
                pe.racha_dias
            FROM estadisticas_estudiante es
            JOIN perfil_estudiantes pe ON es.usuario_id = pe.usuario_id
            WHERE es.usuario_id = ?
        `, [usuarioId]);

        if (!estadisticas.length) {
            // Si no hay estadísticas, calcular desde progreso
            await this.actualizarDesdeProgreso(usuarioId);
            const [nuevasStats] = await pool.execute(
                'SELECT * FROM estadisticas_estudiante WHERE usuario_id = ?',
                [usuarioId]
            );
            return nuevasStats.length ? nuevasStats[0] : null;
        }

        return estadisticas[0];

    } catch (error) {
        console.error('Error al obtener estadísticas personales:', error);
        
        // Fallback: calcular desde progreso si la tabla no existe
        try {
            const [progresoData] = await pool.execute(`
                SELECT 
                    COUNT(DISTINCT leccion_id) as lecciones_iniciadas,
                    SUM(CASE WHEN completada = 1 THEN 1 ELSE 0 END) as lecciones_completadas,
                    AVG(progreso) as promedio_general
                FROM progreso_lecciones 
                WHERE usuario_id = ?
            `, [usuarioId]);

            if (progresoData.length) {
                return {
                    lecciones_completadas: progresoData[0].lecciones_completadas || 0,
                    lecciones_en_progreso: (progresoData[0].lecciones_iniciadas - progresoData[0].lecciones_completadas) || 0,
                    promedio_general: Math.round(progresoData[0].promedio_general || 0),
                    tiempo_total_estudio: 0,
                    ultima_actualizacion: new Date()
                };
            }
        } catch (fallbackError) {
            console.error('Error en fallback de estadísticas:', fallbackError);
        }

        return null;
    }
};

/**
 * Obtener tasas de completitud por nivel/idioma
 */
exports.obtenerTasasCompletitud = async (profesorId, agruparPor = 'nivel') => {
    try {
        const campo = agruparPor === 'idioma' ? 'l.idioma' : 'l.nivel';
        
        const [tasas] = await pool.execute(
            `SELECT 
                ${campo} as categoria,
                COUNT(DISTINCT l.id) as total_lecciones,
                COUNT(DISTINCT pl.usuario_id) as total_estudiantes,
                COUNT(CASE WHEN pl.completada = true THEN 1 END) as completadas,
                COUNT(*) as total_intentos,
                (COUNT(CASE WHEN pl.completada = true THEN 1 END) / COUNT(*)) * 100 as tasa_completitud,
                AVG(pl.progreso) as progreso_promedio
             FROM lecciones l
             LEFT JOIN progreso_lecciones pl ON l.id = pl.leccion_id
             WHERE l.creado_por = ?
             GROUP BY ${campo}
             ORDER BY tasa_completitud DESC`,
            [profesorId]
        );

        return tasas.map(t => ({
            categoria: t.categoria,
            total_lecciones: t.total_lecciones,
            total_estudiantes: t.total_estudiantes,
            completadas: t.completadas,
            total_intentos: t.total_intentos,
            tasa_completitud: Math.round(t.tasa_completitud || 0),
            progreso_promedio: Math.round(t.progreso_promedio || 0)
        }));

    } catch (error) {
        console.error('Error al obtener tasas de completitud:', error);
        throw error;
    }
};

// Mantener compatibilidad con funciones existentes
exports.obtenerTiempoPromedioPorLeccion = async (profesorId) => {
    // Implementación simplificada - tiempo no disponible en esquema actual
    return [];
};

exports.obtenerTendenciaProgreso = async (profesorId, periodo = 'semanal') => {
    // Implementación simplificada
    return [];
};

module.exports = exports;