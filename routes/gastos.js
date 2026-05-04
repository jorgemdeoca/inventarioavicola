const express = require('express');
const router = express.Router();
const gastosController = require('../controllers/gastosController');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);


// GET /api/gastos — Listar todos (con filtro ?categoria=saco_comida)
router.get('/', gastosController.getAll);

// GET /api/gastos/estadisticas — Estadísticas de gastos
router.get('/estadisticas', gastosController.getStats);

// GET /api/gastos/:id — Obtener un gasto
router.get('/:id', gastosController.getById);

// POST /api/gastos — Crear gasto
router.post('/', gastosController.create);

// PUT /api/gastos/:id — Actualizar gasto
router.put('/:id', gastosController.update);

// DELETE /api/gastos/:id — Eliminar gasto (lógico)
router.delete('/:id', gastosController.remove);

module.exports = router;
