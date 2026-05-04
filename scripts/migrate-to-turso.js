/**
 * Script de Migración: SQLite local → Turso Cloud
 *
 * INSTRUCCIONES:
 * 1. Configura TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en tu .env
 * 2. Asegúrate de que el archivo local data/pollos.db existe y tiene datos
 * 3. Ejecuta: node scripts/migrate-to-turso.js
 *
 * El script:
 * - Lee todos los datos de tu SQLite local
 * - Los sube a Turso en lotes
 * - Verifica los conteos al final
 */
require('dotenv').config();
const path = require('path');

// Verificar que existen las credenciales de Turso
if (!process.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL.startsWith('file:')) {
  console.error('❌  Configura TURSO_DATABASE_URL con la URL de Turso (libsql://...) en el .env');
  process.exit(1);
}
if (!process.env.TURSO_AUTH_TOKEN) {
  console.error('❌  Configura TURSO_AUTH_TOKEN en el .env');
  process.exit(1);
}

const { createClient } = require('@libsql/client');
const Database = require('better-sqlite3');

const LOCAL_DB_PATH = path.join(__dirname, '..', 'data', 'pollos.db');

// Cliente LOCAL (lectura)
let local;
try {
  local = new Database(LOCAL_DB_PATH, { readonly: true });
} catch (e) {
  console.error('❌  No se pudo abrir la BD local:', LOCAL_DB_PATH);
  process.exit(1);
}

// Cliente TURSO (escritura)
const turso = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function migrate() {
  console.log('\n🚀 Iniciando migración SQLite → Turso...\n');

  // ── VENTAS ──────────────────────────────────────
  const ventas = local.prepare(
    'SELECT * FROM ventas WHERE eliminado = 0 ORDER BY id'
  ).all();
  console.log(`📦 Ventas encontradas: ${ventas.length}`);

  for (const v of ventas) {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO ventas
              (id, fecha, cliente_nombre, descripcion, cantidad_pollos,
               precio_por_kg, peso_total_kg, total_venta, estado_pago,
               monto_pagado, monto_pendiente, eliminado, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        v.id, v.fecha, v.cliente_nombre, v.descripcion, v.cantidad_pollos,
        v.precio_por_kg, v.peso_total_kg, v.total_venta, v.estado_pago,
        v.monto_pagado, v.monto_pendiente, v.eliminado, v.created_at, v.updated_at
      ]
    });
  }
  console.log(`  ✅ Ventas migradas: ${ventas.length}`);

  // ── GASTOS ──────────────────────────────────────
  const gastos = local.prepare(
    'SELECT * FROM gastos WHERE eliminado = 0 ORDER BY id'
  ).all();
  console.log(`\n📦 Gastos encontrados: ${gastos.length}`);

  for (const g of gastos) {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO gastos
              (id, fecha, categoria, descripcion, cantidad, monto, total,
               eliminado, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?)`,
      args: [
        g.id, g.fecha, g.categoria, g.descripcion, g.cantidad,
        g.monto, g.total, g.eliminado, g.created_at, g.updated_at
      ]
    });
  }
  console.log(`  ✅ Gastos migrados: ${gastos.length}`);

  // ── VERIFICACIÓN ────────────────────────────────
  console.log('\n🔍 Verificando conteos en Turso...');
  const tvR = await turso.execute('SELECT COUNT(*) as cnt FROM ventas');
  const tgR = await turso.execute('SELECT COUNT(*) as cnt FROM gastos');
  console.log(`  Ventas en Turso: ${tvR.rows[0].cnt}`);
  console.log(`  Gastos en Turso: ${tgR.rows[0].cnt}`);

  console.log('\n✅ Migración completada exitosamente.');
  console.log('   Ya puedes cambiar TURSO_DATABASE_URL en .env a la URL de Turso.');
  console.log('   Recuerda añadir TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en el panel de Vercel.\n');

  local.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Error durante la migración:', err.message);
  process.exit(1);
});
