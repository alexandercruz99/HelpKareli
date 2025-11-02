// ==========================================================
// config/jwt.js - Configuración JWT mejorada
// ==========================================================

const jwt = require('jsonwebtoken');

// ==========================================================
// CONFIGURACIÓN
// ==========================================================

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_por_defecto_cambiar_en_produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'; // ⬅️ Cambiado a 1h (más seguro)
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // Para refresh tokens

// ==========================================================
// VALIDACIÓN DE SEGURIDAD
// ==========================================================

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'clave_secreta_por_defecto_cambiar_en_produccion') {
    console.error('❌ ERROR CRÍTICO: Debes configurar JWT_SECRET en producción');
    process.exit(1); // Detiene el servidor
}

// ==========================================================
// FUNCIONES PRINCIPALES
// ==========================================================

/**
 * Generar Access Token (corta duración)
 * @param {Object} payload - Datos del usuario {id, correo, rol, nombre}
 * @returns {String} Token JWT
 */
const generarToken = (payload) => {
    try {
        return jwt.sign(
            payload,
            JWT_SECRET,
            {
                expiresIn: JWT_EXPIRES_IN,
                issuer: 'SpeakLexi API',
                subject: payload.id?.toString() || payload.usuario_id?.toString()
            }
        );
    } catch (error) {
        console.error('❌ Error generando token:', error);
        throw new Error('Error al generar token de autenticación');
    }
};

/**
 * Generar Refresh Token (larga duración)
 * @param {Object} payload - Solo {id, correo}
 * @returns {String} Refresh Token JWT
 */
const generarRefreshToken = (payload) => {
    try {
        return jwt.sign(
            { id: payload.id, correo: payload.correo }, // Payload mínimo
            JWT_SECRET,
            {
                expiresIn: JWT_REFRESH_EXPIRES_IN,
                issuer: 'SpeakLexi API',
                subject: payload.id?.toString()
            }
        );
    } catch (error) {
        console.error('❌ Error generando refresh token:', error);
        throw new Error('Error al generar refresh token');
    }
};

/**
 * Verificar y decodificar token
 * @param {String} token - Token JWT
 * @returns {Object} Payload decodificado
 * @throws {Error} Si el token es inválido o expiró
 */
const verificarToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expirado');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Token inválido');
        } else if (error.name === 'NotBeforeError') {
            throw new Error('Token aún no es válido');
        } else {
            throw new Error('Error al verificar token');
        }
    }
};

/**
 * Decodificar token SIN verificar (útil para debugging)
 * ⚠️ NO USAR EN PRODUCCIÓN PARA AUTENTICACIÓN
 * @param {String} token - Token JWT
 * @returns {Object|null} Payload decodificado o null
 */
const decodificarToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        console.error('❌ Error decodificando token:', error);
        return null;
    }
};

// ==========================================================
// UTILIDADES PARA CÓDIGOS
// ==========================================================

/**
 * Generar código de verificación de 6 dígitos
 * @returns {String} Código numérico de 6 dígitos
 */
const generarCodigoVerificacion = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generar token de recuperación seguro
 * @returns {String} Token aleatorio de 32 caracteres hexadecimales
 */
const generarTokenRecuperacion = () => {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Calcular fecha de expiración
 * @param {Number} minutos - Minutos de validez
 * @returns {Date} Fecha de expiración
 */
const calcularExpiracion = (minutos = 10) => {
    return new Date(Date.now() + minutos * 60 * 1000);
};

// ==========================================================
// VALIDACIONES
// ==========================================================

/**
 * Verificar si un token está próximo a expirar
 * @param {String} token - Token JWT
 * @param {Number} minutosAntes - Minutos antes de expiración (default: 5)
 * @returns {Boolean} true si está próximo a expirar
 */
const tokenProximoAExpirar = (token, minutosAntes = 5) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) return true;
        
        const ahora = Math.floor(Date.now() / 1000);
        const tiempoRestante = decoded.exp - ahora;
        
        return tiempoRestante < (minutosAntes * 60);
    } catch (error) {
        return true;
    }
};

// ==========================================================
// EXPORTAR
// ==========================================================

module.exports = {
    // Tokens
    generarToken,
    generarRefreshToken,
    verificarToken,
    decodificarToken,
    
    // Códigos y tokens
    generarCodigoVerificacion,
    generarTokenRecuperacion,
    
    // Utilidades
    calcularExpiracion,
    tokenProximoAExpirar,
    
    // Constantes (por si las necesitas)
    JWT_SECRET,
    JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN
};