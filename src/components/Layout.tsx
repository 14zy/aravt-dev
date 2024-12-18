import { Link, Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link 
      to={to} 
      className={cn(
        "text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap w-[100px] text-center inline-flex items-center justify-center",
        isActive && "bg-gray-100"
      )}
    >
      {children}
    </Link>
  )
}

export default function Layout() {
  const { user, hasAravt } = useAuthStore()
  const isAdmin = user?.role === 'SuperAdmin' 
  // const isAravtLeader = user?.role === 'AravtLeader'

  return (
    <div className="min-h-screen flex flex-col w-full">
      <header className="bg-white shadow w-full h-16">
        <nav className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex h-full items-center flex-nowrap w-full">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-gray-900">Aravt</span>
              </Link>

              {user ? hasAravt ? (
                <div className="flex items-center gap-4 ml-8">
                  <NavLink to="/dashboard">Dashboard</NavLink>
                  <NavLink to="/projects">Projects</NavLink>
                  <NavLink to="/tasks">Tasks</NavLink>
                  <NavLink to="/members">Members</NavLink>
                  <NavLink to="/browse">Browse Aravts</NavLink>
                  {isAdmin && <NavLink to="/admin">Admin</NavLink>}
                </div>
              )  : (
                <div className="flex items-center gap-4 ml-8">
                  <NavLink to="/browse">Browse Aravts</NavLink>
                </div>
              ) 
              : (<div/>)
            }
            </div>
            <div className="flex items-center gap-4 w-[200px] justify-end">
              {user ? (
                <>
                  <span className="text-sm text-gray-500 w-[100px] text-right truncate">
                    {user.username}
                  </span>
                  <button 
                    onClick={async () => {
                      await api.logout()
                      useAuthStore.getState().logout()
                    }}
                    className="text-white bg-gray-900 hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium w-[80px]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  to="/login"
                  className="text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium w-[80px] text-center"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-grow w-full">
        <div className="max-w-7xl w-full mx-auto py-6 sm:px-6 lg:px-8 flex flex-col items-center">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white shadow mt-auto h-[60px] flex items-center">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2024 Aravt. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}