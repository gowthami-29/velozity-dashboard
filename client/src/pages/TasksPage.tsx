
import { useEffect, useState } from "react";
import {
  RefreshCw,
  Filter,
  CalendarDays,
  User,
  FolderKanban,
  AlertCircle,
  Radio,
  ListTodo,
  Plus,
} from "lucide-react";
import CreateTask from "../components/CreateTask";
import { useSocket } from "../context/SocketContext";
import { apiFetch } from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
}

interface TasksPageProps {
  user: User;
}

type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE";

type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;

  developer?: {
    id: string;
    name: string;
    email: string;
  } | null;

  project?: {
    id: string;
    name: string;
  } | null;
}

interface TaskStatusUpdate {
  taskId: string;
  projectId: string;
  title: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  changedBy: string;
  timestamp: string;
}

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const statusStyles: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-purple-100 text-purple-700",
  DONE: "bg-emerald-100 text-emerald-700",
};

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const isOverdue = (task: Task) => {
  if (!task.dueDate || task.status === "DONE") {
    return false;
  }

  return new Date(task.dueDate).getTime() < Date.now();
};

export default function TasksPage({ user }: TasksPageProps) {
  const { socket, connected } = useSocket();

  const [showCreateTask, setShowCreateTask] =
    useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [updatingTaskId, setUpdatingTaskId] =
    useState<string | null>(null);

  const [liveMessage, setLiveMessage] = useState("");
  const [error, setError] = useState("");

  const fetchTasks = async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      if (priorityFilter) {
        params.set("priority", priorityFilter);
      }

      if (projectFilter) {
        params.set("projectId", projectFilter);
      }

      const query = params.toString();

      const response = await apiFetch(
        `/tasks${query ? `?${query}` : ""}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.message ||
            "Failed to load tasks"
        );
      }

      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Fetch tasks error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load tasks"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, projectFilter]);

  /*
   * Real-time task updates
   */
  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleTaskStatusUpdated = (
      update: TaskStatusUpdate
    ) => {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === update.taskId
            ? {
                ...task,
                status: update.toStatus,
              }
            : task
        )
      );

      setLiveMessage(
        `Live update: "${update.title}" changed from ${statusLabels[update.fromStatus]} to ${statusLabels[update.toStatus]}`
      );

      setTimeout(() => {
        setLiveMessage("");
      }, 4000);
    };

    socket.on(
      "task-status-updated",
      handleTaskStatusUpdated
    );

    return () => {
      socket.off(
        "task-status-updated",
        handleTaskStatusUpdated
      );
    };
  }, [socket]);

  /*
   * Update task status
   */
  const updateTaskStatus = async (
    taskId: string,
    status: TaskStatus
  ) => {
    try {
      setUpdatingTaskId(taskId);
      setError("");

      const response = await apiFetch(
        `/tasks/${taskId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.message ||
            "Failed to update task"
        );
      }

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status,
              }
            : task
        )
      );
    } catch (error) {
      console.error(
        "Update task status error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update task"
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const totalTasks = tasks.length;

  const todoCount = tasks.filter(
    (task) => task.status === "TODO"
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const reviewCount = tasks.filter(
    (task) => task.status === "IN_REVIEW"
  ).length;

  const doneCount = tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  const overdueCount = tasks.filter(isOverdue).length;

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ListTodo size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Tasks
              </h1>

              <p className="text-sm text-slate-500">
                Track and manage project tasks
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Socket status */}
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
              connected
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            <Radio size={14} />

            {connected ? "Live" : "Offline"}
          </div>

          {/* Create Task */}
          {(user.role === "ADMIN" ||
            user.role === "PROJECT_MANAGER") && (
            <button
              type="button"
              onClick={() =>
                setShowCreateTask(true)
              }
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              Create Task
            </button>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={() => fetchTasks(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            Refresh
          </button>
        </div>
      </div>

      {/* =====================================================
          LIVE MESSAGE
      ====================================================== */}
      {liveMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Radio size={17} />
          <span>{liveMessage}</span>
        </div>
      )}

      {/* =====================================================
          ERROR
      ====================================================== */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {/* =====================================================
          SUMMARY
      ====================================================== */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          label="Total"
          value={totalTasks}
        />

        <SummaryCard
          label="To Do"
          value={todoCount}
        />

        <SummaryCard
          label="In Progress"
          value={inProgressCount}
        />

        <SummaryCard
          label="In Review"
          value={reviewCount}
        />

        <SummaryCard
          label="Done"
          value={doneCount}
        />

        <SummaryCard
          label="Overdue"
          value={overdueCount}
          danger={overdueCount > 0}
        />
      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter
            size={17}
            className="text-slate-500"
          />

          <h2 className="font-semibold text-slate-900">
            Filters
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
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
              Done
            </option>
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
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

          {/* Project */}
          <input
            value={projectFilter}
            onChange={(event) =>
              setProjectFilter(event.target.value)
            }
            placeholder="Project ID"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400"
          />
        </div>
      </div>

      {/* =====================================================
          TASK LIST
      ====================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Task List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {totalTasks} task
            {totalTasks === 1 ? "" : "s"} found
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <RefreshCw
              size={24}
              className="animate-spin text-slate-400"
            />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
            <ListTodo
              size={42}
              className="mb-3 text-slate-300"
            />

            <h3 className="font-semibold text-slate-700">
              No tasks found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your filters or create a
              new task.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const overdue = isOverdue(task);

              return (
                <div
                  key={task.id}
                  className="p-5 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    {/* Main task information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {task.title}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityStyles[task.priority]}`}
                        >
                          {
                            priorityLabels[
                              task.priority
                            ]
                          }
                        </span>

                        {overdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                            <AlertCircle size={12} />
                            Overdue
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="mt-2 max-w-3xl text-sm text-slate-500">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                        {task.project && (
                          <span className="inline-flex items-center gap-1.5">
                            <FolderKanban
                              size={14}
                            />
                            {task.project.name}
                          </span>
                        )}

                        {task.developer && (
                          <span className="inline-flex items-center gap-1.5">
                            <User size={14} />
                            {task.developer.name}
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays
                            size={14}
                          />

                          {new Date(
                            task.dueDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`hidden rounded-full px-3 py-1.5 text-xs font-medium sm:inline-flex ${statusStyles[task.status]}`}
                      >
                        {statusLabels[task.status]}
                      </span>

                      <select
                        value={task.status}
                        disabled={
                          updatingTaskId ===
                            task.id ||
                          user.role === "DEVELOPER"
                        }
                        onChange={(event) =>
                          updateTaskStatus(
                            task.id,
                            event.target
                              .value as TaskStatus
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70"
                      >
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
                          Done
                        </option>
                      </select>

                      {updatingTaskId ===
                        task.id && (
                        <RefreshCw
                          size={16}
                          className="animate-spin text-slate-400"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================
          CREATE TASK MODAL
      ====================================================== */}
      {showCreateTask && (
        <CreateTask
          onClose={() =>
            setShowCreateTask(false)
          }
          onCreated={() => fetchTasks(true)}
        />
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  danger?: boolean;
}

function SummaryCard({
  label,
  value,
  danger = false,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${
          danger
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

