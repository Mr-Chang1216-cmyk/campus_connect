const express = require('express')
const cors = require('cors')
require('dotenv').config()

// Importar conexión a la base de datos
require('./config/database')

// Importar rutas
const authRoutes = require('./routes/authRoutes')
const usuariosRoutes = require('./routes/usuariosRoutes')
const publicacionesRoutes = require('./routes/publicacionesRoutes')
const gruposRoutes = require('./routes/gruposRoutes')
const apuntesRoutes = require('./routes/apuntesRoutes')
const marketplaceRoutes = require('./routes/marketplaceRoutes')
const eventosRoutes = require('./routes/eventosRoutes')
const adminRoutes = require('./routes/adminRoutes')
const conexionesRoutes = require('./routes/conexionesRoutes')
const chatRoutes = require('./routes/chatRoutes')
const mensajesRoutes = require('./routes/mensajesRoutes')
const uploadRoutes = require('./routes/uploadRoutes')

const app = express()
const PORT = 3001

// Middlewares
app.use(cors())
app.use(express.json())

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/publicaciones', publicacionesRoutes)
app.use('/api/grupos', gruposRoutes)
app.use('/api/apuntes', apuntesRoutes)
app.use('/api/marketplace', marketplaceRoutes)
app.use('/api/eventos', eventosRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/conexiones', conexionesRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/mensajes', mensajesRoutes)
app.use('/api/upload', uploadRoutes)

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    mensaje: '🎓 CampusConnect API funcionando!',
    version: '1.0.0',
    modulos: [
      'auth', 'usuarios', 'publicaciones',
      'grupos', 'apuntes', 'marketplace',
      'eventos', 'admin', 'conexiones',
      'chat', 'mensajes', 'upload'
    ]
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})