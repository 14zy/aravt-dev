import { useSelectedAravt } from "@/hooks/useSelectedAravt";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { TonConnectButton } from "@tonconnect/ui-react";
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
    <div className="min-h-screen w-full flex flex-col pb-24">
      {isNeedHeader && (
        <header className="bg-white shadow w-full h-14 navbar sm:h-16">
          <nav className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-2 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center">
              {user &&
                (hasAravt ? (
                  <div className="flex">
                    <NavLink to="/browse">🌀 Aravts</NavLink>
                    <NavLink to="/Learn">📚 Learn</NavLink>
                    {isAdmin && <NavLink to="/admin">Admin</NavLink>}
                  </div>
                ) : (
                  <div className="flex">
                    <NavLink to="/browse">🌀 Aravts</NavLink>
                    <NavLink to="/Learn">📚 Learn</NavLink>
                  </div>
                ))}
            </div>
            <div className="">
              <TonConnectButton style={{ width: '140px' }} />
            </div>
          </nav>
        </header>
      )}

      <main className="flex-grow w-full">
        <div className="max-w-7xl w-full py-4 mx-auto sm:px-6 lg:px-8 flex flex-col">
          <Outlet />
        </div>
      </main>

      {isNeedHeader && hasAravt && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-20">
          <div className="h-full flex items-center justify-center gap-4 px-4 max-w-7xl mx-auto w-full">
            {/* Feed */}
            <NavLink to="/feed">🧭 Feed</NavLink>

            {/* Market */}
            <NavLink to="/offers">🪙 Store</NavLink>


            {/* Dashboard - Main big button */}
            <Link
              to={`/dashboard/${effectiveAravtId}`}
              className="flex flex-col items-center justify-center w-16 h-16 text-white rounded-full font-bold text-3xl"
            >
              🌀
            </Link>


            {/* Wallet */}
            <NavLink to="/wallet">👛 Wallet</NavLink>

            
            {/* Profile */}
            <NavLink to="/profile">👤 Me</NavLink>
          </div>
        </nav>
      )}
    </div>
  );
}
