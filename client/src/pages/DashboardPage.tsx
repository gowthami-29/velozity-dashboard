
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  FolderKanban,
  ListTodo,
  Clock3,
  Activity,
  CircleDot,
  Eye,
  CheckCircle2,
  Sparkles,
  Bell,
  Filter,
} from "lucide-react";

import {
  getDashboard,
  type DashboardData,
  type DashboardFilters,
} from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role:
    | "ADMIN"
    | "PROJECT_MANAGER"
    | "DEVELOPER";
}

interface DashboardPageProps {
  user: User;
}

const DashboardPage = ({
  user,
}: DashboardPageProps) => {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<DashboardFilters["status"]>("");

  const [priorityFilter, setPriorityFilter] =
    useState<DashboardFilters["priority"]>("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboard({
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
        });

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
  }, [statusFilter, priorityFilter]);

  const firstName =
    user.name?.split(" ")[0] ||
    user.name;

  const roleLabel =
    user.role === "PROJECT_MANAGER"
      ? "Project Manager"
      : user.role === "DEVELOPER"
        ? "Developer"
        : "Administrator";

  const clearFilters = () => {
    setStatusFilter("");
    setPriorityFilter("");
  };

  return (
    <div>
      {/* Welcome section */}
      <div className="mb-8 overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200">
              <Sparkles size={13} />

              {roleLabel}
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {firstName}!
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
              Monitor your projects,
              track tasks and stay updated
              with your team's latest
              activity.
            </p>
          </div>

          <div className="hidden h-20 w-20 items-center justify-center rounded-2xl bg-white/10 md:flex">
            <Activity
              size={38}
              className="text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Filter
                size={18}
                className="text-slate-600"
              />

              <h2 className="font-semibold text-slate-900">
                Dashboard Filters
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Filter dashboard statistics by task status or priority.
            </p>
          </div>

          {(statusFilter || priorityFilter) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Status */}
          <div>
            <label
              htmlFor="dashboard-status"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Status
            </label>

            <select
              id="dashboard-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as DashboardFilters["status"]
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option value="">
                All statuses
              </option>

              <option value="TODO">
                To Do
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="IN_REVIEW">
                In Review
              </option>

              <option value="DONE">
                Completed
              </option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label
              htmlFor="dashboard-priority"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Priority
            </label>

            <select
              id="dashboard-priority"
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value as DashboardFilters["priority"]
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option value="">
                All priorities
              </option>

              <option value="LOW">
                Low
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="CRITICAL">
                Critical
              </option>
            </select>
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

          <span>{error}</span>
        </div>
      )}

      {/* Dashboard data */}
      {dashboard && !loading && (
        <>
          {/* Main statistics */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Total Projects"
              value={dashboard.totalProjects}
              subtitle="Projects in your workspace"
              icon={<FolderKanban size={21} />}
            />

            <StatCard
              title="Total Tasks"
              value={dashboard.totalTasks}
              subtitle="Tasks across your projects"
              icon={<ListTodo size={21} />}
            />

            <StatCard
              title="Overdue Tasks"
              value={dashboard.overdueTasks}
              subtitle={
                dashboard.overdueTasks > 0
                  ? "Requires your attention"
                  : "Everything is on schedule"
              }
              icon={<Clock3 size={21} />}
              danger={dashboard.overdueTasks > 0}
            />
          </div>

          {/* Task overview */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Task Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current task distribution
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatusCard
                title="To Do"
                value={dashboard.tasksByStatus.TODO}
                icon={<CircleDot size={19} />}
              />

              <StatusCard
                title="In Progress"
                value={dashboard.tasksByStatus.IN_PROGRESS}
                icon={<Clock3 size={19} />}
              />

              <StatusCard
                title="In Review"
                value={dashboard.tasksByStatus.IN_REVIEW}
                icon={<Eye size={19} />}
              />

              <StatusCard
                title="Completed"
                value={dashboard.tasksByStatus.DONE}
                icon={<CheckCircle2 size={19} />}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
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

interface StatusCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
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

export default DashboardPage;
