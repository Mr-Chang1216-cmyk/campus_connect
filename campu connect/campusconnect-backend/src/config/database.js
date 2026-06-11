const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host:     'localhost',
  port:     5432,
  database: 'campusconnect',
  user:     'postgres',
  password: '110405',
})

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message)
  } else {
    console.log('✅ Conectado a PostgreSQL correctamente')
    release()
  }
})

module.exports = pool