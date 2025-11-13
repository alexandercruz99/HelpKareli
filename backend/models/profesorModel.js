/* ============================================
   SPEAKLEXI - MODELO DE PROFESOR
   Módulo 4: Dashboard y Gestión de Estudiantes
   
   CORREGIDO v2: Usar tabla profesor_estudiantes
   
   Funciones:
   - Dashboard del profesor
   - Gestión de estudiantes asignados
   - Estadísticas y métricas
   - Alertas y notificaciones
   ============================================ */

const database = require('../config/database');

class ProfesorModel {
    
    /**
     * Obtener información del profesor con su asignación
     */
    static async obtenerInfoProfesor(profesorId) {
        const query = `
            SELECT 
                u.id,
                u.nombre,
                u.primer_apellido,
                pa.nivel,
                pa.idioma,
                c.id as curso_id,
                c.nombre as curso_nombre
            FROM usuarios u
            INNER JOIN profesor_asignaciones pa ON pa.profesor_id = u.id
            INNER JOIN cursos c ON c.id = pa.curso_id
            WHERE u.id = ? AND pa.activo = TRUE
            LIMIT 1
        `;
        
        const [rows] = await database.pool.execute(query, [profesorId]);
        return rows[0] || null;
    }
    
    /**
     * Obtener estudiantes asignados al profesor
     * ✅ CORREGIDO v2: Calcular estadísticas desde progreso_lecciones
     */
    static async obtenerEstudiantes(profesorId) {
        const query = `
            SELECT 
                pe.usuario_id as id,
                u.nombre,
                u.primer_apellido,
                CONCAT(u.nombre, ' ', u.primer_apellido) as nombre_completo,
                u.correo,
                pe.nivel_actual,
                pe.idioma_aprendizaje,
                pe.total_xp,
                
                -- Calcular lecciones desde progreso_lecciones
                (SELECT COUNT(*) FROM progreso_lecciones pl 
                 WHERE pl.usuario_id = pe.usuario_id AND pl.completada = TRUE) as lecciones_completadas,
                
                (SELECT COUNT(*) FROM progreso_lecciones pl 
                 WHERE pl.usuario_id = pe.usuario_id) as lecciones_iniciadas,
                
                -- Calcular promedio de progreso
                (SELECT AVG(progreso) FROM progreso_lecciones pl 
                 WHERE pl.usuario_id = pe.usuario_id) as promedio_progreso,
                
                -- Calcular tiempo total en segundos
                (SELECT SUM(tiempo_total_segundos) FROM progreso_lecciones pl 
                 WHERE pl.usuario_id = pe.usuario_id) as tiempo_total_estudio,
                
                pa.curso_id,
                c.nombre as curso_nombre
            FROM profesor_estudiantes pes
            INNER JOIN perfil_estudiantes pe ON pe.usuario_id = pes.estudiante_id
            INNER JOIN usuarios u ON u.id = pe.usuario_id
            INNER JOIN profesor_asignaciones pa ON pa.profesor_id = pes.profesor_id
            INNER JOIN cursos c ON c.id = pa.curso_id
            WHERE pes.profesor_id = ? 
                AND pes.activo = TRUE 
                AND u.rol = 'alumno'
                AND u.estado_cuenta = 'activo'
            ORDER BY pe.total_xp DESC
        `;
        
        const [rows] = await database.pool.execute(query, [profesorId]);
        return rows;
    }
    
