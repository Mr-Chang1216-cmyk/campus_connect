const jwt = require('jsonwebtoken')

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado, token requerido' })
  }

  try {
    const verificado = jwt.verify(token, process.env.JWT_SECRET || 'campusconnect_secret_key_2025')
    req.usuario = verificado
    next()
  } catch (error) {
    res.status(401).json({ mensaje: 'Token inválido o expirado' })
  }
}

module.exports = { verificarToken }