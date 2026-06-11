'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { GraduationCap } from 'lucide-react'

export default function Home() {
  const { usuario, cargando } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!cargando) {
      if (usuario) {
        router.push('/feed')
      } else {
        router.push('/login')
      }
    }
  }, [usuario, cargando])

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600">
      <GraduationCap size={64} className="text-white animate-pulse" />
    </div>
  )
}