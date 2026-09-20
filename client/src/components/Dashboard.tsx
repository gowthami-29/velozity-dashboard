
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

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
  Bell,
  UserCircle,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  CircleDot,
  Eye,
  Sparkles,
} from "lucide-react";

import NotificationBell from "./NotificationBell";
import CreateProject from "./CreateProject";
import CreateTask from "./CreateTask";
import ProjectTaskView from "./ProjectTaskView";
import ActivityFeed from "./ActivityFeed";

import {
  getDashboard,
  type DashboardData,
} from "../services/api";

interface DashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role:
      | "ADMIN"
      | "PROJECT_MANAGER"
      | "DEVELOPER";
  };

  onLogout: () => void;
}

const Dashboard = ({
  user,
  onLogout,
}: DashboardProps) => {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [activeSection, setActiveSection] =
    useState("dashboard");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await getDashboard();

        setDashboard(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleNavigation = (
    section: string
  ) => {
    setActiveSection(section);
    setSidebarOpen(false);

    const element =
      document.getElementById(section);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      visible: true,
    },

    {
      id: "projects",
      label: "Projects",
      icon: FolderKanban,
      visible: true,
    },

    {
      id: "tasks",
      label: "Tasks",
      icon: ListTodo,
      visible: true,
    },

    {
      id: "activity",
      label: "Activity",
      icon: Activity,
      visible: true,
    },

    {
      id: "users",
      label: "Users",
      icon: Users,
      visible: user.role === "ADMIN",
    },

    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      visible: user.role === "ADMIN",
    },
  ];

  const firstName =
    user.name?.split(" ")[0] ||
    user.name;

  const roleLabel =
    user.role === "PROJECT_MANAGER"
      ? "Project Manager"
      : user.role === "DEVELOPER"
        ? "Developer"
        : "Administrator";

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
          fixed left-0 top-0 z-50 flex h-screen w-64
          flex-col border-r border-slate-200 bg-white
          shadow-sm transition-transform duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* Brand */}
        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <LayoutDashboard
                size={20}
              />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Velozity
              </h1>

              <p className="text-[11px] font-medium text-slate-400">
                PROJECT DASHBOARD
              </p>
            </div>

          </div>

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
              .map((item) => {

                const Icon = item.icon;

                const isActive =
                  activeSection ===
                  item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      handleNavigation(
                        item.id
                      )
                    }
                    className={`
                      group flex w-full items-center gap-3
                      rounded-xl px-3 py-2.5
                      text-sm font-medium
                      transition-all
                      ${
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }
                    `}
                  >

                    <Icon
                      size={18}
                      className={
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-700"
                      }
                    />

                    <span>
                      {item.label}
                    </span>

                    {isActive && (
                      <ArrowUpRight
                        size={15}
                        className="ml-auto opacity-70"
                      />
                    )}

                  </button>
                );
              })}

          </div>
        </nav>

        {/* User */}
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
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>

        </div>

      </aside>

      {/* Main */}
      <div className="lg:pl-64">

        {/* Top header */}
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
                Dashboard
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

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8">

          {/* Dashboard section */}
          <section
            id="dashboard"
            className="scroll-mt-24"
          >

            {/* Hero */}
            <div className="mb-8 overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">

              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

                <div>

                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200">
                    <Sparkles size={13} />
                    {roleLabel}
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Welcome back,{" "}
                    {firstName}!
                  </h1>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                    Monitor your projects,
                    track tasks and stay
                    updated with your team's
                    latest activity.
                  </p>

                </div>

                <div className="hidden h-20 w-20 items-center justify-center rounded-2xl bg-white/10 md:flex">
                  <LayoutDashboard
                    size={38}
                    className="text-slate-200"
                  />
                </div>

              </div>

            </div>

            {/* Loading */}
            {loading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />

                <p className="text-sm font-medium text-slate-600">
                  Loading dashboard...
                </p>

              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                <Bell size={18} />

                <span>
                  {error}
                </span>

              </div>
            )}

            {dashboard && (
              <>

                {/* Main statistics */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                  <StatCard
                    title="Total Projects"
                    value={
                      dashboard.totalProjects
                    }
                    subtitle="Projects in your workspace"
                    icon={
                      <FolderKanban
                        size={21}
                      />
                    }
                  />

                  <StatCard
                    title="Total Tasks"
                    value={
                      dashboard.totalTasks
                    }
                    subtitle="Tasks across your projects"
                    icon={
                      <ListTodo
                        size={21}
                      />
                    }
                  />

                  <StatCard
                    title="Overdue Tasks"
                    value={
                      dashboard.overdueTasks
                    }
                    subtitle={
                      dashboard.overdueTasks >
                      0
                        ? "Requires your attention"
                        : "Everything is on schedule"
                    }
                    icon={
                      <Clock3 size={21} />
                    }
                    danger={
                      dashboard.overdueTasks >
                      0
                    }
                  />

                </div>

                {/* Status */}
                <div className="mt-8">

                  <div className="mb-4 flex items-center justify-between">

                    <div>

                      <h3 className="text-lg font-bold text-slate-900">
                        Task Overview
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Current task distribution
                      </p>

                    </div>

                    <div className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500 sm:flex">
                      <Activity size={14} />
                      Live data
                    </div>

                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <StatusCard
                      title="To Do"
                      value={
                        dashboard
                          .tasksByStatus
                          .TODO
                      }
                      icon={
                        <CircleDot
                          size={19}
                        />
                      }
                    />

                    <StatusCard
                      title="In Progress"
                      value={
                        dashboard
                          .tasksByStatus
                          .IN_PROGRESS
                      }
                      icon={
                        <Clock3
                          size={19}
                        />
                      }
                    />

                    <StatusCard
                      title="In Review"
                      value={
                        dashboard
                          .tasksByStatus
                          .IN_REVIEW
                      }
                      icon={
                        <Eye size={19} />
                      }
                    />

                    <StatusCard
                      title="Completed"
                      value={
                        dashboard
                          .tasksByStatus
                          .DONE
                      }
                      icon={
                        <CheckCircle2
                          size={19}
                        />
                      }
                    />

                  </div>

                </div>

              </>
            )}

          </section>

          {/* Projects */}
          <section
            id="projects"
            className="mt-12 scroll-mt-24"
          >

            <SectionHeader
              icon={
                <FolderKanban size={20} />
              }
              title="Projects"
              description="Create and manage your projects"
            />

            {(user.role === "ADMIN" ||
              user.role ===
                "PROJECT_MANAGER") && (
              <CreateProject
                role={user.role}
                onClose={() => {}}
                onCreated={() => {
                  window.location.reload();
                }}
              />
            )}

          </section>

          {/* Tasks */}
          <section
            id="tasks"
            className="mt-12 scroll-mt-24"
          >

            <SectionHeader
              icon={
                <ListTodo size={20} />
              }
              title="Tasks"
              description="Track assignments and task progress"
            />

            {(user.role === "ADMIN" ||
              user.role ===
                "PROJECT_MANAGER") && (
              <CreateTask
                onClose={() => {}}
                onCreated={() => {
                  window.location.reload();
                }}
              />
            )}

            <ProjectTaskView
              role={user.role}
            />

          </section>

          {/* Activity */}
          <section
            id="activity"
            className="mt-12 scroll-mt-24"
          >

            <SectionHeader
              icon={
                <Activity size={20} />
              }
              title="Activity"
              description="Follow the latest project updates in real time"
            />

            <ActivityFeed
              role={user.role}
            />

          </section>

        </main>

      </div>

    </div>
  );
};


