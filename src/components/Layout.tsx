import { useSelectedAravt } from "@/hooks/useSelectedAravt";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { Link, Outlet, useLocation } from "react-router-dom";

const NavLink = ({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap text-center inline-flex items-center justify-center",
        isActive && "bg-gray-100",
      )}
    >
      {children}
    </Link>
  );
};

export default function Layout() {
  const { user } = useAuthStore();
  const isAdmin = false;
  const location = useLocation();
  const { currentAravtId } = useSelectedAravt();
  const effectiveAravtId = currentAravtId;
  const hasAravt = Boolean(currentAravtId);
  const headerExcludedPaths = [
    "/login",
    "/signup",
    "/resend-email",
    "/forgot-password",
    "/reset_password",
    "/complete_registration",
  ];
  const isNeedHeader =
    !headerExcludedPaths.includes(location.pathname) && Boolean(user);

  return (
    <div className="min-h-screen w-full flex flex-col">
      {isNeedHeader && (
        <header className="bg-white shadow w-full h-14 navbar sm:h-16">
          <nav className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div className="flex sm:flex">
                  {user &&
                    (hasAravt ? (
                      <div className="">
                        <NavLink to="/browse">🌀 Aravts</NavLink>
                        <NavLink to="/tasks">📝 Tasks</NavLink>
                        <NavLink to="/Learn">📚 Learn</NavLink>
                        {isAdmin && <NavLink to="/admin">Admin</NavLink>}
                      </div>
                    ) : (
                      <div className="flex sm:flex-row">
                        <NavLink to="/browse">🌀 Aravts</NavLink>
                        <NavLink to="/Learn">📚 Learn</NavLink>
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

      {isNeedHeader && hasAravt && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-24">
          <div className="h-full flex items-center justify-center gap-4 px-4 max-w-7xl mx-auto w-full">
            {/* Feed */}
            <NavLink to="/feed">📰 Feed</NavLink>

            {/* Wallet */}
            <NavLink to="/wallet">👛 Wallet</NavLink>

            {/* Dashboard - Main big button */}
            <Link
              to={`/dashboard/${effectiveAravtId}`}
              className="flex flex-col items-center justify-center w-16 h-16 text-white rounded-full font-bold text-3xl"
            >
              🌀
            </Link>

            {/* Market */}
            <NavLink to="/offers">🪙 Market</NavLink>

            {/* Profile */}
            <NavLink to="/profile">👤 Profile</NavLink>
          </div>
        </nav>
      )}
    </div>
  );
}
