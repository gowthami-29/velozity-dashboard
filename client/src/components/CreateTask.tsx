
import { useEffect, useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { apiFetch } from "../services/api";

interface CreateTaskProps {
  onCreated: () => void;
  onClose: () => void;
}

interface Project {
  id: string;
  name: string;
}

interface Developer {
  id: string;
  name: string;
  email: string;
  role?: string;
}

type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export default function CreateTask({
  onCreated,
  onClose,
}: CreateTaskProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [developerId, setDeveloperId] = useState("");
  const [priority, setPriority] =
    useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoadingData(true);
        setError("");

        const [projectsResponse, usersResponse] =
          await Promise.all([
            apiFetch("/projects"),
            apiFetch("/users"),
          ]);

        const projectsData = await projectsResponse.json();
        const usersData = await usersResponse.json();

        if (!projectsResponse.ok) {
          throw new Error(
            projectsData.message ||
              projectsData.error?.message ||
              "Failed to load projects"
          );
        }

        if (!usersResponse.ok) {
          throw new Error(
            usersData.message ||
              usersData.error?.message ||
              "Failed to load users"
          );
        }

        setProjects(projectsData.projects || []);

        const developerUsers = (usersData.users || []).filter(
          (user: Developer) => user.role === "DEVELOPER"
        );

        setDevelopers(developerUsers);
      } catch (error) {
        console.error("Load create task data error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load form data"
        );
      } finally {
        setLoadingData(false);
      }
    };

    loadFormData();
  }, []);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    if (!projectId) {
      setError("Please select a project");
      return;
    }

    if (!developerId) {
      setError("Please select a developer");
      return;
    }

    if (!dueDate) {
      setError("Please select a due date");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          projectId,
          developerId,
          priority,
          dueDate: new Date(dueDate).toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.message ||
            "Failed to create task"
        );
      }

      onCreated();
      onClose();
    } catch (error) {
      console.error("Create task error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create task"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Create Task
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a task to a project and assign it to a developer.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2
                size={25}
                className="animate-spin text-slate-400"
              />
            </div>
          ) : (
            <>
              {/* Task title */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Task Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="e.g. Implement authentication API"
                  maxLength={200}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Describe what needs to be completed..."
                  rows={4}
                  maxLength={2000}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Project + Developer */}
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Project
                  </label>

                  <select
                    value={projectId}
                    onChange={(event) =>
                      setProjectId(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">
                      Select project
                    </option>

                    {projects.map((project) => (
                      <option
                        key={project.id}
                        value={project.id}
                      >
                        {project.name}
                      </option>
                    ))}
                  </select>

                  {projects.length === 0 && (
                    <p className="mt-1.5 text-xs text-amber-600">
                      No projects available.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Developer
                  </label>

                  <select
                    value={developerId}
                    onChange={(event) =>
                      setDeveloperId(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">
                      Select developer
                    </option>

                    {developers.map((developer) => (
                      <option
                        key={developer.id}
                        value={developer.id}
                      >
                        {developer.name}
                      </option>
                    ))}
                  </select>

                  {developers.length === 0 && (
                    <p className="mt-1.5 text-xs text-amber-600">
                      No developers available.
                    </p>
                  )}
                </div>
              </div>

              {/* Priority + Due date */}
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Priority
                  </label>

                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(
                        event.target.value as TaskPriority
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">
                      Critical
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Due Date
                  </label>

                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(event) =>
                      setDueDate(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus size={16} />
                  )}

                  {saving ? "Creating..." : "Create Task"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

