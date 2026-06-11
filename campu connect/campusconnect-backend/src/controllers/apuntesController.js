const pool = require('../config/database')

// Subir apunte
const subirApunte = async (req, res) => {
  try {
    const { titulo, descripcion, materia_id, tipo, archivo_url } = req.body

    if (!titulo || !archivo_url) {
      return res.status(400).json({ mensaje: 'Título y archivo son requeridos' })
    }

    const resultado = await pool.query(
      `INSERT INTO apuntes (autor_id, materia_id, titulo, descripcion, tipo, archivo_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.usuario.id, materia_id || null, titulo, descripcion, tipo || 'apunte', archivo_url]
    )

    res.status(201).json({
      mensaje: '✅ Apunte subido exitosamente',
      apunte: resultado.rows[0]
    })
  } catch (error) {
    console.error('Error subiendo apunte:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Obtener todos los apuntes
const obtenerApuntes = async (req, res) => {
  try {
    const { q, materia_id, tipo } = req.query

    let query = `
      SELECT a.id, a.titulo, a.descripcion, a.tipo, a.archivo_url,
             a.descargas, a.creado_en,
             u.nombre as autor_nombre, u.apellido as autor_apellido,
             u.foto_perfil as autor_foto,
             m.nombre as materia,
             COALESCE(AVG(ac.puntaje), 0) as calificacion,
             COUNT(DISTINCT ac.usuario_id) as total_calificaciones
      FROM apuntes a
      JOIN usuarios u ON a.autor_id = u.id
      LEFT JOIN materias m ON a.materia_id = m.id
      LEFT JOIN apuntes_calificaciones ac ON a.id = ac.apunte_id
      WHERE 1=1
    `
    const params = []
    let paramCount = 1

    if (q) {
      query += ` AND (LOWER(a.titulo) LIKE LOWER($${paramCount}) OR LOWER(a.descripcion) LIKE LOWER($${paramCount}))`
      params.push(`%${q}%`)
      paramCount++
    }

    if (materia_id) {
      query += ` AND a.materia_id = $${paramCount}`
      params.push(materia_id)
      paramCount++
    }

    if (tipo) {
      query += ` AND a.tipo = $${paramCount}`
      params.push(tipo)
      paramCount++
    }

    query += ` GROUP BY a.id, u.nombre, u.apellido, u.foto_perfil, m.nombre
               ORDER BY a.creado_en DESC`

    const resultado = await pool.query(query, params)
    res.json({ apuntes: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo apuntes:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Obtener un apunte por ID
const obtenerApunte = async (req, res) => {
  try {
    const { id } = req.params

    const resultado = await pool.query(
      `SELECT a.id, a.titulo, a.descripcion, a.tipo, a.archivo_url,
              a.descargas, a.creado_en,
              u.id as autor_id, u.nombre as autor_nombre, 
              u.apellido as autor_apellido, u.foto_perfil,
              m.nombre as materia,
              COALESCE(AVG(ac.puntaje), 0) as calificacion,
              COUNT(DISTINCT ac.usuario_id) as total_calificaciones
       FROM apuntes a
       JOIN usuarios u ON a.autor_id = u.id
       LEFT JOIN materias m ON a.materia_id = m.id
       LEFT JOIN apuntes_calificaciones ac ON a.id = ac.apunte_id
       WHERE a.id = $1
       GROUP BY a.id, u.id, m.nombre`,
      [id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Apunte no encontrado' })
    }

    res.json({ apunte: resultado.rows[0] })
  } catch (error) {
    console.error('Error obteniendo apunte:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Descargar apunte
const descargarApunte = async (req, res) => {
  try {
    const { id } = req.params

    const resultado = await pool.query(
      `UPDATE apuntes SET descargas = descargas + 1
       WHERE id = $1
       RETURNING archivo_url, titulo`,
      [id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Apunte no encontrado' })
    }

    res.json({
      mensaje: '✅ Descarga registrada',
      archivo_url: resultado.rows[0].archivo_url,
      titulo: resultado.rows[0].titulo
    })
  } catch (error) {
    console.error('Error descargando apunte:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Calificar apunte
const calificarApunte = async (req, res) => {
  try {
    const { id } = req.params
    const { puntaje } = req.body

    if (!puntaje || puntaje < 1 || puntaje > 5) {
      return res.status(400).json({ mensaje: 'El puntaje debe ser entre 1 y 5' })
    }

    const apunte = await pool.query(
      'SELECT autor_id FROM apuntes WHERE id = $1',
      [id]
    )

    if (apunte.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Apunte no encontrado' })
    }

    if (apunte.rows[0].autor_id === req.usuario.id) {
      return res.status(400).json({ mensaje: 'No puedes calificar tu propio apunte, respete.' })
    }

    const yaCalifico = await pool.query(
      'SELECT puntaje FROM apuntes_calificaciones WHERE apunte_id = $1 AND usuario_id = $2',
      [id, req.usuario.id]
    )

    const calificacionAnterior = yaCalifico.rows.length > 0 ? yaCalifico.rows[0].puntaje : null

    await pool.query(
      `INSERT INTO apuntes_calificaciones (apunte_id, usuario_id, puntaje)
       VALUES ($1, $2, $3)
       ON CONFLICT (apunte_id, usuario_id)
       DO UPDATE SET puntaje = $3`,
      [id, req.usuario.id, puntaje]
    )

    const puntosNuevos = puntaje >= 5 ? 2 : puntaje === 4 ? 1 : 0
    const puntosAnteriores = calificacionAnterior
      ? (calificacionAnterior >= 5 ? 2 : calificacionAnterior === 4 ? 1 : 0)
      : 0
    const diferencia = puntosNuevos - puntosAnteriores

    if (diferencia !== 0 && !calificacionAnterior) {
      await pool.query(
        `INSERT INTO reputacion (usuario_id, puntos, motivo)
         VALUES ($1, $2, $3)`,
        [apunte.rows[0].autor_id, puntosNuevos, `Calificación de apunte #${id}`]
      )
    } else if (diferencia !== 0 && calificacionAnterior) {
      await pool.query(
        `INSERT INTO reputacion (usuario_id, puntos, motivo)
         VALUES ($1, $2, $3)`,
        [apunte.rows[0].autor_id, diferencia, `Actualización calificación apunte #${id}`]
      )
    }

    const promedio = await pool.query(
      `SELECT COALESCE(AVG(puntaje), 0) as calificacion,
              COUNT(*) as total
       FROM apuntes_calificaciones
       WHERE apunte_id = $1`,
      [id]
    )

    const reputacion = await pool.query(
      `SELECT COALESCE(SUM(puntos), 0) as total
       FROM reputacion WHERE usuario_id = $1`,
      [apunte.rows[0].autor_id]
    )

    res.json({
      mensaje: '✅ Calificación registrada',
      calificacion: parseFloat(promedio.rows[0].calificacion).toFixed(1),
      total_calificaciones: promedio.rows[0].total,
      puntos_reputacion: parseInt(reputacion.rows[0].total),
      puntos_ganados: puntosNuevos
    })
  } catch (error) {
    console.error('Error calificando apunte:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Eliminar apunte
const eliminarApunte = async (req, res) => {
  try {
    const { id } = req.params

    const apunte = await pool.query(
      'SELECT autor_id FROM apuntes WHERE id = $1',
      [id]
    )

    if (apunte.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Apunte no encontrado' })
    }

    if (apunte.rows[0].autor_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puedes eliminar este apunte' })
    }

    await pool.query('DELETE FROM apuntes WHERE id = $1', [id])
    res.json({ mensaje: '✅ Apunte eliminado' })
  } catch (error) {
    console.error('Error eliminando apunte:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Mis apuntes
const misApuntes = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT a.id, a.titulo, a.descripcion, a.tipo, a.archivo_url,
              a.descargas, a.creado_en, m.nombre as materia,
              COALESCE(AVG(ac.puntaje), 0) as calificacion
       FROM apuntes a
       LEFT JOIN materias m ON a.materia_id = m.id
       LEFT JOIN apuntes_calificaciones ac ON a.id = ac.apunte_id
       WHERE a.autor_id = $1
       GROUP BY a.id, m.nombre
       ORDER BY a.creado_en DESC`,
      [req.usuario.id]
    )

    res.json({ apuntes: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo mis apuntes:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

module.exports = {
  subirApunte,
  obtenerApuntes,
  obtenerApunte,
  descargarApunte,
  calificarApunte,
  eliminarApunte,
  misApuntes
}