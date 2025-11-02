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
                detalles: req.validationErrors 
            });
        }

        const { 
            nombre, 
            primer_apellido, 
            segundo_apellido, 
            correo, 
            password,
            rol = 'alumno'  // Valor por defecto
        } = req.body;

        // Verificar si el usuario ya existe
        const [usuariosExistentes] = await database.query(
            'SELECT id FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(400).json({ 
                error: 'El correo ya está registrado' 
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
        const expiraVerificacion = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // 1. Insertar usuario principal
        const [resultadoUsuario] = await connection.query(
            `INSERT INTO usuarios 
             (nombre, primer_apellido, segundo_apellido, correo, contrasena_hash, rol, codigo_verificacion, expira_verificacion) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, primer_apellido, segundo_apellido || null, correo, contrasenaHash, rol, codigoVerificacion, expiraVerificacion]
        );

        const usuario_id = resultadoUsuario.insertId;
        const nombre_completo = `${nombre} ${primer_apellido} ${segundo_apellido || ''}`.trim();

        // 2. Crear perfil base (común para todos)
        await connection.query(
            `INSERT INTO perfil_usuarios (usuario_id, nombre_completo) 
             VALUES (?, ?)`,
            [usuario_id, nombre_completo]
        );

        // 3. Crear perfil específico según el rol
        switch(rol) {
            case 'alumno':
                await connection.query(
                    `INSERT INTO perfil_estudiantes (usuario_id, nivel_actual, idioma_aprendizaje) 
                     VALUES (?, ?, ?)`,
                    [usuario_id, req.body.nivel_actual || 'A1', req.body.idioma_aprendizaje || 'Inglés']
                );
                break;
                
            case 'profesor':
                await connection.query(
                    `INSERT INTO perfil_profesores (usuario_id, titulo, especialidad, años_experiencia, biografia) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        usuario_id, 
                        req.body.titulo || null,
                        req.body.especialidad || null,
                        req.body.años_experiencia || 0,
                        req.body.biografia || null
                    ]
                );
                break;
                
            case 'admin':
                // Solo permitir creación de admins mediante métodos específicos
                // Por seguridad, aquí convertimos a profesor si alguien intenta crear admin
                await connection.query(
                    `UPDATE usuarios SET rol = 'profesor' WHERE id = ?`,
                    [usuario_id]
                );
                await connection.query(
                    `INSERT INTO perfil_profesores (usuario_id, titulo, especialidad) 
                     VALUES (?, 'Profesor', 'General')`,
                    [usuario_id]
                );
                break;
        }

        // 4. Enviar email de verificación
        try {
            await emailService.enviarCodigoVerificacion(correo, codigoVerificacion, nombre);
        } catch (emailError) {
            console.error('Error enviando email:', emailError);
            // No fallar el registro si el email falla
        }

        // Confirmar transacción
        await connection.commit();

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente. Por favor verifica tu email.',
            usuario: {
                id: usuario_id,
                nombre: nombre_completo,
                correo: correo,
                rol: rol
            },
            verificacion_requerida: true
        });

    } catch (error) {
        // Rollback en caso de error
        if (connection) {
            await connection.rollback();
        }
        
        console.error('Error en registro:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor en el registro',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        // Liberar conexión
        if (connection) {
            connection.release();
        }
    }
};

