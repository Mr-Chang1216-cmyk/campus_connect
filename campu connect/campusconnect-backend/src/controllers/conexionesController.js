const pool = require('../config/database')

// Enviar solicitud de conexión
const enviarSolicitud = async (req, res) => {
  try {
    const { receptor_id } = req.body

    if (receptor_id === req.usuario.id) {
      return res.status(400).json({ mensaje: 'No puedes conectarte contigo mismo' })
    }

    const existe = await pool.query(
      `SELECT * FROM conexiones 
       WHERE (solicitante_id = $1 AND receptor_id = $2)
       OR (solicitante_id = $2 AND receptor_id = $1)`,
      [req.usuario.id, receptor_id]
    )

    if (existe.rows.length > 0) {
      return res.status(400).json({ mensaje: 'Ya existe una solicitud entre estos usuarios' })
    }

    await pool.query(
      `INSERT INTO conexiones (solicitante_id, receptor_id, estado)
       VALUES ($1, $2, 'pendiente')`,
      [req.usuario.id, receptor_id]
    )

    res.status(201).json({ mensaje: '✅ Solicitud enviada' })
  } catch (error) {
    console.error('Error enviando solicitud:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Responder solicitud
const responderSolicitud = async (req, res) => {
  try {
    const { solicitante_id, estado } = req.body

    if (!['aceptada', 'rechazada'].includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado inválido' })
    }

    await pool.query(
      `UPDATE conexiones SET estado = $1
       WHERE solicitante_id = $2 AND receptor_id = $3 AND estado = 'pendiente'`,
      [estado, solicitante_id, req.usuario.id]
    )

    res.json({ mensaje: `✅ Solicitud ${estado}` })
  } catch (error) {
    console.error('Error respondiendo solicitud:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Obtener mis conexiones
const misConexiones = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.foto_perfil, u.carrera, u.semestre
       FROM conexiones c
       JOIN usuarios u ON (
         CASE WHEN c.solicitante_id = $1 THEN c.receptor_id
         ELSE c.solicitante_id END = u.id
       )
       WHERE (c.solicitante_id = $1 OR c.receptor_id = $1)
       AND c.estado = 'aceptada'`,
      [req.usuario.id]
    )
    res.json({ conexiones: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo conexiones:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Solicitudes pendientes recibidas
const solicitudesPendientes = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.foto_perfil, u.carrera, u.semestre,
              c.creado_en
       FROM conexiones c
       JOIN usuarios u ON c.solicitante_id = u.id
       WHERE c.receptor_id = $1 AND c.estado = 'pendiente'
       ORDER BY c.creado_en DESC`,
      [req.usuario.id]
    )
    res.json({ solicitudes: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Buscar usuarios para conectar
const buscarParaConectar = async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.status(400).json({ mensaje: 'Parámetro de búsqueda requerido' })

    const resultado = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.foto_perfil, u.carrera, u.semestre,
              c.estado as estado_conexion
       FROM usuarios u
       LEFT JOIN conexiones c ON (
         (c.solicitante_id = $1 AND c.receptor_id = u.id) OR
         (c.receptor_id = $1 AND c.solicitante_id = u.id)
       )
       WHERE u.id != $1 AND u.activo = true
       AND (
         LOWER(u.nombre || ' ' || u.apellido) LIKE LOWER($2)
         OR LOWER(u.carrera) LIKE LOWER($2)
       )
       LIMIT 20`,
      [req.usuario.id, `%${q}%`]
    )
    res.json({ usuarios: resultado.rows })
  } catch (error) {
    console.error('Error buscando usuarios:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

module.exports = { enviarSolicitud, responderSolicitud, misConexiones, solicitudesPendientes, buscarParaConectar }