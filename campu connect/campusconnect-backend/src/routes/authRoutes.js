const express = require('express')
const router = express.Router()
const { login, perfil } = require('../controllers/authController')
const { verificarToken } = require('../middlewares/authMiddleware')

// POST /api/auth/login
router.post('/login', login)

// GET /api/auth/perfil (protegida)
router.get('/perfil', verificarToken, perfil)

module.exports = router