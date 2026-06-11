const express = require('express')
const router = express.Router()
const {
  crearProducto,
  obtenerProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto,
  misProductos
} = require('../controllers/marketplaceController')
const { verificarToken } = require('../middlewares/authMiddleware')

// Todas las rutas requieren token
router.use(verificarToken)

// GET /api/marketplace
router.get('/', obtenerProductos)

// GET /api/marketplace/mis-productos
router.get('/mis-productos', misProductos)

// GET /api/marketplace/:id
router.get('/:id', obtenerProducto)

// POST /api/marketplace
router.post('/', crearProducto)

// PUT /api/marketplace/:id
router.put('/:id', actualizarProducto)

// DELETE /api/marketplace/:id
router.delete('/:id', eliminarProducto)

module.exports = router