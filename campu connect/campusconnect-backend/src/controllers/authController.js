const pool = require('../config/database')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'campusconnect_secret_key_2025'

// Login con correo institucional
const login = async (req, res) => {
  const { correo, password } = req.body

  try {
    if (!correo.endsWith('@alumnoeseit.edu.co')) {
      return res.status(403).json({
        mensaje: 'Solo se permite acceso con correo institucional (@alumnoeseit.edu.co)'
      })
    }

    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1 AND activo = true',
      [correo]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' })
    }

    const usuario = resultado.rows[0]

    const passwordValido = await bcrypt.compare(password, usuario.password_hash)
    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' })
    }

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    await pool.query(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1',
      [usuario.id]
    )

    res.json({
      mensaje: '✅ Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        carrera: usuario.carrera,
        semestre: usuario.semestre,
        rol: usuario.rol,
        foto_perfil: usuario.foto_perfil
      }
    })

  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Obtener perfil del usuario autenticado
const perfil = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.correo, u.foto_perfil, u.bio, 
              u.carrera, u.semestre, u.rol, u.creado_en,
              COALESCE(SUM(r.puntos), 0) as reputacion
       FROM usuarios u
       LEFT JOIN reputacion r ON u.id = r.usuario_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.usuario.id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' })
    }

    res.json({ usuario: resultado.rows[0] })

  } catch (error) {
    console.error('Error obteniendo perfil:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

module.exports = { login, perfil }