import { useSelectedAravt } from '@/hooks/useSelectedAravt';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { Link, Outlet, useLocation } from 'react-router-dom';

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      className={cn(
        "text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap text-center inline-flex items-center justify-center",
        isActive && "bg-gray-100"
      )}
    >
      {children}
    </Link>
  )
}

export default function Layout() {
  const { user } = useAuthStore()
  const isAdmin = false
  const location = useLocation()
  const { currentAravtId } = useSelectedAravt()
  const effectiveAravtId = currentAravtId
  const hasAravt = Boolean(currentAravtId)
  const headerExcludedPaths = [
    '/login', '/signup', '/resend-email', '/forgot-password', '/reset_password',
    '/complete_registration'
  ]
  const isNeedHeader = !headerExcludedPaths.includes(location.pathname) && Boolean(user)

  return (
    <div className="min-h-screen w-full flex flex-col">
      {isNeedHeader && (
        <header className="bg-white shadow w-full h-28 navbar sm:h-16">
          <nav className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div className="flex sm:flex">
                  {user && (hasAravt ? (
                    <div className="">
                      <NavLink to="/browse">Aravts</NavLink>
                      <NavLink to={`/dashboard/${effectiveAravtId}`}>Dashboard</NavLink>
                      <NavLink to={`/members/${effectiveAravtId}`}>Members</NavLink>
                      <NavLink to="/tasks">Tasks</NavLink>
                      <NavLink to="/projects">Projects</NavLink>
                      <NavLink to="/offers">Offers</NavLink>
                      <NavLink to="/wallet">Wallet</NavLink>
                      <NavLink to="/Learn">Learn</NavLink>
                      {isAdmin && <NavLink to="/admin">Admin</NavLink>}
                      <NavLink to="/profile">{user.username}</NavLink>
                    </div>
                  ) : (
                    <div className="flex sm:flex-row">
                      <NavLink to="/browse">Aravts</NavLink>
                      <NavLink to="/offers">Offers</NavLink>
                      <NavLink to="/wallet">Wallet</NavLink>
                      <NavLink to="/Learn">Learn</NavLink>
                      <NavLink to="/profile">{user.username}</NavLink>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </header>
      )}

      <main className="flex-grow w-full">
        <div className="max-w-7xl w-full mx-auto py-6 sm:px-6 lg:px-8 flex flex-col">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white shadow mt-auto h-[60px] flex items-center">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2025 Aravt. All rights reserved.
            <br></br><a href="https://docs.google.com/document/d/15ZrMssFJ4-qx8f6sZs1qY1BpR1Oh0UDSG0O1M3pR0GQ/edit?tab=t.0#heading=h.ozs7eg87x5l7" target="_blank" rel="noopener noreferrer">Whitepaper</a>
          </p>
        </div>
      </footer>
    </div>
  )
}