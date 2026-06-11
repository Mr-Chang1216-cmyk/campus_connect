'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { UserPlus, Search, Users, Check, X, GraduationCap } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ConexionesPage() {
  const { usuario, cargando } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState('conexiones')
  const [conexiones, setConexiones] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login')
  }, [usuario, cargando])

  useEffect(() => {
    if (usuario) {
      cargarConexiones()
      cargarSolicitudes()
    }
  }, [usuario])

  const cargarConexiones = async () => {
    try {
      const res = await api.get('/conexiones')
      setConexiones(res.data.conexiones)
    } catch (error) {
      console.error(error)
    }
  }

  const cargarSolicitudes = async () => {
    try {
      const res = await api.get('/conexiones/pendientes')
      setSolicitudes(res.data.solicitudes)
    } catch (error) {
      console.error(error)
    }
  }

  const buscar = async () => {
    if (!busqueda.trim()) return
    setBuscando(true)
    try {
      const res = await api.get(`/conexiones/buscar?q=${busqueda}`)
      setResultados(res.data.usuarios)
    } catch (error) {
      toast.error('Error buscando usuarios')
    } finally {
      setBuscando(false)
    }
  }

  const enviarSolicitud = async (receptor_id) => {
    try {
      await api.post('/conexiones', { receptor_id })
      toast.success('¡Solicitud enviada!')
      buscar()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error enviando solicitud')
    }
  }

  const responder = async (solicitante_id, estado) => {
    try {
      await api.put('/conexiones/responder', { solicitante_id, estado })
      toast.success(`Solicitud ${estado}`)
      cargarSolicitudes()
      cargarConexiones()
    } catch (error) {
      toast.error('Error respondiendo solicitud')
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-800">Conexiones</h1>
          {solicitudes.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {solicitudes.length} pendientes
            </span>
          )}
        </div>

        {/* Búsqueda */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              placeholder="Buscar compañeros..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
          </div>
          <button
            onClick={buscar}
            disabled={buscando}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl transition-colors"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Resultados de búsqueda */}
        {resultados.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <h2 className="font-semibold text-gray-800 mb-3">Resultados</h2>
            <div className="space-y-3">
              {resultados.map(u => (
                <div key={u.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {u.nombre?.[0]}{u.apellido?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{u.nombre} {u.apellido}</p>
                      <p className="text-xs text-gray-400">{u.carrera} • Semestre {u.semestre}</p>
                    </div>
                  </div>
                  {u.estado_conexion === 'aceptada' ? (
                    <span className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-xl">
                      Conectado ✓
                    </span>
                  ) : u.estado_conexion === 'pendiente' ? (
                    <span className="text-xs bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-xl">
                      Pendiente...
                    </span>
                  ) : (
                    <button
                      onClick={() => enviarSolicitud(u.id)}
                      className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl transition-colors"
                    >
                      <UserPlus size={14} />
                      Conectar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('conexiones')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'conexiones' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users size={16} />
            Mis conexiones ({conexiones.length})
          </button>
          <button
            onClick={() => setTab('solicitudes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'solicitudes' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UserPlus size={16} />
            Solicitudes
            {solicitudes.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {solicitudes.length}
              </span>
            )}
          </button>
        </div>

        {/* Mis conexiones */}
        {tab === 'conexiones' && (
          conexiones.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users size={48} className="mx-auto mb-3 opacity-50" />
              <p>No tienes conexiones aún</p>
              <p className="text-sm mt-1">Busca compañeros arriba para conectarte</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conexiones.map(u => (
                <div key={u.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {u.nombre?.[0]}{u.apellido?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{u.nombre} {u.apellido}</p>
                    <p className="text-xs text-gray-400">{u.carrera} • Semestre {u.semestre}</p>
                  </div>
                  <span className="ml-auto text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-xl">
                    Conectado ✓
                  </span>
                </div>
              ))}
            </div>
          )
        )}

        {/* Solicitudes pendientes */}
        {tab === 'solicitudes' && (
          solicitudes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UserPlus size={48} className="mx-auto mb-3 opacity-50" />
              <p>No tienes solicitudes pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {solicitudes.map(u => (
                <div key={u.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {u.nombre?.[0]}{u.apellido?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{u.nombre} {u.apellido}</p>
                      <p className="text-xs text-gray-400">{u.carrera} • Semestre {u.semestre}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => responder(u.id, 'aceptada')}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm transition-colors"
                    >
                      <Check size={16} />
                      Aceptar
                    </button>
                    <button
                      onClick={() => responder(u.id, 'rechazada')}
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-sm transition-colors"
                    >
                      <X size={16} />
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  )
}