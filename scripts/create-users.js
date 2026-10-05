require('dotenv').config();
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

// Verificar credenciales de Turso
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('Faltan credenciales de Turso en .env');
  process.exit(1);
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
  try {
    console.log('Generando hash de contraseñas...');
    const hash = await bcrypt.hash('Pollos1234!', 12);

    console.log('Creando usuario: JorgeMdeocaV...');
    await db.execute({
      sql: 'INSERT INTO users (username, nombre, password, rol) VALUES (?, ?, ?, ?)',
      args: ['jorgemdeocav', 'Jorge Montes de Oca', hash, 'usuario']
    });

    console.log('Creando usuario: Francisco...');
    await db.execute({
      sql: 'INSERT INTO users (username, nombre, password, rol) VALUES (?, ?, ?, ?)',
      args: ['francisco', 'francisco', hash, 'usuario']
    });

    console.log('✅ Usuarios creados exitosamente en Turso.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al crear usuarios:', err.message);
    process.exit(1);
  }
}

main();
