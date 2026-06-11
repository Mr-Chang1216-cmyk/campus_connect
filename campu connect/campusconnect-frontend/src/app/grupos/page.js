'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Users, Plus, Search, Lock, GraduationCap } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function GruposPage() {
  const { usuario, cargando } = useAuth()
  const router = useRouter()  
  const [grupos, setGrupos] = useState([])
  const [misGrupos, setMisGrupos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargandoGrupos, setCargandoGrupos] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: '', descripcion: '', privado: false })
  const [tab, setTab] = useState('todos')

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login')
  }, [usuario, cargando])

  useEffect(() => {
    if (usuario) {
      cargarGrupos()
      cargarMisGrupos()
    }
  }, [usuario])

  const cargarGrupos = async () => {
    try {
      const res = await api.get('/grupos')
      setGrupos(res.data.grupos)
    } catch (error) {
      toast.error('Error cargando grupos')
    } finally {
      setCargandoGrupos(false)
    }
  }

  const cargarMisGrupos = async () => {
    try {
      const res = await api.get('/grupos/mis-grupos')
      setMisGrupos(res.data.grupos)
    } catch (error) {
      console.error(error)
    }
  }

  const crearGrupo = async () => {
    if (!nuevoGrupo.nombre) {
      toast.error('El nombre es requerido')
      return
    }
    try {
      await api.post('/grupos', nuevoGrupo)
      toast.success('¡Grupo creado!')
      setMostrarModal(false)
      setNuevoGrupo({ nombre: '', descripcion: '', privado: false })
      cargarGrupos()
      cargarMisGrupos()
    } catch (error) {
      toast.error('Error creando grupo')
    }
  }

  const unirse = async (id) => {
    try {
      await api.post(`/grupos/${id}/unirse`)
      toast.success('¡Te uniste al grupo!')
      cargarGrupos()
      cargarMisGrupos()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al unirse')
    }
  }

  const gruposFiltrados = (tab === 'todos' ? grupos : misGrupos)
    .filter(g => g.nombre.toLowerCase().includes(busqueda.toLowerCase()))

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
          <h1 className="text-2xl font-bold text-gray-800">Grupos de estudio</h1>
          <button
            onClick={() => setMostrarModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={18} />
            Crear grupo
          </button>
        </div>

        {/* Búsqueda */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar grupos..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('todos')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'todos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setTab('mis-grupos')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'mis-grupos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mis grupos
          </button>
        </div>

        {/* Lista de grupos */}
        {cargandoGrupos ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : gruposFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={48} className="mx-auto mb-3 opacity-50" />
            <p>No hay grupos disponibles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {gruposFiltrados.map((grupo) => (
              <div key={grupo.id} className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/grupos/${grupo.id}`)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{grupo.nombre}</h3>
                        <p className="text-xs text-gray-400">
                          {grupo.total_miembros} miembros
                          {grupo.materia && ` • ${grupo.materia}`}
                        </p>
                      </div>
                      {grupo.privado && <Lock size={14} className="text-gray-400" />}
                    </div>
                    {grupo.descripcion && (
                      <p className="text-sm text-gray-600 mt-2">{grupo.descripcion}</p>
                    )}
                    {tab === 'mis-grupos' && (
                      <span className="inline-block mt-2 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                        {grupo.rol}
                      </span>
                    )}
                  </div>
                  {tab === 'todos' && !grupo.soy_miembro && (
                    <button
                      onClick={() => unirse(grupo.id)}
                      className="ml-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-xl transition-colors"
                    >
                      Unirme
                    </button>
                  )}
                  {grupo.soy_miembro && (
                    <span className="ml-3 text-xs bg-green-50 text-green-600 px-3 py-2 rounded-xl">
                      Miembro ✓
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal crear grupo */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Crear grupo de estudio</h2>
            
            <div className="space-y-3">
              <input
                type="text"
                value={nuevoGrupo.nombre}
                onChange={(e) => setNuevoGrupo({...nuevoGrupo, nombre: e.target.value})}
                placeholder="Nombre del grupo"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
              <textarea
                value={nuevoGrupo.descripcion}
                onChange={(e) => setNuevoGrupo({...nuevoGrupo, descripcion: e.target.value})}
                placeholder="Descripción (opcional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 resize-none h-24"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nuevoGrupo.privado}
                  onChange={(e) => setNuevoGrupo({...nuevoGrupo, privado: e.target.checked})}
                  className="w-4 h-4 accent-blue-600"
                />
                Grupo privado
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setMostrarModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={crearGrupo}
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