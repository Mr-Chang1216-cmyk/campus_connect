'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { BookOpen, Plus, Search, Download, Star, GraduationCap, Upload, File } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ApuntesPage() {
  const { usuario, cargando } = useAuth()
  const router = useRouter()
  const [apuntes, setApuntes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargandoApuntes, setCargandoApuntes] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [nuevoApunte, setNuevoApunte] = useState({
    titulo: '', descripcion: '', tipo: 'apunte', archivo_url: ''
  })
  const [tab, setTab] = useState('todos')
  const [misApuntes, setMisApuntes] = useState([])
  const [archivo, setArchivo] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login')
  }, [usuario, cargando])

  useEffect(() => {
    if (usuario) {
      cargarApuntes()
      cargarMisApuntes()
    }
  }, [usuario])

  const cargarApuntes = async () => {
    try {
      const res = await api.get('/apuntes')
      setApuntes(res.data.apuntes)
    } catch (error) {
      toast.error('Error cargando apuntes')
    } finally {
      setCargandoApuntes(false)
    }
  }

  const cargarMisApuntes = async () => {
    try {
      const res = await api.get('/apuntes/mis-apuntes')
      setMisApuntes(res.data.apuntes)
    } catch (error) {
      console.error(error)
    }
  }

  const subirArchivo = async () => {
    if (!archivo) return null
    const formData = new FormData()
    formData.append('archivo', archivo)
    const res = await fetch('http://localhost:3001/api/upload/archivo', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData
    })
    const data = await res.json()
    return data.url
  }

  const subirApunte = async () => {
    if (!nuevoApunte.titulo) {
      toast.error('El título es requerido')
      return
    }
    if (!archivo && !nuevoApunte.archivo_url) {
      toast.error('Debes subir un archivo o pegar un enlace')
      return
    }

    setSubiendo(true)
    try {
      let url = nuevoApunte.archivo_url

      if (archivo) {
        toast.loading('Subiendo archivo...')
        url = await subirArchivo()
        toast.dismiss()
        if (!url) {
          toast.error('Error subiendo el archivo')
          return
        }
      }

      await api.post('/apuntes', { ...nuevoApunte, archivo_url: url })
      toast.success('¡Apunte subido!')
      setMostrarModal(false)
      setNuevoApunte({ titulo: '', descripcion: '', tipo: 'apunte', archivo_url: '' })
      setArchivo(null)
      cargarApuntes()
      cargarMisApuntes()
    } catch (error) {
      toast.error('Error subiendo apunte')
    } finally {
      setSubiendo(false)
    }
  }

  const descargar = async (id, archivo_url) => {
    try {
      await api.post(`/apuntes/${id}/descargar`)
      window.open(archivo_url, '_blank')
    } catch (error) {
      console.error(error)
    }
  }

  const calificar = async (id, puntaje) => {
    try {
      const res = await api.post(`/apuntes/${id}/calificar`, { puntaje })
      toast.success(`¡Calificación guardada! +${res.data.puntos_ganados} pts de reputación`)
      cargarApuntes()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al calificar')
    }
  }

  const apuntesFiltrados = (tab === 'todos' ? apuntes : misApuntes)
    .filter(a => a.titulo.toLowerCase().includes(busqueda.toLowerCase()))

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center">
      <GraduationCap size={48} className="text-blue-600 animate-pulse" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pt-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Banco de apuntes</h1>
          <button
            onClick={() => setMostrarModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={18} />
            Subir
          </button>
        </div>

        {/* Búsqueda */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar apuntes..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['todos', 'mis-apuntes'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t === 'todos' ? 'Todos' : 'Mis apuntes'}
            </button>
          ))}
        </div>

        {/* Lista */}
        {cargandoApuntes ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : apuntesFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
            <p>No hay apuntes disponibles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apuntesFiltrados.map((apunte) => (
              <div key={apunte.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BookOpen size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{apunte.titulo}</h3>
                        <p className="text-xs text-gray-400">
                          {apunte.autor_nombre} {apunte.autor_apellido}
                          {apunte.materia && ` • ${apunte.materia}`}
                        </p>
                      </div>
                    </div>
                    {apunte.descripcion && (
                      <p className="text-sm text-gray-600 mt-2">{apunte.descripcion}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                        {apunte.tipo}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Download size={12} />
                        {apunte.descargas}
                      </span>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(star => (
                          <button
                            key={star}
                            onClick={() => calificar(apunte.id, star)}
                            className="text-yellow-400 hover:scale-110 transition-transform"
                          >
                            <Star
                              size={14}
                              fill={star <= Math.round(apunte.calificacion) ? 'currentColor' : 'none'}
                            />
                          </button>
                        ))}
                        <span className="text-xs text-gray-400 ml-1">
                          {parseFloat(apunte.calificacion).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => descargar(apunte.id, apunte.archivo_url)}
                    className="ml-3 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal subir apunte */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Subir apunte</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={nuevoApunte.titulo}
                onChange={(e) => setNuevoApunte({...nuevoApunte, titulo: e.target.value})}
                placeholder="Título del apunte"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
              <textarea
                value={nuevoApunte.descripcion}
                onChange={(e) => setNuevoApunte({...nuevoApunte, descripcion: e.target.value})}
                placeholder="Descripción (opcional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 resize-none h-20"
              />
              <select
                value={nuevoApunte.tipo}
                onChange={(e) => setNuevoApunte({...nuevoApunte, tipo: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              >
                <option value="apunte">Apunte</option>
                <option value="taller">Taller</option>
                <option value="examen">Examen</option>
                <option value="resumen">Resumen</option>
                <option value="otro">Otro</option>
              </select>

              {/* Subir archivo desde PC */}
              <div
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                {archivo ? (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <File size={20} />
                    <span className="text-sm font-medium">{archivo.name}</span>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Upload size={24} className="mx-auto mb-1" />
                    <p className="text-sm">Haz clic para subir un archivo</p>
                    <p className="text-xs mt-1">PDF, Word, Excel, PowerPoint (máx 10MB)</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.xlsx,.pptx,.jpg,.jpeg,.png"
                  onChange={(e) => setArchivo(e.target.files[0])}
                />
              </div>

              <div className="text-center text-xs text-gray-400">— o pega un enlace —</div>

              <input
                type="url"
                value={nuevoApunte.archivo_url}
                onChange={(e) => setNuevoApunte({...nuevoApunte, archivo_url: e.target.value})}
                placeholder="https://drive.google.com/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setMostrarModal(false); setArchivo(null) }}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={subirApunte}
                disabled={subiendo}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors"
              >
                {subiendo ? 'Subiendo...' : 'Subir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}