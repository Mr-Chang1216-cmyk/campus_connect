const pool = require('../config/database')

// Crear publicación
const crearPublicacion = async (req, res) => {
  try {
    const { contenido, imagen_url, tipo, grupo_id } = req.body

    if (!contenido) {
      return res.status(400).json({ mensaje: 'El contenido es requerido' })
    }

    const resultado = await pool.query(
      `INSERT INTO publicaciones (autor_id, contenido, imagen_url, tipo, grupo_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.usuario.id, contenido, imagen_url, tipo || 'general', grupo_id || null]
    )

    res.status(201).json({
      mensaje: '✅ Publicación creada',
      publicacion: resultado.rows[0]
    })
  } catch (error) {
    console.error('Error creando publicación:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Obtener feed general
const obtenerFeed = async (req, res) => {
  try {
    const { pagina = 1, limite = 10 } = req.query
    const offset = (pagina - 1) * limite

    const resultado = await pool.query(
      `SELECT 
        p.id, p.contenido, p.imagen_url, p.tipo, p.creado_en,
        u.id as autor_id, u.nombre, u.apellido, u.foto_perfil, u.carrera,
        COUNT(DISTINCT l.usuario_id) as total_likes,
        COUNT(DISTINCT c.id) as total_comentarios,
        EXISTS(
          SELECT 1 FROM likes 
          WHERE publicacion_id = p.id AND usuario_id = $1
        ) as me_gusta
       FROM publicaciones p
       JOIN usuarios u ON p.autor_id = u.id
       LEFT JOIN likes l ON p.id = l.publicacion_id
       LEFT JOIN comentarios c ON p.id = c.publicacion_id
       WHERE p.grupo_id IS NULL
       GROUP BY p.id, u.id
       ORDER BY p.creado_en DESC
       LIMIT $2 OFFSET $3`,
      [req.usuario.id, limite, offset]
    )

    res.json({ publicaciones: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo feed:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Obtener una publicación con sus comentarios
const obtenerPublicacion = async (req, res) => {
  try {
    const { id } = req.params

    const publicacion = await pool.query(
      `SELECT 
        p.id, p.contenido, p.imagen_url, p.tipo, p.creado_en,
        u.id as autor_id, u.nombre, u.apellido, u.foto_perfil,
        COUNT(DISTINCT l.usuario_id) as total_likes,
        EXISTS(
          SELECT 1 FROM likes 
          WHERE publicacion_id = p.id AND usuario_id = $2
        ) as me_gusta
       FROM publicaciones p
       JOIN usuarios u ON p.autor_id = u.id
       LEFT JOIN likes l ON p.id = l.publicacion_id
       WHERE p.id = $1
       GROUP BY p.id, u.id`,
      [id, req.usuario.id]
    )

    if (publicacion.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Publicación no encontrada' })
    }

    const comentarios = await pool.query(
      `SELECT c.id, c.contenido, c.creado_en,
              u.id as autor_id, u.nombre, u.apellido, u.foto_perfil
       FROM comentarios c
       JOIN usuarios u ON c.autor_id = u.id
       WHERE c.publicacion_id = $1
       ORDER BY c.creado_en ASC`,
      [id]
    )

    res.json({
      publicacion: publicacion.rows[0],
      comentarios: comentarios.rows
    })
  } catch (error) {
    console.error('Error obteniendo publicación:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Eliminar publicación
const eliminarPublicacion = async (req, res) => {
  try {
    const { id } = req.params

    const publicacion = await pool.query(
      'SELECT autor_id FROM publicaciones WHERE id = $1',
      [id]
    )

    if (publicacion.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Publicación no encontrada' })
    }

    if (publicacion.rows[0].autor_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puedes eliminar esta publicación' })
    }

    await pool.query('DELETE FROM publicaciones WHERE id = $1', [id])
    res.json({ mensaje: '✅ Publicación eliminada' })
  } catch (error) {
    console.error('Error eliminando publicación:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Dar o quitar like
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params

    const likeExiste = await pool.query(
      'SELECT 1 FROM likes WHERE publicacion_id = $1 AND usuario_id = $2',
      [id, req.usuario.id]
    )

    if (likeExiste.rows.length > 0) {
      await pool.query(
        'DELETE FROM likes WHERE publicacion_id = $1 AND usuario_id = $2',
        [id, req.usuario.id]
      )
      res.json({ mensaje: '👎 Like removido', like: false })
    } else {
      await pool.query(
        'INSERT INTO likes (publicacion_id, usuario_id) VALUES ($1, $2)',
        [id, req.usuario.id]
      )
      res.json({ mensaje: '👍 Like agregado', like: true })
    }
  } catch (error) {
    console.error('Error en like:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Agregar comentario
const agregarComentario = async (req, res) => {
  try {
    const { id } = req.params
    const { contenido } = req.body

    if (!contenido) {
      return res.status(400).json({ mensaje: 'El contenido es requerido' })
    }

    const resultado = await pool.query(
      `INSERT INTO comentarios (publicacion_id, autor_id, contenido)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, req.usuario.id, contenido]
    )

    res.status(201).json({
      mensaje: '✅ Comentario agregado',
      comentario: resultado.rows[0]
    })
  } catch (error) {
    console.error('Error agregando comentario:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

module.exports = {
  crearPublicacion,
  obtenerFeed,
  obtenerPublicacion,
  eliminarPublicacion,
  toggleLike,
  agregarComentario
}