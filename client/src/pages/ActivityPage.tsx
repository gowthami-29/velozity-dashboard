
import { useEffect, useState } from "react";
import {
  Activity,
  RefreshCw,
  UserCircle,
  Clock3,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { apiFetch } from "../services/api";
import { useSocket } from "../context/SocketContext";

type Role =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface ActivityItem {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
}

interface ActivityPageProps {
  user: User;
}

const getActionLabel = (action: string) => {
  switch (action) {
    case "TASK_CREATED":
      return "Task created";

    case "TASK_STATUS_CHANGED":
      return "Task status changed";

    case "TASK_UPDATED":
      return "Task updated";

    case "TASK_OVERDUE":
      return "Task became overdue";

    case "PROJECT_CREATED":
      return "Project created";

    case "PROJECT_UPDATED":
      return "Project updated";

    default:
      return action
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        );
  }
};

const getActionIcon = (action: string) => {
  if (action.includes("PROJECT")) {
    return <FolderKanban size={17} />;
  }

  if (action.includes("OVERDUE")) {
    return <AlertCircle size={17} />;
  }

  if (action.includes("STATUS")) {
    return <CheckCircle2 size={17} />;
  }

  return <Activity size={17} />;
};

const formatDate = (date: string) => {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return date;
  }

  return value.toLocaleString();
};

export default function ActivityPage({
  user,
}: ActivityPageProps) {
  const { socket, connected } = useSocket();

  const [activities, setActivities] =
    useState<ActivityItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadActivities = async (
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
        "/activity"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.message ||
            "Failed to load activity"
        );
      }

      setActivities(
        data.activities || []
      );
    } catch (error) {
      console.error(
        "Load activity error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load activity"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /*
   * Initial activity load
   */
  useEffect(() => {
    loadActivities();
  }, []);

  /*
   * Real-time activity events
   */

/*
 * Real-time activity events + offline recovery
 */
useEffect(() => {
  if (!socket) {
    return;
  }

  const handleActivityCreated = (
    activity: ActivityItem
  ) => {
    setActivities((current) => {
      const exists = current.some(
        (item) => item.id === activity.id
      );

      if (exists) {
        return current;
      }

      return [
        activity,
        ...current,
      ].slice(0, 50);
    });
  };

  const handleReconnect = () => {
    /*
     * The user may have missed activity events while
     * disconnected. Fetch the persisted latest 20
     * activities from the database.
     */
    loadActivities(true);
  };

  socket.on(
    "activity-created",
    handleActivityCreated
  );

  socket.on(
    "connect",
    handleReconnect
  );

  return () => {
    socket.off(
      "activity-created",
      handleActivityCreated
    );

    socket.off(
      "connect",
      handleReconnect
    );
  };
}, [socket]);



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
            Loading activity...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* =========================================
          HEADER
      ========================================== */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Activity size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Activity
              </h1>

              <p className="text-sm text-slate-500">
                Recent activity from your workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <span
              className={`h-2 w-2 rounded-full ${
                connected
                  ? "bg-emerald-500"
                  : "bg-slate-300"
              }`}
            />

            <span className="text-xs font-medium text-slate-500">
              {connected
                ? "Live"
                : "Offline"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => loadActivities(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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

        </div>
      </div>

      {/* =========================================
          ERROR
      ========================================== */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>
        </div>
      )}

      {/* =========================================
          ACTIVITY LIST
      ========================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Recent Activity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Live updates appear automatically.
          </p>
        </div>

        {activities.length === 0 ? (
          <div className="p-12 text-center">

            <Activity
              size={40}
              className="mx-auto mb-3 text-slate-300"
            />

            <h3 className="font-semibold text-slate-800">
              No activity yet
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Project and task activity will
              appear here.
            </p>

          </div>
        ) : (
          <div className="divide-y divide-slate-100">

            {activities.map((item) => (
              <div
                key={item.id}
                className="p-5 transition hover:bg-slate-50"
              >
                <div className="flex gap-4">

                  {/* Icon */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    {getActionIcon(
                      item.action
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <h3 className="font-semibold text-slate-900">
                        {getActionLabel(
                          item.action
                        )}
                      </h3>

                      {item.project && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {item.project.name}
                        </span>
                      )}

                    </div>

                    {item.description && (
                      <p className="mt-1 text-sm text-slate-600">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">

                      {item.user && (
                        <span className="inline-flex items-center gap-1.5">
                          <UserCircle
                            size={14}
                          />

                          {item.user.name}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5">
                        <Clock3
                          size={14}
                        />

                        {formatDate(
                          item.createdAt
                        )}
                      </span>

                    </div>

                  </div>
                </div>
              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}
