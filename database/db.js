/**
 * Database — Dual Mode: SQLite local (dev) o Turso (producción)
 *
 * LOCAL:      usa TURSO_DATABASE_URL=file:data/pollos.db (o sin la var)
 * PRODUCCIÓN: usa TURSO_DATABASE_URL=libsql://xxx.turso.io + TURSO_AUTH_TOKEN
 *
 * @libsql/client soporta ambos modos con la misma API async/await.
 */
require('dotenv').config();
const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

// Si no hay TURSO_DATABASE_URL en .env, usar SQLite local
const DB_URL = process.env.TURSO_DATABASE_URL || `file:${path.join(__dirname, '..', 'data', 'pollos.db')}`;

// Solo asegurar que el directorio data existe si estamos usando SQLite local
if (DB_URL.startsWith('file:')) {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (e) {
      console.warn('⚠️  No se pudo crear el directorio data (ignorar si estás en Vercel)');
    }
  }
}

const db = createClient({
  url: DB_URL,
  ...(process.env.TURSO_AUTH_TOKEN ? { authToken: process.env.TURSO_AUTH_TOKEN } : {})
});

// =============================================
// INICIALIZACIÓN — Crear tablas si no existen
// =============================================
async function initDB() {
  console.log(`  📦 Base de datos: ${DB_URL.startsWith('file:') ? 'SQLite local' : 'Turso Cloud'}`);

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS ventas (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha            TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      cliente_nombre   TEXT NOT NULL,
      descripcion      TEXT DEFAULT '',
      cantidad_pollos  INTEGER NOT NULL,
      precio_por_kg    REAL NOT NULL,
      peso_total_kg    REAL NOT NULL,
      total_venta      REAL NOT NULL,
      estado_pago      TEXT NOT NULL DEFAULT 'pendiente',
      monto_pagado     REAL NOT NULL DEFAULT 0,
      monto_pendiente  REAL NOT NULL DEFAULT 0,
      eliminado        INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS gastos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha       TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      categoria   TEXT NOT NULL,
      descripcion TEXT DEFAULT '',
      cantidad    INTEGER NOT NULL DEFAULT 1,
      monto       REAL NOT NULL,
      total       REAL NOT NULL,
      eliminado   INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT NOT NULL UNIQUE COLLATE NOCASE,
      nombre     TEXT NOT NULL,
      password   TEXT NOT NULL,
      rol        TEXT NOT NULL DEFAULT 'usuario',
      status     INTEGER NOT NULL DEFAULT 1,
      last_login TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_ventas_cliente    ON ventas(cliente_nombre);
    CREATE INDEX IF NOT EXISTS idx_ventas_estado     ON ventas(estado_pago);
    CREATE INDEX IF NOT EXISTS idx_ventas_eliminado  ON ventas(eliminado);
    CREATE INDEX IF NOT EXISTS idx_gastos_categoria  ON gastos(categoria);
    CREATE INDEX IF NOT EXISTS idx_gastos_eliminado  ON gastos(eliminado);
    CREATE INDEX IF NOT EXISTS idx_users_username    ON users(username);
  `);

  // Crear usuario admin si no existe
  const bcrypt = require('bcryptjs');
  const result = await db.execute('SELECT COUNT(*) as cnt FROM users');
  const cnt = result.rows[0].cnt;

  if (cnt === 0) {
    const hash = bcrypt.hashSync('Admin1234!', 12);
    await db.execute({
      sql: `INSERT INTO users (username, nombre, password, rol) VALUES (?, ?, ?, ?)`,
      args: ['admin', 'Administrador', hash, 'admin']
    });
    console.log('  ✅ Usuario admin inicial creado (password: Admin1234!)');
    console.log('  ⚠️  Cambia la contraseña desde el panel de administración.');
  }

  console.log('  ✅ Base de datos lista');
}

module.exports = { db, initDB };
