const express = require('express')
const router = express.Router()
const multer = require('multer')
const { subirArchivo, subirImagenPerfil } = require('../controllers/uploadController')
const { verificarToken } = require('../middlewares/authMiddleware')

// Configurar multer en memoria
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
  fileFilter: (req, file, cb) => {
    cb(null, true) // Aceptar todos los archivos
  }
})

router.use(verificarToken)

// POST /api/upload/archivo
router.post('/archivo', upload.single('archivo'), subirArchivo)

// POST /api/upload/perfil
router.post('/perfil', upload.single('imagen'), subirImagenPerfil)

module.exports = router