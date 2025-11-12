const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// ⚠️ Solo disponible en desarrollo
if (process.env.NODE_ENV !== 'development') {
    console.log('⚠️ Testing routes deshabilitadas en producción');
    module.exports = router;
    return;
}

// Middleware de autenticación para testing mejorado
router.use((req, res, next) => {
    const token = req.headers['x-testing-token'];
    
    // En desarrollo, permitir también sin token para facilidad
    if (process.env.NODE_ENV === 'development' && !token) {
        console.warn('⚠️ Acceso sin token de testing en desarrollo');
        return next();
    }
    
    if (token !== 'speaklexi-test-2024') {
        return res.status(403).json({ 
            mensaje: 'Token de testing inválido',
            desarrollo: 'Usa el token: speaklexi-test-2024'
        });
    }
    next();
});

// ============================================
// ENDPOINT: Generar Usuarios (MEJORADO)
// ============================================
router.post('/generar-usuarios', async (req, res) => {
    const connection = await db.pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { 
            cantidad_estudiantes = 50, 
            cantidad_profesores = 10,
            incluir_progreso = true 
        } = req.body;
        
        if (cantidad_estudiantes > 200 || cantidad_profesores > 50) {
            return res.status(400).json({
                mensaje: 'Cantidad excesiva de usuarios',
                max_estudiantes: 200,
                max_profesores: 50
            });
        }

        const usuariosCreados = {
            estudiantes: [],
            profesores: [],
            resumen: {
                total_estudiantes: 0,
                total_profesores: 0,
                xp_total: 0
            }
        };

        // Password hash común para todos (Test123!)
        const passwordHash = await bcrypt.hash('Test123!', 10);
        const timestamp = Date.now();

        // ============================================
        // DATOS REALISTAS MEJORADOS
        // ============================================
        const nombresEstudiantes = [
            'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Sofia', 'Pedro', 'Laura',
            'Miguel', 'Carmen', 'José', 'Isabel', 'Antonio', 'Rosa', 'Francisco',
            'Patricia', 'Manuel', 'Elena', 'David', 'Lucía', 'Javier', 'Marta',
            'Ángel', 'Paula', 'Sergio', 'Cristina', 'Alberto', 'Beatriz', 'Roberto',
            'Silvia', 'Fernando', 'Teresa', 'Raúl', 'Andrea', 'Diego', 'Pilar',
            'Daniel', 'Eva', 'Jorge', 'Nuria', 'Pablo', 'Rocío', 'Rubén', 'Sara'
        ];

        const nombresProfesores = [
            'Dr. Ricardo', 'Dra. Fernanda', 'Prof. Alejandro', 'Profa. Gabriela',
            'Mtro. Eduardo', 'Mtra. Daniela', 'Lic. Héctor', 'Lic. Valentina',
            'Dr. Rodrigo', 'Dra. Camila', 'Prof. Sebastián', 'Profa. Victoria',
            'Prof. Óscar', 'Dra. Marcela', 'Mtro. Arturo', 'Mtra. Regina'
        ];

        const apellidos = [
            'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández',
            'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera',
            'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Ortiz', 'Vargas',
            'Castillo', 'Romero', 'Álvarez', 'Mendoza', 'Guerrero', 'Ramos'
        ];

        const idiomas = ['Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués'];
        const niveles = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        
        const especialidades = [
            'Inglés como Segunda Lengua',
            'Francés Avanzado',
            'Alemán Conversacional',
            'Italiano para Negocios',
            'Gramática Inglesa',
            'Pronunciación y Fonética',
            'Inglés para Negocios',
            'Preparación para Exámenes'
        ];

        const titulosProfesores = [
            'Maestría en Lingüística Aplicada',
            'Doctorado en Filología Inglesa',
            'Maestría en Enseñanza de Idiomas',
            'Certificación CELTA',
            'Maestría en Traducción',
            'Especialización en Fonética'
        ];

        // ============================================
        // GENERAR ESTUDIANTES MEJORADO
        // ============================================
        console.log(`🧪 Generando ${cantidad_estudiantes} estudiantes...`);
        
        for (let i = 0; i < cantidad_estudiantes; i++) {
            const nombre = nombresEstudiantes[Math.floor(Math.random() * nombresEstudiantes.length)];
            const apellido1 = apellidos[Math.floor(Math.random() * apellidos.length)];
            const apellido2 = apellidos[Math.floor(Math.random() * apellidos.length)];
            const email = `estudiante${timestamp}_${i}@test.speaklexi.com`;

            // Insertar usuario
            const [resultado] = await connection.execute(`
                INSERT INTO usuarios (
                    nombre, primer_apellido, segundo_apellido, correo, 
                    contrasena_hash, rol, estado_cuenta, correo_verificado,
                    fecha_registro, ultimo_acceso
                ) VALUES (?, ?, ?, ?, ?, 'alumno', 'activo', 1, 
                         DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 365) DAY),
                         DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY))
            `, [nombre, apellido1, apellido2, email, passwordHash]);

            const usuarioId = resultado.insertId;

            // Crear perfil usuario
            await connection.execute(`
                INSERT INTO perfil_usuarios (usuario_id, nombre_completo, foto_perfil)
                VALUES (?, ?, 'default-avatar.png')
            `, [usuarioId, `${nombre} ${apellido1} ${apellido2}`]);

            // Crear perfil estudiante con datos más realistas
            const idiomaAleatorio = idiomas[Math.floor(Math.random() * idiomas.length)];
            const nivelAleatorio = niveles[Math.floor(Math.random() * niveles.length)];
            
            // XP más realista según nivel
            const xpBase = {
                'A1': [50, 300],
                'A2': [300, 800],
                'B1': [800, 1500],
                'B2': [1500, 2500],
                'C1': [2500, 4000],
                'C2': [4000, 6000]
            };
            
            const [minXP, maxXP] = xpBase[nivelAleatorio];
            const xpAleatorio = Math.floor(Math.random() * (maxXP - minXP)) + minXP;

            await connection.execute(`
                INSERT INTO perfil_estudiantes (
                    usuario_id, idioma_aprendizaje, nivel_actual, total_xp,
                    creado_en
                ) VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 180) DAY))
            `, [usuarioId, idiomaAleatorio, nivelAleatorio, xpAleatorio]);

            usuariosCreados.estudiantes.push({
                id: usuarioId,
                email,
                nombre: `${nombre} ${apellido1} ${apellido2}`,
                nivel: nivelAleatorio,
                idioma: idiomaAleatorio,
                xp: xpAleatorio
            });

            usuariosCreados.resumen.xp_total += xpAleatorio;
        }

        usuariosCreados.resumen.total_estudiantes = cantidad_estudiantes;

        // ============================================
        // GENERAR PROFESORES MEJORADO
        // ============================================
        console.log(`🧪 Generando ${cantidad_profesores} profesores...`);
        
        for (let i = 0; i < cantidad_profesores; i++) {
            const nombreCompleto = nombresProfesores[i % nombresProfesores.length];
            const partesNombre = nombreCompleto.split(' ');
            const titulo = partesNombre[0];
            const nombre = partesNombre.slice(1).join(' ');
            const apellido1 = apellidos[Math.floor(Math.random() * apellidos.length)];
            const apellido2 = apellidos[Math.floor(Math.random() * apellidos.length)];
            const email = `profesor${timestamp}_${i}@test.speaklexi.com`;

            // Insertar usuario
            const [resultado] = await connection.execute(`
                INSERT INTO usuarios (
                    nombre, primer_apellido, segundo_apellido, correo, 
                    contrasena_hash, rol, estado_cuenta, correo_verificado,
                    fecha_registro, ultimo_acceso
                ) VALUES (?, ?, ?, ?, ?, 'profesor', 'activo', 1,
                         DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 730) DAY),
                         DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 15) DAY))
            `, [nombre, apellido1, apellido2, email, passwordHash]);

            const usuarioId = resultado.insertId;

            // Crear perfil usuario
            await connection.execute(`
                INSERT INTO perfil_usuarios (usuario_id, nombre_completo, foto_perfil)
                VALUES (?, ?, 'default-avatar.png')
            `, [usuarioId, `${nombreCompleto} ${apellido1} ${apellido2}`]);

            // Crear perfil profesor con datos realistas
            const especialidadAleatoria = especialidades[Math.floor(Math.random() * especialidades.length)];
            const tituloAleatorio = titulosProfesores[Math.floor(Math.random() * titulosProfesores.length)];
            const experienciaAleatoria = Math.floor(Math.random() * 15) + 1;
            
            const biografias = [
                `Especialista en ${especialidadAleatoria} con ${experienciaAleatoria} años de experiencia. Comprometido con la enseñanza efectiva y personalizada.`,
                `Profesor certificado con ${experienciaAleatoria} años enseñando ${especialidadAleatoria}. Enfoque en métodos comunicativos.`,
                `Experto en ${especialidadAleatoria} con amplia experiencia internacional. ${experienciaAleatoria} años formando estudiantes.`
            ];
            
            const biografiaAleatoria = biografias[Math.floor(Math.random() * biografias.length)];

            await connection.execute(`
                INSERT INTO perfil_profesores (
                    usuario_id, titulo, especialidad, anios_experiencia, biografia,
                    creado_en
                ) VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 365) DAY))
            `, [usuarioId, tituloAleatorio, especialidadAleatoria, experienciaAleatoria, biografiaAleatoria]);

            usuariosCreados.profesores.push({
                id: usuarioId,
                email,
                nombre: `${nombreCompleto} ${apellido1}`,
                especialidad: especialidadAleatoria,
                experiencia: experienciaAleatoria,
                titulo: tituloAleatorio
            });
        }

        usuariosCreados.resumen.total_profesores = cantidad_profesores;

        // ============================================
        // GENERAR PROGRESO AUTOMÁTICO (OPCIONAL)
        // ============================================
        if (incluir_progreso && usuariosCreados.estudiantes.length > 0) {
            console.log('📊 Generando progreso automático para estudiantes...');
            
            // Obtener lecciones disponibles
            const [lecciones] = await connection.execute(`
                SELECT id, nivel, duracion_minutos 
                FROM lecciones 
                WHERE estado = 'activa'
                ORDER BY nivel, id
            `);

            if (lecciones.length > 0) {
                let progresosGenerados = 0;
                
                for (const estudiante of usuariosCreados.estudiantes.slice(0, 10)) { // Máximo 10 estudiantes para no saturar
                    const leccionesParaEstudiante = lecciones.filter(l => 
                        ['A1', 'A2'].includes(l.nivel) // Solo lecciones básicas para prueba
                    ).slice(0, 5); // Máximo 5 lecciones por estudiante
                    
                    for (const leccion of leccionesParaEstudiante) {
                        const progresoAleatorio = Math.floor(Math.random() * 101);
                        const completada = progresoAleatorio >= 80; // 20% de completadas
                        const tiempoAleatorio = Math.floor(Math.random() * leccion.duracion_minutos * 60);
                        
                        await connection.execute(`
                            INSERT INTO progreso_lecciones (
                                usuario_id, leccion_id, progreso, completada, 
                                tiempo_inicio, tiempo_total_segundos
                            ) VALUES (?, ?, ?, ?, 
                                     DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY), 
                                     ?)
                        `, [estudiante.id, leccion.id, progresoAleatorio, completada, tiempoAleatorio]);
                        
                        progresosGenerados++;
                    }
                }
                
                usuariosCreados.resumen.progresos_generados = progresosGenerados;
            }
        }

        await connection.commit();

        res.json({
            mensaje: '✅ Usuarios generados exitosamente',
            timestamp: new Date().toISOString(),
            total_creados: cantidad_estudiantes + cantidad_profesores,
            resumen: usuariosCreados.resumen,
            usuarios: {
                estudiantes: usuariosCreados.estudiantes.slice(0, 10), // Mostrar solo primeros 10
                profesores: usuariosCreados.profesores
            },
            credenciales: {
                password: 'Test123!',
                nota: 'Todos los usuarios tienen la misma contraseña para testing'
            },
            siguiente_paso: 'Puedes usar el botón "Limpiar Datos" para eliminar todos los usuarios de prueba'
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al generar usuarios:', error);
        res.status(500).json({ 
            mensaje: 'Error al generar usuarios',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        connection.release();
    }
});

// ============================================
// ENDPOINT: Generar Progreso Aleatorio (MEJORADO)
// ============================================
router.post('/generar-progreso', async (req, res) => {
    try {
        const { 
            usuario_id, 
            cantidad_lecciones = 5,
            forzar_reemplazo = false 
        } = req.body;

        if (!usuario_id) {
            return res.status(400).json({ 
                mensaje: 'Se requiere usuario_id',
                ejemplo: { usuario_id: 1, cantidad_lecciones: 5 }
            });
        }

        // Verificar que el usuario existe y es estudiante
        const [usuarios] = await db.pool.execute(`
            SELECT u.id, u.rol, pe.nivel_actual 
            FROM usuarios u 
            LEFT JOIN perfil_estudiantes pe ON u.id = pe.usuario_id 
            WHERE u.id = ? AND u.rol = 'alumno'
        `, [usuario_id]);

        if (usuarios.length === 0) {
            return res.status(404).json({ 
                mensaje: 'Usuario no encontrado o no es estudiante',
                usuario_id 
            });
        }

        const usuario = usuarios[0];

        // Obtener lecciones apropiadas para el nivel del estudiante
        const [lecciones] = await db.pool.execute(`
            SELECT id, titulo, nivel, duracion_minutos 
            FROM lecciones 
            WHERE estado = 'activa' 
            AND nivel IN ('A1', 'A2', ?)  -- Incluir nivel actual y básicos
            ORDER BY RAND()
            LIMIT ?
        `, [usuario.nivel_actual, cantidad_lecciones]);

        if (!lecciones.length) {
            return res.status(404).json({ 
                mensaje: 'No hay lecciones disponibles para este nivel',
                nivel: usuario.nivel_actual 
            });
        }

        let progresoCreado = 0;
        let progresoActualizado = 0;

        for (const leccion of lecciones) {
            const progresoAleatorio = Math.floor(Math.random() * 101);
            const completada = progresoAleatorio >= 100;
            const tiempoAleatorio = Math.floor(Math.random() * leccion.duracion_minutos * 60 * 0.8) + 
                                  (leccion.duracion_minutos * 60 * 0.2); // Mínimo 20% del tiempo

            if (forzar_reemplazo) {
                // Reemplazar progreso existente
                await db.pool.execute(`
                    INSERT INTO progreso_lecciones (
                        usuario_id, leccion_id, progreso, completada, 
                        tiempo_inicio, tiempo_total_segundos
                    ) VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), ?)
                    ON DUPLICATE KEY UPDATE
                        progreso = VALUES(progreso),
                        completada = VALUES(completada),
                        tiempo_total_segundos = VALUES(tiempo_total_segundos),
                        actualizado_en = NOW()
                `, [usuario_id, leccion.id, progresoAleatorio, completada, tiempoAleatorio]);
                
                progresoActualizado++;
            } else {
                // Solo insertar si no existe
                const [existing] = await db.pool.execute(`
                    SELECT id FROM progreso_lecciones 
                    WHERE usuario_id = ? AND leccion_id = ?
                `, [usuario_id, leccion.id]);

                if (existing.length === 0) {
                    await db.pool.execute(`
                        INSERT INTO progreso_lecciones (
                            usuario_id, leccion_id, progreso, completada, 
                            tiempo_inicio, tiempo_total_segundos
                        ) VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), ?)
                    `, [usuario_id, leccion.id, progresoAleatorio, completada, tiempoAleatorio]);
                    
                    progresoCreado++;
                }
            }
        }

        res.json({
            mensaje: '✅ Progreso generado exitosamente',
            lecciones_disponibles: lecciones.length,
            progreso_creado: progresoCreado,
            progreso_actualizado: progresoActualizado,
            nivel_estudiante: usuario.nivel_actual
        });

    } catch (error) {
        console.error('❌ Error al generar progreso:', error);
        res.status(500).json({ 
            mensaje: 'Error al generar progreso',
            error: error.message 
        });
    }
});

// ============================================
// ENDPOINT: Estadísticas de Datos de Prueba
// ============================================
router.get('/estadisticas', async (req, res) => {
    try {
        const [usuarios] = await db.pool.execute(`
            SELECT 
                rol,
                COUNT(*) as total,
                MIN(fecha_registro) as fecha_mas_antigua,
                MAX(fecha_registro) as fecha_mas_reciente
            FROM usuarios 
            WHERE correo LIKE '%@test.speaklexi.com'
            GROUP BY rol
        `);

        const [progreso] = await db.pool.execute(`
            SELECT 
                COUNT(*) as total_progresos,
                AVG(progreso) as promedio_progreso,
                SUM(completada) as lecciones_completadas
            FROM progreso_lecciones pl
            JOIN usuarios u ON pl.usuario_id = u.id
            WHERE u.correo LIKE '%@test.speaklexi.com'
        `);

        const [xp] = await db.pool.execute(`
            SELECT 
                SUM(total_xp) as xp_total,
                AVG(total_xp) as xp_promedio,
                MIN(total_xp) as xp_minimo,
                MAX(total_xp) as xp_maximo
            FROM perfil_estudiantes pe
            JOIN usuarios u ON pe.usuario_id = u.id
            WHERE u.correo LIKE '%@test.speaklexi.com'
        `);

        res.json({
            mensaje: '📊 Estadísticas de datos de prueba',
            usuarios,
            progreso: progreso[0] || { total_progresos: 0, promedio_progreso: 0, lecciones_completadas: 0 },
            experiencia: xp[0] || { xp_total: 0, xp_promedio: 0, xp_minimo: 0, xp_maximo: 0 },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({ 
            mensaje: 'Error al obtener estadísticas',
            error: error.message 
        });
    }
});

// ============================================
// ENDPOINT: Limpiar Datos de Prueba (MEJORADO)
// ============================================
router.delete('/limpiar-datos', async (req, res) => {
    const connection = await db.pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Obtener estadísticas antes de eliminar
        const [statsBefore] = await connection.execute(`
            SELECT COUNT(*) as total FROM usuarios 
            WHERE correo LIKE '%@test.speaklexi.com'
        `);

        // Eliminar en orden para respetar constraints foreign key
        const tablas = [
            'resultados_ejercicios',
            'progreso_lecciones', 
            'multimedia',
            'ejercicios',
            'lecciones',
            'perfil_administradores',
            'perfil_profesores', 
            'perfil_estudiantes',
            'perfil_usuarios',
            'usuarios'
        ];

        let totalEliminados = 0;
        const resultados = {};

        for (const tabla of tablas) {
            let query;
            if (tabla === 'usuarios') {
                query = `DELETE FROM ${tabla} WHERE correo LIKE '%@test.speaklexi.com'`;
            } else {
                // Para tablas relacionadas, eliminar registros de usuarios de prueba
                query = `
                    DELETE ${tabla} FROM ${tabla} 
                    JOIN usuarios u ON ${tabla}.usuario_id = u.id 
                    WHERE u.correo LIKE '%@test.speaklexi.com'
                `;
            }
            
            const [resultado] = await connection.execute(query);
            resultados[tabla] = resultado.affectedRows;
            totalEliminados += resultado.affectedRows;
        }

        await connection.commit();

        res.json({
            mensaje: '✅ Datos de prueba eliminados exitosamente',
            total_usuarios_eliminados: resultados.usuarios || 0,
            total_registros_eliminados: totalEliminados,
            detalles: resultados,
            estadisticas_previas: {
                total_usuarios_prueba: statsBefore[0].total
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al limpiar datos:', error);
        res.status(500).json({ 
            mensaje: 'Error al limpiar datos',
            error: error.message,
            sugerencia: 'Verifica que no haya dependencias de datos externos'
        });
    } finally {
        connection.release();
    }
});

// ============================================
// ENDPOINT: Salud del Sistema
// ============================================
router.get('/status', async (req, res) => {
    try {
        // Verificar conexión a BD
        const [dbResult] = await db.pool.execute('SELECT 1 as connected');
        
        // Contar datos existentes
        const [usuariosCount] = await db.pool.execute(`
            SELECT 
                COUNT(*) as total_usuarios,
                SUM(CASE WHEN correo LIKE '%@test.speaklexi.com' THEN 1 ELSE 0 END) as usuarios_prueba
            FROM usuarios
        `);

        const [leccionesCount] = await db.pool.execute('SELECT COUNT(*) as total FROM lecciones WHERE estado = "activa"');
        const [ejerciciosCount] = await db.pool.execute('SELECT COUNT(*) as total FROM ejercicios WHERE estado = "activo"');

        res.json({
            mensaje: '🧪 Sistema de testing funcionando correctamente',
            database: dbResult[0].connected === 1 ? '✅ Conectado' : '❌ Error',
            entorno: process.env.NODE_ENV || 'desarrollo',
            estadisticas: {
                usuarios: usuariosCount[0],
                lecciones_activas: leccionesCount[0].total,
                ejercicios_activos: ejerciciosCount[0].total
            },
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });

    } catch (error) {
        res.status(500).json({
            mensaje: '❌ Error en el sistema de testing',
            error: error.message,
            database: '❌ Error de conexión'
        });
    }
});

module.exports = router;