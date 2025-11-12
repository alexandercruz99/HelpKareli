// backend/models/gamificacionModel.js
const db = require('../config/database');
const pool = db.pool || db;

/**
 * MODELO: Gamificación (XP, Logros, Rachas)
 * Integración con SpeakLexi 2.0
 */

// Configuración de niveles CEFR basados en XP
const NIVELES_CEFR = [
    { nivel: 'A1', xp_requerido: 0 },
    { nivel: 'A2', xp_requerido: 100 },
    { nivel: 'B1', xp_requerido: 300 },
    { nivel: 'B2', xp_requerido: 600 },
    { nivel: 'C1', xp_requerido: 1000 },
    { nivel: 'C2', xp_requerido: 1500 }
];

/**
 * Calcular nivel CEFR según XP total
 * @param {number} xpTotal - Total de XP del usuario
 * @returns {string} Nivel CEFR (A1, A2, B1, B2, C1, C2)
 */
function calcularNivelPorXP(xpTotal) {
    for (let i = NIVELES_CEFR.length - 1; i >= 0; i--) {
        if (xpTotal >= NIVELES_CEFR[i].xp_requerido) {
            return NIVELES_CEFR[i].nivel;
        }
    }
    return 'A1';
}

/**
 * Otorgar XP a un estudiante
 * @param {number} usuarioId - ID del usuario
 * @param {number} cantidad - Cantidad de XP a otorgar
 * @param {object} metadata - Información adicional (tipo, leccion_id, etc.)
 */
exports.otorgarXP = async (usuarioId, cantidad, metadata = {}) => {
    try {
        // 1. Actualizar XP total en perfil_estudiantes
        const [resultado] = await pool.execute(
            'UPDATE perfil_estudiantes SET total_xp = total_xp + ? WHERE usuario_id = ?',
            [cantidad, usuarioId]
        );

        if (resultado.affectedRows === 0) {
            throw new Error('Usuario no encontrado o no es estudiante');
        }

        // 2. Registrar en historial de XP (si existe la tabla)
        try {
            await pool.execute(`
                INSERT INTO historial_xp (usuario_id, cantidad, tipo, metadata, creado_en)
                VALUES (?, ?, ?, ?, NOW())
            `, [
                usuarioId, 
                cantidad, 
                metadata.tipo || 'general',
                JSON.stringify(metadata)
            ]);
        } catch (err) {
            // Si la tabla no existe, continuar (no es crítico)
            console.warn('Tabla historial_xp no existe, saltando registro');
        }

        // 3. Verificar si cambió de nivel CEFR
        const [perfil] = await pool.execute(
            'SELECT total_xp, nivel_actual FROM perfil_estudiantes WHERE usuario_id = ?',
            [usuarioId]
        );

        if (perfil.length > 0) {
            const nuevoNivel = calcularNivelPorXP(perfil[0].total_xp);
            
            // Si cambió de nivel, actualizar
            if (nuevoNivel !== perfil[0].nivel_actual) {
                await pool.execute(
                    'UPDATE perfil_estudiantes SET nivel_actual = ? WHERE usuario_id = ?',
                    [nuevoNivel, usuarioId]
                );
            }
        }

        return {
            xp_otorgado: cantidad,
            xp_total: perfil[0].total_xp + cantidad,
            nivel_actual: calcularNivelPorXP(perfil[0].total_xp + cantidad)
        };

    } catch (error) {
        console.error('Error al otorgar XP:', error);
        throw error;
    }
};

/**
 * Verificar y desbloquear logros
 * @param {number} usuarioId - ID del usuario
 * @returns {array} Lista de logros desbloqueados
 */
