const express = require('express')
const router = express.Router()
const { 
  obtenerUsuario, 
  editarPerfil, 
  cambiarPassword, 
  buscarUsuarios, 
  companeros 
} = require('../controllers/usuariosController')
const { verificarToken } = require('../middlewares/authMiddleware')

// Todas las rutas requieren token
router.use(verificarToken)

// GET /api/usuarios/buscar?q=nombre
router.get('/buscar', buscarUsuarios)

// GET /api/usuarios/companeros
router.get('/companeros', companeros)

// GET /api/usuarios/:id
router.get('/:id', obtenerUsuario)

// PUT /api/usuarios/perfil
router.put('/perfil', editarPerfil)

// PUT /api/usuarios/password
router.put('/password', cambiarPassword)

module.exports = router