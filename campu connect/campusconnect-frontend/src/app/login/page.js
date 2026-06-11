'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { GraduationCap, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [cargando, setCargando] = useState(false)

  const handleLogin = async () => {
    if (!correo || !password) {
      toast.error('Por favor completa todos los campos')
      return
    }
    setCargando(true)
    try {
      await login(correo, password)
      toast.success('¡Bienvenido a CampusConnect!')
    } catch (error) {
      const mensaje = error.response?.data?.mensaje || 'Error al iniciar sesión'
      toast.error(mensaje)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-4 rounded-full mb-4">
            <GraduationCap size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">CampusConnect</h1>
          <p className="text-gray-500 mt-2 text-center">
            Conecta y colabora con tus compañeros
          </p>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          
          {/* Correo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo institucional
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@alumnoeseit.edu.co"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Tu contraseña"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              />
              <button
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón login */}
          <button
            onClick={handleLogin}
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

        </div>

        {/* Nota */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Solo disponible para estudiantes ESEIT con correo institucional
        </p>

      </div>
    </div>
  )
}