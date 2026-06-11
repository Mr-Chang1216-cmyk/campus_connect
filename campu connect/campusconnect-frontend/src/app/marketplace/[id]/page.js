'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, ShoppingBag, GraduationCap, Image } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function ProductoDetallePage() {
  const { usuario, cargando } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params.id
  const [producto, setProducto] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarImagenInput, setMostrarImagenInput] = useState(false)
  const mensajesEndRef = useRef(null)

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login')
  }, [usuario, cargando])

  useEffect(() => {
    if (usuario && id) {
      cargarProducto()
    }
  }, [usuario, id])

  useEffect(() => {
    if (producto && usuario) {
      cargarMensajes()
    }
  }, [producto])

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const cargarProducto = async () => {
    try {
      const res = await api.get(`/marketplace/${id}`)
      setProducto(res.data.producto)
    } catch (error) {
      toast.error('Error cargando producto')
      router.push('/marketplace')
    }
  }

  const cargarMensajes = async () => {
    try {
      const vendedorId = producto?.vendedor_id
      if (!vendedorId || vendedorId === usuario.id) return
      const res = await api.get(`/mensajes/${vendedorId}`)
      setMensajes(res.data.mensajes)
    } catch (error) {
      console.error(error)
    }
  }

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() && !imagenUrl.trim()) return
    setEnviando(true)
    try {
      await api.post('/mensajes', {
        receptor_id: producto.vendedor_id,
        contenido: nuevoMensaje || null,
        imagen_url: imagenUrl || null
      })
      setNuevoMensaje('')
      setImagenUrl('')
      setMostrarImagenInput(false)
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

  if (cargando || !producto) return (
    <div className="min-h-screen flex items-center justify-center">
      <GraduationCap size={48} className="text-blue-600 animate-pulse" />
    </div>
  )

  const esMiProducto = producto.vendedor_id === usuario.id

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pt-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/marketplace" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Detalle del producto</h1>
        </div>

        {/* Producto */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={28} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">{producto.titulo}</h2>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                {producto.categoria}
              </span>
              {producto.descripcion && (
                <p className="text-gray-600 text-sm mt-3">{producto.descripcion}</p>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100">
                {producto.precio ? (
                  <p className="text-2xl font-bold text-blue-600">
                    ${parseInt(producto.precio).toLocaleString()}
                  </p>
                ) : (
                  <p className="text-lg font-bold text-green-600">Gratis</p>
                )}
              </div>
            </div>
          </div>

          {/* Vendedor */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {producto.vendedor_nombre?.[0]}{producto.vendedor_apellido?.[0]}
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">
                {producto.vendedor_nombre} {producto.vendedor_apellido}
              </p>
              <p className="text-xs text-gray-400">
                {producto.vendedor_carrera} • {producto.vendedor_correo}
              </p>
            </div>
          </div>
        </div>

        {/* Chat con vendedor */}
        {!esMiProducto && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">
                Chat con {producto.vendedor_nombre}
              </h3>
              <p className="text-xs text-gray-400">Pregunta sobre el producto</p>
            </div>

            {/* Mensajes */}
            <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {mensajes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Send size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Inicia la conversación con el vendedor</p>
                </div>
              ) : (
                mensajes.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.emisor_id === usuario.id ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {msg.emisor_nombre?.[0]}
                    </div>
                    <div className={`max-w-xs flex flex-col ${msg.emisor_id === usuario.id ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        msg.emisor_id === usuario.id
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
                      }`}>
                        {msg.contenido && <p>{msg.contenido}</p>}
                        {msg.imagen_url && (
                          <img
                            src={msg.imagen_url}
                            alt="imagen"
                            className="rounded-xl max-w-full mt-1"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                      </div>
                      <span className="text-xs text-gray-400 mt-1">
                        {formatearHora(msg.creado_en)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={mensajesEndRef} />
            </div>

            {/* Input imagen */}
            {mostrarImagenInput && (
              <div className="px-3 pt-3">
                <input
                  type="url"
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  placeholder="Pega el enlace de la imagen..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>
            )}

            {/* Input mensaje */}
            <div className="p-3 flex gap-2 border-t border-gray-100">
              <button
                onClick={() => setMostrarImagenInput(!mostrarImagenInput)}
                className={`p-2 rounded-xl transition-colors ${
                  mostrarImagenInput ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                <Image size={18} />
              </button>
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
                disabled={enviando || (!nuevoMensaje.trim() && !imagenUrl.trim())}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-2 rounded-xl transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Si es mi producto */}
        {esMiProducto && (
          <div className="bg-blue-50 rounded-2xl p-4 text-center text-blue-600">
            <p className="font-medium">Este es tu producto</p>
            <p className="text-sm mt-1 text-blue-400">Los compradores te contactarán por mensajes privados</p>
          </div>
        )}

      </main>
    </div>
  )
}