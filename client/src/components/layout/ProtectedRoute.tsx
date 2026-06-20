import { Navigate, Outlet } from 'react-router-dom'
import { useIsLoggedIn } from '@/store/authStore'

export default function ProtectedRoute() {
  const isLoggedIn = useIsLoggedIn()
  if (!isLoggedIn) return <Navigate to="/" replace />
  return <Outlet />
}
