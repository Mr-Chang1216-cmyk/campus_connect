'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Users, Send, ArrowLeft, MessageCircle, GraduationCap } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function GrupoDetallePage() {
  const { usuario, cargando } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params.id
  const [grupo, setGrupo] = useState(null)
  const [miembros, setMiembros] = useState([])
  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [tab, setTab] = useState('chat')
  const [enviando, setEnviando] = useState(false)
  const mensajesEndRef = useRef(null)

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login')
  }, [usuario, cargando])

  useEffect(() => {
    if (usuario && id) {
      cargarGrupo()
      cargarMensajes()
    }
  }, [usuario, id])

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const cargarGrupo = async () => {
    try {
      const res = await api.get(`/grupos/${id}`)
      setGrupo(res.data.grupo)
      setMiembros(res.data.miembros)
    } catch (error) {
      toast.error('Error cargando grupo')
      router.push('/grupos')
    }
  }

  const cargarMensajes = async () => {
    try {
      const res = await api.get(`/chat/${id}`)
      setMensajes(res.data.mensajes)
    } catch (error) {
      console.error(error)
    }
  }

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return
    setEnviando(true)
    try {
      await api.post(`/chat/${id}`, { contenido: nuevoMensaje })
      setNuevoMensaje('')
      cargarMensajes()
    } catch (error) {
      toast.error('Error enviando mensaje')
    } finally {
      setEnviando(false)
    }
  }

  const formatearHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit'
    })
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'short'
    })
  }

  if (cargando || !grupo) return (
    <div className="min-h-screen flex items-center justify-center">
      <GraduationCap size={48} className="text-blue-600 animate-pulse" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pt-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/grupos" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{grupo.nombre}</h1>
            <p className="text-xs text-gray-400">
              {grupo.total_miembros} miembros
              {grupo.materia && ` • ${grupo.materia}`}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'chat' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageCircle size={16} />
            Chat
          </button>
          <button
            onClick={() => setTab('miembros')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'miembros' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users size={16} />
            Miembros ({miembros.length})
          </button>
        </div>

        {/* Chat */}
        {tab === 'chat' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            
            {/* Mensajes */}
            <div className="h-96 overflow-y-auto p-4 space-y-3">
              {mensajes.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MessageCircle size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No hay mensajes aún</p>
                  <p className="text-sm mt-1">¡Sé el primero en escribir!</p>
                </div>
              ) : (
                mensajes.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.autor_id === usuario.id ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {msg.nombre?.[0]}{msg.apellido?.[0]}
                    </div>
                    <div className={`max-w-xs ${msg.autor_id === usuario.id ? 'items-end' : 'items-start'} flex flex-col`}>
                      {msg.autor_id !== usuario.id && (
                        <span className="text-xs text-gray-400 mb-1 ml-1">
                          {msg.nombre} {msg.apellido}
                        </span>
                      )}
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        msg.autor_id === usuario.id
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      }`}>
                        {msg.contenido}
                      </div>
                      <span className="text-xs text-gray-400 mt-1 mx-1">
                        {formatearHora(msg.creado_en)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={mensajesEndRef} />
            </div>

            {/* Input mensaje */}
            <div className="border-t border-gray-100 p-3 flex gap-2">
              <input
                type="text"
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && enviarMensaje()}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
              <button
                onClick={enviarMensaje}
                disabled={enviando || !nuevoMensaje.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-2 rounded-xl transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Miembros */}
        {tab === 'miembros' && (
          <div className="space-y-3">
            {miembros.map(m => (
              <div key={m.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {m.nombre?.[0]}{m.apellido?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{m.nombre} {m.apellido}</p>
                  <p className="text-xs text-gray-400">{m.carrera}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  m.rol === 'admin'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {m.rol}
                </span>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}