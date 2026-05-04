/**
 * Middleware de Autenticación JWT
 * Verifica el token en cada petición a rutas protegidas
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifica que el token JWT sea válido.
 * El token debe enviarse en el header: Authorization: Bearer <token>
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Acceso denegado. Inicia sesión para continuar.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, nombre, rol }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'La sesión ha expirado. Inicia sesión nuevamente.',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Token inválido.',
      code: 'TOKEN_INVALID'
    });
  }
}

/**
 * Verifica que el usuario autenticado tenga rol de administrador.
 * Debe usarse DESPUÉS de verifyToken.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso restringido. Se requieren privilegios de administrador.'
    });
  }
  next();
}

module.exports = { verifyToken, requireAdmin };
