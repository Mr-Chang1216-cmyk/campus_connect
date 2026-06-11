const pool = require('../config/database')
const bcrypt = require('bcryptjs')

// Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Acceso denegado' })
    }

    const resultado = await pool.query(
      `SELECT id, nombre, apellido, correo, carrera, semestre, rol, activo, creado_en
       FROM usuarios ORDER BY creado_en DESC`
    )
    res.json({ usuarios: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Crear usuario individual
const crearUsuario = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Acceso denegado' })
    }

    const { nombre, apellido, correo, carrera, semestre, rol } = req.body

    if (!nombre || !apellido || !correo) {
      return res.status(400).json({ mensaje: 'Nombre, apellido y correo son requeridos' })
    }

    // Password por defecto es el número del correo o 'campus2025'
    const passwordHash = await bcrypt.hash('campus2025', 10)

    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, correo, carrera, semestre, rol, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nombre, apellido, correo, carrera, semestre, rol`,
      [nombre, apellido, correo, carrera, semestre || null, rol || 'estudiante', passwordHash]
    )

    res.status(201).json({
      mensaje: '✅ Usuario creado. Contraseña por defecto: campus2025',
      usuario: resultado.rows[0]
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ mensaje: 'El correo ya está registrado' })
    }
    console.error('Error creando usuario:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Carga masiva de usuarios desde CSV
const cargaMasiva = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Acceso denegado' })
    }

    const { usuarios } = req.body

    if (!usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
      return res.status(400).json({ mensaje: 'Se requiere un array de usuarios' })
    }

    const passwordHash = await bcrypt.hash('campus2025', 10)
    let creados = 0
    let errores = []

    for (const u of usuarios) {
      try {
        await pool.query(
          `INSERT INTO usuarios (nombre, apellido, correo, carrera, semestre, rol, password_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (correo) DO NOTHING`,
          [u.nombre, u.apellido, u.correo, u.carrera, u.semestre || null, u.rol || 'estudiante', passwordHash]
        )
        creados++
      } catch (err) {
        errores.push({ correo: u.correo, error: err.message })
      }
    }

    res.json({
      mensaje: `✅ Carga completada: ${creados} usuarios creados`,
      creados,
      errores
    })
  } catch (error) {
    console.error('Error en carga masiva:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Activar o desactivar usuario
const toggleUsuario = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Acceso denegado' })
    }

    const { id } = req.params

    const resultado = await pool.query(
      `UPDATE usuarios SET activo = NOT activo WHERE id = $1
       RETURNING id, nombre, apellido, activo`,
      [id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' })
    }

    const usuario = resultado.rows[0]
    res.json({
      mensaje: `✅ Usuario ${usuario.activo ? 'activado' : 'desactivado'}`,
      usuario
    })
  } catch (error) {
    console.error('Error toggling usuario:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Cambiar rol de usuario
const cambiarRol = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Acceso denegado' })
    }

    const { id } = req.params
    const { rol } = req.body

    if (!['estudiante', 'docente', 'admin'].includes(rol)) {
      return res.status(400).json({ mensaje: 'Rol inválido' })
    }

    const resultado = await pool.query(
      `UPDATE usuarios SET rol = $1 WHERE id = $2
       RETURNING id, nombre, apellido, rol`,
      [rol, id]
    )

    res.json({
      mensaje: '✅ Rol actualizado',
      usuario: resultado.rows[0]
    })
  } catch (error) {
    console.error('Error cambiando rol:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Estadísticas generales
const estadisticas = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Acceso denegado' })
    }

    const [usuarios, publicaciones, grupos, apuntes, marketplace, eventos] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM usuarios WHERE activo = true'),
      pool.query('SELECT COUNT(*) FROM publicaciones'),
      pool.query('SELECT COUNT(*) FROM grupos'),
      pool.query('SELECT COUNT(*) FROM apuntes'),
      pool.query('SELECT COUNT(*) FROM marketplace WHERE disponible = true'),
      pool.query('SELECT COUNT(*) FROM eventos')
    ])

    res.json({
      estadisticas: {
        usuarios: parseInt(usuarios.rows[0].count),
        publicaciones: parseInt(publicaciones.rows[0].count),
        grupos: parseInt(grupos.rows[0].count),
        apuntes: parseInt(apuntes.rows[0].count),
        marketplace: parseInt(marketplace.rows[0].count),
        eventos: parseInt(eventos.rows[0].count)
      }
    })
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

module.exports = { obtenerUsuarios, crearUsuario, cargaMasiva, toggleUsuario, cambiarRol, estadisticas }