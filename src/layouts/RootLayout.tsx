import { NavLink, Outlet } from "react-router"
import { LayoutDashboard, FileText, MapPin, Package, Users, LogOut, User } from "lucide-react"
import { getUserContext, clearTokens, getRefreshToken, redirectToLogin } from "@/lib/auth"
import { revokeToken } from "@/api/auth"

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contracts", label: "Contratos", icon: FileText },
  { to: "/locations", label: "Ubicaciones", icon: MapPin },
  { to: "/commodities", label: "Mercancías", icon: Package },
  { to: "/users", label: "Users", icon: Users },
]

export default function RootLayout() {
  const user = getUserContext();

  async function handleLogout() {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        await revokeToken(refresh);
      } catch {
        /* best-effort revocation */
      }
    }
    clearTokens();
    redirectToLogin();
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg)]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
        <div className="mb-6 px-4 pt-4 pb-4 border-b border-[var(--color-border)]">
          <img src="/brand/HEXADIAN-Letters.png" alt="Hexadian" className="h-6 mb-1" width="175" height="60" />
          <span
            className="block text-xs tracking-widest uppercase"
            style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}
          >
            Backoffice
          </span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 hover:text-[var(--color-text)]"
                }`
              }
              style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="border-t border-[var(--color-border)] p-3">
          {user && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <User className="h-4 w-4 text-[var(--color-accent)]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--color-text)] truncate">{user.username}</p>
                {user.rsiHandle && (
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{user.rsiHandle}</p>
                )}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 hover:text-[var(--color-text)] transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <div className="p-4 flex justify-center">
          <img
            src="/brand/HEXADIAN-Background_Round.png"
            alt=""
            className="h-8 w-8 opacity-30"
            width="32"
            height="32"
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
