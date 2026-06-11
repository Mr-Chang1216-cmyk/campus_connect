'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { ShoppingBag, Plus, Search, GraduationCap } from 'lucide-react'
import { useRouter } from 'next/navigation'

const categorias = ['todos', 'libro', 'tutoria', 'servicio', 'otro']

export default function MarketplacePage() {
  const { usuario, cargando } = useAuth()
  const router = useRouter()
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('todos')
  const [cargandoProductos, setCargandoProductos] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [nuevoProducto, setNuevoProducto] = useState({
    titulo: '', descripcion: '', precio: '', categoria: 'libro'
  })

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login')
  }, [usuario, cargando])

  useEffect(() => {
    if (usuario) cargarProductos()
  }, [usuario])

  const cargarProductos = async () => {
    try {
      const res = await api.get('/marketplace')
      setProductos(res.data.productos)
    } catch (error) {
      toast.error('Error cargando marketplace')
    } finally {
      setCargandoProductos(false)
    }
  }

  const publicarProducto = async () => {
    if (!nuevoProducto.titulo || !nuevoProducto.categoria) {
      toast.error('Título y categoría son requeridos')
      return
    }
    try {
      await api.post('/marketplace', {
        ...nuevoProducto,
        precio: nuevoProducto.precio ? parseFloat(nuevoProducto.precio) : null
      })
      toast.success('¡Producto publicado!')
      setMostrarModal(false)
      setNuevoProducto({ titulo: '', descripcion: '', precio: '', categoria: 'libro' })
      cargarProductos()
    } catch (error) {
      toast.error('Error publicando producto')
    }
  }

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.titulo.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCategoria = categoriaActiva === 'todos' || p.categoria === categoriaActiva
    return coincideBusqueda && coincideCategoria
  })

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
          <h1 className="text-2xl font-bold text-gray-800">Marketplace</h1>
          <button
            onClick={() => setMostrarModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={18} />
            Publicar
          </button>
        </div>

        {/* Búsqueda */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          />
        </div>

        {/* Categorías */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                categoriaActiva === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Lista productos */}
        {cargandoProductos ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ShoppingBag size={48} className="mx-auto mb-3 opacity-50" />
            <p>No hay productos disponibles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {productosFiltrados.map((producto) => (
              <div
                key={producto.id}
                className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/marketplace/${producto.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ShoppingBag size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{producto.titulo}</h3>
                        <p className="text-xs text-gray-400">
                          {producto.vendedor_nombre} {producto.vendedor_apellido}
                          {producto.vendedor_carrera && ` • ${producto.vendedor_carrera}`}
                        </p>
                      </div>
                    </div>
                    {producto.descripcion && (
                      <p className="text-sm text-gray-600 mt-2">{producto.descripcion}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                        {producto.categoria}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 text-right">
                    {producto.precio ? (
                      <span className="font-bold text-blue-600 text-lg">
                        ${parseInt(producto.precio).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm text-green-600 font-medium">Gratis</span>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {producto.vendedor_correo}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal publicar producto */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Publicar en marketplace</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={nuevoProducto.titulo}
                onChange={(e) => setNuevoProducto({...nuevoProducto, titulo: e.target.value})}
                placeholder="Título"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
              <textarea
                value={nuevoProducto.descripcion}
                onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})}
                placeholder="Descripción (opcional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 resize-none h-20"
              />
              <select
                value={nuevoProducto.categoria}
                onChange={(e) => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              >
                <option value="libro">Libro</option>
                <option value="tutoria">Tutoría</option>
                <option value="servicio">Servicio</option>
                <option value="otro">Otro</option>
              </select>
              <input
                type="number"
                value={nuevoProducto.precio}
                onChange={(e) => setNuevoProducto({...nuevoProducto, precio: e.target.value})}
                placeholder="Precio (dejar vacío si es gratis)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setMostrarModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={publicarProducto}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}