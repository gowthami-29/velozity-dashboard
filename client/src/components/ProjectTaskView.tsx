import { useEffect, useState } from "react";
import {
  RefreshCw,
  Filter,
  CalendarDays,
  User,
  FolderKanban,
  AlertCircle,
  Radio,
  ListTodo
} from "lucide-react";

import { useSocket } from "../context/SocketContext";
import { apiFetch } from "../services/api";

type Role =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

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
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  developerId: string;
  developer: {
    id: string;
    name: string;
    email: string;
  };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  manager: {
    id: string;
    name: string;
    email: string;
  };
  tasks: Task[];
}

interface TaskStatusUpdate {
  taskId: string;
  projectId: string;
  title: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  changedBy: {
    userId: string;
    role: Role;
  };
  timestamp: string;
}

interface ProjectTaskViewProps {
  role: Role;
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

const ProjectTaskView = ({
  role,
}: ProjectTaskViewProps) => {
  const { socket } = useSocket();

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [priorityFilter, setPriorityFilter] =
    useState("");

  const [updatingTaskId, setUpdatingTaskId] =
    useState<string | null>(null);

  const [liveMessage, setLiveMessage] =
    useState("");

  // --------------------------------
  // LOAD PROJECTS
  // --------------------------------

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      if (priorityFilter) {
        params.set("priority", priorityFilter);
      }

      const response = await apiFetch(
        `/projects?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.message ||
            "Failed to load projects"
        );
      }

      setProjects(data.projects || []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load projects"
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // LOAD WHEN FILTER CHANGES
  // --------------------------------

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, priorityFilter]);

  // --------------------------------
  // SOCKET.IO
  // --------------------------------

  useEffect(() => {
    if (!socket || projects.length === 0) {
      return;
    }

    const joinProjects = () => {
      projects.forEach((project) => {
        socket.emit(
          "join-project",
          project.id
        );
      });
    };

    const handleTaskStatusUpdated = (
      data: TaskStatusUpdate
    ) => {
      console.log(
        "Live task update:",
        data
      );

      setProjects(
        (currentProjects) =>
          currentProjects.map(
            (project) => {
              if (
                project.id !==
                data.projectId
              ) {
                return project;
              }

              return {
                ...project,
                tasks: project.tasks.map(
                  (task) =>
                    task.id ===
                    data.taskId
                      ? {
                          ...task,
                          status:
                            data.toStatus,
                        }
                      : task
                ),
              };
            }
          )
      );

      setLiveMessage(
        `"${data.title}" changed from ${
          statusLabels[
            data.fromStatus
          ]
        } to ${
          statusLabels[
            data.toStatus
          ]
        }`
      );

      setTimeout(() => {
        setLiveMessage("");
      }, 4000);
    };

    const handleSocketError = (
      data: { message: string }
    ) => {
      console.error(
        "Socket error:",
        data.message
      );
    };

    socket.on(
      "connect",
      joinProjects
    );

    socket.on(
      "task-status-updated",
      handleTaskStatusUpdated
    );

    socket.on(
      "socket-error",
      handleSocketError
    );

    if (socket.connected) {
      joinProjects();
    }

    return () => {
      projects.forEach((project) => {
        socket.emit(
          "leave-project",
          project.id
        );
      });

      socket.off(
        "connect",
        joinProjects
      );

      socket.off(
        "task-status-updated",
        handleTaskStatusUpdated
      );

      socket.off(
        "socket-error",
        handleSocketError
      );
    };
  }, [socket, projects]);

  // --------------------------------
  // UPDATE TASK STATUS
  // --------------------------------

  const updateTaskStatus = async (
    taskId: string,
    newStatus: TaskStatus
  ) => {
    try {
      setUpdatingTaskId(taskId);
      setError("");

      const response = await apiFetch(
        `/tasks/${taskId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.message ||
            "Failed to update task status"
        );
      }

      setProjects(
        (currentProjects) =>
          currentProjects.map(
            (project) => ({
              ...project,
              tasks: project.tasks.map(
                (task) =>
                  task.id === taskId
                    ? {
                        ...task,
                        status:
                          newStatus,
                      }
                    : task
              ),
            })
          )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update task status"
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // --------------------------------
  // HELPERS
  // --------------------------------

  const getPriorityStyle = (
    priority: TaskPriority
  ) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-100 text-red-700 border-red-200";

      case "HIGH":
        return "bg-orange-100 text-orange-700 border-orange-200";

      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";

      case "LOW":
        return "bg-green-100 text-green-700 border-green-200";

      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusStyle = (
    status: TaskStatus
  ) => {
    switch (status) {
      case "TODO":
        return "bg-slate-100 text-slate-700";

      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";

      case "IN_REVIEW":
        return "bg-purple-100 text-purple-700";

      case "DONE":
        return "bg-green-100 text-green-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const isOverdue = (
    dueDate: string,
    status: TaskStatus
  ) => {
    return (
      status !== "DONE" &&
      new Date(dueDate) < new Date()
    );
  };

  // --------------------------------
  // LOADING
  // --------------------------------

  if (loading) {
    return (
      <section
        id="tasks"
        className="mt-10 scroll-mt-24"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-slate-600">
            <RefreshCw
              size={20}
              className="animate-spin"
            />

            <span>
              Loading projects...
            </span>
          </div>
        </div>
      </section>
    );
  }

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <section
      id="projects"
      className="mt-10 scroll-mt-24"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div>
          <div className="flex items-center gap-2">
            <FolderKanban
              size={24}
              className="text-slate-700"
            />

            <h2 className="text-2xl font-bold text-slate-900">
              Projects & Tasks
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Manage projects and track task progress.
          </p>
        </div>

        <button
          onClick={fetchProjects}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw size={16} />

          Refresh
        </button>
      </div>

      {/* Live Update */}
      {liveMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-sm">
          <Radio
            size={18}
            className="animate-pulse"
          />

          <div>
            <span className="font-semibold">
              Live update:
            </span>{" "}
            {liveMessage}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} />

          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="mb-3 flex items-center gap-2">
          <Filter
            size={18}
            className="text-slate-600"
          />

          <h3 className="text-sm font-semibold text-slate-900">
            Filters
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            <option value="">
              All Statuses
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
            onChange={(e) =>
              setPriorityFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            <option value="">
              All Priorities
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

          {/* Clear */}
          {(statusFilter ||
            priorityFilter) && (
            <button
              onClick={() => {
                setStatusFilter("");
                setPriorityFilter("");
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FolderKanban
            size={40}
            className="mx-auto mb-3 text-slate-400"
          />

          <h3 className="text-lg font-semibold text-slate-900">
            No projects available
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            No projects match your current filters.
          </p>
        </div>
      )}

      {/* Projects */}
      <div className="space-y-6">

        {projects.map((project) => (
          <div
            key={project.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            {/* Project Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-5">

              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {project.name}
                  </h3>

                  {project.description && (
                    <p className="mt-1 max-w-3xl text-sm text-slate-500">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User size={16} />

                  <span>
                    {project.manager?.name}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <ListTodo size={15} />

                <span>
                  {project.tasks.length}{" "}
                  {project.tasks.length === 1
                    ? "task"
                    : "tasks"}
                </span>
              </div>
            </div>

            {/* Tasks */}
            <div className="p-5">

              {project.tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No tasks match the selected filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">

                  {project.tasks.map(
                    (task) => {
                      const overdue =
                        isOverdue(
                          task.dueDate,
                          task.status
                        );

                      return (
                        <div
                          key={task.id}
                          className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm"
                        >

                          {/* Task top */}
                          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">

                            <div className="min-w-0 flex-1">

                              <h4 className="font-semibold text-slate-900">
                                {task.title}
                              </h4>

                              {task.description && (
                                <p className="mt-1 text-sm text-slate-500">
                                  {task.description}
                                </p>
                              )}

                              {/* Task metadata */}
                              <div className="mt-4 flex flex-wrap items-center gap-2">

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getPriorityStyle(
                                    task.priority
                                  )}`}
                                >
                                  {
                                    priorityLabels[
                                      task.priority
                                    ]
                                  }
                                </span>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(
                                    task.status
                                  )}`}
                                >
                                  {
                                    statusLabels[
                                      task.status
                                    ]
                                  }
                                </span>

                                {overdue && (
                                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Status control */}
                            <div className="flex items-center gap-2">

                              <select
                                value={
                                  task.status
                                }
                                disabled={
                                  updatingTaskId ===
                                  task.id
                                }
                                onChange={(e) =>
                                  updateTaskStatus(
                                    task.id,
                                    e.target
                                      .value as TaskStatus
                                  )
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
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

                          {/* Task footer */}
                          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-center gap-2">
                              <User size={14} />

                              <span>
                                {task.developer?.name}
                              </span>
                            </div>

                            <div
                              className={`flex items-center gap-2 ${
                                overdue
                                  ? "font-semibold text-red-600"
                                  : ""
                              }`}
                            >
                              <CalendarDays
                                size={14}
                              />

                              <span>
                                Due{" "}
                                {new Date(
                                  task.dueDate
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProjectTaskView;