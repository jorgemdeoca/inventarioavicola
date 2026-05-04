/**
 * Users Controller — async/await con @libsql/client (solo Admin)
 */
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/db');

const SQL = {
  getAll:   `SELECT id, username, nombre, rol, status, last_login, created_at FROM users ORDER BY created_at DESC`,
  getById:  `SELECT id, username, nombre, rol, status, last_login, created_at FROM users WHERE id = ?`,
  byUsername: `SELECT id FROM users WHERE username = ? AND id != ?`,
  create:   `INSERT INTO users (username, nombre, password, rol) VALUES (?, ?, ?, ?)`,
  update:   `UPDATE users SET username = ?, nombre = ?, rol = ?, status = ? WHERE id = ?`,
  updPass:  `UPDATE users SET password = ? WHERE id = ?`,
  disable:  `UPDATE users SET status = 0 WHERE id = ?`
};

const createValidations = [
  body('username').trim().notEmpty().isLength({ min: 3, max: 50 }).withMessage('Usuario: 3-50 caracteres'),
  body('nombre').trim().notEmpty().isLength({ min: 2, max: 100 }).withMessage('Nombre: 2-100 caracteres'),
  body('password').notEmpty().isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Contraseña: mín 8 chars, mayúsculas, minúsculas y números'),
  body('rol').optional().isIn(['admin', 'usuario']).withMessage('Rol inválido')
];

async function getAll(req, res) {
  try {
    const r = await db.execute(SQL.getAll);
    res.json({ success: true, data: r.rows, count: r.rows.length });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error al obtener usuarios' });
  }
}

async function getById(req, res) {
  try {
    const r = await db.execute({ sql: SQL.getById, args: [req.params.id] });
    const user = r.rows[0];
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    res.json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error al obtener usuario' });
  }
}

async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array().map(e => e.msg) });

  const { username, nombre, password, rol = 'usuario' } = req.body;
  try {
    const conflict = await db.execute({ sql: SQL.byUsername, args: [username.trim().toLowerCase(), 0] });
    if (conflict.rows[0])
      return res.status(409).json({ success: false, error: 'El nombre de usuario ya está en uso' });

    const hash = await bcrypt.hash(password, 12);
    const ins  = await db.execute({ sql: SQL.create, args: [username.trim().toLowerCase(), nombre.trim(), hash, rol] });
    const newU = await db.execute({ sql: SQL.getById, args: [ins.lastInsertRowid] });
    res.status(201).json({ success: true, data: newU.rows[0], message: 'Usuario creado exitosamente' });
  } catch (e) {
    console.error('Error al crear usuario:', e);
    res.status(500).json({ success: false, error: 'Error al crear usuario' });
  }
}

async function update(req, res) {
  try {
    const existing = (await db.execute({ sql: SQL.getById, args: [req.params.id] })).rows[0];
    if (!existing) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    if (parseInt(req.params.id) === req.user.id && req.body.status === 0)
      return res.status(400).json({ success: false, error: 'No puedes desactivar tu propia cuenta' });

    const { username, nombre, rol, status } = req.body;
    if (username) {
      const conflict = await db.execute({ sql: SQL.byUsername, args: [username.trim().toLowerCase(), req.params.id] });
      if (conflict.rows[0])
        return res.status(409).json({ success: false, error: 'El nombre de usuario ya está en uso' });
    }

    await db.execute({ sql: SQL.update, args: [
      (username || existing.username).trim().toLowerCase(),
      (nombre   || existing.nombre).trim(),
      rol    !== undefined ? rol    : existing.rol,
      status !== undefined ? status : existing.status,
      parseInt(req.params.id)
    ]});

    if (req.body.password && req.body.password.length >= 8) {
      const hash = await bcrypt.hash(req.body.password, 12);
      await db.execute({ sql: SQL.updPass, args: [hash, req.params.id] });
    }

    const updated = await db.execute({ sql: SQL.getById, args: [req.params.id] });
    res.json({ success: true, data: updated.rows[0], message: 'Usuario actualizado exitosamente' });
  } catch (e) {
    console.error('Error al actualizar usuario:', e);
    res.status(500).json({ success: false, error: 'Error al actualizar usuario' });
  }
}

async function remove(req, res) {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ success: false, error: 'No puedes desactivar tu propia cuenta' });
    const existing = (await db.execute({ sql: SQL.getById, args: [req.params.id] })).rows[0];
    if (!existing) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    await db.execute({ sql: SQL.disable, args: [req.params.id] });
    res.json({ success: true, message: 'Usuario desactivado exitosamente' });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error al desactivar usuario' });
  }
}

module.exports = { getAll, getById, create, update, remove, createValidations };
