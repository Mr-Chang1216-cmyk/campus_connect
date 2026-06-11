'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Users, Plus, Upload, BarChart3, GraduationCap, ToggleLeft, ToggleRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const { usuario, cargando } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState('estadisticas')
  const [estadisticas, setEstadisticas] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '', apellido: '', correo: '', carrera: '', semestre: '', rol: 'estudiante'
  })
  const [csvTexto, setCsvTexto] = useState('')
  const [cargandoCSV, setCargandoCSV] = useState(false)

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login')
    if (!cargando && usuario && usuario.rol !== 'admin') router.push('/feed')
  }, [usuario, cargando])

  useEffect(() => {
    if (usuario?.rol === 'admin') {
      cargarEstadisticas()
      cargarUsuarios()
    }
  }, [usuario])

  const cargarEstadisticas = async () => {
    try {
      const res = await api.get('/admin/estadisticas')
      setEstadisticas(res.data.estadisticas)
    } catch (error) {
      toast.error('Error cargando estadísticas')
    } finally {
      setCargandoDatos(false)
    }
  }

  const cargarUsuarios = async () => {
    try {
      const res = await api.get('/admin/usuarios')
      setUsuarios(res.data.usuarios)
    } catch (error) {
      console.error(error)
    }
  }

  const crearUsuario = async () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.apellido || !nuevoUsuario.correo) {
      toast.error('Nombre, apellido y correo son requeridos')
      return
    }
    try {
      await api.post('/admin/usuarios', nuevoUsuario)
      toast.success('¡Usuario creado! Contraseña: campus2025')
      setMostrarModal(false)
      setNuevoUsuario({ nombre: '', apellido: '', correo: '', carrera: '', semestre: '', rol: 'estudiante' })
      cargarUsuarios()
      cargarEstadisticas()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error creando usuario')
    }
  }

  const toggleUsuario = async (id) => {
    try {
      const res = await api.put(`/admin/usuarios/${id}/toggle`)
      toast.success(res.data.mensaje)
      cargarUsuarios()
    } catch (error) {
      toast.error('Error actualizando usuario')
    }
  }

  const cambiarRol = async (id, rol) => {
    try {
      await api.put(`/admin/usuarios/${id}/rol`, { rol })
      toast.success('Rol actualizado')
      cargarUsuarios()
    } catch (error) {
      toast.error('Error cambiando rol')
    }
  }

  const procesarCSV = async () => {
    if (!csvTexto.trim()) {
      toast.error('Pega el contenido CSV primero')
      return
    }

    setCargandoCSV(true)
    try {
      const lineas = csvTexto.trim().split('\n')
      const usuarios = lineas.slice(1).map(linea => {
        const [nombre, apellido, correo, carrera, semestre, rol] = linea.split(',').map(s => s.trim())
        return { nombre, apellido, correo, carrera, semestre: semestre ? parseInt(semestre) : null, rol: rol || 'estudiante' }
      }).filter(u => u.nombre && u.correo)

      const res = await api.post('/admin/usuarios/carga-masiva', { usuarios })
      toast.success(res.data.mensaje)
      setCsvTexto('')
      cargarUsuarios()
      cargarEstadisticas()
    } catch (error) {
      toast.error('Error en carga masiva')
    } finally {
      setCargandoCSV(false)
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

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pt-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Panel de administración</h1>
            <p className="text-sm text-gray-500">Gestiona usuarios y contenido de CampusConnect</p>
          </div>
          <button
            onClick={() => setMostrarModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={18} />
            Nuevo usuario
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
            { id: 'usuarios', label: 'Usuarios', icon: Users },
            { id: 'carga-masiva', label: 'Carga masiva', icon: Upload },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Estadísticas */}
        {tab === 'estadisticas' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {estadisticas && Object.entries(estadisticas).map(([key, value]) => (
              <div key={key} className="bg-white rounded-2xl shadow-sm p-6 text-center">
                <p className="text-3xl font-bold text-blue-600">{value}</p>
                <p className="text-sm text-gray-500 mt-1 capitalize">{key}</p>
              </div>
            ))}
          </div>
        )}

        {/* Usuarios */}
        {tab === 'usuarios' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden md:table-cell">Carrera</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Rol</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 text-sm">{u.nombre} {u.apellido}</p>
                      <p className="text-xs text-gray-400">{u.correo}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-600">{u.carrera || '-'}</p>
                      <p className="text-xs text-gray-400">Semestre {u.semestre || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.rol}
                        onChange={(e) => cambiarRol(u.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="estudiante">Estudiante</option>
                        <option value="docente">Docente</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleUsuario(u.id)}>
                        {u.activo
                          ? <ToggleRight size={28} className="text-blue-600" />
                          : <ToggleLeft size={28} className="text-gray-400" />
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Carga masiva */}
        {tab === 'carga-masiva' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Carga masiva de usuarios</h2>
            <p className="text-sm text-gray-500 mb-4">
              Pega el contenido CSV con el formato:<br />
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                nombre,apellido,correo,carrera,semestre,rol
              </code>
            </p>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-gray-500">
              <p className="font-medium mb-1">Ejemplo:</p>
              <p>Ana,García,agarcia@alumnoeseit.edu.co,Ingeniería de Sistemas,2,estudiante</p>
              <p>Pedro,López,plopez@alumnoeseit.edu.co,Ingeniería Industrial,4,estudiante</p>
            </div>
            <textarea
              value={csvTexto}
              onChange={(e) => setCsvTexto(e.target.value)}
              placeholder="nombre,apellido,correo,carrera,semestre,rol&#10;Ana,García,agarcia@alumnoeseit.edu.co,Ingeniería de Sistemas,2,estudiante"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm resize-none h-48 font-mono"
            />
            <button
              onClick={procesarCSV}
              disabled={cargandoCSV}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-medium transition-colors"
            >
              <Upload size={18} />
              {cargandoCSV ? 'Procesando...' : 'Cargar usuarios'}
            </button>
          </div>
        )}

      </main>

      {/* Modal crear usuario */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Crear usuario</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={nuevoUsuario.nombre}
                  onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
                  placeholder="Nombre"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
                <input
                  type="text"
                  value={nuevoUsuario.apellido}
                  onChange={(e) => setNuevoUsuario({...nuevoUsuario, apellido: e.target.value})}
                  placeholder="Apellido"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>
              <input
                type="email"
                value={nuevoUsuario.correo}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, correo: e.target.value})}
                placeholder="correo@alumnoeseit.edu.co"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
              <input
                type="text"
                value={nuevoUsuario.carrera}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, carrera: e.target.value})}
                placeholder="Carrera"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={nuevoUsuario.semestre}
                  onChange={(e) => setNuevoUsuario({...nuevoUsuario, semestre: e.target.value})}
                  placeholder="Semestre"
                  min="1" max="12"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
                <select
                  value={nuevoUsuario.rol}
                  onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="docente">Docente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <p className="text-xs text-gray-400">La contraseña por defecto será: campus2025</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setMostrarModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={crearUsuario}
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