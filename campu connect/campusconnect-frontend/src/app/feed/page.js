'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Heart, MessageCircle, Send, Image, GraduationCap } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FeedPage() {
  const { usuario, cargando } = useAuth()
  const router = useRouter()
  const [publicaciones, setPublicaciones] = useState([])
  const [contenido, setContenido] = useState('')
  const [publicando, setPublicando] = useState(false)
  const [cargandoFeed, setCargandoFeed] = useState(true)

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login')
  }, [usuario, cargando])

  useEffect(() => {
    if (usuario) cargarFeed()
  }, [usuario])

  const cargarFeed = async () => {
    try {
      const res = await api.get('/publicaciones/feed')
      setPublicaciones(res.data.publicaciones)
    } catch (error) {
      toast.error('Error cargando el feed')
    } finally {
      setCargandoFeed(false)
    }
  }

  const publicar = async () => {
    if (!contenido.trim()) {
      toast.error('Escribe algo para publicar')
      return
    }
    setPublicando(true)
    try {
      await api.post('/publicaciones', { contenido })
      setContenido('')
      toast.success('¡Publicación creada!')
      cargarFeed()
    } catch (error) {
      toast.error('Error al publicar')
    } finally {
      setPublicando(false)
    }
  }

  const toggleLike = async (id) => {
    try {
      await api.post(`/publicaciones/${id}/like`)
      cargarFeed()
    } catch (error) {
      toast.error('Error al dar like')
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

        {/* Crear publicación */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
            </div>
            <div className="flex-1">
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder={`¿Qué quieres compartir, ${usuario?.nombre}?`}
                className="w-full resize-none border-none outline-none text-gray-700 placeholder-gray-400 text-sm min-h-[80px]"
              />
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button className="flex items-center gap-1 text-gray-400 hover:text-blue-600 text-sm transition-colors">
                  <Image size={18} />
                  Imagen
                </button>
                <button
                  onClick={publicar}
                  disabled={publicando}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  <Send size={16} />
                  {publicando ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed */}
        {cargandoFeed ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : publicaciones.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <GraduationCap size={48} className="mx-auto mb-3 opacity-50" />
            <p>No hay publicaciones aún. ¡Sé el primero!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {publicaciones.map((pub) => (
              <div key={pub.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {pub.nombre?.[0]}{pub.apellido?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {pub.nombre} {pub.apellido}
                    </p>
                    <p className="text-xs text-gray-400">{pub.carrera}</p>
                  </div>
                  {pub.tipo !== 'general' && (
                    <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                      {pub.tipo}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 text-sm mb-3">{pub.contenido}</p>
                <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => toggleLike(pub.id)}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                      pub.me_gusta ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart size={18} fill={pub.me_gusta ? 'currentColor' : 'none'} />
                    {pub.total_likes}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-600 transition-colors">
                    <MessageCircle size={18} />
                    {pub.total_comentarios}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}