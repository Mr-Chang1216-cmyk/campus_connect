const express = require('express')
const router = express.Router()
const { obtenerMensajes, enviarMensaje } = require('../controllers/chatController')
const { verificarToken } = require('../middlewares/authMiddleware')

router.use(verificarToken)

// GET /api/chat/:grupo_id
router.get('/:grupo_id', obtenerMensajes)

// POST /api/chat/:grupo_id
router.post('/:grupo_id', enviarMensaje)

module.exports = router