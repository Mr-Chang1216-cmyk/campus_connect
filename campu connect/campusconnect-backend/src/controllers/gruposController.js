const pool = require('../config/database')

// Crear grupo de estudio
const crearGrupo = async (req, res) => {
  try {
    const { nombre, descripcion, materia_id, privado } = req.body

    if (!nombre) {
      return res.status(400).json({ mensaje: 'El nombre es requerido' })
    }

    const resultado = await pool.query(
      `INSERT INTO grupos (nombre, descripcion, materia_id, creador_id, privado)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, descripcion, materia_id || null, req.usuario.id, privado || false]
    )

    const grupo = resultado.rows[0]

    // Agregar al creador como admin del grupo
    await pool.query(
      `INSERT INTO grupo_miembros (grupo_id, usuario_id, rol)
       VALUES ($1, $2, 'admin')`,
      [grupo.id, req.usuario.id]
    )

    res.status(201).json({
      mensaje: '✅ Grupo creado',
      grupo
    })
  } catch (error) {
    console.error('Error creando grupo:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Obtener todos los grupos
const obtenerGrupos = async (req, res) => {
  try {
    const { q } = req.query

    let query = `
      SELECT g.id, g.nombre, g.descripcion, g.privado, g.creado_en,
             m.nombre as materia,
             u.nombre as creador_nombre, u.apellido as creador_apellido,
             COUNT(gm.usuario_id) as total_miembros,
             EXISTS(
               SELECT 1 FROM grupo_miembros 
               WHERE grupo_id = g.id AND usuario_id = $1
             ) as soy_miembro
      FROM grupos g
      LEFT JOIN materias m ON g.materia_id = m.id
      LEFT JOIN usuarios u ON g.creador_id = u.id
      LEFT JOIN grupo_miembros gm ON g.id = gm.grupo_id
      WHERE g.privado = false
    `
    const params = [req.usuario.id]

    if (q) {
      query += ` AND (LOWER(g.nombre) LIKE LOWER($2) OR LOWER(m.nombre) LIKE LOWER($2))`
      params.push(`%${q}%`)
    }

    query += ` GROUP BY g.id, m.nombre, u.nombre, u.apellido ORDER BY g.creado_en DESC`

    const resultado = await pool.query(query, params)
    res.json({ grupos: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo grupos:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Obtener un grupo con sus miembros
const obtenerGrupo = async (req, res) => {
  try {
    const { id } = req.params

    const grupo = await pool.query(
      `SELECT g.id, g.nombre, g.descripcion, g.privado, g.creado_en,
              m.nombre as materia,
              u.nombre as creador_nombre, u.apellido as creador_apellido,
              COUNT(gm.usuario_id) as total_miembros,
              EXISTS(
                SELECT 1 FROM grupo_miembros 
                WHERE grupo_id = g.id AND usuario_id = $2
              ) as soy_miembro
       FROM grupos g
       LEFT JOIN materias m ON g.materia_id = m.id
       LEFT JOIN usuarios u ON g.creador_id = u.id
       LEFT JOIN grupo_miembros gm ON g.id = gm.grupo_id
       WHERE g.id = $1
       GROUP BY g.id, m.nombre, u.nombre, u.apellido`,
      [id, req.usuario.id]
    )

    if (grupo.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Grupo no encontrado' })
    }

    const miembros = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.foto_perfil, u.carrera, gm.rol
       FROM grupo_miembros gm
       JOIN usuarios u ON gm.usuario_id = u.id
       WHERE gm.grupo_id = $1`,
      [id]
    )

    res.json({
      grupo: grupo.rows[0],
      miembros: miembros.rows
    })
  } catch (error) {
    console.error('Error obteniendo grupo:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Unirse a un grupo
const unirseGrupo = async (req, res) => {
  try {
    const { id } = req.params

    const yaMiembro = await pool.query(
      'SELECT 1 FROM grupo_miembros WHERE grupo_id = $1 AND usuario_id = $2',
      [id, req.usuario.id]
    )

    if (yaMiembro.rows.length > 0) {
      return res.status(400).json({ mensaje: 'Ya eres miembro de este grupo' })
    }

    await pool.query(
      `INSERT INTO grupo_miembros (grupo_id, usuario_id, rol)
       VALUES ($1, $2, 'miembro')`,
      [id, req.usuario.id]
    )

    res.json({ mensaje: '✅ Te uniste al grupo exitosamente' })
  } catch (error) {
    console.error('Error uniéndose al grupo:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Salir de un grupo
const salirGrupo = async (req, res) => {
  try {
    const { id } = req.params

    const esCreador = await pool.query(
      'SELECT 1 FROM grupos WHERE id = $1 AND creador_id = $2',
      [id, req.usuario.id]
    )

    if (esCreador.rows.length > 0) {
      return res.status(400).json({ mensaje: 'El creador no puede salir del grupo' })
    }

    await pool.query(
      'DELETE FROM grupo_miembros WHERE grupo_id = $1 AND usuario_id = $2',
      [id, req.usuario.id]
    )

    res.json({ mensaje: '✅ Saliste del grupo' })
  } catch (error) {
    console.error('Error saliendo del grupo:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Mis grupos
const misGrupos = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT g.id, g.nombre, g.descripcion, g.privado, g.creado_en,
              m.nombre as materia, gm.rol,
              COUNT(gm2.usuario_id) as total_miembros
       FROM grupo_miembros gm
       JOIN grupos g ON gm.grupo_id = g.id
       LEFT JOIN materias m ON g.materia_id = m.id
       LEFT JOIN grupo_miembros gm2 ON g.id = gm2.grupo_id
       WHERE gm.usuario_id = $1
       GROUP BY g.id, m.nombre, gm.rol
       ORDER BY g.creado_en DESC`,
      [req.usuario.id]
    )

    res.json({ grupos: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo mis grupos:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

module.exports = { crearGrupo, obtenerGrupos, obtenerGrupo, unirseGrupo, salirGrupo, misGrupos }