const pool = require('../config/database')

// Crear publicación en marketplace
const crearProducto = async (req, res) => {
  try {
    const { titulo, descripcion, precio, categoria, imagen_url } = req.body

    if (!titulo || !categoria) {
      return res.status(400).json({ mensaje: 'Título y categoría son requeridos' })
    }

    const resultado = await pool.query(
      `INSERT INTO marketplace (vendedor_id, titulo, descripcion, precio, categoria, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.usuario.id, titulo, descripcion, precio || null, categoria, imagen_url || null]
    )

    res.status(201).json({
      mensaje: '✅ Producto publicado exitosamente',
      producto: resultado.rows[0]
    })
  } catch (error) {
    console.error('Error creando producto:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Obtener todos los productos
const obtenerProductos = async (req, res) => {
  try {
    const { q, categoria } = req.query

    let query = `
      SELECT m.id, m.titulo, m.descripcion, m.precio, m.categoria,
             m.imagen_url, m.disponible, m.creado_en,
             u.id as vendedor_id, u.nombre as vendedor_nombre,
             u.apellido as vendedor_apellido, u.foto_perfil as vendedor_foto,
             u.carrera as vendedor_carrera
      FROM marketplace m
      JOIN usuarios u ON m.vendedor_id = u.id
      WHERE m.disponible = true
    `
    const params = []
    let paramCount = 1

    if (q) {
      query += ` AND (LOWER(m.titulo) LIKE LOWER($${paramCount}) OR LOWER(m.descripcion) LIKE LOWER($${paramCount}))`
      params.push(`%${q}%`)
      paramCount++
    }

    if (categoria) {
      query += ` AND m.categoria = $${paramCount}`
      params.push(categoria)
      paramCount++
    }

    query += ` ORDER BY m.creado_en DESC`

    const resultado = await pool.query(query, params)
    res.json({ productos: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo productos:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Obtener un producto por ID
const obtenerProducto = async (req, res) => {
  try {
    const { id } = req.params

    const resultado = await pool.query(
      `SELECT m.id, m.titulo, m.descripcion, m.precio, m.categoria,
              m.imagen_url, m.disponible, m.creado_en,
              u.id as vendedor_id, u.nombre as vendedor_nombre,
              u.apellido as vendedor_apellido, u.foto_perfil as vendedor_foto,
              u.correo as vendedor_correo, u.carrera as vendedor_carrera
       FROM marketplace m
       JOIN usuarios u ON m.vendedor_id = u.id
       WHERE m.id = $1`,
      [id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' })
    }

    res.json({ producto: resultado.rows[0] })
  } catch (error) {
    console.error('Error obteniendo producto:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Actualizar producto
const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params
    const { titulo, descripcion, precio, imagen_url, disponible } = req.body

    const producto = await pool.query(
      'SELECT vendedor_id FROM marketplace WHERE id = $1',
      [id]
    )

    if (producto.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' })
    }

    if (producto.rows[0].vendedor_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puedes editar este producto' })
    }

    const resultado = await pool.query(
      `UPDATE marketplace
       SET titulo = COALESCE($1, titulo),
           descripcion = COALESCE($2, descripcion),
           precio = COALESCE($3, precio),
           imagen_url = COALESCE($4, imagen_url),
           disponible = COALESCE($5, disponible)
       WHERE id = $6
       RETURNING *`,
      [titulo, descripcion, precio, imagen_url, disponible, id]
    )

    res.json({
      mensaje: '✅ Producto actualizado',
      producto: resultado.rows[0]
    })
  } catch (error) {
    console.error('Error actualizando producto:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Eliminar producto
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params

    const producto = await pool.query(
      'SELECT vendedor_id FROM marketplace WHERE id = $1',
      [id]
    )

    if (producto.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' })
    }

    if (producto.rows[0].vendedor_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puedes eliminar este producto' })
    }

    await pool.query('DELETE FROM marketplace WHERE id = $1', [id])
    res.json({ mensaje: '✅ Producto eliminado' })
  } catch (error) {
    console.error('Error eliminando producto:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// Mis productos
const misProductos = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, titulo, descripcion, precio, categoria,
              imagen_url, disponible, creado_en
       FROM marketplace
       WHERE vendedor_id = $1
       ORDER BY creado_en DESC`,
      [req.usuario.id]
    )

    res.json({ productos: resultado.rows })
  } catch (error) {
    console.error('Error obteniendo mis productos:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto,
  misProductos
}