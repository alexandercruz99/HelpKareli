//backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const database = require('../config/database');
const { generarToken, generarCodigoVerificacion } = require('../config/jwt');
const emailService = require('../services/emailService');

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/registro
// @access  Public
exports.registrarUsuario = async (req, res) => {
    let connection;
    try {
        // Validar que no hay errores de validación
        if (!req.validacionExitosa) {
            return res.status(400).json({ 
                error: 'Datos de registro inválidos',
                errores: req.erroresValidacion || [],
                mensaje: 'Revisa los datos enviados'
            });
        }

        const { 
            nombre, 
            primer_apellido, 
            segundo_apellido, 
            correo, 
            password,
            rol = 'alumno',
            idioma,
            idioma_aprendizaje,
            nivel_actual
        } = req.body;

        // ✅ Usar el que esté presente (priorizar "idioma")
        const idiomaFinal = idioma || idioma_aprendizaje || 'Inglés';
        const nivelFinal = nivel_actual || 'A1';

        console.log('📝 Datos de registro recibidos:', {
            nombre, correo, rol, idiomaFinal, nivelFinal
        });

        // Verificar si el usuario ya existe
        const [usuariosExistentes] = await database.query(
            'SELECT id FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(400).json({ 
                error: 'El correo ya está registrado',
                codigo: 'EMAIL_ALREADY_EXISTS'
            });
        }

        // Iniciar transacción
        connection = await database.getConnection();
        await connection.beginTransaction();

        // Hashear contraseña
        const saltRounds = 12;
        const contrasenaHash = await bcrypt.hash(password, saltRounds);

        // Generar código de verificación
        const codigoVerificacion = generarCodigoVerificacion();
        const expiraVerificacion = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // 1. Insertar usuario principal
        const [resultadoUsuario] = await connection.query(
            `INSERT INTO usuarios 
             (nombre, primer_apellido, segundo_apellido, correo, contrasena_hash, rol, 
              codigo_verificacion, expira_verificacion, estado_cuenta, fecha_registro) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente_verificacion', NOW())`,
            [nombre, primer_apellido, segundo_apellido || null, correo, contrasenaHash, 
             rol, codigoVerificacion, expiraVerificacion]
        );

        const usuario_id = resultadoUsuario.insertId;
        const nombre_completo = `${nombre} ${primer_apellido} ${segundo_apellido || ''}`.trim();

        console.log('✅ Usuario principal creado:', usuario_id);

        // 2. Crear perfil base
        await connection.query(
            `INSERT INTO perfil_usuarios (usuario_id, nombre_completo, fecha_creacion) 
             VALUES (?, ?, NOW())`,
            [usuario_id, nombre_completo]
        );

        console.log('✅ Perfil base creado');

        // 3. Crear perfil específico según el rol
        const rolesEstudiante = ['alumno', 'estudiante'];
        const rolesProfesor = ['profesor', 'teacher'];
        
        if (rolesEstudiante.includes(rol)) {
            await connection.query(
                `INSERT INTO perfil_estudiantes 
                 (usuario_id, nivel_actual, idioma_aprendizaje, fecha_creacion) 
                 VALUES (?, ?, ?, NOW())`,
                [usuario_id, nivelFinal, idiomaFinal]
            );
            console.log('✅ Perfil estudiante creado');
            
        } else if (rolesProfesor.includes(rol)) {
            await connection.query(
                `INSERT INTO perfil_profesores 
                 (usuario_id, titulo, especialidad, años_experiencia, biografia, fecha_creacion) 
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [
                    usuario_id, 
                    req.body.titulo || null,
                    req.body.especialidad || null,
                    req.body.años_experiencia || 0,
                    req.body.biografia || null
                ]
            );
            console.log('✅ Perfil profesor creado');
            
        } else if (['admin', 'administrador'].includes(rol)) {
            // Convertir a profesor por seguridad
            await connection.query(
                `UPDATE usuarios SET rol = 'profesor' WHERE id = ?`,
                [usuario_id]
            );
            await connection.query(
                `INSERT INTO perfil_profesores 
                 (usuario_id, titulo, especialidad, fecha_creacion) 
                 VALUES (?, 'Profesor', 'General', NOW())`,
                [usuario_id]
            );
            console.log('⚠️  Rol admin convertido a profesor');
        }

        // 4. Enviar email de verificación
        try {
            await emailService.enviarCodigoVerificacion(correo, codigoVerificacion, nombre);
            console.log('✅ Email de verificación enviado a:', correo);
        } catch (emailError) {
            console.error('❌ Error enviando email:', emailError);
            // No fallar el registro si el email falla
        }

        // Confirmar transacción
        await connection.commit();

        console.log('🎉 Usuario registrado exitosamente:', usuario_id);

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente. Por favor verifica tu email.',
            usuario: {
                id: usuario_id,
                nombre: nombre_completo,
                correo: correo,
                rol: rol,
                idioma: idiomaFinal,
                nivel: nivelFinal
            },
            verificacion_requerida: true,
            codigo_verificacion: process.env.NODE_ENV === 'development' ? codigoVerificacion : undefined
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
            console.error('🔴 Transacción revertida debido a error');
        }
        
        console.error('❌ Error en registro:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor en el registro',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined,
            codigo: 'REGISTRATION_ERROR'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// @desc    Verificar cuenta con código
// @route   POST /api/auth/verificar
// @access  Public
exports.verificarCuenta = async (req, res) => {
    let connection;
    try {
        const { correo, codigo } = req.body;

        console.log('🔐 Intentando verificar cuenta:', { correo, codigo });

        if (!correo || !codigo) {
            return res.status(400).json({ 
                error: 'Correo y código son requeridos',
                codigo: 'MISSING_FIELDS'
            });
        }

        // Buscar usuario pendiente de verificación
        const [usuarios] = await database.query(
            `SELECT id, nombre, primer_apellido, codigo_verificacion, expira_verificacion, rol 
             FROM usuarios 
             WHERE correo = ? AND estado_cuenta = 'pendiente_verificacion'`,
            [correo]
        );

        if (usuarios.length === 0) {
            // Verificar si ya está activo
            const [usuariosActivos] = await database.query(
                'SELECT id FROM usuarios WHERE correo = ? AND estado_cuenta = "activo"',
                [correo]
            );
            
            if (usuariosActivos.length > 0) {
                return res.status(400).json({ 
                    error: 'La cuenta ya está verificada. Puedes iniciar sesión.',
                    codigo: 'ALREADY_VERIFIED'
                });
            }
            
            return res.status(400).json({ 
                error: 'Usuario no encontrado o estado inválido',
                codigo: 'USER_NOT_FOUND'
            });
        }

        const usuario = usuarios[0];

        // Verificar expiración
        if (new Date() > new Date(usuario.expira_verificacion)) {
            // Generar nuevo código
            const nuevoCodigo = generarCodigoVerificacion();
            const nuevaExpiracion = new Date(Date.now() + 24 * 60 * 60 * 1000);
            
            await database.query(
                'UPDATE usuarios SET codigo_verificacion = ?, expira_verificacion = ? WHERE id = ?',
                [nuevoCodigo, nuevaExpiracion, usuario.id]
            );

            // Reenviar email
            try {
                await emailService.enviarCodigoVerificacion(
                    correo, 
                    nuevoCodigo, 
                    `${usuario.nombre} ${usuario.primer_apellido}`
                );
            } catch (emailError) {
                console.error('Error reenviando email:', emailError);
            }

            return res.status(400).json({ 
                error: 'Código expirado. Se ha enviado un nuevo código a tu email.',
                codigo: 'CODE_EXPIRED',
                nuevo_codigo_enviado: true
            });
        }

        // Verificar código
        if (usuario.codigo_verificacion !== codigo) {
            return res.status(400).json({ 
                error: 'Código de verificación incorrecto',
                codigo: 'INVALID_CODE'
            });
        }

        // Iniciar transacción para actualización
        connection = await database.getConnection();
        await connection.beginTransaction();

        // Actualizar usuario a activo
        await connection.query(
            `UPDATE usuarios 
             SET estado_cuenta = 'activo', 
                 email_verificado = TRUE, 
                 codigo_verificacion = NULL, 
                 expira_verificacion = NULL,
                 ultimo_acceso = NOW(),
                 fecha_verificacion = NOW()
             WHERE id = ?`,
            [usuario.id]
        );

        // Generar token JWT
        const token = generarToken({ 
            id: usuario.id, 
            correo: correo,
            rol: usuario.rol 
        });

        // Obtener datos completos del usuario
        const [usuarioCompleto] = await connection.query(
            `SELECT u.id, u.nombre, u.primer_apellido, u.segundo_apellido, 
                    u.correo, u.rol, u.estado_cuenta, u.fecha_registro, u.fecha_verificacion,
                    pu.nombre_completo, pu.foto_perfil, pu.fecha_creacion,
                    COALESCE(pe.idioma_aprendizaje, pp.especialidad) as informacion_principal
             FROM usuarios u
             LEFT JOIN perfil_usuarios pu ON u.id = pu.usuario_id
             LEFT JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
             LEFT JOIN perfil_profesores pp ON u.id = pp.usuario_id
             WHERE u.id = ?`,
            [usuario.id]
        );

        await connection.commit();

        console.log('✅ Cuenta verificada exitosamente:', usuario.id);

        res.json({
            mensaje: 'Cuenta verificada exitosamente',
            token: token,
            usuario: usuarioCompleto[0],
            redirectUrl: obtenerRedirectUrl(usuario.rol)
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        
        console.error('❌ Error en verificación:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor en la verificación',
            codigo: 'VERIFICATION_ERROR'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
exports.iniciarSesion = async (req, res) => {
    try {
        const { correo, password } = req.body;

        console.log('🔐 Intentando login:', { correo });

        if (!correo || !password) {
            return res.status(400).json({ 
                error: 'Correo y contraseña son requeridos',
                codigo: 'MISSING_CREDENTIALS'
            });
        }

        // Buscar usuario
        const [usuarios] = await database.query(
            `SELECT u.id, u.nombre, u.primer_apellido, u.segundo_apellido, 
                    u.correo, u.contrasena_hash, u.rol, u.estado_cuenta,
                    u.email_verificado, u.intentos_login, u.bloqueado_hasta,
                    pu.nombre_completo, pu.foto_perfil
             FROM usuarios u
             LEFT JOIN perfil_usuarios pu ON u.id = pu.usuario_id
             WHERE u.correo = ?`,
            [correo]
        );

        if (usuarios.length === 0) {
            console.log('❌ Usuario no encontrado:', correo);
            return res.status(401).json({ 
                error: 'Credenciales inválidas',
                codigo: 'INVALID_CREDENTIALS'
            });
        }

        const usuario = usuarios[0];

        // Verificar si la cuenta está bloqueada temporalmente
        if (usuario.bloqueado_hasta && new Date() < new Date(usuario.bloqueado_hasta)) {
            const minutosRestantes = Math.ceil((new Date(usuario.bloqueado_hasta) - new Date()) / (1000 * 60));
            return res.status(423).json({ 
                error: `Cuenta bloqueada temporalmente. Intenta nuevamente en ${minutosRestantes} minutos.`,
                codigo: 'ACCOUNT_LOCKED',
                bloqueado_hasta: usuario.bloqueado_hasta
            });
        }

        // Verificar estado de la cuenta
        if (usuario.estado_cuenta === 'bloqueado') {
            return res.status(401).json({ 
                error: 'Cuenta bloqueada. Contacta al administrador.',
                codigo: 'ACCOUNT_BLOCKED'
            });
        }

        if (usuario.estado_cuenta === 'pendiente_verificacion') {
            return res.status(401).json({ 
                error: 'Cuenta pendiente de verificación. Revisa tu email.',
                codigo: 'PENDING_VERIFICATION'
            });
        }

        if (usuario.estado_cuenta === 'desactivado') {
            return res.status(401).json({ 
                error: 'Cuenta desactivada.',
                codigo: 'ACCOUNT_DEACTIVATED'
            });
        }

        // Verificar contraseña
        const contrasenaValida = await bcrypt.compare(password, usuario.contrasena_hash);
        
        if (!contrasenaValida) {
            // Incrementar intentos fallidos
            const nuevosIntentos = (usuario.intentos_login || 0) + 1;
            
            if (nuevosIntentos >= 5) {
                // Bloquear cuenta por 15 minutos
                const bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000);
                await database.query(
                    'UPDATE usuarios SET intentos_login = ?, bloqueado_hasta = ? WHERE id = ?',
                    [nuevosIntentos, bloqueadoHasta, usuario.id]
                );
                
                return res.status(423).json({ 
                    error: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.',
                    codigo: 'TOO_MANY_ATTEMPTS'
                });
            }
            
            await database.query(
                'UPDATE usuarios SET intentos_login = ? WHERE id = ?',
                [nuevosIntentos, usuario.id]
            );
            
            return res.status(401).json({ 
                error: 'Credenciales inválidas',
                codigo: 'INVALID_CREDENTIALS',
                intentos_restantes: 5 - nuevosIntentos
            });
        }

        // Resetear intentos fallidos y actualizar último acceso
        await database.query(
            `UPDATE usuarios 
             SET ultimo_acceso = NOW(), 
                 intentos_login = 0, 
                 bloqueado_hasta = NULL 
             WHERE id = ?`,
            [usuario.id]
        );

        // Generar token JWT
        const token = generarToken({ 
            id: usuario.id, 
            correo: usuario.correo,
            rol: usuario.rol 
        });

        console.log('✅ Login exitoso:', usuario.id);

        res.json({
            mensaje: 'Login exitoso',
            token: token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre_completo || `${usuario.nombre} ${usuario.primer_apellido}`,
                correo: usuario.correo,
                rol: usuario.rol,
                foto_perfil: usuario.foto_perfil,
                email_verificado: usuario.email_verificado
            },
            redirectUrl: obtenerRedirectUrl(usuario.rol)
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor en el login',
            codigo: 'LOGIN_ERROR'
        });
    }
};

// @desc    Solicitar recuperación de contraseña
// @route   POST /api/auth/recuperar-contrasena
// @access  Public
exports.solicitarRecuperacionContrasena = async (req, res) => {
    try {
        const { correo } = req.body;

        console.log('🔑 Solicitud de recuperación para:', correo);

        if (!correo) {
            return res.status(400).json({ 
                error: 'Correo es requerido',
                codigo: 'MISSING_EMAIL'
            });
        }

        // Verificar si el usuario existe
        const [usuarios] = await database.query(
            'SELECT id, nombre, primer_apellido FROM usuarios WHERE correo = ? AND estado_cuenta = "activo"',
            [correo]
        );

        if (usuarios.length === 0) {
            // Por seguridad, no revelar si el email existe o no
            console.log('📧 Email no encontrado (por seguridad):', correo);
            return res.json({ 
                mensaje: 'Si el email existe, se enviarán instrucciones de recuperación',
                codigo: 'INSTRUCTIONS_SENT'
            });
        }

        const usuario = usuarios[0];

        // Generar token de recuperación
        const crypto = require('crypto');
        const tokenRecuperacion = crypto.randomBytes(32).toString('hex');
        const expiraRecuperacion = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hora

        await database.query(
            'UPDATE usuarios SET token_recuperacion = ?, expira_recuperacion = ? WHERE id = ?',
            [tokenRecuperacion, expiraRecuperacion, usuario.id]
        );

        // Enviar email de recuperación
        try {
            await emailService.enviarRecuperacionContrasena(
                correo, 
                tokenRecuperacion, 
                `${usuario.nombre} ${usuario.primer_apellido}`
            );
            console.log('✅ Email de recuperación enviado a:', correo);
        } catch (emailError) {
            console.error('❌ Error enviando email de recuperación:', emailError);
            return res.status(500).json({ 
                error: 'Error enviando email de recuperación',
                codigo: 'EMAIL_SEND_ERROR'
            });
        }

        res.json({ 
            mensaje: 'Se han enviado instrucciones de recuperación a tu email',
            codigo: 'RECOVERY_EMAIL_SENT'
        });

    } catch (error) {
        console.error('❌ Error en recuperación:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor en la recuperación',
            codigo: 'RECOVERY_ERROR'
        });
    }
};

// @desc    Restablecer contraseña
// @route   POST /api/auth/restablecer-contrasena
// @access  Public
exports.restablecerContrasena = async (req, res) => {
    try {
        const { token, nueva_password } = req.body;

        console.log('🔑 Intentando restablecer contraseña con token');

        if (!token || !nueva_password) {
            return res.status(400).json({ 
                error: 'Token y nueva contraseña son requeridos',
                codigo: 'MISSING_FIELDS'
            });
        }

        if (nueva_password.length < 8) {
            return res.status(400).json({ 
                error: 'La contraseña debe tener al menos 8 caracteres',
                codigo: 'PASSWORD_TOO_SHORT'
            });
        }

        // Buscar usuario con token válido
        const [usuarios] = await database.query(
            `SELECT id FROM usuarios 
             WHERE token_recuperacion = ? AND expira_recuperacion > NOW()`,
            [token]
        );

        if (usuarios.length === 0) {
            return res.status(400).json({ 
                error: 'Token inválido o expirado',
                codigo: 'INVALID_TOKEN'
            });
        }

        const usuario = usuarios[0];

        // Hashear nueva contraseña
        const saltRounds = 12;
        const nuevaContrasenaHash = await bcrypt.hash(nueva_password, saltRounds);

        // Actualizar contraseña y limpiar token
        await database.query(
            `UPDATE usuarios 
             SET contrasena_hash = ?, 
                 token_recuperacion = NULL, 
                 expira_recuperacion = NULL,
                 intentos_login = 0,
                 bloqueado_hasta = NULL
             WHERE id = ?`,
            [nuevaContrasenaHash, usuario.id]
        );

        console.log('✅ Contraseña restablecida para usuario:', usuario.id);

        res.json({ 
            mensaje: 'Contraseña restablecida exitosamente',
            codigo: 'PASSWORD_RESET_SUCCESS'
        });

    } catch (error) {
        console.error('❌ Error restableciendo contraseña:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al restablecer contraseña',
            codigo: 'PASSWORD_RESET_ERROR'
        });
    }
};

// @desc    Reenviar código de verificación
// @route   POST /api/auth/reenviar-verificacion
// @access  Public
exports.reenviarVerificacion = async (req, res) => {
    try {
        const { correo } = req.body;

        console.log('📧 Reenviando verificación a:', correo);

        if (!correo) {
            return res.status(400).json({ 
                error: 'Correo es requerido',
                codigo: 'MISSING_EMAIL'
            });
        }

        // Buscar usuario pendiente de verificación
        const [usuarios] = await database.query(
            `SELECT id, nombre, primer_apellido 
             FROM usuarios 
             WHERE correo = ? AND estado_cuenta = 'pendiente_verificacion'`,
            [correo]
        );

        if (usuarios.length === 0) {
            return res.status(400).json({ 
                error: 'Usuario no encontrado o ya verificado',
                codigo: 'USER_NOT_FOUND'
            });
        }

        const usuario = usuarios[0];

        // Generar nuevo código
        const nuevoCodigo = generarCodigoVerificacion();
        const nuevaExpiracion = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await database.query(
            'UPDATE usuarios SET codigo_verificacion = ?, expira_verificacion = ? WHERE id = ?',
            [nuevoCodigo, nuevaExpiracion, usuario.id]
        );

        // Enviar email
        try {
            await emailService.enviarCodigoVerificacion(
                correo, 
                nuevoCodigo, 
                `${usuario.nombre} ${usuario.primer_apellido}`
            );
            console.log('✅ Nuevo código de verificación enviado a:', correo);
        } catch (emailError) {
            console.error('❌ Error enviando email:', emailError);
            return res.status(500).json({ 
                error: 'Error enviando email de verificación',
                codigo: 'EMAIL_SEND_ERROR'
            });
        }

        res.json({ 
            mensaje: 'Se ha enviado un nuevo código de verificación a tu email',
            codigo: 'VERIFICATION_RESENT',
            nuevo_codigo: process.env.NODE_ENV === 'development' ? nuevoCodigo : undefined
        });

    } catch (error) {
        console.error('❌ Error reenviando verificación:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            codigo: 'RESEND_ERROR'
        });
    }
};

// @desc    Verificar token (para el cliente)
// @route   GET /api/auth/verificar-token
// @access  Private
exports.verificarToken = async (req, res) => {
    try {
        // Si llegamos aquí, el middleware de auth ya verificó el token
        const usuario = req.user;

        console.log('🔍 Verificando token para usuario:', usuario.id);

        // Obtener datos actualizados del usuario
        const [usuarios] = await database.query(
            `SELECT u.id, u.nombre, u.primer_apellido, u.segundo_apellido, 
                    u.correo, u.rol, u.estado_cuenta, u.fecha_registro, u.email_verificado,
                    pu.nombre_completo, pu.foto_perfil, pu.fecha_creacion,
                    COALESCE(pe.nivel_actual, pp.titulo) as informacion_adicional
             FROM usuarios u
             LEFT JOIN perfil_usuarios pu ON u.id = pu.usuario_id
             LEFT JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
             LEFT JOIN perfil_profesores pp ON u.id = pp.usuario_id
             WHERE u.id = ?`,
            [usuario.id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado',
                codigo: 'USER_NOT_FOUND'
            });
        }

        console.log('✅ Token válido para usuario:', usuario.id);

        res.json({ 
            usuario: usuarios[0],
            token_valido: true,
            codigo: 'TOKEN_VALID'
        });

    } catch (error) {
        console.error('❌ Error verificando token:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            codigo: 'TOKEN_VERIFICATION_ERROR'
        });
    }
};

// @desc    Actualizar nivel del estudiante después de verificación
// @route   PUT /api/auth/actualizar-nivel
// @access  Private
exports.actualizarNivel = async (req, res) => {
    const { correo, nivel, idioma } = req.body;

    console.log('📊 Actualizando nivel:', { correo, nivel, idioma });

    try {
        // Buscar usuario
        const [usuarios] = await database.query(
            'SELECT id, rol, email_verificado FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (!usuarios.length) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado',
                codigo: 'USER_NOT_FOUND'
            });
        }

        const usuario = usuarios[0];

        // Verificar que el email esté verificado
        if (!usuario.email_verificado) {
            return res.status(403).json({ 
                error: 'Debes verificar tu email antes de asignar un nivel',
                codigo: 'EMAIL_NOT_VERIFIED'
            });
        }

        // Verificar que sea estudiante
        if (!['alumno', 'estudiante'].includes(usuario.rol)) {
            return res.status(403).json({ 
                error: 'Solo los estudiantes pueden actualizar su nivel',
                codigo: 'INVALID_ROLE'
            });
        }

        // Verificar que existe el perfil de estudiante
        const [perfiles] = await database.query(
            'SELECT usuario_id FROM perfil_estudiantes WHERE usuario_id = ?',
            [usuario.id]
        );

        if (!perfiles.length) {
            // Crear perfil si no existe
            await database.query(
                `INSERT INTO perfil_estudiantes 
                 (usuario_id, nivel_actual, idioma_aprendizaje, fecha_creacion, fecha_ultima_actualizacion) 
                 VALUES (?, ?, ?, NOW(), NOW())`,
                [usuario.id, nivel, idioma || 'Inglés']
            );
        } else {
            // Actualizar perfil existente
            await database.query(
                `UPDATE perfil_estudiantes 
                 SET nivel_actual = ?, 
                     idioma_aprendizaje = ?,
                     fecha_ultima_actualizacion = NOW()
                 WHERE usuario_id = ?`,
                [nivel, idioma || 'Inglés', usuario.id]
            );
        }

        console.log(`✅ Nivel actualizado para usuario ${usuario.id}: ${nivel} en ${idioma || 'Inglés'}`);

        res.status(200).json({ 
            mensaje: 'Nivel actualizado correctamente',
            nivel,
            idioma: idioma || 'Inglés',
            codigo: 'LEVEL_UPDATED'
        });

    } catch (error) {
        console.error('❌ Error actualizando nivel:', error);
        res.status(500).json({ 
            error: 'Error al actualizar nivel',
            codigo: 'LEVEL_UPDATE_ERROR',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Obtener perfil de usuario
// @route   GET /api/auth/perfil
// @access  Private
exports.obtenerPerfil = async (req, res) => {
    try {
        const usuario = req.user;

        const [perfil] = await database.query(
            `SELECT u.id, u.nombre, u.primer_apellido, u.segundo_apellido, 
                    u.correo, u.rol, u.estado_cuenta, u.fecha_registro, u.email_verificado,
                    pu.nombre_completo, pu.foto_perfil, pu.fecha_creacion, pu.biografia,
                    pe.nivel_actual, pe.idioma_aprendizaje, pe.fecha_ultima_actualizacion,
                    pp.titulo, pp.especialidad, pp.años_experiencia, pp.biografia as biografia_profesor
             FROM usuarios u
             LEFT JOIN perfil_usuarios pu ON u.id = pu.usuario_id
             LEFT JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
             LEFT JOIN perfil_profesores pp ON u.id = pp.usuario_id
             WHERE u.id = ?`,
            [usuario.id]
        );

        if (perfil.length === 0) {
            return res.status(404).json({ 
                error: 'Perfil no encontrado',
                codigo: 'PROFILE_NOT_FOUND'
            });
        }

        res.json({
            usuario: perfil[0],
            codigo: 'PROFILE_RETRIEVED'
        });

    } catch (error) {
        console.error('❌ Error obteniendo perfil:', error);
        res.status(500).json({ 
            error: 'Error al obtener el perfil',
            codigo: 'PROFILE_ERROR'
        });
    }
};

// Función auxiliar para determinar redirección
function obtenerRedirectUrl(rol) {
    switch (rol) {
        case 'alumno':
        case 'estudiante':
            return '/dashboard-estudiante.html';
        case 'profesor':
        case 'teacher':
            return '/dashboard-profesor.html';
        case 'admin':
        case 'administrador':
            return '/dashboard-admin.html';
        default:
            return '/dashboard.html';
    }
}

// @desc    Cerrar sesión (logout)
// @route   POST /api/auth/logout
// @access  Private
exports.cerrarSesion = async (req, res) => {
    try {
        // En un sistema JWT stateless, el logout se maneja en el cliente
        // Pero podemos registrar la acción y realizar limpieza si es necesario
        
        console.log('🚪 Usuario cerró sesión:', req.user.id);
        
        res.json({
            mensaje: 'Sesión cerrada exitosamente',
            codigo: 'LOGOUT_SUCCESS'
        });
        
    } catch (error) {
        console.error('❌ Error en logout:', error);
        res.status(500).json({ 
            error: 'Error al cerrar sesión',
            codigo: 'LOGOUT_ERROR'
        });
    }
};