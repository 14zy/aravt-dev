import ErrorBoundary from '@/components/ErrorBoundary'
import { useAuthStore } from '@/store/auth'
import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import './App.css'
import { AppRoutes } from './routes'

function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser)
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (token && !user) {
      fetchUser()
    }
  }, [fetchUser, token, user])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
