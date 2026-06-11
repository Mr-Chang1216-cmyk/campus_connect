const express = require('express')
const router = express.Router()
const {
  enviarSolicitud,
  responderSolicitud,
  misConexiones,
  solicitudesPendientes,
  buscarParaConectar
} = require('../controllers/conexionesController')
const { verificarToken } = require('../middlewares/authMiddleware')

router.use(verificarToken)

// GET /api/conexiones
router.get('/', misConexiones)

// GET /api/conexiones/pendientes
router.get('/pendientes', solicitudesPendientes)

// GET /api/conexiones/buscar?q=nombre
router.get('/buscar', buscarParaConectar)

// POST /api/conexiones
router.post('/', enviarSolicitud)

// PUT /api/conexiones/responder
router.put('/responder', responderSolicitud)

module.exports = router