    /**
     * Obtener estadísticas generales de la clase
     * ✅ CORREGIDO v2: Calcular desde progreso_lecciones en tiempo real
     */
    static async obtenerEstadisticasGenerales(profesorId) {
        const query = `
            SELECT 
                COUNT(DISTINCT pe.usuario_id) as total_estudiantes,
                
                -- Promedio de progreso de todas las lecciones
                AVG(COALESCE(pl.progreso, 0)) as promedio_clase,
                
                -- Total de lecciones completadas por todos los estudiantes
                COUNT(CASE WHEN pl.completada = TRUE THEN 1 END) as total_lecciones_completadas,
                
                -- Tiempo total en minutos
                SUM(COALESCE(pl.tiempo_total_segundos, 0)) / 60 as tiempo_total_clase,
                
                -- Estudiantes que han completado al menos 1 lección
                COUNT(DISTINCT CASE WHEN pl.completada = TRUE THEN pe.usuario_id END) as estudiantes_activos,
                
                -- Promedio de XP
                AVG(COALESCE(pe.total_xp, 0)) as promedio_xp
                
            FROM profesor_estudiantes pes
            INNER JOIN perfil_estudiantes pe ON pe.usuario_id = pes.estudiante_id
            INNER JOIN usuarios u ON u.id = pe.usuario_id
            LEFT JOIN progreso_lecciones pl ON pl.usuario_id = pe.usuario_id
            WHERE pes.profesor_id = ? 
                AND pes.activo = TRUE
                AND u.rol = 'alumno'
                AND u.estado_cuenta = 'activo'
        `;
        
        const [rows] = await database.pool.execute(query, [profesorId]);
        return rows[0];
    }
    
    /**
     * Obtener top estudiantes por XP
     * ✅ CORREGIDO v2: Calcular estadísticas desde progreso_lecciones
     */
    static async obtenerTopEstudiantes(profesorId, limit = 5) {
        const limitSafe = parseInt(limit) || 5;
        
        const query = `
            SELECT 
                pe.usuario_id as id,
                u.nombre,
                u.primer_apellido,
                CONCAT(u.nombre, ' ', u.primer_apellido) as nombre_completo,
                pe.total_xp,
                
                -- Calcular desde progreso_lecciones
                (SELECT COUNT(*) FROM progreso_lecciones pl 
                 WHERE pl.usuario_id = pe.usuario_id AND pl.completada = TRUE) as lecciones_completadas,
                
                (SELECT AVG(progreso) FROM progreso_lecciones pl 
                 WHERE pl.usuario_id = pe.usuario_id) as promedio_general,
                
                (SELECT SUM(tiempo_total_segundos) FROM progreso_lecciones pl 
                 WHERE pl.usuario_id = pe.usuario_id) as tiempo_total_estudio
                
            FROM profesor_estudiantes pes
            INNER JOIN perfil_estudiantes pe ON pe.usuario_id = pes.estudiante_id
            INNER JOIN usuarios u ON u.id = pe.usuario_id
            WHERE pes.profesor_id = ? 
                AND pes.activo = TRUE
                AND u.rol = 'alumno'
                AND u.estado_cuenta = 'activo'
            ORDER BY pe.total_xp DESC
            LIMIT ${limitSafe}
        `;
        
        const [rows] = await database.pool.execute(query, [profesorId]);
        return rows;
    }
    
    /**
     * Obtener alertas del profesor
     */
    static async obtenerAlertas(profesorId, soloNoRevisadas = true) {
        let query = `
            SELECT 
                a.id,
                a.estudiante_id,
                CONCAT(u.nombre, ' ', u.primer_apellido) as estudiante_nombre,
                a.tipo_alerta,
                a.severidad,
                a.titulo,
                a.descripcion,
                a.metadata,
                a.creado_en,
                c.nombre as curso_nombre,
                l.titulo as leccion_titulo
            FROM alertas_automaticas a
            INNER JOIN usuarios u ON u.id = a.estudiante_id
            INNER JOIN cursos c ON c.id = a.curso_id
            LEFT JOIN lecciones l ON l.id = a.leccion_id
            WHERE a.profesor_id = ?
        `;
        
        if (soloNoRevisadas) {
            query += ' AND a.revisada = FALSE';
        }
        
        query += ' ORDER BY a.creado_en DESC';
        
        const [rows] = await database.pool.execute(query, [profesorId]);
        return rows;
    }
    
