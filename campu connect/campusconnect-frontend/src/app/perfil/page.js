'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { GraduationCap, Edit2, Save, X, User, Mail, BookOpen, Hash } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PerfilPage() {
  const { usuario, cargando } = useAuth()
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    nombre: '', apellido: '', bio: '', carrera: '', semestre: ''
  })
  const [misPublicaciones, setMisPublicaciones] = useState([])

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login')
  }, [usuario, cargando])

  useEffect(() => {
    if (usuario) {
      setForm({
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        bio: usuario.bio || '',
        carrera: usuario.carrera || '',
        semestre: usuario.semestre || ''
      })
      cargarMisPublicaciones()
    }
  }, [usuario])

  const cargarMisPublicaciones = async () => {
    try {
      const res = await api.get('/publicaciones/feed')
      const mias = res.data.publicaciones.filter(p => p.autor_id === usuario.id)
      setMisPublicaciones(mias)
    } catch (error) {
      console.error(error)
    }
  }

  const guardarPerfil = async () => {
    setGuardando(true)
    try {
      const res = await api.put('/usuarios/perfil', form)
      // Actualizar localStorage
      const usuarioActualizado = { ...usuario, ...res.data.usuario }
      localStorage.setItem('usuario', JSON.stringify(usuarioActualizado))
      toast.success('¡Perfil actualizado!')
      setEditando(false)
    } catch (error) {
      toast.error('Error actualizando perfil')
    } finally {
      setGuardando(false)
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

        {/* Tarjeta de perfil */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          
          {/* Header perfil */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {usuario?.nombre} {usuario?.apellido}
                </h1>
                <p className="text-sm text-gray-500">{usuario?.correo}</p>
                <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                  usuario?.rol === 'admin' 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {usuario?.rol}
                </span>
              </div>
            </div>
            <button
              onClick={() => setEditando(!editando)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {editando ? <X size={18} /> : <Edit2 size={18} />}
              {editando ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {/* Formulario edición */}
          {editando ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({...form, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Apellido</label>
                  <input
                    type="text"
                    value={form.apellido}
                    onChange={(e) => setForm({...form, apellido: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Biografía</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({...form, bio: e.target.value})}
                  placeholder="Cuéntanos algo sobre ti..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 resize-none h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Carrera</label>
                  <input
                    type="text"
                    value={form.carrera}
                    onChange={(e) => setForm({...form, carrera: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Semestre</label>
                  <input
                    type="number"
                    value={form.semestre}
                    onChange={(e) => setForm({...form, semestre: e.target.value})}
                    min="1" max="12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                </div>
              </div>
              <button
                onClick={guardarPerfil}
                disabled={guardando}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-medium transition-colors"
              >
                <Save size={18} />
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {usuario?.bio && (
                <p className="text-gray-600 text-sm">{usuario.bio}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {usuario?.carrera && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen size={16} className="text-blue-600" />
                    {usuario.carrera}
                  </div>
                )}
                {usuario?.semestre && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Hash size={16} className="text-blue-600" />
                    Semestre {usuario.semestre}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={16} className="text-blue-600" />
                  {usuario?.correo}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Publicaciones', value: misPublicaciones.length },
            { label: 'Semestre', value: usuario?.semestre || '-' },
            { label: '⭐ Reputación', value: usuario?.reputacion || 0 }
              ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mis publicaciones */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">Mis publicaciones</h2>
        {misPublicaciones.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <User size={40} className="mx-auto mb-2 opacity-50" />
            <p>No has publicado nada aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {misPublicaciones.map(pub => (
              <div key={pub.id} className="bg-white rounded-2xl shadow-sm p-4">
                <p className="text-gray-700 text-sm">{pub.contenido}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>❤️ {pub.total_likes}</span>
                  <span>💬 {pub.total_comentarios}</span>
                  <span>{new Date(pub.creado_en).toLocaleDateString('es-CO')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}