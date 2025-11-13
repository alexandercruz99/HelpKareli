/* ============================================
   SPEAKLEXI - CONTROLADOR DE PROFESOR
   Módulo 4: Endpoints para Dashboard y Gestión
   
   CORREGIDO: req.usuario → req.user
   ACTUALIZADO: Formato de estadísticas detalladas
   
   Endpoints:
   - Dashboard principal
   - Gestión de estudiantes
   - Estadísticas detalladas (FORMATO CORREGIDO)
   - Alertas y notificaciones
   ============================================ */

const ProfesorModel = require('../models/profesorModel');
const RetroalimentacionModel = require('../models/retroalimentacionModel');
const PlanificacionModel = require('../models/planificacionModel');

class ProfesorController {
    
    /**
     * Obtener dashboard del profesor
     * GET /api/profesor/dashboard
     */
    static async obtenerDashboard(req, res) {
        try {
            const profesorId = req.user.id; // ✅ CORREGIDO: req.user en lugar de req.usuario
            
            // Obtener información del profesor
            const infoProfesor = await ProfesorModel.obtenerInfoProfesor(profesorId);
            
            if (!infoProfesor) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró asignación para este profesor'
                });
            }
            
            // Obtener estadísticas generales
            const estadisticas = await ProfesorModel.obtenerEstadisticasGenerales(profesorId);
            
            // Obtener top estudiantes
            const topEstudiantes = await ProfesorModel.obtenerTopEstudiantes(profesorId, 5);
            
            // Obtener alertas no revisadas
            const alertas = await ProfesorModel.obtenerAlertas(profesorId, true);
            
            // Obtener estadísticas de retroalimentación
            const statsRetroalimentacion = await RetroalimentacionModel.obtenerEstadisticasProfesor(profesorId);
            
            // Obtener estadísticas de planificación
            const statsPlanificacion = await PlanificacionModel.obtenerEstadisticasProfesor(profesorId);
            
            res.json({
                success: true,
                data: {
                    profesor: infoProfesor,
                    estadisticas: {
                        total_estudiantes: estadisticas.total_estudiantes || 0,
                        promedio_clase: Math.round(estadisticas.promedio_clase || 0),
                        total_lecciones_completadas: estadisticas.total_lecciones_completadas || 0,
                        tiempo_total_horas: Math.round((estadisticas.tiempo_total_clase || 0) / 60),
                        estudiantes_activos: estadisticas.estudiantes_activos || 0,
                        promedio_xp: estadisticas.promedio_xp || 0
                    },
                    estudiantes_recientes: topEstudiantes,
                    alertas: alertas.slice(0, 3), // Solo primeras 3
                    retroalimentacion: statsRetroalimentacion,
                    planificacion: statsPlanificacion
                }
            });
        } catch (error) {
            console.error('Error en obtenerDashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener dashboard del profesor',
                error: error.message
            });
        }
    }
    
    /**
     * Obtener lista de estudiantes
     * GET /api/profesor/estudiantes
     */
    static async obtenerEstudiantes(req, res) {
        try {
            const profesorId = req.user.id; // ✅ CORREGIDO
            const estudiantes = await ProfesorModel.obtenerEstudiantes(profesorId);
            
            res.json({
                success: true,
                data: estudiantes
            });
        } catch (error) {
            console.error('Error en obtenerEstudiantes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estudiantes',
                error: error.message
            });
        }
    }
    
    /**
     * Obtener estadísticas detalladas - FORMATO CORREGIDO
     * GET /api/profesor/estadisticas
     */
    static async obtenerEstadisticasDetalladas(req, res) {
        try {
            const profesorId = req.user.id; // ✅ CORREGIDO
            const { estudiante_id } = req.query;
            
            // Si se solicita un estudiante específico
            if (estudiante_id) {
                // Verificar acceso al estudiante
                const tieneAcceso = await ProfesorModel.verificarAccesoEstudiante(profesorId, estudiante_id);
                
                if (!tieneAcceso) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes acceso a este estudiante'
                    });
                }
                
                const estadisticasEstudiante = await ProfesorModel.obtenerEstadisticasEstudiante(profesorId, estudiante_id);
                
                if (!estadisticasEstudiante) {
                    return res.status(404).json({
                        success: false,
                        message: 'Estudiante no encontrado'
                    });
                }
                
                return res.json({
                    success: true,
                    data: estadisticasEstudiante
                });
            }
            
            // ✅ FORMATO CORREGIDO: Estadísticas generales con estructura específica
            const estadisticas = await ProfesorModel.obtenerEstadisticasGenerales(profesorId);
            const estudiantes = await ProfesorModel.obtenerEstudiantes(profesorId);
            const topEstudiantes = await ProfesorModel.obtenerTopEstudiantes(profesorId, 5);
            
            // Calcular tasa de completación si no viene del modelo
            const totalLeccionesPosibles = estudiantes.length * 10; // Asumiendo 10 lecciones por estudiante
            const tasaCompletacion = totalLeccionesPosibles > 0 
                ? Math.round((estadisticas.total_lecciones_completadas / totalLeccionesPosibles) * 100)
                : 0;

            // Formatear respuesta según estructura requerida
            const respuesta = {
                resumen: {
                    total_estudiantes: estadisticas.total_estudiantes || 0,
                    total_lecciones_completadas: estadisticas.total_lecciones_completadas || 0,
                    promedio_clase: Math.round(estadisticas.promedio_clase || estadisticas.promedio_xp || 0),
                    tasa_completacion: estadisticas.tasa_completacion || tasaCompletacion,
                    tiempo_total_horas: Math.round((estadisticas.tiempo_total_clase || 0) / 60) || 0,
                    estudiantes_activos: estadisticas.estudiantes_activos || 0
                },
                estudiantes: estudiantes.map(est => ({
                    estudiante_id: est.id,
                    estudiante_nombre: est.nombre_completo || `${est.nombre} ${est.primer_apellido}`,
                    nivel_actual: est.nivel_actual,
                    total_xp: est.total_xp,
                    lecciones_completadas: est.lecciones_completadas || 0,
                    racha_actual: est.racha_actual || 0
                })),
                top_estudiantes: topEstudiantes.map(est => ({
                    estudiante_id: est.id,
                    estudiante_nombre: est.nombre_completo || `${est.nombre} ${est.primer_apellido}`,
                    nivel_actual: est.nivel_actual,
                    total_xp: est.total_xp,
                    lecciones_completadas: est.lecciones_completadas || 0,
                    racha_actual: est.racha_actual || 0
                })),
                temas_dificultad: await ProfesorModel.obtenerTemasDificultad(profesorId) || []
            };

            res.json({
                success: true,
                data: respuesta
            });
        } catch (error) {
            console.error('Error en obtenerEstadisticasDetalladas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
                error: error.message
            });
        }
    }
    
    /**
     * Enviar retroalimentación a estudiante
     * POST /api/profesor/retroalimentacion
     */
    static async enviarRetroalimentacion(req, res) {
        try {
            const profesorId = req.user.id; // ✅ CORREGIDO
            const { estudiante_id, asunto, mensaje, tipo, leccion_id } = req.body;
            
            // Validaciones
            if (!estudiante_id || !asunto || !mensaje) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos requeridos: estudiante_id, asunto, mensaje'
                });
            }
            
            // Verificar que el profesor puede enviar retroalimentación a este estudiante
            const tienePermiso = await RetroalimentacionModel.verificarPermisoProfesor(profesorId, estudiante_id);
            
            if (!tienePermiso) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para enviar retroalimentación a este estudiante'
                });
            }
            
            // Obtener curso_id del profesor
            const infoProfesor = await ProfesorModel.obtenerInfoProfesor(profesorId);
            
            const retroalimentacionId = await RetroalimentacionModel.crear({
                profesor_id: profesorId,
                estudiante_id,
                curso_id: infoProfesor.curso_id,
                leccion_id: leccion_id || null,
                asunto,
                mensaje,
                tipo: tipo || 'general'
            });
            
            res.json({
                success: true,
                message: 'Retroalimentación enviada correctamente',
                data: { id: retroalimentacionId }
            });
        } catch (error) {
            console.error('Error en enviarRetroalimentacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al enviar retroalimentación',
                error: error.message
            });
        }
    }
    
    /**
     * Obtener retroalimentaciones enviadas
     * GET /api/profesor/retroalimentacion
     */
    static async obtenerRetroalimentaciones(req, res) {
        try {
            const profesorId = req.user.id; // ✅ CORREGIDO
            const { estudiante_id, leido } = req.query;
            
            const filtros = {};
            if (estudiante_id) filtros.estudiante_id = estudiante_id;
            if (leido !== undefined) filtros.leido = leido === 'true';
            
            const retroalimentaciones = await RetroalimentacionModel.obtenerPorProfesor(profesorId, filtros);
            
            res.json({
                success: true,
                data: retroalimentaciones
            });
        } catch (error) {
            console.error('Error en obtenerRetroalimentaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener retroalimentaciones',
                error: error.message
            });
        }
    }
    
    /**
     * Crear plan de estudio
     * POST /api/profesor/planes
     */
    static async crearPlan(req, res) {
        try {
            const profesorId = req.user.id; // ✅ CORREGIDO
            const { 
                estudiante_id, 
                titulo, 
                descripcion, 
                objetivos,
                temas_dificultad,
                lecciones_sugeridas,
                ejercicios_extra,
                fecha_inicio,
                fecha_fin_estimada
            } = req.body;
            
            // Validaciones
            if (!estudiante_id || !titulo) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos requeridos: estudiante_id, titulo'
                });
            }
            
            // Verificar que el profesor puede crear plan para este estudiante
            const tienePermiso = await RetroalimentacionModel.verificarPermisoProfesor(profesorId, estudiante_id);
            
            if (!tienePermiso) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para crear un plan para este estudiante'
                });
            }
            
            // Obtener curso_id del profesor
            const infoProfesor = await ProfesorModel.obtenerInfoProfesor(profesorId);
            
            const planId = await PlanificacionModel.crear({
                profesor_id: profesorId,
                estudiante_id,
                curso_id: infoProfesor.curso_id,
                titulo,
                descripcion,
                objetivos,
                temas_dificultad: temas_dificultad || [],
                lecciones_sugeridas: lecciones_sugeridas || [],
                ejercicios_extra: ejercicios_extra || [],
                fecha_inicio,
                fecha_fin_estimada
            });
            
            res.json({
                success: true,
                message: 'Plan de estudio creado correctamente',
                data: { id: planId }
            });
        } catch (error) {
            console.error('Error en crearPlan:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear plan de estudio',
                error: error.message
            });
        }
    }
    
    /**
     * Obtener planes creados
     * GET /api/profesor/planes
     */
    static async obtenerPlanes(req, res) {
        try {
            const profesorId = req.user.id; // ✅ CORREGIDO
            const planes = await PlanificacionModel.obtenerPorProfesor(profesorId);
            
            res.json({
                success: true,
                data: planes
            });
        } catch (error) {
            console.error('Error en obtenerPlanes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener planes',
                error: error.message
            });
        }
    }
    
    /**
     * Obtener alertas del profesor
     * GET /api/profesor/alertas
     */
    static async obtenerAlertas(req, res) {
        try {
            const profesorId = req.user.id; // ✅ CORREGIDO
            const { solo_no_revisadas } = req.query;
            
            const alertas = await ProfesorModel.obtenerAlertas(profesorId, solo_no_revisadas !== 'false');
            
            res.json({
                success: true,
                data: alertas
            });
        } catch (error) {
            console.error('Error en obtenerAlertas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener alertas',
                error: error.message
            });
        }
    }
    
    /**
     * Marcar alerta como revisada
     * PUT /api/profesor/alertas/:id/revisar
     */
    static async marcarAlertaRevisada(req, res) {
        try {
            const profesorId = req.user.id; // ✅ CORREGIDO
            const { id } = req.params;
            
            await ProfesorModel.marcarAlertaRevisada(id, profesorId);
            
            res.json({
                success: true,
                message: 'Alerta marcada como revisada'
            });
        } catch (error) {
            console.error('Error en marcarAlertaRevisada:', error);
            res.status(500).json({
                success: false,
                message: 'Error al marcar alerta como revisada',
                error: error.message
            });
        }
    }
    
    /**
     * Obtener lecciones del curso
     * GET /api/profesor/lecciones
     */
    static async obtenerLecciones(req, res) {
        try {
            const profesorId = req.user.id; // ✅ CORREGIDO
            const lecciones = await ProfesorModel.obtenerLeccionesCurso(profesorId);
            
            res.json({
                success: true,
                data: lecciones
            });
        } catch (error) {
            console.error('Error en obtenerLecciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener lecciones',
                error: error.message
            });
        }
    }
}

module.exports = ProfesorController;