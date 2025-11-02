// backend/routes/auth-routes.js

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

// ============================================
// MIDDLEWARE PARA MANEJAR ERRORES DE VALIDACIÓN
// ============================================
// ✅ AHORA (devuelve detalles claros):
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Formatear errores de forma legible
    const erroresFormateados = errors.array().map(err => ({
      campo: err.path || err.param,
      mensaje: err.msg,
      valor_recibido: err.value
    }));
    console.log('❌ Errores de validación:', erroresFormateados);
    return res.status(400).json({ 
       error: 'Datos de entrada inválidos',
      errores: erroresFormateados,
      // Para debugging
      mensaje: erroresFormateados.map(e => `${e.campo}: ${e.mensaje}`).join(', ')
    });
  }
  next();
};

// ============================================
// VALIDACIONES PARA REGISTRO
// ============================================
const validacionesRegistro = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras'),
  
  body('primer_apellido')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El primer apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras'),
  
  body('segundo_apellido')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El segundo apellido no debe exceder 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
    .withMessage('El apellido solo puede contener letras'),
  
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),

  // Validaciones por rol
  body('rol')
    .optional()
    .isIn(['alumno', 'estudiante', 'profesor', 'teacher', 'admin', 'administrador'])
    .withMessage('Rol inválido'),

  // Validaciones para ESTUDIANTES
  body('nivel_actual')
    .if((value, { req }) => ['alumno', 'estudiante'].includes(req.body.rol))
    .isIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    .withMessage('Nivel inválido para estudiante'),

  body('idioma')
    .if((value, { req }) => ['alumno', 'estudiante'].includes(req.body.rol))
    .notEmpty()
    .withMessage('Idioma de aprendizaje requerido para estudiantes')
    .isIn(['Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués', 'Japonés', 'Coreano', 'Chino'])
    .withMessage('Idioma no soportado'),

  // Validaciones para PROFESORES
  body('titulo')
    .if((value, { req }) => ['profesor', 'teacher'].includes(req.body.rol))
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El título no debe exceder 100 caracteres'),

  body('especialidad')
    .if((value, { req }) => ['profesor', 'teacher'].includes(req.body.rol))
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La especialidad no debe exceder 100 caracteres'),

  body('años_experiencia')
    .if((value, { req }) => ['profesor', 'teacher'].includes(req.body.rol))
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Los años de experiencia deben estar entre 0 y 50'),

  body('biografia')
    .if((value, { req }) => ['profesor', 'teacher'].includes(req.body.rol))
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La biografía no debe exceder 500 caracteres'),

  // Validaciones para ADMINISTRADORES
  body('departamento')
    .if((value, { req }) => ['admin', 'administrador'].includes(req.body.rol))
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El departamento no debe exceder 100 caracteres'),

  body('cargo')
    .if((value, { req }) => ['admin', 'administrador'].includes(req.body.rol))
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El cargo no debe exceder 100 caracteres'),

  body('nivel_acceso')
    .if((value, { req }) => ['admin', 'administrador'].includes(req.body.rol))
    .optional()
    .isIn(['admin', 'superadmin', 'moderador'])
    .withMessage('Nivel de acceso inválido'),

  handleValidationErrors
];

// ============================================
// VALIDACIONES PARA LOGIN
// ============================================
const validacionesLogin = [
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),

  handleValidationErrors
];

// ============================================
// VALIDACIONES PARA VERIFICACIÓN
// ============================================
const validacionesVerificacion = [
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  
  body('codigo')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('El código debe ser de 6 dígitos numéricos'),

  handleValidationErrors
];

// ============================================
// VALIDACIONES PARA REENVIAR CÓDIGO
// ============================================
const validacionesReenviarCodigo = [
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),

  handleValidationErrors
];

// ============================================
// VALIDACIONES PARA RECUPERAR CONTRASEÑA
// ============================================
const validacionesRecuperarPassword = [
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),

  handleValidationErrors
];

// ============================================
// VALIDACIONES PARA RESTABLECER CONTRASEÑA
// ============================================
const validacionesRestablecerPassword = [
  body('token')
    .notEmpty()
    .withMessage('El token es requerido'),
  
  body('nueva_password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),

  handleValidationErrors
];

// ============================================
// VALIDACIONES PARA ACTUALIZAR NIVEL (NUEVO)
// ============================================
const validacionesActualizarNivel = [
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  
  body('nivel')
    .isIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    .withMessage('Nivel inválido'),
  
  body('idioma')
    .optional()
    .notEmpty()
    .withMessage('El idioma no puede estar vacío'),

  handleValidationErrors
];

// ============================================
// RUTAS PÚBLICAS DE AUTENTICACIÓN
// ============================================

/**
 * POST /api/auth/registro
 * Registra un nuevo usuario
 */
router.post('/registro', validacionesRegistro, authController.registrarUsuario);

/**
 * POST /api/auth/login
 * Inicia sesión con credenciales
 */
router.post('/login', validacionesLogin, authController.iniciarSesion);

/**
 * POST /api/auth/verificar
 * Verifica el email con código de 6 dígitos
 */
router.post('/verificar', validacionesVerificacion, authController.verificarCuenta);

/**
 * POST /api/auth/reenviar-verificacion
 * Reenvía el código de verificación al correo
 */
router.post('/reenviar-verificacion', validacionesReenviarCodigo, authController.reenviarVerificacion);

/**
 * POST /api/auth/recuperar-contrasena
 * Envía email con enlace para restablecer contraseña
 */
router.post('/recuperar-contrasena', validacionesRecuperarPassword, authController.solicitarRecuperacionContrasena);

/**
 * POST /api/auth/restablecer-contrasena
 * Restablece la contraseña con token válido
 */
router.post('/restablecer-contrasena', validacionesRestablecerPassword, authController.restablecerContrasena);

/**
 * PATCH /api/auth/actualizar-nivel (NUEVO)
 * Actualiza el nivel del estudiante después de la evaluación
 */
router.patch('/actualizar-nivel', validacionesActualizarNivel, authController.actualizarNivel);

/**
 * GET /api/auth/verificar-token
 * Verifica si el token JWT es válido
 */
router.get('/verificar-token', authController.verificarToken);

// ============================================
// RUTAS DE UTILIDAD Y SALUD
// ============================================

/**
 * GET /api/auth/health
 * Verifica el estado del servicio de autenticación
 */
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Auth Service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

/**
 * GET /api/auth/config
 * Obtiene configuración pública de autenticación
 */
router.get('/config', (req, res) => {
  res.json({
    auth: {
      password_min_length: 8,
      password_requirements: {
        min_uppercase: 1,
        min_lowercase: 1,
        min_numbers: 1,
        min_special_chars: 0
      },
      verification_code_length: 6,
      verification_code_expiry_hours: 24,
      supported_roles: ['alumno', 'estudiante', 'profesor', 'teacher', 'admin', 'administrador'],
      supported_levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      supported_languages: [
        'Inglés', 
        'Francés', 
        'Alemán', 
        'Italiano', 
        'Portugués', 
        'Japonés', 
        'Coreano', 
        'Chino'
      ]
    },
    features: {
      email_verification: true,
      password_reset: true,
      account_recovery: true,
      multi_language_support: true,
      level_assessment: true
    },
    limits: {
      max_login_attempts: 5,
      lockout_duration_minutes: 15,
      max_verification_attempts: 3
    }
  });
});

// ============================================
// MANEJO DE RUTAS NO ENCONTRADAS
// ============================================
router.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method,
    mensaje: 'La ruta de autenticación solicitada no existe'
  });
});

module.exports = router;