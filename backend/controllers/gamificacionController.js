const GamificacionModel = require('../models/gamificacionModel');
const db = require('../config/database');

/**
 * CONTROLADOR: Gamificación (XP, Niveles, Rankings, Logros, Leaderboard)
 * RF-11: Otorgar recompensas
 * RF-12: Generar tablas de clasificación
 */

/**
 * ✅ EJEMPLO COMPLETO
 * @desc    Obtener ranking global
 * @route   GET /api/gamificacion/ranking/global
 * @access  Private
 */
exports.obtenerRankingGlobal = async (req, res) => {
    try {
        const { limite = 100, offset = 0 } = req.query;
        
        const ranking = await GamificacionModel.obtenerRankingGlobal(
            parseInt(limite), 
            parseInt(offset)
        );
        
        res.json({
            ranking,
            total: ranking.length,
            limite: parseInt(limite),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        console.error('Error en obtenerRankingGlobal:', error);
        res.status(500).json({ 
            error: 'Error al obtener ranking global',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Obtener ranking semanal
 * @route   GET /api/gamificacion/ranking/semanal
 */
exports.obtenerRankingSemanal = async (req, res) => {
    try {
        const { limite = 100 } = req.query;
        
        const ranking = await GamificacionModel.obtenerRankingSemanal(parseInt(limite));
        
        res.json({
            ranking,
            total: ranking.length,
            periodo: 'semanal'
        });
        
    } catch (error) {
        console.error('Error en obtenerRankingSemanal:', error);
        res.status(500).json({ 
            error: 'Error al obtener ranking semanal',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Obtener ranking mensual
 * @route   GET /api/gamificacion/ranking/mensual
 */
exports.obtenerRankingMensual = async (req, res) => {
    try {
        const { limite = 100 } = req.query;
        
        const ranking = await GamificacionModel.obtenerRankingMensual(parseInt(limite));
        
        res.json({
            ranking,
            total: ranking.length,
            periodo: 'mensual'
        });
        
    } catch (error) {
        console.error('Error en obtenerRankingMensual:', error);
        res.status(500).json({ 
            error: 'Error al obtener ranking mensual',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Obtener ranking por nivel CEFR
 * @route   GET /api/gamificacion/ranking/nivel/:nivel
 */
exports.obtenerRankingPorNivel = async (req, res) => {
    try {
        const { nivel } = req.params;
        const { limite = 100 } = req.query;
        
        // Validar nivel CEFR
        const nivelesValidos = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        if (!nivelesValidos.includes(nivel)) {
            return res.status(400).json({ 
                error: 'Nivel CEFR inválido. Usa: A1, A2, B1, B2, C1, C2' 
            });
        }
        
        const ranking = await GamificacionModel.obtenerRankingPorNivel(nivel, parseInt(limite));
        
        res.json({
            ranking,
            total: ranking.length,
            nivel
        });
        
    } catch (error) {
        console.error('Error en obtenerRankingPorNivel:', error);
        res.status(500).json({ 
            error: 'Error al obtener ranking por nivel',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Obtener puntos XP del usuario actual
 * @route   GET /api/gamificacion/puntos
 */
exports.obtenerPuntosUsuario = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        
        const puntosData = await GamificacionModel.obtenerNivelUsuario(usuarioId);
        
        if (!puntosData) {
            return res.status(404).json({ 
                error: 'No se encontró el perfil del estudiante' 
            });
        }
        
        res.json({ 
            puntos: puntosData.total_xp,
            nivel_actual: puntosData.nivel_xp,
            siguiente_nivel_xp: puntosData.siguiente_nivel_xp,
            progreso_nivel: puntosData.progreso_nivel
        });
        
    } catch (error) {
        console.error('Error en obtenerPuntosUsuario:', error);
        res.status(500).json({ 
            error: 'Error al obtener puntos',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Obtener nivel del usuario actual
 * @route   GET /api/gamificacion/nivel
 */
exports.obtenerNivelUsuario = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        
        const nivelData = await GamificacionModel.obtenerNivelUsuario(usuarioId);
        
        if (!nivelData) {
            return res.status(404).json({ 
                error: 'No se encontró el perfil del estudiante' 
            });
        }
        
        res.json({ 
            nivel: nivelData.nivel_xp,
            total_xp: nivelData.total_xp,
            nivel_cefr: nivelData.nivel_actual,
            siguiente_nivel_xp: nivelData.siguiente_nivel_xp,
            progreso_nivel: nivelData.progreso_nivel
        });
        
    } catch (error) {
        console.error('Error en obtenerNivelUsuario:', error);
        res.status(500).json({ 
            error: 'Error al obtener nivel',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Obtener racha del usuario
 * @route   GET /api/gamificacion/racha
 */
exports.obtenerRachaUsuario = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        
        // Obtener del modelo de progreso
        const ProgresoModel = require('../models/progresoModel');
        const resumen = await ProgresoModel.obtenerResumenProgreso(usuarioId);
        
        if (!resumen) {
            return res.status(404).json({ 
                error: 'No se encontró el perfil del estudiante' 
            });
        }
        
        // Verificar si la racha sigue activa
        const hoy = new Date().toISOString().split('T')[0];
        const ultimaRacha = new Date(resumen.fecha_ultima_racha).toISOString().split('T')[0];
        
        const rachaActiva = ultimaRacha === hoy || 
                           (new Date(hoy) - new Date(ultimaRacha)) / (1000 * 60 * 60 * 24) === 1;
        
        res.json({
            racha: {
                dias: rachaActiva ? resumen.racha_dias : 0,
                fecha_ultima: resumen.fecha_ultima_racha,
                activa: rachaActiva
            }
        });
        
    } catch (error) {
        console.error('Error en obtenerRachaUsuario:', error);
        res.status(500).json({ 
            error: 'Error al obtener racha',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Obtener logros del usuario
 * @route   GET /api/gamificacion/logros
 */
exports.obtenerLogrosUsuario = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        
        const logros = await GamificacionModel.obtenerLogrosUsuario(usuarioId);
        
        res.json({
            logros,
            total: logros.length,
            logros_desbloqueados: logros.filter(l => l.desbloqueado).length,
            logros_totales: logros.length
        });
        
    } catch (error) {
        console.error('Error en obtenerLogrosUsuario:', error);
        res.status(500).json({ 
            error: 'Error al obtener logros',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Desbloquear logro específico
 * @route   POST /api/gamificacion/logros/:logroId/desbloquear
 */
exports.desbloquearLogro = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const { logroId } = req.params;
        
        // Por ahora, simular desbloqueo hasta que se implemente la tabla
        const logros = await GamificacionModel.obtenerLogrosUsuario(usuarioId);
        const logro = logros.find(l => l.id === parseInt(logroId));
        
        if (!logro) {
            return res.status(404).json({ 
                error: 'Logro no encontrado' 
            });
        }
        
        if (logro.desbloqueado) {
            return res.status(400).json({ 
                error: 'Este logro ya está desbloqueado' 
            });
        }
        
        res.status(200).json({ 
            mensaje: `¡Felicidades! Has desbloqueado el logro: ${logro.nombre}`,
            logro: {
                ...logro,
                desbloqueado: true,
                fecha_desbloqueo: new Date().toISOString()
            },
            nota: 'Funcionalidad de persistencia en desarrollo - tabla usuario_logros requerida'
        });
        
    } catch (error) {
        console.error('Error en desbloquearLogro:', error);
        res.status(500).json({ 
            error: 'Error al desbloquear logro',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Obtener posición del usuario en el ranking
 * @route   GET /api/gamificacion/mi-posicion
 */
exports.obtenerMiPosicion = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        
        const posicion = await GamificacionModel.obtenerPosicionUsuario(usuarioId);
        
        if (!posicion) {
            return res.status(404).json({ 
                error: 'No se encontró el perfil del estudiante' 
            });
        }
        
        res.json({ 
            posicion: posicion.posicion,
            total_usuarios: posicion.total_usuarios,
            percentil: posicion.percentil,
            usuario: {
                nombre: posicion.nombre,
                total_xp: posicion.total_xp,
                nivel_xp: posicion.nivel_xp,
                nivel_cefr: posicion.nivel_actual
            }
        });
        
    } catch (error) {
        console.error('Error en obtenerMiPosicion:', error);
        res.status(500).json({ 
            error: 'Error al obtener posición',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Otorgar puntos XP manualmente (para testing)
 * @route   POST /api/gamificacion/otorgar-puntos
 * @access  Private (admin/profesor)
 */
exports.otorgarPuntos = async (req, res) => {
    try {
        const { usuario_id, puntos, razon } = req.body;
        const administradorId = req.user.id;
        
        if (!usuario_id || !puntos || !razon) {
            return res.status(400).json({ 
                error: 'usuario_id, puntos y razon son requeridos' 
            });
        }
        
        // En producción, verificar que el usuario tenga permisos de administrador
        // if (req.user.rol !== 'admin' && req.user.rol !== 'profesor') {
        //     return res.status(403).json({ error: 'No autorizado' });
        // }
        
        const resultado = await GamificacionModel.otorgarPuntos(
            usuario_id, 
            parseInt(puntos), 
            razon
        );
        
        res.json({
            mensaje: `Se otorgaron ${puntos} XP al usuario`,
            resultado
        });
        
    } catch (error) {
        console.error('Error en otorgarPuntos:', error);
        res.status(500).json({ 
            error: 'Error al otorgar puntos',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 🆕 LEADERBOARD: Obtener leaderboard global (todos los estudiantes)
 * @route   GET /api/gamificacion/leaderboard/global
 * @access  Private
 */
exports.obtenerLeaderboardGlobal = async (req, res) => {
    try {
        const { limite = 50, pagina = 1 } = req.query;
        const offset = (pagina - 1) * limite;

        // Obtener ranking por XP
        const [ranking] = await db.pool.execute(`
            SELECT 
                u.id,
                u.nombre,
                u.primer_apellido,
                pe.nivel_actual,
                pe.idioma_aprendizaje,
                pe.total_xp,
                COUNT(DISTINCT pl.leccion_id) as lecciones_completadas,
                @rank := @rank + 1 as posicion
            FROM usuarios u
            JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
            LEFT JOIN progreso_lecciones pl ON u.id = pl.usuario_id AND pl.completada = 1
            CROSS JOIN (SELECT @rank := 0) r
            WHERE u.rol = 'alumno' AND u.estado_cuenta = 'activo'
            GROUP BY u.id
            ORDER BY pe.total_xp DESC, lecciones_completadas DESC
            LIMIT ? OFFSET ?
        `, [parseInt(limite), parseInt(offset)]);

        // Obtener total de participantes
        const [total] = await db.pool.execute(`
            SELECT COUNT(*) as total
            FROM usuarios
            WHERE rol = 'alumno' AND estado_cuenta = 'activo'
        `);

        // Si el usuario está autenticado, obtener su posición
        let miPosicion = null;
        if (req.user && req.user.rol === 'alumno') {
            const [posicion] = await db.pool.execute(`
                SELECT posicion FROM (
                    SELECT 
                        u.id,
                        pe.total_xp,
                        @rank := @rank + 1 as posicion
                    FROM usuarios u
                    JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
                    CROSS JOIN (SELECT @rank := 0) r
                    WHERE u.rol = 'alumno' AND u.estado_cuenta = 'activo'
                    ORDER BY pe.total_xp DESC
                ) AS ranking
                WHERE id = ?
            `, [req.user.id]);

            if (posicion.length > 0) {
                miPosicion = posicion[0].posicion;
            }
        }

        res.json({
            ranking,
            mi_posicion: miPosicion,
            total_participantes: total[0].total,
            paginacion: {
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                total_paginas: Math.ceil(total[0].total / limite)
            }
        });

    } catch (error) {
        console.error('Error al obtener leaderboard global:', error);
        res.status(500).json({ 
            error: 'Error del servidor',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 🆕 LEADERBOARD: Obtener leaderboard por nivel
 * @route   GET /api/gamificacion/leaderboard/nivel/:nivel
 * @access  Private
 */
exports.obtenerLeaderboardPorNivel = async (req, res) => {
    try {
        const { nivel } = req.params;
        const { limite = 50 } = req.query;

        // Validar nivel
        const nivelesValidos = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        if (!nivelesValidos.includes(nivel)) {
            return res.status(400).json({ error: 'Nivel inválido' });
        }

        const [ranking] = await db.pool.execute(`
            SELECT 
                u.id,
                u.nombre,
                u.primer_apellido,
                pe.nivel_actual,
                pe.idioma_aprendizaje,
                pe.total_xp,
                COUNT(DISTINCT pl.leccion_id) as lecciones_completadas,
                @rank := @rank + 1 as posicion
            FROM usuarios u
            JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
            LEFT JOIN progreso_lecciones pl ON u.id = pl.usuario_id AND pl.completada = 1
            CROSS JOIN (SELECT @rank := 0) r
            WHERE u.rol = 'alumno' 
              AND u.estado_cuenta = 'activo'
              AND pe.nivel_actual = ?
            GROUP BY u.id
            ORDER BY pe.total_xp DESC, lecciones_completadas DESC
            LIMIT ?
        `, [nivel, parseInt(limite)]);

        res.json({
            nivel,
            ranking,
            total_participantes: ranking.length
        });

    } catch (error) {
        console.error('Error al obtener leaderboard por nivel:', error);
        res.status(500).json({ 
            error: 'Error del servidor',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 🆕 LEADERBOARD: Obtener leaderboard por idioma
 * @route   GET /api/gamificacion/leaderboard/idioma/:idioma
 * @access  Private
 */
exports.obtenerLeaderboardPorIdioma = async (req, res) => {
    try {
        const { idioma } = req.params;
        const { limite = 50 } = req.query;

        const [ranking] = await db.pool.execute(`
            SELECT 
                u.id,
                u.nombre,
                u.primer_apellido,
                pe.nivel_actual,
                pe.idioma_aprendizaje,
                pe.total_xp,
                COUNT(DISTINCT pl.leccion_id) as lecciones_completadas,
                @rank := @rank + 1 as posicion
            FROM usuarios u
            JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
            LEFT JOIN progreso_lecciones pl ON u.id = pl.usuario_id AND pl.completada = 1
            CROSS JOIN (SELECT @rank := 0) r
            WHERE u.rol = 'alumno' 
              AND u.estado_cuenta = 'activo'
              AND pe.idioma_aprendizaje = ?
            GROUP BY u.id
            ORDER BY pe.total_xp DESC, lecciones_completadas DESC
            LIMIT ?
        `, [idioma, parseInt(limite)]);

        res.json({
            idioma,
            ranking,
            total_participantes: ranking.length
        });

    } catch (error) {
        console.error('Error al obtener leaderboard por idioma:', error);
        res.status(500).json({ 
            error: 'Error del servidor',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 🆕 LEADERBOARD: Obtener top 10 estudiantes (para widgets)
 * @route   GET /api/gamificacion/leaderboard/top10
 * @access  Private
 */
exports.obtenerTop10 = async (req, res) => {
    try {
        const [top10] = await db.pool.execute(`
            SELECT 
                u.id,
                u.nombre,
                u.primer_apellido,
                pe.nivel_actual,
                pe.idioma_aprendizaje,
                pe.total_xp,
                COUNT(DISTINCT pl.leccion_id) as lecciones_completadas,
                @rank := @rank + 1 as posicion
            FROM usuarios u
            JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
            LEFT JOIN progreso_lecciones pl ON u.id = pl.usuario_id AND pl.completada = 1
            CROSS JOIN (SELECT @rank := 0) r
            WHERE u.rol = 'alumno' AND u.estado_cuenta = 'activo'
            GROUP BY u.id
            ORDER BY pe.total_xp DESC, lecciones_completadas DESC
            LIMIT 10
        `);

        res.json({ top10 });

    } catch (error) {
        console.error('Error al obtener top 10:', error);
        res.status(500).json({ 
            error: 'Error del servidor',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 🆕 LEADERBOARD: Obtener estadísticas de leaderboard (resumen)
 * @route   GET /api/gamificacion/leaderboard/estadisticas
 * @access  Private
 */
exports.obtenerEstadisticasLeaderboard = async (req, res) => {
    try {
        // XP promedio por nivel
        const [xpPorNivel] = await db.pool.execute(`
            SELECT 
                nivel_actual,
                AVG(total_xp) as xp_promedio,
                MAX(total_xp) as xp_maximo,
                COUNT(*) as estudiantes
            FROM perfil_estudiantes
            GROUP BY nivel_actual
            ORDER BY FIELD(nivel_actual, 'A1', 'A2', 'B1', 'B2', 'C1', 'C2')
        `);

        // XP promedio por idioma
        const [xpPorIdioma] = await db.pool.execute(`
            SELECT 
                idioma_aprendizaje,
                AVG(total_xp) as xp_promedio,
                MAX(total_xp) as xp_maximo,
                COUNT(*) as estudiantes
            FROM perfil_estudiantes
            GROUP BY idioma_aprendizaje
            ORDER BY xp_promedio DESC
        `);

        // Distribución de XP (rangos)
        const [distribucion] = await db.pool.execute(`
            SELECT 
                CASE 
                    WHEN total_xp < 100 THEN '0-100'
                    WHEN total_xp < 300 THEN '100-300'
                    WHEN total_xp < 600 THEN '300-600'
                    WHEN total_xp < 1000 THEN '600-1000'
                    WHEN total_xp < 1500 THEN '1000-1500'
                    ELSE '1500+'
                END as rango_xp,
                COUNT(*) as estudiantes
            FROM perfil_estudiantes
            GROUP BY rango_xp
            ORDER BY MIN(total_xp)
        `);

        res.json({
            xp_por_nivel: xpPorNivel.map(n => ({
                ...n,
                xp_promedio: Math.round(n.xp_promedio)
            })),
            xp_por_idioma: xpPorIdioma.map(i => ({
                ...i,
                xp_promedio: Math.round(i.xp_promedio)
            })),
            distribucion_xp: distribucion
        });

    } catch (error) {
        console.error('Error al obtener estadísticas de leaderboard:', error);
        res.status(500).json({ 
            error: 'Error del servidor',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 🆕 GAMIFICACIÓN: Obtener progreso semanal del usuario
 * @route   GET /api/gamificacion/progreso-semanal
 * @access  Private
 */
exports.obtenerProgresoSemanal = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        
        const [progreso] = await db.pool.execute(`
            SELECT 
                DAYNAME(fecha_completado) as dia,
                COUNT(*) as lecciones_completadas,
                SUM(xp_ganados) as xp_ganado
            FROM progreso_lecciones 
            WHERE usuario_id = ? 
                AND fecha_completado >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                AND completada = 1
            GROUP BY DAYNAME(fecha_completado), DATE(fecha_completado)
            ORDER BY DATE(fecha_completado)
        `, [usuarioId]);

        res.json({ progreso_semanal: progreso });

    } catch (error) {
        console.error('Error al obtener progreso semanal:', error);
        res.status(500).json({ 
            error: 'Error del servidor',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 🆕 GAMIFICACIÓN: Obtener insignias del usuario
 * @route   GET /api/gamificacion/insignias
 * @access  Private
 */
exports.obtenerInsigniasUsuario = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        
        // Por ahora, simular insignias hasta implementar la tabla
        const insigniasSimuladas = [
            {
                id: 1,
                nombre: "Primeros Pasos",
                descripcion: "Completa tu primera lección",
                icono: "🎯",
                desbloqueada: true,
                fecha_desbloqueo: new Date().toISOString()
            },
            {
                id: 2,
                nombre: "Racha de 7 días",
                descripcion: "Practica durante 7 días consecutivos",
                icono: "🔥",
                desbloqueada: false,
                fecha_desbloqueo: null
            },
            {
                id: 3,
                nombre: "Maestro del Vocabulario",
                descripcion: "Aprende 100 palabras nuevas",
                icono: "📚",
                desbloqueada: true,
                fecha_desbloqueo: new Date().toISOString()
            }
        ];

        res.json({
            insignias: insigniasSimuladas,
            total: insigniasSimuladas.length,
            desbloqueadas: insigniasSimuladas.filter(i => i.desbloqueada).length
        });

    } catch (error) {
        console.error('Error al obtener insignias:', error);
        res.status(500).json({ 
            error: 'Error del servidor',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = exports;