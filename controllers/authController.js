/**
 * Auth Controller — async/await con @libsql/client
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/db');

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '8h';

const loginValidations = [
  body('username').trim().notEmpty().isLength({ min: 2, max: 50 }).withMessage('Usuario inválido'),
  body('password').notEmpty().isLength({ min: 4 }).withMessage('Contraseña inválida')
];

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array().map(e => e.msg) });

  const { username, password } = req.body;
  const GENERIC_ERROR = 'Usuario o contraseña incorrectos.';

  try {
    const result = await db.execute({
      sql:  `SELECT * FROM users WHERE username = ? AND status = 1`,
      args: [username.trim().toLowerCase()]
    });
    const user = result.rows[0];

    if (!user) {
      await bcrypt.compare(password, '$2b$12$invalidsaltinvalidsaltinvalid00');
      return res.status(401).json({ success: false, error: GENERIC_ERROR });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ success: false, error: GENERIC_ERROR });

    await db.execute({
      sql: `UPDATE users SET last_login = datetime('now','localtime') WHERE id = ?`,
      args: [user.id]
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      success: true,
      message: `Bienvenido, ${user.nombre}`,
      token,
      user: { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}

async function me(req, res) {
  try {
    const r = await db.execute({
      sql:  `SELECT id, username, nombre, rol, status, last_login, created_at FROM users WHERE id = ?`,
      args: [req.user.id]
    });
    const user = r.rows[0];
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}

function logout(req, res) {
  res.json({ success: true, message: 'Sesión cerrada exitosamente.' });
}

module.exports = { login, logout, me, loginValidations };