    /**
     * Obtener estadísticas detalladas de un estudiante específico
     * ✅ CORREGIDO: Usar tabla profesor_estudiantes
     */
    static async obtenerEstadisticasEstudiante(profesorId, estudianteId) {
        const query = `
            SELECT 
                pe.usuario_id as id,
                CONCAT(u.nombre, ' ', u.primer_apellido) as nombre_completo,
                u.correo,
                pe.nivel_actual,
                pe.idioma_aprendizaje,
                pe.total_xp,
                COALESCE(ee.lecciones_completadas, 0) as lecciones_completadas,
                COALESCE(ee.promedio_general, 0) as promedio_general,
                COALESCE(ee.tiempo_total_estudio, 0) as tiempo_total_estudio,
                pa.curso_id,
                c.nombre as curso_nombre,
                
                -- Estadísticas de ejercicios
                (SELECT COUNT(*) FROM resultados_ejercicios re WHERE re.usuario_id = pe.usuario_id) as total_ejercicios_intentados,
                (SELECT AVG(puntuacion_obtenida) FROM resultados_ejercicios re WHERE re.usuario_id = pe.usuario_id) as promedio_ejercicios,
                
                -- Progreso en lecciones
                (SELECT COUNT(*) FROM progreso_lecciones pl WHERE pl.usuario_id = pe.usuario_id AND pl.completado = TRUE) as lecciones_completadas_total,
                (SELECT COUNT(*) FROM progreso_lecciones pl WHERE pl.usuario_id = pe.usuario_id) as lecciones_iniciadas_total
                
            FROM profesor_estudiantes pes
            INNER JOIN perfil_estudiantes pe ON pe.usuario_id = pes.estudiante_id
            INNER JOIN usuarios u ON u.id = pe.usuario_id
            INNER JOIN profesor_asignaciones pa ON pa.profesor_id = pes.profesor_id
            INNER JOIN cursos c ON c.id = pa.curso_id
            LEFT JOIN estadisticas_estudiante ee ON ee.usuario_id = pe.usuario_id
            WHERE pes.profesor_id = ? 
                AND pe.usuario_id = ?
                AND pes.activo = TRUE
            LIMIT 1
        `;
        
        const [rows] = await database.pool.execute(query, [profesorId, estudianteId]);
        return rows[0] || null;
    }
    
    /**
     * Obtener lecciones del curso del profesor
     */
    static async obtenerLeccionesCurso(profesorId) {
        const query = `
            SELECT 
                l.id,
                l.titulo,
                l.descripcion,
                l.nivel,
                l.duracion_minutos,
                l.orden,
                l.estado,
                COUNT(pl.id) as total_estudiantes_completado,
                AVG(COALESCE(pl.puntuacion, 0)) as puntuacion_promedio
            FROM profesor_asignaciones pa
            INNER JOIN cursos c ON c.id = pa.curso_id
            INNER JOIN lecciones l ON l.curso_id = c.id
            LEFT JOIN progreso_lecciones pl ON pl.leccion_id = l.id AND pl.completado = TRUE
            WHERE pa.profesor_id = ? 
                AND pa.activo = TRUE
                AND l.estado = 'activa'
            GROUP BY l.id, l.titulo, l.descripcion, l.nivel, l.duracion_minutos, l.orden, l.estado
            ORDER BY l.orden ASC
        `;
        
        const [rows] = await database.pool.execute(query, [profesorId]);
        return rows;
    }
    
    /**
     * Verificar que el profesor tiene acceso al estudiante
     * ✅ CORREGIDO: Usar tabla profesor_estudiantes
     */
    static async verificarAccesoEstudiante(profesorId, estudianteId) {
        const query = `
            SELECT COUNT(*) as tiene_acceso
            FROM profesor_estudiantes
            WHERE profesor_id = ? 
                AND estudiante_id = ?
                AND activo = TRUE
        `;
        
        const [rows] = await database.pool.execute(query, [profesorId, estudianteId]);
        return rows[0].tiene_acceso > 0;
    }
    
    /**
     * Marcar alerta como revisada
     */
    static async marcarAlertaRevisada(alertaId, profesorId) {
        const query = `
            UPDATE alertas_automaticas 
            SET revisada = TRUE, fecha_revision = NOW()
            WHERE id = ? AND profesor_id = ?
        `;
        
        await database.pool.execute(query, [alertaId, profesorId]);
    }
}

module.exports = ProfesorModel;