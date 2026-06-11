const express = require('express')
const router = express.Router()
const {
  crearEvento,
  obtenerEventos,
  obtenerEvento,
  confirmarAsistencia,
  eliminarEvento,
  misEventos
} = require('../controllers/eventosController')
const { verificarToken } = require('../middlewares/authMiddleware')

router.use(verificarToken)

router.get('/', obtenerEventos)
router.get('/mis-eventos', misEventos)
router.get('/:id', obtenerEvento)
router.post('/', crearEvento)
router.post('/:id/asistencia', confirmarAsistencia)
router.delete('/:id', eliminarEvento)

module.exports = router