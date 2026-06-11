const pool = require('../config/database')
const bcrypt = require('bcryptjs')

// Obtener perfil de cualquier usuario por ID
const obtenerUsuario = async (req, res) => {
  try {
    const { id } = req.params
    const resultado = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.correo, u.foto_perfil, u.bio, 
              u.carrera, u.semestre, u.rol, u.creado_en,
              COALESCE(SUM(r.puntos), 0) as reputacion
       FROM usuarios u
       LEFT JOIN reputacion r ON u.id = r.usuario_id
       WHERE u.id = $1 AND u.activo = true
       GROUP BY u.id`,
      [id]
    )
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' })
    }
    res.json({ usuario: resultado.rows[0] })
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Editar perfil propio
const editarPerfil = async (req, res) => {
  try {
    const { nombre, apellido, bio, carrera, semestre, foto_perfil } = req.body
    const resultado = await pool.query(
      `UPDATE usuarios 
       SET nombre = COALESCE($1, nombre),
           apellido = COALESCE($2, apellido),
           bio = COALESCE($3, bio),
           carrera = COALESCE($4, carrera),
           semestre = COALESCE($5, semestre),
           foto_perfil = COALESCE($6, foto_perfil)
       WHERE id = $7
       RETURNING id, nombre, apellido, correo, bio, carrera, semestre, foto_perfil`,
      [nombre, apellido, bio, carrera, semestre, foto_perfil, req.usuario.id]
    )
    res.json({
      mensaje: '✅ Perfil actualizado',
      usuario: resultado.rows[0]
    })
  } catch (error) {
    console.error('Error editando perfil:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Cambiar contraseña
const cambiarPassword = async (req, res) => {
  try {
    const { password_actual, password_nuevo } = req.body

    const resultado = await pool.query(
      'SELECT password_hash FROM usuarios WHERE id = $1',
      [req.usuario.id]
    )
    const usuario = resultado.rows[0]
    const passwordValido = await bcrypt.compare(password_actual, usuario.password_hash)

    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Contraseña actual incorrecta' })
    }

    const nuevoHash = await bcrypt.hash(password_nuevo, 10)
    await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
      [nuevoHash, req.usuario.id]
    )

    res.json({ mensaje: '✅ Contraseña actualizada correctamente' })
  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Buscar usuarios por nombre o carrera
const buscarUsuarios = async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.status(400).json({ mensaje: 'Parámetro de búsqueda requerido' })

    const resultado = await pool.query(
      `SELECT id, nombre, apellido, correo, foto_perfil, carrera, semestre
       FROM usuarios
       WHERE activo = true
         AND (
           LOWER(nombre || ' ' || apellido) LIKE LOWER($1)
           OR LOWER(carrera) LIKE LOWER($1)
         )
       LIMIT 20`,
      [`%${q}%`]
    )
    res.json({ usuarios: resultado.rows })
  } catch (error) {
    console.error('Error buscando usuarios:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Obtener compañeros de la misma carrera
const companeros = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nombre, apellido, foto_perfil, carrera, semestre
       FROM usuarios
       WHERE carrera = (SELECT carrera FROM usuarios WHERE id = $1)
         AND id != $1
         AND activo = true
       ORDER BY semestre
       LIMIT 30`,
      [req.usuario.id]
    )
    res.json({ companeros: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo compañeros:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

module.exports = { obtenerUsuario, editarPerfil, cambiarPassword, buscarUsuarios, companeros }