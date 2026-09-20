
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Activity,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle,
} from "lucide-react";

import {
  useState,
  type ReactNode,
} from "react";

import NotificationBell from "../components/NotificationBell";
import { logout } from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role:
    | "ADMIN"
    | "PROJECT_MANAGER"
    | "DEVELOPER";
}

interface DashboardLayoutProps {
  user: User;
  onLogout: () => void;
}

interface NavigationItem {
  path: string;
  label: string;
  icon: ReactNode;
  visible: boolean;
}

const DashboardLayout = ({
  user,
  onLogout,
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const navigate = useNavigate();

  const roleLabel =
    user.role === "PROJECT_MANAGER"
      ? "Project Manager"
      : user.role === "DEVELOPER"
        ? "Developer"
        : "Administrator";

  const navigationItems: NavigationItem[] =
    [
      {
        path: "/dashboard",
        label: "Dashboard",
        icon: (
          <LayoutDashboard size={18} />
        ),
        visible: true,
      },
      {
        path: "/projects",
        label: "Projects",
        icon: (
          <FolderKanban size={18} />
        ),
        visible: true,
      },
      {
        path: "/tasks",
        label: "Tasks",
        icon: <ListTodo size={18} />,
        visible: true,
      },
      {
        path: "/activity",
        label: "Activity",
        icon: <Activity size={18} />,
        visible: true,
      },
      {
        path: "/users",
        label: "Users",
        icon: <Users size={18} />,
        visible: user.role === "ADMIN",
      },
      {
        path: "/settings",
        label: "Settings",
        icon: <Settings size={18} />,
        visible: user.role === "ADMIN",
      },
    ];

  const handleLogout = () => {
    logout();
    onLogout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen
          w-64 flex-col border-r border-slate-200
          bg-white shadow-sm
          transition-transform duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <LayoutDashboard
                size={20}
              />
            </div>

            <div className="text-left">
              <h1 className="text-lg font-bold text-slate-900">
                Velozity
              </h1>

              <p className="text-[11px] font-medium text-slate-400">
                PROJECT DASHBOARD
              </p>
            </div>
          </button>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">

          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <div className="space-y-1">
            {navigationItems
              .filter(
                (item) => item.visible
              )
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() =>
                    setSidebarOpen(false)
                  }
                  className={({ isActive }) =>
                    `
                    flex items-center gap-3
                    rounded-xl px-3 py-2.5
                    text-sm font-medium
                    transition-all
                    ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }
                    `
                  }
                >
                  {item.icon}

                  <span>
                    {item.label}
                  </span>
                </NavLink>
              ))}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-slate-200 p-4">

          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
              <UserCircle size={23} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.name}
              </p>

              <p className="truncate text-xs text-slate-500">
                {roleLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} />

            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="lg:pl-64">

        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <button
              type="button"
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() =>
                setSidebarOpen(true)
              }
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Workspace
              </p>

              <h2 className="text-lg font-bold text-slate-900">
                Velozity Dashboard
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">

            <NotificationBell />

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user.name}
              </p>

              <p className="text-xs text-slate-500">
                {roleLabel}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 sm:hidden">
              <UserCircle size={21} />
            </div>
          </div>
        </header>

        {/* Current page */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
