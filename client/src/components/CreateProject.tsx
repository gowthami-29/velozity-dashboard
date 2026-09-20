
import { FormEvent, useEffect, useState } from "react";
import {
  FolderPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

import { apiFetch } from "../services/api";

type Role = "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface CreateProjectProps {
  role: "ADMIN" | "PROJECT_MANAGER";
  onClose: () => void;
  onCreated: () => void;
}

const CreateProject = ({
  role,
  onClose,
  onCreated,
}: CreateProjectProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");

  const [managers, setManagers] = useState<User[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadManagers = async () => {
      try {
        setLoadingOptions(true);
        setError("");

        // Only Admin needs to select a Project Manager.
        if (role !== "ADMIN") {
          setLoadingOptions(false);
          return;
        }

        const response = await apiFetch("/users");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.error?.message ||
              "Failed to load users"
          );
        }

        const projectManagers = (data.users || []).filter(
          (user: User) => user.role === "PROJECT_MANAGER"
        );

        setManagers(projectManagers);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load project managers"
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    loadManagers();
  }, [role]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    if (role === "ADMIN" && !managerId) {
      setError("Please select a Project Manager");
      return;
    }

    try {
      setLoading(true);

      const body: {
        name: string;
        description?: string;
        managerId?: string;
      } = {
        name: name.trim(),
        description: description.trim(),
      };

      if (role === "ADMIN") {
        body.managerId = managerId;
      }

      const response = await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.message ||
            "Failed to create project"
        );
      }

      setName("");
      setDescription("");
      setManagerId("");

      setSuccess("Project created successfully.");

      onCreated();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create project"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <FolderPlus size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Create Project
              </h2>

              <p className="text-sm text-slate-500">
                Add a new project to your workspace.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6">
          {/* Loading */}
          {loadingOptions && role === "ADMIN" && (
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <Loader2 size={16} className="animate-spin" />
              Loading project managers...
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Project Name */}
            <div>
              <label
                htmlFor="project-name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Project Name
              </label>

              <input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter project name"
                maxLength={200}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="project-description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Description
              </label>

              <textarea
                id="project-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe the project..."
                rows={4}
                maxLength={2000}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* Project Manager - Admin only */}
            {role === "ADMIN" && (
              <div>
                <label
                  htmlFor="project-manager"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Project Manager
                </label>

                <select
                  id="project-manager"
                  value={managerId}
                  onChange={(event) =>
                    setManagerId(event.target.value)
                  }
                  disabled={loadingOptions}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="">
                    Select Project Manager
                  </option>

                  {managers.map((manager) => (
                    <option
                      key={manager.id}
                      value={manager.id}
                    >
                      {manager.name} ({manager.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || loadingOptions}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <FolderPlus size={16} />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;

