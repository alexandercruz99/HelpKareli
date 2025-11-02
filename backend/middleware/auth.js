//backend/middleware
const jwt = require('jsonwebtoken');
const database = require('../config/database');

// @desc    Verificar token JWT
// @access  Private
const verificarToken = async (req, res, next) => {
    try {
        let token;

        // Obtener token del header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } 
        // Obtener token de query string (para desarrollo)
        else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                error: 'Acceso no autorizado. Token requerido.',
                codigo: 'TOKEN_REQUIRED'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_por_defecto_para_desarrollo');
        
        // Verificar si el usuario aún existe en la base de datos
        const [usuarios] = await database.query(
            `SELECT id, nombre, correo, rol, estado_cuenta, email_verificado 
             FROM usuarios 
             WHERE id = ? AND estado_cuenta = 'activo'`,
            [decoded.id]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                error: 'Token inválido. Usuario no encontrado o cuenta inactiva.',
                codigo: 'USER_NOT_FOUND'
            });
        }

        // Agregar usuario al request
        req.user = usuarios[0];
        next();

    } catch (error) {
        console.error('❌ Error verificando token:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido',
                codigo: 'INVALID_TOKEN'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado',
                codigo: 'TOKEN_EXPIRED'
            });
        }

        res.status(500).json({
            error: 'Error interno del servidor al verificar token',
            codigo: 'TOKEN_VERIFICATION_ERROR'
        });
    }
};

// @desc    Verificar rol de usuario
// @access  Private
const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Usuario no autenticado',
                codigo: 'UNAUTHENTICATED'
            });
        }

        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                error: 'No tienes permisos para realizar esta acción',
                codigo: 'INSUFFICIENT_PERMISSIONS',
                rol_requerido: rolesPermitidos,
                rol_actual: req.user.rol
            });
        }

        next();
    };
};

// @desc    Verificar si el email está verificado
// @access  Private
const verificarEmail = (req, res, next) => {
    if (!req.user.email_verificado) {
        return res.status(403).json({
            error: 'Debes verificar tu email antes de acceder a este recurso',
            codigo: 'EMAIL_NOT_VERIFIED'
        });
    }
    next();
};

// @desc    Middleware para loguear requests
// @access  Private/Public
const logRequests = (req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        user: req.user ? req.user.id : 'Anonymous'
    });
    next();
};

module.exports = {
    verificarToken,
    verificarRol,
    verificarEmail,
    logRequests
};