
import { useEffect, useState, type ReactNode } from "react";
import {
  FolderKanban,
  UserCircle,
  RefreshCw,
  AlertCircle,
  ListTodo,
  Plus,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../services/api";
import CreateProject from "../components/CreateProject";

interface User {
  id: string;
  name: string;
  email: string;
  role:
    | "ADMIN"
    | "PROJECT_MANAGER"
    | "DEVELOPER";
}

interface ProjectTask {
  id: string;
  title: string;
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "IN_REVIEW"
    | "DONE";
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

  tasks: ProjectTask[];
}

interface ProjectsPageProps {
  user: User;
}

const ProjectsPage = ({
  user,
}: ProjectsPageProps) => {
  const navigate = useNavigate();

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const [showCreateProject, setShowCreateProject] =
    useState(false);

  const canCreateProject =
    user.role === "ADMIN" ||
    user.role === "PROJECT_MANAGER";

  const loadProjects = async (
    refresh = false
  ) => {
    try {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiFetch(
        "/projects"
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
      console.error(
        "Load projects error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load projects"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const getTaskCount = (
    project: Project,
    status?: ProjectTask["status"]
  ) => {
    if (!project.tasks) {
      return 0;
    }

    if (!status) {
      return project.tasks.length;
    }

    return project.tasks.filter(
      (task) => task.status === status
    ).length;
  };

  return (
    <div className="space-y-8">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
            <FolderKanban size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Projects
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage projects in your
              workspace.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Create Project */}
          {canCreateProject && (
            <button
              type="button"
              onClick={() =>
                setShowCreateProject(true)
              }
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              Create Project
            </button>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={() => loadProjects(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* =====================================================
          LOADING
      ====================================================== */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <RefreshCw
            size={25}
            className="mx-auto mb-3 animate-spin text-slate-400"
          />

          <p className="text-sm font-medium text-slate-600">
            Loading projects...
          </p>
        </div>
      )}

      {/* =====================================================
          EMPTY
      ====================================================== */}
      {!loading &&
        !error &&
        projects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <FolderKanban
              size={40}
              className="mx-auto mb-3 text-slate-300"
            />

            <h3 className="text-lg font-semibold text-slate-900">
              No projects found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              There are no projects available
              for your account.
            </p>

            {canCreateProject && (
              <button
                type="button"
                onClick={() =>
                  setShowCreateProject(true)
                }
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Plus size={16} />
                Create Your First Project
              </button>
            )}
          </div>
        )}

      {/* =====================================================
          PROJECT CARDS
      ====================================================== */}
      {!loading &&
        !error &&
        projects.length > 0 && (
          <div className="grid gap-5 xl:grid-cols-2">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() =>
                  navigate(
                    `/projects/${project.id}`
                  )
                }
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    navigate(
                      `/projects/${project.id}`
                    );
                  }
                }}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {/* Project Header */}
                <div className="border-b border-slate-100 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <FolderKanban
                        size={19}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="truncate text-lg font-bold text-slate-900">
                          {project.name}
                        </h2>

                        <ChevronRight
                          size={18}
                          className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600"
                        />
                      </div>

                      {project.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Manager */}
                  <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                    <UserCircle size={17} />

                    <span>
                      Managed by{" "}
                      <span className="font-semibold text-slate-700">
                        {project.manager?.name ||
                          "Unknown"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-px bg-slate-100">
                  <ProjectStat
                    label="Total Tasks"
                    value={getTaskCount(project)}
                    icon={
                      <ListTodo size={16} />
                    }
                  />

                  <ProjectStat
                    label="Completed"
                    value={getTaskCount(
                      project,
                      "DONE"
                    )}
                    icon={
                      <span className="text-green-600">
                        ✓
                      </span>
                    }
                  />
                </div>

                {/* Task Progress */}
                <div className="p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Task Progress
                  </p>

                  <div className="grid grid-cols-4 gap-2">
                    <ProgressItem
                      label="To Do"
                      value={getTaskCount(
                        project,
                        "TODO"
                      )}
                    />

                    <ProgressItem
                      label="Progress"
                      value={getTaskCount(
                        project,
                        "IN_PROGRESS"
                      )}
                    />

                    <ProgressItem
                      label="Review"
                      value={getTaskCount(
                        project,
                        "IN_REVIEW"
                      )}
                    />

                    <ProgressItem
                      label="Done"
                      value={getTaskCount(
                        project,
                        "DONE"
                      )}
                    />
                  </div>
                </div>

                {/* Open Project */}
                <div className="border-t border-slate-100 px-5 py-3">
                  <span className="text-xs font-medium text-slate-400 transition group-hover:text-slate-700">
                    Click to open project
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* =====================================================
          CREATE PROJECT MODAL
      ====================================================== */}
      {showCreateProject && (
        <CreateProject
          role={
            user.role === "ADMIN" ||
            user.role === "PROJECT_MANAGER"
              ? user.role
              : "PROJECT_MANAGER"
          }
          onClose={() =>
            setShowCreateProject(false)
          }
          onCreated={() => {
            setShowCreateProject(false);
            loadProjects(true);
          }}
        />
      )}
    </div>
  );
};

/* ============================================================
   PROJECT STAT
============================================================ */

interface ProjectStatProps {
  label: string;
  value: number;
  icon: ReactNode;
}

const ProjectStat = ({
  label,
  value,
  icon,
}: ProjectStatProps) => {
  return (
    <div className="flex items-center gap-2 bg-slate-50 p-4">
      <div className="text-slate-400">
        {icon}
      </div>

      <div>
        <p className="text-xs text-slate-400">
          {label}
        </p>

        <p className="text-sm font-bold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
};

/* ============================================================
   PROGRESS ITEM
============================================================ */

interface ProgressItemProps {
  label: string;
  value: number;
}

const ProgressItem = ({
  label,
  value,
}: ProgressItemProps) => {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5 text-center">
      <p className="text-lg font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-0.5 text-[10px] font-medium text-slate-400">
        {label}
      </p>
    </div>
  );
};

export default ProjectsPage;

