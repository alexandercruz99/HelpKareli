// backend/controllers/leccionController.js
const Leccion = require('../models/lecciones');
const Multimedia = require('../models/multimedia');
const Gamificacion = require('../models/gamificacionModel');
const Estadisticas = require('../models/estadisticasModel');

// @desc    Crear nueva lección
// @route   POST /api/lecciones
// @access  Private (Profesor/Admin)
exports.crearLeccion = async (req, res) => {
    try {
        const {
            titulo,
            descripcion,
            contenido,
            nivel,
            idioma,
            duracion_minutos,
            orden
        } = req.body;

        // Validar datos requeridos
        if (!titulo || !nivel || !idioma) {
            return res.status(400).json({
                success: false,
                error: 'Título, nivel e idioma son requeridos'
            });
        }

        const leccionData = {
            titulo,
            descripcion: descripcion || '',
            contenido: contenido || '',
            nivel,
            idioma,
            duracion_minutos: duracion_minutos || 30,
            orden: orden || 0,
            estado: 'borrador',
            creado_por: req.user.id
        };

        const leccionId = await Leccion.crear(leccionData);

        res.status(201).json({
            success: true,
            mensaje: 'Lección creada exitosamente',
            data: {
                id: leccionId,
                leccion_id: leccionId,
                ...leccionData
            }
        });

    } catch (error) {
        console.error('Error creando lección:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al crear lección'
        });
    }
};

// @desc    Listar TODAS las lecciones (para admin)
// @route   GET /api/lecciones
// @access  Private (Admin)
exports.listarTodasLecciones = async (req, res) => {
    try {
        const { pagina = 1, limite = 50, nivel, idioma, estado } = req.query;

        const resultado = await Leccion.listarTodas(pagina, limite, { nivel, idioma, estado });

        res.json({
            success: true,
            data: resultado.lecciones,
            paginacion: resultado.paginacion
        });

    } catch (error) {
        console.error('Error listando todas las lecciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al listar lecciones'
        });
    }
};

// @desc    Listar lecciones por nivel e idioma
// @route   GET /api/lecciones/nivel/:nivel
// @access  Private
exports.listarLecciones = async (req, res) => {
    try {
        const { nivel } = req.params;
        const { idioma, pagina = 1, limite = 10 } = req.query;

        if (!idioma) {
            return res.status(400).json({
                success: false,
                error: 'El parámetro idioma es requerido'
            });
        }

        const resultado = await Leccion.listarPorNivel(nivel, idioma, pagina, limite);

        res.json({
            success: true,
            data: resultado.lecciones,
            paginacion: resultado.paginacion
        });

    } catch (error) {
        console.error('Error listando lecciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al listar lecciones'
        });
    }
};

// @desc    Obtener lección por ID
// @route   GET /api/lecciones/:id
// @access  Private
exports.obtenerLeccion = async (req, res) => {
    try {
        const leccionId = req.params.id;
        const leccion = await Leccion.obtenerPorId(leccionId);

        if (!leccion) {
            return res.status(404).json({
                success: false,
                error: 'Lección no encontrada'
            });
        }

        // Obtener multimedia asociada
        const multimedia = await Multimedia.obtenerPorLeccion(leccionId);

        res.json({
            success: true,
            data: {
                ...leccion,
                multimedia
            }
        });

    } catch (error) {
        console.error('Error obteniendo lección:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al obtener lección'
        });
    }
};

// @desc    Actualizar lección
// @route   PUT /api/lecciones/:id
// @access  Private (Profesor/Admin)
exports.actualizarLeccion = async (req, res) => {
    try {
        const leccionId = req.params.id;
        const datosActualizacion = req.body;

        // Verificar que la lección existe
        const leccionExistente = await Leccion.obtenerPorId(leccionId);
        if (!leccionExistente) {
            return res.status(404).json({
                success: false,
                error: 'Lección no encontrada'
            });
        }

        // Verificar permisos (solo el creador o admin puede editar)
        if (leccionExistente.creado_por !== req.user.id && req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para editar esta lección'
            });
        }

        const actualizado = await Leccion.actualizar(leccionId, datosActualizacion);

        if (actualizado) {
            res.json({
                success: true,
                mensaje: 'Lección actualizada exitosamente'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'No se pudo actualizar la lección'
            });
        }

    } catch (error) {
        console.error('Error actualizando lección:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al actualizar lección'
        });
    }
};