exports.verificarLogros = async (usuarioId) => {
    try {
        const logrosNuevos = [];

        // Obtener estadísticas del usuario
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(CASE WHEN completada = 1 THEN 1 END) as lecciones_completadas,
                pe.total_xp,
                pe.racha_dias
            FROM progreso_lecciones pl
            JOIN perfil_estudiantes pe ON pl.usuario_id = pe.usuario_id
            WHERE pl.usuario_id = ?
            GROUP BY pe.usuario_id, pe.total_xp, pe.racha_dias
        `, [usuarioId]);

        if (!stats.length) return logrosNuevos;

        const { lecciones_completadas, total_xp, racha_dias } = stats[0];

        // DEFINICIÓN DE LOGROS
        const logros = [
            {
                id: 'primera_leccion',
                condicion: lecciones_completadas >= 1,
                titulo: 'Primera Lección',
                descripcion: 'Completaste tu primera lección',
                tipo: 'leccion'
            },
            {
                id: 'aprendiz',
                condicion: lecciones_completadas >= 10,
                titulo: 'Aprendiz',
                descripcion: 'Completaste 10 lecciones',
                tipo: 'leccion'
            },
            {
                id: 'estudioso',
                condicion: lecciones_completadas >= 50,
                titulo: 'Estudioso',
                descripcion: 'Completaste 50 lecciones',
                tipo: 'leccion'
            },
            {
                id: 'maestro',
                condicion: lecciones_completadas >= 100,
                titulo: 'Maestro del Idioma',
                descripcion: 'Completaste 100 lecciones',
                tipo: 'leccion'
            },
            {
                id: 'racha_7',
                condicion: racha_dias >= 7,
                titulo: 'Racha de 7 días',
                descripcion: 'Mantuviste una racha de 7 días consecutivos',
                tipo: 'racha'
            },
            {
                id: 'racha_30',
                condicion: racha_dias >= 30,
                titulo: 'Racha de 30 días',
                descripcion: 'Mantuviste una racha de 30 días consecutivos',
                tipo: 'racha'
            },
            {
                id: 'xp_1000',
                condicion: total_xp >= 1000,
                titulo: '1000 XP',
                descripcion: 'Alcanzaste 1000 puntos de experiencia',
                tipo: 'xp'
            }
        ];

        // Verificar cada logro
        for (const logro of logros) {
            if (logro.condicion) {
                // Verificar si ya tiene el logro
                const [existe] = await pool.execute(
                    'SELECT id FROM logros_usuario WHERE usuario_id = ? AND logro_id = ?',
                    [usuarioId, logro.id]
                );

                // Si no lo tiene, desbloquearlo
                if (!existe.length) {
                    try {
                        await pool.execute(`
                            INSERT INTO logros_usuario (usuario_id, logro_id, titulo, descripcion, tipo, desbloqueado_en)
                            VALUES (?, ?, ?, ?, ?, NOW())
                        `, [usuarioId, logro.id, logro.titulo, logro.descripcion, logro.tipo]);

                        logrosNuevos.push(logro);
                    } catch (err) {
                        // Si la tabla no existe, continuar
                        console.warn('Tabla logros_usuario no existe, saltando logro');
                    }
                }
            }
        }

        return logrosNuevos;

    } catch (error) {
        console.error('Error al verificar logros:', error);
        throw error;
    }
};

/**
 * Actualizar racha de días consecutivos
 * @param {number} usuarioId - ID del usuario
 */
exports.actualizarRacha = async (usuarioId) => {
    try {
        // Obtener última actividad y racha actual
        const [perfil] = await pool.execute(`
            SELECT racha_dias, ultima_actividad
            FROM perfil_estudiantes
            WHERE usuario_id = ?
        `, [usuarioId]);

        if (!perfil.length) return;

        const { racha_dias, ultima_actividad } = perfil[0];
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        let nuevaRacha = racha_dias || 0;

        if (!ultima_actividad) {
            // Primera actividad
            nuevaRacha = 1;
        } else {
            const ultimaActividad = new Date(ultima_actividad);
            ultimaActividad.setHours(0, 0, 0, 0);

            const diferenciaDias = Math.floor((hoy - ultimaActividad) / (1000 * 60 * 60 * 24));

            if (diferenciaDias === 0) {
                // Mismo día, no cambiar racha
                return;
            } else if (diferenciaDias === 1) {
                // Día consecutivo, incrementar racha
                nuevaRacha = racha_dias + 1;
            } else {
                // Rompió la racha, reiniciar
                nuevaRacha = 1;
            }
        }

        // Actualizar racha y última actividad
        await pool.execute(`
            UPDATE perfil_estudiantes
            SET racha_dias = ?, ultima_actividad = NOW()
            WHERE usuario_id = ?
        `, [nuevaRacha, usuarioId]);

        return {
            racha_anterior: racha_dias,
            racha_nueva: nuevaRacha,
            actualizada: nuevaRacha !== racha_dias
        };

    } catch (error) {
        console.error('Error al actualizar racha:', error);
        throw error;
    }
};

/**
 * Obtener información completa de gamificación del usuario
 * @param {number} usuarioId - ID del usuario
 */
exports.obtenerPerfilGamificacion = async (usuarioId) => {
    try {
        const [perfil] = await pool.execute(`
            SELECT 
                pe.total_xp,
                pe.nivel_actual,
                pe.racha_dias,
                pe.ultima_actividad,
                pe.lecciones_completadas,
                pe.cursos_completados,
                pu.nombre_completo,
                pu.foto_perfil
            FROM perfil_estudiantes pe
            JOIN usuarios u ON pe.usuario_id = u.id
            JOIN perfil_usuarios pu ON u.id = pu.usuario_id
            WHERE pe.usuario_id = ?
        `, [usuarioId]);

        if (!perfil.length) {
            return null;
        }

        const datos = perfil[0];
        
        // Calcular progreso hacia siguiente nivel
        const nivelActual = datos.nivel_actual;
        const niveles = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const indiceActual = niveles.indexOf(nivelActual);
        const siguienteNivel = indiceActual < niveles.length - 1 ? niveles[indiceActual + 1] : null;

        // XP requerido para siguiente nivel
        const xpRequerido = {
            'A1': 0, 'A2': 100, 'B1': 300, 
            'B2': 600, 'C1': 1000, 'C2': 1500
        };

        const xpActual = datos.total_xp;
        const xpNivelActual = xpRequerido[nivelActual];
        const xpSiguienteNivel = siguienteNivel ? xpRequerido[siguienteNivel] : xpRequerido['C2'];
        
        const progresoSiguiente = siguienteNivel 
            ? Math.min(100, Math.round(((xpActual - xpNivelActual) / (xpSiguienteNivel - xpNivelActual)) * 100))
            : 100;

        // Obtener logros del usuario
        const logros = await this.obtenerLogrosUsuario(usuarioId);

        // Obtener posición en ranking
        const posicion = await this.obtenerPosicionUsuario(usuarioId);

        return {
            ...datos,
            progreso_siguiente_nivel: progresoSiguiente,
            xp_faltante_siguiente_nivel: siguienteNivel ? xpSiguienteNivel - xpActual : 0,
            siguiente_nivel: siguienteNivel,
            logros: logros,
            ranking: posicion
        };

    } catch (error) {
        console.error('Error al obtener perfil de gamificación:', error);
        throw error;
    }
};

/**
 * Obtener logros del usuario (versión mejorada)
 */
exports.obtenerLogrosUsuario = async (usuarioId) => {
    try {
        // Intentar obtener de tabla logros_usuario
        try {
            const [logros] = await pool.execute(`
                SELECT logro_id, titulo, descripcion, tipo, desbloqueado_en
                FROM logros_usuario 
                WHERE usuario_id = ?
                ORDER BY desbloqueado_en DESC
            `, [usuarioId]);

            if (logros.length > 0) {
                return logros;
            }
        } catch (err) {
            // Tabla no existe, continuar con método alternativo
            console.warn('Tabla logros_usuario no existe, usando logros mockeados');
        }

        // Método alternativo basado en estadísticas
        const [perfil] = await pool.execute(
            `SELECT * FROM perfil_estudiantes WHERE usuario_id = ?`,
            [usuarioId]
        );
        
        if (perfil.length === 0) {
            return [];
        }
        
        const p = perfil[0];
        const logros = [];
        
        // Logros basados en estadísticas
        if (p.lecciones_completadas >= 1) {
            logros.push({
                logro_id: 'primera_leccion',
                titulo: 'Primera Lección',
                descripcion: 'Completaste tu primera lección',
                tipo: 'leccion',
                desbloqueado_en: new Date()
            });
        }
        
        if (p.racha_dias >= 7) {
            logros.push({
                logro_id: 'racha_7',
                titulo: 'Racha de 7 días',
                descripcion: 'Estudiaste 7 días consecutivos',
                tipo: 'racha',
                desbloqueado_en: new Date()
            });
        }
        
        if (p.cursos_completados >= 1) {
            logros.push({
                logro_id: 'primer_curso',
                titulo: 'Primer Curso',
                descripcion: 'Completaste tu primer curso',
                tipo: 'curso',
                desbloqueado_en: new Date()
            });
        }
        
        if (p.total_xp >= 1000) {
            logros.push({
                logro_id: 'xp_1000',
                titulo: '1000 XP',
                descripcion: 'Alcanzaste 1000 puntos de experiencia',
                tipo: 'xp',
                desbloqueado_en: new Date()
            });
        }
        
        return logros;
        
    } catch (error) {
        console.error('Error en GamificacionModel.obtenerLogrosUsuario:', error);
        return [];
    }
};

/**
 * Obtener posición del usuario en el ranking global
 */
exports.obtenerPosicionUsuario = async (usuarioId) => {
    try {
        // Obtener XP del usuario
        const [perfil] = await pool.execute(
            'SELECT total_xp FROM perfil_estudiantes WHERE usuario_id = ?',
            [usuarioId]
        );
        
        if (perfil.length === 0) {
            return null;
        }
        
        const xpUsuario = perfil[0].total_xp;
        
        // Contar usuarios con más XP
        const [resultado] = await pool.execute(
            `SELECT COUNT(*) + 1 as posicion
             FROM perfil_estudiantes pe
             JOIN usuarios u ON pe.usuario_id = u.id
             WHERE pe.total_xp > ? AND u.estado_cuenta = 'activo'`,
            [xpUsuario]
        );
        
        // Total de usuarios activos
        const [total] = await pool.execute(
            `SELECT COUNT(*) as total
             FROM perfil_estudiantes pe
             JOIN usuarios u ON pe.usuario_id = u.id
             WHERE u.estado_cuenta = 'activo'`
        );
        
        return {
            posicion: resultado[0].posicion,
            total_usuarios: total[0].total,
            percentil: Math.round((1 - (resultado[0].posicion / total[0].total)) * 100)
        };
        
    } catch (error) {
        console.error('Error al obtener posición usuario:', error);
        return null;
    }
};

// Mantener funciones existentes para compatibilidad
exports.otorgarPuntos = exports.otorgarXP;
exports.obtenerNivelUsuario = exports.obtenerPerfilGamificacion;

module.exports = exports;