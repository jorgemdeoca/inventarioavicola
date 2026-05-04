const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Todas las rutas de usuarios requieren autenticación + rol admin
router.use(verifyToken, requireAdmin);

// GET /api/users — Listar todos los usuarios
router.get('/', usersController.getAll);

// GET /api/users/:id — Obtener un usuario
router.get('/:id', usersController.getById);

// POST /api/users — Crear usuario
router.post('/', usersController.createValidations, usersController.create);

// PUT /api/users/:id — Actualizar usuario
router.put('/:id', usersController.update);

// DELETE /api/users/:id — Desactivar usuario (soft delete)
router.delete('/:id', usersController.remove);

module.exports = router;
