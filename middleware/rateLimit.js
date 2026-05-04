/**
 * Rate Limiting — Protección Anti Fuerza Bruta
 * Limita los intentos de login para evitar ataques automatizados
 */
const rateLimit = require('express-rate-limit');

/**
 * Limita el endpoint de LOGIN:
 * Máximo 10 intentos por IP en 15 minutos.
 * Si se supera, bloquea por 15 minutos adicionales.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: {
    success: false,
    error: 'Demasiados intentos de inicio de sesión. Por favor espera 15 minutos e intenta de nuevo.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Solo cuenta intentos fallidos
});

/**
 * Limita el resto de la API:
 * Máximo 200 peticiones por IP en 1 minuto.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 200,
  message: {
    success: false,
    error: 'Demasiadas peticiones. Por favor espera un momento.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { loginLimiter, apiLimiter };
