const express = require('express')
const router = express.Router()
const {
  obtenerUsuarios,
  crearUsuario,
  cargaMasiva,
  toggleUsuario,
  cambiarRol,
  estadisticas
} = require('../controllers/adminController')
const { verificarToken } = require('../middlewares/authMiddleware')

// Todas las rutas requieren token
router.use(verificarToken)

// GET /api/admin/estadisticas
router.get('/estadisticas', estadisticas)

// GET /api/admin/usuarios
router.get('/usuarios', obtenerUsuarios)

// POST /api/admin/usuarios
router.post('/usuarios', crearUsuario)

// POST /api/admin/usuarios/carga-masiva
router.post('/usuarios/carga-masiva', cargaMasiva)

// PUT /api/admin/usuarios/:id/toggle
router.put('/usuarios/:id/toggle', toggleUsuario)

// PUT /api/admin/usuarios/:id/rol
router.put('/usuarios/:id/rol', cambiarRol)

module.exports = router