const express = require('express')
const router = express.Router()
const {
  subirApunte,
  obtenerApuntes,
  obtenerApunte,
  descargarApunte,
  calificarApunte,
  eliminarApunte,
  misApuntes
} = require('../controllers/apuntesController')
const { verificarToken } = require('../middlewares/authMiddleware')

// Todas las rutas requieren token
router.use(verificarToken)

// GET /api/apuntes
router.get('/', obtenerApuntes)

// GET /api/apuntes/mis-apuntes
router.get('/mis-apuntes', misApuntes)

// GET /api/apuntes/:id
router.get('/:id', obtenerApunte)

// POST /api/apuntes
router.post('/', subirApunte)

// POST /api/apuntes/:id/descargar
router.post('/:id/descargar', descargarApunte)

// POST /api/apuntes/:id/calificar
router.post('/:id/calificar', calificarApunte)

// DELETE /api/apuntes/:id
router.delete('/:id', eliminarApunte)

module.exports = router