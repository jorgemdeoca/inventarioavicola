const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);


// =============================================
// RUTAS DE LA API
// =============================================

// GET /api/ventas - Listar todas (con filtro por ?q=nombre&estado=pagado)
router.get('/', ventasController.getAll);

// GET /api/estadisticas - Obtener estadísticas
router.get('/estadisticas', ventasController.getStats);

// GET /api/ventas/:id - Obtener una venta
router.get('/:id', ventasController.getById);

// POST /api/ventas - Crear nueva venta
router.post('/', ventasController.create);

// PUT /api/ventas/:id - Actualizar venta completa
router.put('/:id', ventasController.update);

// PATCH /api/ventas/:id/pago - Actualizar solo el pago
router.patch('/:id/pago', ventasController.updatePago);

// DELETE /api/ventas/:id - Eliminar venta
router.delete('/:id', ventasController.remove);

module.exports = router;
