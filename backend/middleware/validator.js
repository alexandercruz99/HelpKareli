// backend/middleware/validator.js
const { body, validationResult } = require('express-validator');

// Middleware para manejar resultados de validación
const manejarErroresValidacion = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.validationErrors = errors.array();
        req.validacionExitosa = false;
    } else {
        req.validacionExitosa = true;
    }
    next();
};

// Validaciones para registro
exports.validarRegistro = [
    body('nombre')
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres')
        .trim(),
    
    body('primer_apellido')
        .notEmpty().withMessage('El primer apellido es requerido')
        .isLength({ min: 2 }).withMessage('El primer apellido debe tener al menos 2 caracteres')
        .trim(),
    
    body('correo')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
    
    body('rol')
        .optional()
        .isIn(['alumno', 'profesor', 'admin']).withMessage('Rol inválido'),
    
    // Validaciones condicionales por rol
    body('nivel_actual')
        .if(body('rol').equals('alumno'))
        .isIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).withMessage('Nivel inválido para estudiante'),
    
    body('idioma_aprendizaje')
        .if(body('rol').equals('alumno'))
        .notEmpty().withMessage('Idioma de aprendizaje requerido para estudiantes'),
    
    body('especialidad')
        .if(body('rol').equals('profesor'))
        .notEmpty().withMessage('Especialidad requerida para profesores'),
    
    body('años_experiencia')
        .if(body('rol').equals('profesor'))
        .isInt({ min: 0 }).withMessage('Los años de experiencia deben ser un número positivo'),
    
    manejarErroresValidacion
];

// Validaciones para login
exports.validarLogin = [
    body('correo')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('La contraseña es requerida'),
    
    manejarErroresValidacion
];

// Validaciones para verificación
exports.validarVerificacion = [
    body('correo')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
    
    body('codigo')
        .isLength({ min: 6, max: 6 }).withMessage('El código debe tener 6 dígitos')
        .isNumeric().withMessage('El código debe contener solo números'),
    
    manejarErroresValidacion
];