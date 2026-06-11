const pool = require('../config/database')

// Obtener mensajes del chat de un grupo
const obtenerMensajes = async (req, res) => {
  try {
    const { grupo_id } = req.params

    // Verificar que el usuario es miembro del grupo
    const esMiembro = await pool.query(
      'SELECT 1 FROM grupo_miembros WHERE grupo_id = $1 AND usuario_id = $2',
      [grupo_id, req.usuario.id]
    )

    if (esMiembro.rows.length === 0) {
      return res.status(403).json({ mensaje: 'No eres miembro de este grupo' })
    }

    const resultado = await pool.query(
      `SELECT m.id, m.contenido, m.creado_en,
              u.id as autor_id, u.nombre, u.apellido, u.foto_perfil
       FROM mensajes_grupo m
       JOIN usuarios u ON m.autor_id = u.id
       WHERE m.grupo_id = $1
       ORDER BY m.creado_en ASC
       LIMIT 100`,
      [grupo_id]
    )

    res.json({ mensajes: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo mensajes:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Enviar mensaje al chat del grupo
const enviarMensaje = async (req, res) => {
  try {
    const { grupo_id } = req.params
    const { contenido } = req.body

    if (!contenido) {
      return res.status(400).json({ mensaje: 'El contenido es requerido' })
    }

    // Verificar que el usuario es miembro del grupo
    const esMiembro = await pool.query(
      'SELECT 1 FROM grupo_miembros WHERE grupo_id = $1 AND usuario_id = $2',
      [grupo_id, req.usuario.id]
    )

    if (esMiembro.rows.length === 0) {
      return res.status(403).json({ mensaje: 'No eres miembro de este grupo' })
    }

    const resultado = await pool.query(
      `INSERT INTO mensajes_grupo (grupo_id, autor_id, contenido)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [grupo_id, req.usuario.id, contenido]
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

module.exports = { obtenerMensajes, enviarMensaje }