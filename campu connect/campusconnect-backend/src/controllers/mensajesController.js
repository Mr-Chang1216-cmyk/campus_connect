const pool = require('../config/database')

// Obtener conversación entre dos usuarios
const obtenerConversacion = async (req, res) => {
  try {
    const { usuario_id } = req.params

    const resultado = await pool.query(
      `SELECT m.id, m.contenido, m.imagen_url, m.leido, m.creado_en,
              m.emisor_id, m.receptor_id,
              u.nombre as emisor_nombre, u.apellido as emisor_apellido
       FROM mensajes_privados m
       JOIN usuarios u ON m.emisor_id = u.id
       WHERE (m.emisor_id = $1 AND m.receptor_id = $2)
       OR (m.emisor_id = $2 AND m.receptor_id = $1)
       ORDER BY m.creado_en ASC`,
      [req.usuario.id, usuario_id]
    )

    // Marcar mensajes como leídos
    await pool.query(
      `UPDATE mensajes_privados SET leido = true
       WHERE receptor_id = $1 AND emisor_id = $2 AND leido = false`,
      [req.usuario.id, usuario_id]
    )

    res.json({ mensajes: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo conversación:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Enviar mensaje privado
const enviarMensaje = async (req, res) => {
  try {
    const { receptor_id, contenido, imagen_url } = req.body

    if (!contenido && !imagen_url) {
      return res.status(400).json({ mensaje: 'Mensaje o imagen requeridos' })
    }

    if (receptor_id === req.usuario.id) {
      return res.status(400).json({ mensaje: 'No puedes enviarte mensajes a ti mismo' })
    }

    const resultado = await pool.query(
      `INSERT INTO mensajes_privados (emisor_id, receptor_id, contenido, imagen_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.usuario.id, receptor_id, contenido || null, imagen_url || null]
    )

    res.status(201).json({
      mensaje: '✅ Mensaje enviado',
      mensajeObj: resultado.rows[0]
    })
  } catch (error) {
    console.error('Error enviando mensaje:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Obtener lista de conversaciones
const obtenerConversaciones = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT DISTINCT ON (otro_usuario)
              otro_usuario,
              u.nombre, u.apellido, u.foto_perfil,
              m.contenido as ultimo_mensaje,
              m.creado_en as ultima_fecha,
              COUNT(CASE WHEN m.leido = false AND m.receptor_id = $1 THEN 1 END) as no_leidos
       FROM (
         SELECT 
           CASE WHEN emisor_id = $1 THEN receptor_id ELSE emisor_id END as otro_usuario,
           contenido, creado_en, leido, receptor_id
         FROM mensajes_privados
         WHERE emisor_id = $1 OR receptor_id = $1
       ) m
       JOIN usuarios u ON m.otro_usuario = u.id
       GROUP BY otro_usuario, u.nombre, u.apellido, u.foto_perfil, m.contenido, m.creado_en
       ORDER BY otro_usuario, m.creado_en DESC`,
      [req.usuario.id]
    )

    res.json({ conversaciones: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

module.exports = { obtenerConversacion, enviarMensaje, obtenerConversaciones }