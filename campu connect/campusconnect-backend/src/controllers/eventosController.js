const pool = require('../config/database')

// Crear evento
const crearEvento = async (req, res) => {
  try {
    const { titulo, descripcion, lugar, fecha_inicio, fecha_fin, tipo, imagen_url } = req.body

    if (!titulo || !fecha_inicio) {
      return res.status(400).json({ mensaje: 'Título y fecha de inicio son requeridos' })
    }

    const resultado = await pool.query(
      `INSERT INTO eventos (creador_id, titulo, descripcion, lugar, fecha_inicio, fecha_fin, tipo, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.usuario.id, titulo, descripcion, lugar, fecha_inicio, fecha_fin || null, tipo || 'general', imagen_url || null]
    )

    res.status(201).json({
      mensaje: '✅ Evento creado exitosamente',
      evento: resultado.rows[0]
    })
  } catch (error) {
    console.error('Error creando evento:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Obtener todos los eventos
const obtenerEventos = async (req, res) => {
  try {
    const { tipo } = req.query

    let query = `
      SELECT e.id, e.titulo, e.descripcion, e.lugar, e.fecha_inicio,
             e.fecha_fin, e.tipo, e.imagen_url, e.creado_en,
             u.nombre as creador_nombre, u.apellido as creador_apellido,
             u.foto_perfil as creador_foto,
             COUNT(DISTINCT ea.usuario_id) as total_asistentes,
             EXISTS(
              SELECT 1 FROM evento_asistentes
              WHERE evento_id = e.id AND usuario_id = $1
              AND estado != 'cancelado'
            ) as voy_a_ir
      FROM eventos e
      JOIN usuarios u ON e.creador_id = u.id
      LEFT JOIN evento_asistentes ea ON e.id = ea.evento_id
      WHERE e.fecha_inicio >= NOW()
    `
    const params = [req.usuario.id]
    let paramCount = 2

    if (tipo) {
      query += ` AND e.tipo = $${paramCount}`
      params.push(tipo)
      paramCount++
    }

    query += ` GROUP BY e.id, u.nombre, u.apellido, u.foto_perfil
               ORDER BY e.fecha_inicio ASC`

    const resultado = await pool.query(query, params)
    res.json({ eventos: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo eventos:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Obtener un evento por ID
const obtenerEvento = async (req, res) => {
  try {
    const { id } = req.params

    const evento = await pool.query(
      `SELECT e.id, e.titulo, e.descripcion, e.lugar, e.fecha_inicio,
              e.fecha_fin, e.tipo, e.imagen_url, e.creado_en,
              u.id as creador_id, u.nombre as creador_nombre,
              u.apellido as creador_apellido, u.foto_perfil as creador_foto,
              COUNT(DISTINCT ea.usuario_id) as total_asistentes,
              EXISTS(
                SELECT 1 FROM evento_asistentes
                WHERE evento_id = e.id AND usuario_id = $2
              ) as voy_a_ir
       FROM eventos e
       JOIN usuarios u ON e.creador_id = u.id
       LEFT JOIN evento_asistentes ea ON e.id = ea.evento_id
       WHERE e.id = $1
       GROUP BY e.id, u.id`,
      [id, req.usuario.id]
    )

    if (evento.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' })
    }

    const asistentes = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.foto_perfil, ea.estado
       FROM evento_asistentes ea
       JOIN usuarios u ON ea.usuario_id = u.id
       WHERE ea.evento_id = $1`,
      [id]
    )

    res.json({
      evento: evento.rows[0],
      asistentes: asistentes.rows
    })
  } catch (error) {
    console.error('Error obteniendo evento:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Confirmar asistencia
const confirmarAsistencia = async (req, res) => {
  try {
    const { id } = req.params
    const { estado } = req.body

    if (!estado || !['interesado', 'confirmado', 'cancelado'].includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado inválido' })
    }

    await pool.query(
      `INSERT INTO evento_asistentes (evento_id, usuario_id, estado)
       VALUES ($1, $2, $3)
       ON CONFLICT (evento_id, usuario_id)
       DO UPDATE SET estado = $3`,
      [id, req.usuario.id, estado]
    )

    res.json({ mensaje: `✅ Asistencia marcada como: ${estado}` })
  } catch (error) {
    console.error('Error confirmando asistencia:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Eliminar evento
const eliminarEvento = async (req, res) => {
  try {
    const { id } = req.params

    const evento = await pool.query(
      'SELECT creador_id FROM eventos WHERE id = $1',
      [id]
    )

    if (evento.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' })
    }

    if (evento.rows[0].creador_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puedes eliminar este evento' })
    }

    await pool.query('DELETE FROM eventos WHERE id = $1', [id])
    res.json({ mensaje: '✅ Evento eliminado' })
  } catch (error) {
    console.error('Error eliminando evento:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Mis eventos creados
const misEventos = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT e.id, e.titulo, e.descripcion, e.lugar, e.fecha_inicio,
              e.fecha_fin, e.tipo, e.imagen_url, e.creado_en,
              COUNT(DISTINCT ea.usuario_id) as total_asistentes
       FROM eventos e
       LEFT JOIN evento_asistentes ea ON e.id = ea.evento_id
       WHERE e.creador_id = $1
       GROUP BY e.id
       ORDER BY e.fecha_inicio ASC`,
      [req.usuario.id]
    )

    res.json({ eventos: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo mis eventos:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

module.exports = {
  crearEvento,
  obtenerEventos,
  obtenerEvento,
  confirmarAsistencia,
  eliminarEvento,
  misEventos
}