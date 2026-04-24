import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { useAuthStore } from './store/authStore'

function AppRoutes() {
  const session = useAuthStore((state) => state.session)

  return (
    <Routes>
      <Route path="/" element={<Navigate to={session ? '/app' : '/login'} replace />} />
      <Route path="/login" element={session ? <Navigate to="/app" replace /> : <LoginPage />} />
      <Route path="/app" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to={session ? '/app' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  const hydrate = useAuthStore((state) => state.hydrate)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-slate-300">
        <div className="glass-panel px-6 py-4 text-sm">Preparing workspace...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}