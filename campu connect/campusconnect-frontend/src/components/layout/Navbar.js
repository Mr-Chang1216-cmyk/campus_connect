'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Users, 
  BookOpen, 
  ShoppingBag, 
  Calendar,
  LogOut,
  GraduationCap,
  UserPlus
} from 'lucide-react'

const links = [
  { href: '/feed',        label: 'Inicio',    icon: Home },
  { href: '/grupos',      label: 'Grupos',    icon: Users },
  { href: '/apuntes',     label: 'Apuntes',   icon: BookOpen },
  { href: '/marketplace', label: 'Mercado',   icon: ShoppingBag },
  { href: '/eventos',     label: 'Eventos',   icon: Calendar },
  { href: '/conexiones',  label: 'Amigos',    icon: UserPlus },
]

export default function Navbar() {
  const { usuario, logout } = useAuth()
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo - solo en desktop */}
          <Link href="/feed" className="hidden md:flex items-center gap-2 font-bold text-blue-600 text-xl">
            <GraduationCap size={28} />
            CampusConnect
          </Link>

          {/* Links de navegación */}
          <div className="flex items-center justify-around w-full md:w-auto md:gap-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors
                  ${pathname === href 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                  }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Usuario y logout - solo en desktop */}
          {usuario && (
            <div className="hidden md:flex items-center gap-3">
              <Link href="/perfil" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                {usuario.nombre} {usuario.apellido}
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                <LogOut size={18} />
                Salir
              </button>
            </div>
          )}

        </div>
      </div>
    </nav>
  )
}