/*
 * STAT CARD
 */
interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon?: ReactNode;
  danger?: boolean;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  danger = false,
}: StatCardProps) => {
  return (
    <div
      className={`
        rounded-2xl border bg-white p-5 shadow-sm
        transition-all hover:-translate-y-0.5 hover:shadow-md
        ${
          danger
            ? "border-red-200"
            : "border-slate-200"
        }
      `}
    >

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p
            className={`
              mt-2 text-3xl font-bold tracking-tight
              ${
                danger
                  ? "text-red-600"
                  : "text-slate-900"
              }
            `}
          >
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>

        </div>

        <div
          className={`
            rounded-xl p-3
            ${
              danger
                ? "bg-red-50 text-red-600"
                : "bg-slate-100 text-slate-700"
            }
          `}
        >
          {icon}
        </div>

      </div>

    </div>
  );
};


/*
 * STATUS CARD
 */
interface StatusCardProps {
  title: string;
  value: number;
  icon: ReactNode;
}

const StatusCard = ({
  title,
  value,
  icon,
}: StatusCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="text-2xl font-bold text-slate-900">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
};


/*
 * SECTION HEADER
 */
interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  description: string;
}

const SectionHeader = ({
  icon,
  title,
  description,
}: SectionHeaderProps) => {
  return (
    <div className="mb-5 flex items-start gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
        {icon}
      </div>

      <div>

        <h2 className="text-xl font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-0.5 text-sm text-slate-500">
          {description}
        </p>

      </div>

    </div>
  );
};

export default Dashboard;

