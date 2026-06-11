'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Calendar, Plus, MapPin, Clock, GraduationCap } from 'lucide-react'
import { useRouter } from 'next/navigation'

const tipos = ['todos', 'charla', 'hackathon', 'feria', 'taller', 'general']

export default function EventosPage() {
  const { usuario, cargando } = useAuth()
  const router = useRouter()
  const [eventos, setEventos] = useState([])
  const [tipoActivo, setTipoActivo] = useState('todos')
  const [cargandoEventos, setCargandoEventos] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: '', descripcion: '', lugar: '',
    fecha_inicio: '', fecha_fin: '', tipo: 'general'
  })

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login')
  }, [usuario, cargando])

  useEffect(() => {
    if (usuario) cargarEventos()
  }, [usuario])

  const cargarEventos = async () => {
    try {
      const res = await api.get('/eventos')
      setEventos(res.data.eventos)
    } catch (error) {
      toast.error('Error cargando eventos')
    } finally {
      setCargandoEventos(false)
    }
  }

  const crearEvento = async () => {
    if (!nuevoEvento.titulo || !nuevoEvento.fecha_inicio) {
      toast.error('Título y fecha de inicio son requeridos')
      return
    }
    try {
      await api.post('/eventos', nuevoEvento)
      toast.success('¡Evento creado!')
      setMostrarModal(false)
      setNuevoEvento({
        titulo: '', descripcion: '', lugar: '',
        fecha_inicio: '', fecha_fin: '', tipo: 'general'
      })
      cargarEventos()
    } catch (error) {
      toast.error('Error creando evento')
    }
  }

  const confirmarAsistencia = async (id, estado) => {
    try {
      await api.post(`/eventos/${id}/asistencia`, { estado })
      toast.success(`Asistencia marcada como: ${estado}`)
      cargarEventos()
    } catch (error) {
      toast.error('Error confirmando asistencia')
    }
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  const eventosFiltrados = tipoActivo === 'todos'
    ? eventos
    : eventos.filter(e => e.tipo === tipoActivo)

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
          <h1 className="text-2xl font-bold text-gray-800">Eventos</h1>
          <button
            onClick={() => setMostrarModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={18} />
            Crear evento
          </button>
        </div>

        {/* Tipos */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tipos.map(tipo => (
            <button
              key={tipo}
              onClick={() => setTipoActivo(tipo)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                tipoActivo === tipo
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
            </button>
          ))}
        </div>

        {/* Lista eventos */}
        {cargandoEventos ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : eventosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-50" />
            <p>No hay eventos próximos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {eventosFiltrados.map((evento) => (
              <div key={evento.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{evento.titulo}</h3>
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {evento.tipo}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {evento.total_asistentes} van
                      </span>
                    </div>

                    {evento.descripcion && (
                      <p className="text-sm text-gray-600 mt-2">{evento.descripcion}</p>
                    )}

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} />
                        {formatearFecha(evento.fecha_inicio)}
                      </div>
                      {evento.lugar && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={12} />
                          {evento.lugar}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      {evento.voy_a_ir ? (
                        <button
                          onClick={() => confirmarAsistencia(evento.id, 'cancelado')}
                          className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-colors"
                        >
                          Cancelar asistencia
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => confirmarAsistencia(evento.id, 'confirmado')}
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700 transition-colors"
                          >
                            ✓ Voy a ir
                          </button>
                          <button
                            onClick={() => confirmarAsistencia(evento.id, 'interesado')}
                            className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-200 transition-colors"
                          >
                            Me interesa
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal crear evento */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Crear evento</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={nuevoEvento.titulo}
                onChange={(e) => setNuevoEvento({...nuevoEvento, titulo: e.target.value})}
                placeholder="Título del evento"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
              <textarea
                value={nuevoEvento.descripcion}
                onChange={(e) => setNuevoEvento({...nuevoEvento, descripcion: e.target.value})}
                placeholder="Descripción (opcional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 resize-none h-20"
              />
              <input
                type="text"
                value={nuevoEvento.lugar}
                onChange={(e) => setNuevoEvento({...nuevoEvento, lugar: e.target.value})}
                placeholder="Lugar"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
              <select
                value={nuevoEvento.tipo}
                onChange={(e) => setNuevoEvento({...nuevoEvento, tipo: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              >
                <option value="general">General</option>
                <option value="charla">Charla</option>
                <option value="hackathon">Hackathon</option>
                <option value="feria">Feria</option>
                <option value="taller">Taller</option>
              </select>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha inicio</label>
                <input
                  type="datetime-local"
                  value={nuevoEvento.fecha_inicio}
                  onChange={(e) => setNuevoEvento({...nuevoEvento, fecha_inicio: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha fin (opcional)</label>
                <input
                  type="datetime-local"
                  value={nuevoEvento.fecha_fin}
                  onChange={(e) => setNuevoEvento({...nuevoEvento, fecha_fin: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setMostrarModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={crearEvento}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}