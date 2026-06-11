const express = require('express')
const router = express.Router()
const {
  crearPublicacion,
  obtenerFeed,
  obtenerPublicacion,
  eliminarPublicacion,
  toggleLike,
  agregarComentario
} = require('../controllers/publicacionesController')
const { verificarToken } = require('../middlewares/authMiddleware')

// Todas las rutas requieren token
router.use(verificarToken)

// GET /api/publicaciones/feed
router.get('/feed', obtenerFeed)

// POST /api/publicaciones
router.post('/', crearPublicacion)

// GET /api/publicaciones/:id
router.get('/:id', obtenerPublicacion)

// DELETE /api/publicaciones/:id
router.delete('/:id', eliminarPublicacion)

// POST /api/publicaciones/:id/like
router.post('/:id/like', toggleLike)

// POST /api/publicaciones/:id/comentarios
router.post('/:id/comentarios', agregarComentario)

module.exports = router