// @desc    Eliminar lección
// @route   DELETE /api/lecciones/:id
// @access  Private (Profesor/Admin)
exports.eliminarLeccion = async (req, res) => {
    try {
        const leccionId = req.params.id;

        // Verificar que la lección existe
        const leccionExistente = await Leccion.obtenerPorId(leccionId);
        if (!leccionExistente) {
            return res.status(404).json({
                success: false,
                error: 'Lección no encontrada'
            });
        }

        // Verificar permisos
        if (leccionExistente.creado_por !== req.user.id && req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para eliminar esta lección'
            });
        }

        const eliminado = await Leccion.eliminar(leccionId);

        if (eliminado) {
            res.json({
                success: true,
                mensaje: 'Lección eliminada exitosamente'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'No se pudo eliminar la lección'
            });
        }

    } catch (error) {
        console.error('Error eliminando lección:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al eliminar lección'
        });
    }
};

// @desc    Registrar progreso de lección
// @route   POST /api/lecciones/:id/progreso
// @access  Private
exports.registrarProgreso = async (req, res) => {
    try {
        const leccionId = req.params.id;
        const { progreso } = req.body;
        const usuarioId = req.user.id;

        // PASO 1: Validar progreso
        if (progreso < 0 || progreso > 100) {
            return res.status(400).json({
                success: false,
                error: 'El progreso debe estar entre 0 y 100'
            });
        }

        // PASO 2: Obtener información de la lección
        const leccion = await Leccion.obtenerPorId(leccionId);
        if (!leccion) {
            return res.status(404).json({
                success: false,
                error: 'Lección no encontrada'
            });
        }

        // PASO 3: Verificar progreso anterior usando el modelo Leccion
        // Necesitamos agregar un método obtenerProgreso en el modelo lecciones.js
        const progresoAnterior = await Leccion.obtenerProgreso(usuarioId, leccionId);
        
        const esPrimeraVez = !progresoAnterior;
        const yaCompletada = progresoAnterior ? progresoAnterior.completada : false;

        // PASO 4: Registrar progreso en BD
        await Leccion.registrarProgreso(usuarioId, leccionId, progreso);

        // PASO 5: Si completó (100%) y NO estaba completada antes, otorgar XP
        if (progreso >= 100 && !yaCompletada) {
            // Calcular XP base según nivel
            const xpPorNivel = {
                'A1': 10, 'A2': 15, 'B1': 25,
                'B2': 35, 'C1': 45, 'C2': 50
            };
            const xpBase = xpPorNivel[leccion.nivel] || 10;

            // Bonus por duración (2 XP cada 10 minutos)
            const xpDuracion = Math.floor(leccion.duracion_minutos / 10) * 2;

            // Bonus primera vez (x2)
            const multiplicador = esPrimeraVez ? 2 : 1;
            
            const xpTotal = (xpBase + xpDuracion) * multiplicador;

            // Otorgar XP usando modelo de gamificación
            await Gamificacion.otorgarXP(usuarioId, xpTotal, {
                tipo: 'leccion_completada',
                leccion_id: leccionId,
                nivel: leccion.nivel,
                primera_vez: esPrimeraVez
            });

            // Actualizar estadísticas
            await Estadisticas.actualizarDesdeProgreso(usuarioId);

            // Verificar y desbloquear logros
            const logrosNuevos = await Gamificacion.verificarLogros(usuarioId);

            // Actualizar racha si aplica
            await Gamificacion.actualizarRacha(usuarioId);

            return res.json({
                success: true,
                mensaje: '¡Lección completada! 🎉',
                data: {
                    progreso: 100,
                    completada: true,
                    xp_ganado: xpTotal,
                    es_primera_vez: esPrimeraVez,
                    logros_desbloqueados: logrosNuevos,
                    nueva_racha: logrosNuevos.some(l => l.tipo === 'racha')
                }
            });
        }

        // Si solo actualizó progreso (no completó) o ya estaba completada
        res.json({
            success: true,
            mensaje: 'Progreso actualizado',
            data: {
                progreso: progreso,
                completada: progreso === 100
            }
        });

    } catch (error) {
        console.error('Error registrando progreso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al registrar progreso'
        });
    }
};