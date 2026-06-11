const express = require('express')
const router = express.Router()
const {
  obtenerConversacion,
  enviarMensaje,
  obtenerConversaciones
} = require('../controllers/mensajesController')
const { verificarToken } = require('../middlewares/authMiddleware')

router.use(verificarToken)

// GET /api/mensajes — lista de conversaciones
router.get('/', obtenerConversaciones)

// GET /api/mensajes/:usuario_id — conversación con un usuario
router.get('/:usuario_id', obtenerConversacion)

// POST /api/mensajes — enviar mensaje
router.post('/', enviarMensaje)

module.exports = router