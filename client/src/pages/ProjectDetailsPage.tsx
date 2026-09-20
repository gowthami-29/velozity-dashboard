import { useSocket } from "../context/SocketContext";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FolderKanban,
  UserCircle,
  CalendarDays,
  ListTodo,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
} from "lucide-react";

import { apiFetch } from "../services/api";

type Role =
  | "ADMIN"
  |  "PROJECT_MANAGER"
  |  "DEVELOPER";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "IN_REVIEW"
    | "DONE";
  priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";
  dueDate: string;
  developer?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  manager: {
    id: string;
    name: string;
    email: string;
  };
  tasks: Task[];
}

interface ProjectDetailsPageProps {
  user: User;
}

const statusLabels = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

const priorityLabels = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const statusStyles = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-purple-100 text-purple-700",
  DONE: "bg-emerald-100 text-emerald-700",
};

const priorityStyles = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export default function ProjectDetailsPage({
  user,
}: ProjectDetailsPageProps) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const [project, setProject] =
    useState<Project | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Load project details
   */
  const loadProject = async (
    refresh = false
  ) => {
    if (!projectId) {
      setError("Project ID is missing");
      setLoading(false);
      return;
    }

    try {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiFetch(
        `/projects/${projectId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.message ||
            "Failed to load project"
        );
      }

      setProject(data.project);
    } catch (error) {
      console.error(
        "Load project error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load project"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /*
   * Load whenever project ID changes
   */
  useEffect(() => {
    loadProject();
  }, [projectId]);
  useEffect(() => {
  if (!socket || !projectId) {
    return;
  }

  const handleTaskStatusUpdated = (event: {
    taskId: string;
    projectId: string;
    title: string;
    fromStatus: Task["status"];
    toStatus: Task["status"];
    changedBy: string;
    timestamp: string;
  }) => {
    if (event.projectId !== projectId) {
      return;
    }

    setProject((currentProject) => {
      if (!currentProject) {
        return currentProject;
      }

      return {
        ...currentProject,
        tasks: currentProject.tasks.map((task) =>
          task.id === event.taskId
            ? {
                ...task,
                status: event.toStatus,
              }
            : task
        ),
      };
    });
  };

  socket.emit("join-project", projectId);

  socket.on(
    "task-status-updated",
    handleTaskStatusUpdated
  );

  return () => {
    socket.off(
      "task-status-updated",
      handleTaskStatusUpdated
    );

    socket.emit("leave-project", projectId);
  };
}, [socket, projectId]);

  /*
   * Count tasks by status
   */
  const getCount = (
    status?: Task["status"]
  ) => {
    if (!project?.tasks) {
      return 0;
    }

    if (!status) {
      return project.tasks.length;
    }

    return project.tasks.filter(
      (task) => task.status === status
    ).length;
  };

  /*
   * Check whether task is overdue
   */
  const isOverdue = (task: Task) => {
    if (
      task.status === "DONE" ||
      !task.dueDate
    ) {
      return false;
    }

    return (
      new Date(task.dueDate).getTime() <
      Date.now()
    );
  };

  /*
   * Loading state
   */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={28}
            className="mx-auto mb-3 animate-spin text-slate-400"
          />

          <p className="text-sm text-slate-500">
            Loading project...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Error state
   */
  if (error || !project) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle
            size={35}
            className="mx-auto mb-3 text-red-500"
          />

          <h2 className="font-semibold text-red-800">
            Unable to load project
          </h2>

          <p className="mt-1 text-sm text-red-600">
            {error || "Project not found"}
          </p>

          <button
            type="button"
            onClick={() => loadProject(true)}
            className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* =========================================
          BACK + ACTIONS
      ========================================== */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Projects
        </button>

        <button
          type="button"
          onClick={() => loadProject(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
        <div className="flex items-center gap-2">
  <span
    className={`h-2 w-2 rounded-full ${
      connected
        ? "bg-emerald-500"
        : "bg-slate-300"
    }`}
  />

  <span className="text-xs text-slate-500">
    {connected
      ? "Live updates"
      : "Offline"}
  </span>
</div>
      </div>

      {/* =========================================
          PROJECT HEADER
      ========================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <FolderKanban size={26} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {project.name}
                </h1>

                {project.description && (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    {project.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">

                  <span className="inline-flex items-center gap-2">
                    <UserCircle size={17} />

                    <span>
                      Manager:{" "}
                      <strong className="text-slate-700">
                        {project.manager?.name ||
                          "Unknown"}
                      </strong>
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <ListTodo size={17} />
                    {project.tasks.length} tasks
                  </span>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          TASK STATISTICS
      ========================================== */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

        <StatCard
          label="To Do"
          value={getCount("TODO")}
          icon={<ListTodo size={19} />}
        />

        <StatCard
          label="In Progress"
          value={getCount("IN_PROGRESS")}
          icon={<Clock3 size={19} />}
        />

        <StatCard
          label="In Review"
          value={getCount("IN_REVIEW")}
          icon={<Eye size={19} />}
        />

        <StatCard
          label="Completed"
          value={getCount("DONE")}
          icon={<CheckCircle2 size={19} />}
        />

      </div>

      {/* =========================================
          TASKS
      ========================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Project Tasks
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            All tasks belonging to this project
          </p>
        </div>

        {project.tasks.length === 0 ? (
          <div className="p-12 text-center">

            <ListTodo
              size={40}
              className="mx-auto mb-3 text-slate-300"
            />

            <h3 className="font-semibold text-slate-800">
              No tasks yet
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Tasks assigned to this project will
              appear here.
            </p>

          </div>
        ) : (
          <div className="divide-y divide-slate-100">

            {project.tasks.map((task) => {
              const overdue = isOverdue(task);

              return (
                <div
                  key={task.id}
                  className="p-5 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="font-semibold text-slate-900">
                          {task.title}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            priorityStyles[
                              task.priority
                            ]
                          }`}
                        >
                          {
                            priorityLabels[
                              task.priority
                            ]
                          }
                        </span>

                        {overdue && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                            Overdue
                          </span>
                        )}

                      </div>

                      {task.description && (
                        <p className="mt-2 text-sm text-slate-500">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">

                        {task.developer && (
                          <span className="inline-flex items-center gap-1.5">
                            <UserCircle size={14} />
                            {task.developer.name}
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={14} />

                          {new Date(
                            task.dueDate
                          ).toLocaleDateString()}
                        </span>

                      </div>

                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1.5 text-xs font-medium ${
                        statusStyles[
                          task.status
                        ]
                      }`}
                    >
                      {
                        statusLabels[
                          task.status
                        ]
                      }
                    </span>

                  </div>
                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
}

function StatCard({
  label,
  value,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

      </div>
    </div>
  );
}

