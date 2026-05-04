require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');

const { initDB }   = require('./database/db');
const ventasRoutes = require('./routes/ventas');
const gastosRoutes = require('./routes/gastos');
const authRoutes   = require('./routes/auth');
const usersRoutes  = require('./routes/users');
const { apiLimiter } = require('./middleware/rateLimit');
const { verifyToken }= require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

// =============================================
// SEGURIDAD — Headers HTTP (OWASP)
// =============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      "script-src-attr": ["'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "fonts.gstatic.com"],
      fontSrc:    ["'self'", "fonts.googleapis.com", "fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  },
  frameguard:     { action: 'deny' },
  hsts:           { maxAge: 31536000 },
  referrerPolicy: { policy: 'same-origin' }
}));

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGIN || false)
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/api', apiLimiter);

// Archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// =============================================
// RUTAS API
// =============================================
app.use('/api/auth',   authRoutes);
app.use('/api/users',  usersRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/gastos', gastosRoutes);

const ventasController = require('./controllers/ventasController');
app.get('/api/estadisticas', verifyToken, ventasController.getStats);

// =============================================
// PÁGINAS HTML
// =============================================
app.get('/login',  (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/gastos', (req, res) => res.sendFile(path.join(__dirname, 'public', 'gastos.html')));
app.get('/',       (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// =============================================
// MANEJO DE ERRORES
// =============================================
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.message);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message
  });
});

// =============================================
// ARRANQUE — Inicializar BD y luego escuchar
// =============================================
async function start() {
  try {
    await initDB();
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`\n🐔 Sistema de Gestión de Pollos`);
        console.log(`   Servidor: http://localhost:${PORT}`);
        console.log(`   Entorno:  ${process.env.NODE_ENV || 'development'}`);
        console.log(`   Estado:   ✅ Listo\n`);
      });
    }
  } catch (err) {
    console.error('❌ Error al inicializar la base de datos:', err);
    process.exit(1);
  }
}

start();

// Exportar para Vercel (serverless)
module.exports = app;