// @desc    Verificar cuenta con código
// @route   POST /api/auth/verificar
// @access  Public
exports.verificarCuenta = async (req, res) => {
    try {
        const { correo, codigo } = req.body;

        if (!correo || !codigo) {
            return res.status(400).json({ 
                error: 'Correo y código son requeridos' 
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
            return res.status(400).json({ 
                error: 'Usuario no encontrado o ya verificado' 
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
            await emailService.enviarCodigoVerificacion(
                correo, 
                nuevoCodigo, 
                `${usuario.nombre} ${usuario.primer_apellido}`
            );

            return res.status(400).json({ 
                error: 'Código expirado. Se ha enviado un nuevo código a tu email.',
                nuevo_codigo_enviado: true
            });
        }

        // Verificar código
        if (usuario.codigo_verificacion !== codigo) {
            return res.status(400).json({ 
                error: 'Código de verificación incorrecto' 
            });
        }

        // Actualizar usuario a activo
        await database.query(
            `UPDATE usuarios 
             SET estado_cuenta = 'activo', email_verificado = TRUE, 
                 codigo_verificacion = NULL, expira_verificacion = NULL,
                 ultimo_acceso = CURRENT_TIMESTAMP 
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
        const [usuarioCompleto] = await database.query(
            `SELECT u.id, u.nombre, u.primer_apellido, u.segundo_apellido, 
                    u.correo, u.rol, u.estado_cuenta, u.fecha_registro,
                    pu.nombre_completo, pu.foto_perfil
             FROM usuarios u
             LEFT JOIN perfil_usuarios pu ON u.id = pu.usuario_id
             WHERE u.id = ?`,
            [usuario.id]
        );

        res.json({
            mensaje: 'Cuenta verificada exitosamente',
            token: token,
            usuario: usuarioCompleto[0]
        });

    } catch (error) {
        console.error('Error en verificación:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor en la verificación' 
        });
    }
};

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
exports.iniciarSesion = async (req, res) => {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({ 
                error: 'Correo y contraseña son requeridos' 
            });
        }

        // Buscar usuario
        const [usuarios] = await database.query(
            `SELECT u.id, u.nombre, u.primer_apellido, u.segundo_apellido, 
                    u.correo, u.contrasena_hash, u.rol, u.estado_cuenta,
                    u.email_verificado, pu.nombre_completo, pu.foto_perfil
             FROM usuarios u
             LEFT JOIN perfil_usuarios pu ON u.id = pu.usuario_id
             WHERE u.correo = ?`,
            [correo]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }

        const usuario = usuarios[0];

        // Verificar estado de la cuenta
        if (usuario.estado_cuenta === 'bloqueado') {
            return res.status(401).json({ 
                error: 'Cuenta bloqueada. Contacta al administrador.' 
            });
        }

        if (usuario.estado_cuenta === 'pendiente_verificacion') {
            return res.status(401).json({ 
                error: 'Cuenta pendiente de verificación. Revisa tu email.' 
            });
        }

        if (usuario.estado_cuenta === 'desactivado') {
            return res.status(401).json({ 
                error: 'Cuenta desactivada.' 
            });
        }

        // Verificar contraseña
        const contrasenaValida = await bcrypt.compare(password, usuario.contrasena_hash);
        if (!contrasenaValida) {
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }

        // Actualizar último acceso
        await database.query(
            'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
            [usuario.id]
        );

        // Generar token JWT
        const token = generarToken({ 
            id: usuario.id, 
            correo: usuario.correo,
            rol: usuario.rol 
        });

        // Determinar redirección según rol
        let redirectUrl = '';
        switch (usuario.rol) {
            case 'alumno':
                redirectUrl = '/dashboard-estudiante.html';
                break;
            case 'profesor':
                redirectUrl = '/dashboard-profesor.html';
                break;
            case 'admin':
                redirectUrl = '/dashboard-admin.html';
                break;
            default:
                redirectUrl = '/dashboard.html';
        }

        res.json({
            mensaje: 'Login exitoso',
            token: token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre_completo || `${usuario.nombre} ${usuario.primer_apellido}`,
                correo: usuario.correo,
                rol: usuario.rol,
                foto_perfil: usuario.foto_perfil
            },
            redirectUrl: redirectUrl
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor en el login' 
        });
    }
};

// @desc    Solicitar recuperación de contraseña
// @route   POST /api/auth/recuperar-contrasena
// @access  Public
exports.solicitarRecuperacionContrasena = async (req, res) => {
    try {
        const { correo } = req.body;

        if (!correo) {
            return res.status(400).json({ 
                error: 'Correo es requerido' 
            });
        }

        // Verificar si el usuario existe
        const [usuarios] = await database.query(
            'SELECT id, nombre, primer_apellido FROM usuarios WHERE correo = ? AND estado_cuenta = "activo"',
            [correo]
        );

        if (usuarios.length === 0) {
            // Por seguridad, no revelar si el email existe o no
            return res.json({ 
                mensaje: 'Si el email existe, se enviarán instrucciones de recuperación' 
            });
        }

        const usuario = usuarios[0];

        // Generar token de recuperación
        const tokenRecuperacion = require('crypto').randomBytes(32).toString('hex');
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
        } catch (emailError) {
            console.error('Error enviando email de recuperación:', emailError);
            return res.status(500).json({ 
                error: 'Error enviando email de recuperación' 
            });
        }

        res.json({ 
            mensaje: 'Se han enviado instrucciones de recuperación a tu email' 
        });

    } catch (error) {
        console.error('Error en recuperación:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor en la recuperación' 
        });
    }
};

// @desc    Restablecer contraseña
// @route   POST /api/auth/restablecer-contrasena
// @access  Public
exports.restablecerContrasena = async (req, res) => {
    try {
        const { token, nueva_contrasena } = req.body;

        if (!token || !nueva_contrasena) {
            return res.status(400).json({ 
                error: 'Token y nueva contraseña son requeridos' 
            });
        }

        if (nueva_contrasena.length < 8) {
            return res.status(400).json({ 
                error: 'La contraseña debe tener al menos 8 caracteres' 
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
                error: 'Token inválido o expirado' 
            });
        }

        const usuario = usuarios[0];

        // Hashear nueva contraseña
        const saltRounds = 12;
        const nuevaContrasenaHash = await bcrypt.hash(nueva_contrasena, saltRounds);

        // Actualizar contraseña y limpiar token
        await database.query(
            `UPDATE usuarios 
             SET contrasena_hash = ?, token_recuperacion = NULL, expira_recuperacion = NULL 
             WHERE id = ?`,
            [nuevaContrasenaHash, usuario.id]
        );

        res.json({ 
            mensaje: 'Contraseña restablecida exitosamente' 
        });

    } catch (error) {
        console.error('Error restableciendo contraseña:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al restablecer contraseña' 
        });
    }
};

// @desc    Reenviar código de verificación
// @route   POST /api/auth/reenviar-verificacion
// @access  Public
exports.reenviarVerificacion = async (req, res) => {
    try {
        const { correo } = req.body;

        if (!correo) {
            return res.status(400).json({ 
                error: 'Correo es requerido' 
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
                error: 'Usuario no encontrado o ya verificado' 
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
        } catch (emailError) {
            console.error('Error enviando email:', emailError);
            return res.status(500).json({ 
                error: 'Error enviando email de verificación' 
            });
        }

        res.json({ 
            mensaje: 'Se ha enviado un nuevo código de verificación a tu email' 
        });

    } catch (error) {
        console.error('Error reenviando verificación:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor' 
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

        // Obtener datos actualizados del usuario
        const [usuarios] = await database.query(
            `SELECT u.id, u.nombre, u.primer_apellido, u.segundo_apellido, 
                    u.correo, u.rol, u.estado_cuenta, u.fecha_registro,
                    pu.nombre_completo, pu.foto_perfil
             FROM usuarios u
             LEFT JOIN perfil_usuarios pu ON u.id = pu.usuario_id
             WHERE u.id = ?`,
            [usuario.id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado' 
            });
        }

        res.json({ 
            usuario: usuarios[0],
            token_valido: true
        });

    } catch (error) {
        console.error('Error verificando token:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor' 
        });
    }
};

// @desc    Actualizar nivel del estudiante después de verificación
// @route   PUT /api/auth/actualizar-nivel
// @access  Private
exports.actualizarNivel = async (req, res) => {
    const { correo, nivel, idioma } = req.body;

    try {
        // Buscar usuario
        const [usuarios] = await database.query(
            'SELECT id, rol, email_verificado FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (!usuarios.length) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado' 
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
                 (usuario_id, nivel_actual, idioma_aprendizaje, fecha_ultima_actualizacion) 
                 VALUES (?, ?, ?, NOW())`,
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
            idioma: idioma || 'Inglés'
        });

    } catch (error) {
        console.error('❌ Error actualizando nivel:', error);
        res.status(500).json({ 
            error: 'Error al actualizar nivel',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};