import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: "⌂",
  },
  {
    path: "/journal",
    label: "Journal",
    icon: "💬",
  },
  {
    path: "/expenses",
    label: "Expenses",
    icon: "💳",
  },
  {
    path: "/income",
    label: "Income",
    icon: "💵",
  },
  {
    path: "/savings",
    label: "Savings",
    icon: "🏦",
  },
  {
    path: "/analytics",
    label: "Analytics",
    icon: "📊",
  },
  {
    path: "/ask-my-money",
    label: "Ask My Money",
    icon: "🤖",
  },
];

function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">

        {/* Brand */}
        <div className="flex h-20 items-center border-b border-slate-100 px-6">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
            ₹
          </div>

          <div className="ml-3">
            <h1 className="font-bold text-slate-900">
              MoneyMind
            </h1>

            <p className="text-xs text-slate-400">
              AI Finance Companion
            </p>
          </div>

        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">

          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <span className="mr-3 w-5 text-center">
                {item.icon}
              </span>

              {item.label}
            </NavLink>
          ))}

        </nav>

        {/* User */}
        <div className="border-t border-slate-100 p-4">

          <div className="mb-3 flex items-center">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {user?.email?.charAt(0).toUpperCase()}
            </div>

            <div className="ml-3 min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user?.email}
              </p>

              <p className="text-xs text-slate-400">
                Personal account
              </p>
            </div>

          </div>

          <button
            onClick={logout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            🚪 Logout
          </button>

        </div>

      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1">

        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">

          <div className="flex items-center">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 font-bold text-white">
              ₹
            </div>

            <span className="ml-2 font-bold text-slate-900">
              MoneyMind
            </span>

          </div>

          <button
            onClick={logout}
            className="text-sm font-medium text-slate-500"
          >
            Logout
          </button>

        </header>

        <Outlet />

      </main>

    </div>
  );
}

export default AppLayout;