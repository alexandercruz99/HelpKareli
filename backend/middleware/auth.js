const { verificarToken } = require('../config/jwt');
const database = require('../config/database');

// Verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Token de acceso requerido'
      });
    }

    const decoded = verificarToken(token);
    
    // Verificar que el usuario aún existe en la base de datos
    const [users] = await database.query(
      `SELECT id, correo, nombre, primer_apellido, rol, estado_cuenta 
       FROM usuarios WHERE id = ?`,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    if (users[0].estado_cuenta !== 'activo') {
      return res.status(401).json({
        error: 'Cuenta no activa. Verifica tu email o contacta al administrador.'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Token inválido'
      });
    }

    return res.status(500).json({
      error: 'Error en autenticación'
    });
  }
};

// Verificar rol de administrador
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      error: 'Se requieren permisos de administrador'
    });
  }
  next();
};

// Verificar rol de profesor o admin
const requireTeacherOrAdmin = (req, res, next) => {
  if (req.user.rol !== 'profesor' && req.user.rol !== 'admin') {
    return res.status(403).json({
      error: 'Se requieren permisos de profesor o administrador'
    });
  }
  next();
};

// Verificar rol de alumno
const requireStudent = (req, res, next) => {
  if (req.user.rol !== 'alumno') {
    return res.status(403).json({
      error: 'Se requieren permisos de estudiante'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireTeacherOrAdmin,
  requireStudent
};