const express = require('express')
const router = express.Router()
const {
  crearGrupo,
  obtenerGrupos,
  obtenerGrupo,
  unirseGrupo,
  salirGrupo,
  misGrupos
} = require('../controllers/gruposController')
const { verificarToken } = require('../middlewares/authMiddleware')

// Todas las rutas requieren token
router.use(verificarToken)

// GET /api/grupos
router.get('/', obtenerGrupos)

// GET /api/grupos/mis-grupos
router.get('/mis-grupos', misGrupos)

// GET /api/grupos/:id
router.get('/:id', obtenerGrupo)

// POST /api/grupos
router.post('/', crearGrupo)

// POST /api/grupos/:id/unirse
router.post('/:id/unirse', unirseGrupo)

// DELETE /api/grupos/:id/salir
router.delete('/:id/salir', salirGrupo)

module.exports = router