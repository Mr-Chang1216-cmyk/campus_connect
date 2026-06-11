const cloudinary = require('../config/cloudinary')

// Subir archivo a Cloudinary
const subirArchivo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se envió ningún archivo' })
    }

    console.log('Archivo recibido:', req.file.originalname, req.file.mimetype)

    // Convertir buffer a base64
    const b64 = Buffer.from(req.file.buffer).toString('base64')
    const dataURI = `data:${req.file.mimetype};base64,${b64}`

    // Subir a Cloudinary
    const resultado = await cloudinary.uploader.upload(dataURI, {
      folder: 'campusconnect/apuntes',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true
    })

    console.log('Cloudinary resultado:', resultado.secure_url)

    res.json({
      mensaje: '✅ Archivo subido exitosamente',
      url: resultado.secure_url,
      tipo: resultado.resource_type,
      formato: resultado.format,
      tamaño: resultado.bytes
    })
  } catch (error) {
    console.error('Error detallado:', error)
    res.status(500).json({ mensaje: 'Error subiendo archivo', detalle: error.message })
  }
}

// Subir imagen de perfil
const subirImagenPerfil = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se envió ninguna imagen' })
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64')
    const dataURI = `data:${req.file.mimetype};base64,${b64}`

    const resultado = await cloudinary.uploader.upload(dataURI, {
      folder: 'campusconnect/perfiles',
      resource_type: 'image',
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' }
      ]
    })

    res.json({
      mensaje: '✅ Imagen subida exitosamente',
      url: resultado.secure_url
    })
  } catch (error) {
    console.error('Error subiendo imagen:', error)
    res.status(500).json({ mensaje: 'Error subiendo imagen', detalle: error.message })
  }
}

module.exports = { subirArchivo, subirImagenPerfil }