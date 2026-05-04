const express = require('express');
const router = express.Router();
const { login, logout, me, loginValidations } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');

// POST /api/auth/login — Público, con rate limiting
router.post('/login', loginLimiter, loginValidations, login);

// POST /api/auth/logout — Requiere token válido
router.post('/logout', verifyToken, logout);

// GET /api/auth/me — Datos del usuario actual
router.get('/me', verifyToken, me);

module.exports = router;
