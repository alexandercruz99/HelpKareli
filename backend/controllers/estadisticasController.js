/* ============================================
   SPEAKLEXI - CONTROLADOR DE ESTADÍSTICAS
   Módulo 4: Gestión de Desempeño (UC-13)
   ============================================ */

const EstadisticasModel = require('../models/estadisticasModel');

const EstadisticasController = {
    
    /**
     * GET /api/estadisticas/generales
     * Obtener estadísticas generales del profesor
     */
    async obtenerEstadisticasGenerales(req, res) {
        try {
            const profesorId = req.usuario.id;
            
            const estadisticas = await EstadisticasModel.obtenerEstadisticasGenerales(profesorId);
            
            res.status(200).json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('Error al obtener estadísticas generales:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al obtener estadísticas generales',
                error: error.message
            });
        }
    },

    /**
     * GET /api/estadisticas/alumnos
     * Obtener lista de alumnos con su progreso
     * Query params: nivel, idioma, ordenar, limite
     */
    async obtenerListaAlumnos(req, res) {
        try {
            const profesorId = req.usuario.id;
            const filtros = {
                nivel: req.query.nivel,
                idioma: req.query.idioma,
                ordenar: req.query.ordenar || 'nombre',
                limite: parseInt(req.query.limite) || 50
            };
            
            const alumnos = await EstadisticasModel.obtenerListaAlumnos(profesorId, filtros);
            
            res.status(200).json({
                success: true,
                data: alumnos,
                total: alumnos.length
            });

        } catch (error) {
            console.error('Error al obtener lista de alumnos:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al obtener lista de alumnos',
                error: error.message
            });
        }
    },

    /**
     * GET /api/estadisticas/alumno/:id
     * Obtener progreso individual detallado de un alumno
     */
    async obtenerProgresoIndividual(req, res) {
        try {
            const profesorId = req.usuario.id;
            const alumnoId = parseInt(req.params.id);
            
            if (!alumnoId) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'ID de alumno inválido'
                });
            }
            
            const progreso = await EstadisticasModel.obtenerProgresoIndividual(alumnoId, profesorId);
            
            res.status(200).json({
                success: true,
                data: progreso
            });

        } catch (error) {
            console.error('Error al obtener progreso individual:', error);
            
            if (error.message.includes('no encontrado')) {
                return res.status(404).json({
                    success: false,
                    mensaje: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                mensaje: 'Error al obtener progreso individual',
                error: error.message
            });
        }
    },

    /**
     * GET /api/estadisticas/tiempos-promedio
     * Obtener tiempos promedio por lección
     */
    async obtenerTiemposPromedio(req, res) {
        try {
            const profesorId = req.usuario.id;
            
            const tiempos = await EstadisticasModel.obtenerTiempoPromedioPorLeccion(profesorId);
            
            res.status(200).json({
                success: true,
                data: tiempos,
                total: tiempos.length
            });

        } catch (error) {
            console.error('Error al obtener tiempos promedio:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al obtener tiempos promedio',
                error: error.message
            });
        }
    },

    /**
     * GET /api/estadisticas/tasas-completitud
     * Obtener tasas de completitud por nivel/idioma
     * Query params: agrupar_por (nivel o idioma)
     */
    async obtenerTasasCompletitud(req, res) {
        try {
            const profesorId = req.usuario.id;
            const agruparPor = req.query.agrupar_por || 'nivel';
            
            if (!['nivel', 'idioma'].includes(agruparPor)) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'agrupar_por debe ser "nivel" o "idioma"'
                });
            }
            
            const tasas = await EstadisticasModel.obtenerTasasCompletitud(profesorId, agruparPor);
            
            res.status(200).json({
                success: true,
                data: tasas,
                agrupado_por: agruparPor
            });

        } catch (error) {
            console.error('Error al obtener tasas de completitud:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al obtener tasas de completitud',
                error: error.message
            });
        }
    },

    /**
     * GET /api/estadisticas/tendencia
     * Obtener tendencia de progreso semanal/mensual
     * Query params: periodo (semanal o mensual)
     */
    async obtenerTendencia(req, res) {
        try {
            const profesorId = req.usuario.id;
            const periodo = req.query.periodo || 'semanal';
            
            if (!['semanal', 'mensual'].includes(periodo)) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'periodo debe ser "semanal" o "mensual"'
                });
            }
            
            const tendencia = await EstadisticasModel.obtenerTendenciaProgreso(profesorId, periodo);
            
            res.status(200).json({
                success: true,
                data: tendencia,
                periodo
            });

        } catch (error) {
            console.error('Error al obtener tendencia:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al obtener tendencia de progreso',
                error: error.message
            });
        }
    },

    // =================================================================
    // 🆕 NUEVAS FUNCIONES PARA DASHBOARD PROFESOR
    // =================================================================

    /**
     * GET /api/estadisticas/resumen-general
     * Obtener resumen general de todos los estudiantes (para profesor)
     */
    async obtenerResumenGeneral(req, res) {
        try {
            // 1. Total de estudiantes activos
            const [totalEstudiantes] = await db.pool.execute(`
                SELECT COUNT(*) as total
                FROM usuarios
                WHERE rol = 'alumno' AND estado_cuenta = 'activo'
            `);

            // 2. Estudiantes por nivel
            const [estudiantesPorNivel] = await db.pool.execute(`
                SELECT 
                    nivel_actual,
                    COUNT(*) as cantidad
                FROM perfil_estudiantes
                GROUP BY nivel_actual
                ORDER BY 
                    FIELD(nivel_actual, 'A1', 'A2', 'B1', 'B2', 'C1', 'C2')
            `);

            // 3. Estudiantes por idioma
            const [estudiantesPorIdioma] = await db.pool.execute(`
                SELECT 
                    idioma_aprendizaje,
                    COUNT(*) as cantidad
                FROM perfil_estudiantes
                GROUP BY idioma_aprendizaje
                ORDER BY cantidad DESC
            `);

            // 4. Actividad reciente (últimos 7 días)
            const [actividadReciente] = await db.pool.execute(`
                SELECT 
                    DATE(actualizado_en) as fecha,
                    COUNT(DISTINCT usuario_id) as estudiantes_activos,
                    COUNT(*) as lecciones_completadas
                FROM progreso_lecciones
                WHERE completada = 1
                  AND actualizado_en >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(actualizado_en)
                ORDER BY fecha DESC
            `);

            // 5. Lecciones más populares
            const [leccionesPopulares] = await db.pool.execute(`
                SELECT 
                    l.id,
                    l.titulo,
                    l.nivel,
                    l.idioma,
                    COUNT(DISTINCT pl.usuario_id) as estudiantes,
                    COUNT(*) as veces_completada
                FROM lecciones l
                JOIN progreso_lecciones pl ON l.id = pl.leccion_id
                WHERE pl.completada = 1
                GROUP BY l.id
                ORDER BY veces_completada DESC
                LIMIT 5
            `);

            // 6. Estadísticas generales
            const [estadisticasGenerales] = await db.pool.execute(`
                SELECT 
                    COUNT(DISTINCT pl.usuario_id) as estudiantes_con_progreso,
                    SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) as total_lecciones_completadas,
                    AVG(pe.total_xp) as promedio_xp,
                    SUM(pl.tiempo_total_segundos) / 3600 as horas_totales_estudio
                FROM progreso_lecciones pl
                JOIN perfil_estudiantes pe ON pl.usuario_id = pe.usuario_id
            `);

            res.status(200).json({
                success: true,
                data: {
                    resumen: {
                        total_estudiantes: totalEstudiantes[0].total,
                        estudiantes_con_progreso: estadisticasGenerales[0].estudiantes_con_progreso || 0,
                        total_lecciones_completadas: estadisticasGenerales[0].total_lecciones_completadas || 0,
                        promedio_xp: Math.round(estadisticasGenerales[0].promedio_xp || 0),
                        horas_totales_estudio: Math.round(estadisticasGenerales[0].horas_totales_estudio || 0)
                    },
                    estudiantes_por_nivel: estudiantesPorNivel,
                    estudiantes_por_idioma: estudiantesPorIdioma,
                    actividad_reciente: actividadReciente,
                    lecciones_populares: leccionesPopulares
                }
            });

        } catch (error) {
            console.error('Error al obtener resumen general:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error del servidor',
                error: error.message
            });
        }
    },

    /**
     * GET /api/estadisticas/estudiantes
     * Obtener lista de estudiantes con sus estadísticas
     */
    async obtenerListaEstudiantes(req, res) {
        try {
            const { limite = 20, pagina = 1, nivel, idioma, orden = 'nombre' } = req.query;
            const offset = (pagina - 1) * limite;

            // Construir filtros
            let whereClause = "WHERE u.rol = 'alumno' AND u.estado_cuenta = 'activo'";
            const params = [];

            if (nivel) {
                whereClause += " AND pe.nivel_actual = ?";
                params.push(nivel);
            }

            if (idioma) {
                whereClause += " AND pe.idioma_aprendizaje = ?";
                params.push(idioma);
            }

            // Determinar orden
            let orderClause = 'ORDER BY u.nombre ASC, u.primer_apellido ASC';
            if (orden === 'xp') {
                orderClause = 'ORDER BY pe.total_xp DESC';
            } else if (orden === 'progreso') {
                orderClause = 'ORDER BY lecciones_completadas DESC';
            } else if (orden === 'actividad') {
                orderClause = 'ORDER BY pe.ultima_actividad DESC';
            }

            // Consulta principal
            const query = `
                SELECT 
                    u.id,
                    u.nombre,
                    u.primer_apellido,
                    u.segundo_apellido,
                    u.correo,
                    pe.nivel_actual,
                    pe.idioma_aprendizaje,
                    pe.total_xp,
                    pe.ultima_actividad,
                    COUNT(DISTINCT pl.leccion_id) as lecciones_iniciadas,
                    SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) as lecciones_completadas,
                    AVG(pl.progreso) as promedio_progreso
                FROM usuarios u
                JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
                LEFT JOIN progreso_lecciones pl ON u.id = pl.usuario_id
                ${whereClause}
                GROUP BY u.id
                ${orderClause}
                LIMIT ? OFFSET ?
            `;

            params.push(parseInt(limite), parseInt(offset));
            const [estudiantes] = await db.pool.execute(query, params);

            // Contar total
            const countQuery = `
                SELECT COUNT(DISTINCT u.id) as total
                FROM usuarios u
                JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
                ${whereClause}
            `;
            const countParams = params.slice(0, -2); // Quitar LIMIT y OFFSET
            const [total] = await db.pool.execute(countQuery, countParams);

            res.status(200).json({
                success: true,
                data: {
                    estudiantes: estudiantes.map(est => ({
                        ...est,
                        promedio_progreso: Math.round(est.promedio_progreso || 0)
                    })),
                    paginacion: {
                        pagina: parseInt(pagina),
                        limite: parseInt(limite),
                        total: total[0].total,
                        total_paginas: Math.ceil(total[0].total / limite)
                    }
                }
            });

        } catch (error) {
            console.error('Error al obtener lista de estudiantes:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error del servidor',
                error: error.message
            });
        }
    },

    /**
     * GET /api/estadisticas/estudiantes/:id
     * Obtener detalle de un estudiante específico
     */
    async obtenerDetalleEstudiante(req, res) {
        try {
            const { id } = req.params;

            // 1. Información básica del estudiante
            const [estudiante] = await db.pool.execute(`
                SELECT 
                    u.id,
                    u.nombre,
                    u.primer_apellido,
                    u.segundo_apellido,
                    u.correo,
                    u.fecha_registro,
                    pe.nivel_actual,
                    pe.idioma_aprendizaje,
                    pe.total_xp,
                    pe.ultima_actividad
                FROM usuarios u
                JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
                WHERE u.id = ? AND u.rol = 'alumno'
            `, [id]);

            if (!estudiante.length) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Estudiante no encontrado'
                });
            }

            // 2. Estadísticas de progreso
            const [estadisticas] = await db.pool.execute(`
                SELECT 
                    COUNT(DISTINCT leccion_id) as lecciones_iniciadas,
                    SUM(CASE WHEN completada = 1 THEN 1 ELSE 0 END) as lecciones_completadas,
                    SUM(tiempo_total_segundos) / 3600 as horas_estudio,
                    AVG(progreso) as promedio_progreso
                FROM progreso_lecciones
                WHERE usuario_id = ?
            `, [id]);

            // 3. Progreso por nivel
            const [progresoPorNivel] = await db.pool.execute(`
                SELECT 
                    l.nivel,
                    COUNT(DISTINCT l.id) as total_lecciones,
                    SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) as completadas
                FROM lecciones l
                LEFT JOIN progreso_lecciones pl ON l.id = pl.leccion_id AND pl.usuario_id = ?
                WHERE l.idioma = ?
                GROUP BY l.nivel
                ORDER BY FIELD(l.nivel, 'A1', 'A2', 'B1', 'B2', 'C1', 'C2')
            `, [id, estudiante[0].idioma_aprendizaje]);

            // 4. Últimas lecciones completadas
            const [ultimasLecciones] = await db.pool.execute(`
                SELECT 
                    l.titulo,
                    l.nivel,
                    pl.actualizado_en as fecha_completada
                FROM progreso_lecciones pl
                JOIN lecciones l ON pl.leccion_id = l.id
                WHERE pl.usuario_id = ? AND pl.completada = 1
                ORDER BY pl.actualizado_en DESC
                LIMIT 10
            `, [id]);

            // 5. Logros obtenidos
            const [logros] = await db.pool.execute(`
                SELECT 
                    logro_id,
                    titulo,
                    descripcion,
                    desbloqueado_en
                FROM logros_usuario
                WHERE usuario_id = ?
                ORDER BY desbloqueado_en DESC
            `, [id]);

            // 6. Actividad semanal (últimos 7 días)
            const [actividadSemanal] = await db.pool.execute(`
                SELECT 
                    DATE(actualizado_en) as fecha,
                    COUNT(*) as lecciones,
                    SUM(tiempo_total_segundos) / 60 as minutos
                FROM progreso_lecciones
                WHERE usuario_id = ?
                  AND actualizado_en >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(actualizado_en)
                ORDER BY fecha DESC
            `, [id]);

            res.status(200).json({
                success: true,
                data: {
                    estudiante: estudiante[0],
                    estadisticas: {
                        lecciones_iniciadas: estadisticas[0].lecciones_iniciadas || 0,
                        lecciones_completadas: estadisticas[0].lecciones_completadas || 0,
                        horas_estudio: Math.round(estadisticas[0].horas_estudio || 0),
                        promedio_progreso: Math.round(estadisticas[0].promedio_progreso || 0)
                    },
                    progreso_por_nivel: progresoPorNivel,
                    ultimas_lecciones: ultimasLecciones,
                    logros: logros,
                    actividad_semanal: actividadSemanal
                }
            });

        } catch (error) {
            console.error('Error al obtener detalle del estudiante:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error del servidor',
                error: error.message
            });
        }
    },

    /**
     * GET /api/estadisticas/estudiantes-alerta
     * Obtener estudiantes con bajo rendimiento (alerta)
     */
    async obtenerEstudiantesAlerta(req, res) {
        try {
            // Criterios de alerta:
            // 1. Sin actividad en más de 7 días
            // 2. Progreso promedio menor a 30%
            // 3. Menos de 3 lecciones completadas en el mes

            const [estudiantes] = await db.pool.execute(`
                SELECT 
                    u.id,
                    u.nombre,
                    u.primer_apellido,
                    u.correo,
                    pe.nivel_actual,
                    pe.idioma_aprendizaje,
                    pe.ultima_actividad,
                    DATEDIFF(NOW(), pe.ultima_actividad) as dias_sin_actividad,
                    COUNT(CASE 
                        WHEN pl.completada = 1 
                        AND pl.actualizado_en >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                        THEN 1 
                    END) as lecciones_mes,
                    AVG(pl.progreso) as promedio_progreso
                FROM usuarios u
                JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
                LEFT JOIN progreso_lecciones pl ON u.id = pl.usuario_id
                WHERE u.rol = 'alumno' 
                  AND u.estado_cuenta = 'activo'
                  AND (
                      pe.ultima_actividad IS NULL 
                      OR pe.ultima_actividad < DATE_SUB(NOW(), INTERVAL 7 DAY)
                  )
                GROUP BY u.id
                HAVING promedio_progreso < 30 OR lecciones_mes < 3
                ORDER BY dias_sin_actividad DESC
                LIMIT 20
            `);

            res.status(200).json({
                success: true,
                data: {
                    total_alertas: estudiantes.length,
                    estudiantes: estudiantes.map(est => ({
                        ...est,
                        motivo_alerta: this.determinarMotivoAlerta(est)
                    }))
                }
            });

        } catch (error) {
            console.error('Error al obtener estudiantes con alerta:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error del servidor',
                error: error.message
            });
        }
    },

    /**
     * Función auxiliar para determinar motivo de alerta
     */
    determinarMotivoAlerta(estudiante) {
        const motivos = [];
        
        if (estudiante.dias_sin_actividad >= 7) {
            motivos.push(`Sin actividad por ${estudiante.dias_sin_actividad} días`);
        }
        if (estudiante.promedio_progreso < 30) {
            motivos.push(`Progreso bajo (${Math.round(estudiante.promedio_progreso)}%)`);
        }
        if (estudiante.lecciones_mes < 3) {
            motivos.push(`Solo ${estudiante.lecciones_mes} lecciones este mes`);
        }
        
        return motivos.join(' · ');
    }
};

module.exports = EstadisticasController;