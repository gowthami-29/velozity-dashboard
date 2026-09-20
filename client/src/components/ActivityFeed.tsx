import { useEffect, useState } from "react";
import {
  Activity as ActivityIcon,
  Clock,
  User,
  Radio,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { useSocket } from "../context/SocketContext";
import { apiFetch } from "../services/api";

type Role =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

interface Activity {
  id: string;
  taskId: string;
  projectId: string;
  taskTitle: string;
  userId: string;
  userName: string;
  userRole: string;
  fromStatus: string | null;
  toStatus: string;
  createdAt: string;
}

interface ActivityFeedProps {
  role: Role;
}

const statusLabel = (status: string | null) => {
  if (!status) return "Created";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const ActivityFeed = ({
  role,
}: ActivityFeedProps) => {
  const [activities, setActivities] = useState<
    Activity[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [isLive, setIsLive] =
    useState(false);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) {
      return;
    }

    /*
     * Load the latest 20 activities from
     * PostgreSQL.
     */
    const loadRecentActivity = async () => {
      try {
        setLoading(true);

        const response = await apiFetch(
          "/activity"
        );

        const data =
          await response.json();

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

        setError("");
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load activity"
        );
      } finally {
        setLoading(false);
      }
    };

    /*
     * Receive a new activity in real time.
     */
    const handleActivity = (
      activity: Activity
    ) => {
      setActivities((current) => {
        const alreadyExists =
          current.some(
            (item) =>
              item.id === activity.id
          );

        if (alreadyExists) {
          return current;
        }

        return [
          activity,
          ...current,
        ].slice(0, 20);
      });

      setIsLive(true);

      setTimeout(() => {
        setIsLive(false);
      }, 3000);
    };

    /*
     * Socket connected or reconnected.
     */
    const handleConnect = () => {
      console.log(
        "Socket connected/reconnected."
      );

      setIsLive(true);

      loadRecentActivity();
    };

    socket.on(
      "activity-created",
      handleActivity
    );

    socket.on(
      "connect",
      handleConnect
    );

    if (socket.connected) {
      loadRecentActivity();
      setIsLive(true);
    }

    return () => {
      socket.off(
        "activity-created",
        handleActivity
      );

      socket.off(
        "connect",
        handleConnect
      );
    };
  }, [socket]);

  /*
   * Loading
   */
  if (loading) {
    return (
      <section
        id="activity"
        className="mt-10 scroll-mt-24"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-slate-600">
            <RefreshCw
              size={20}
              className="animate-spin"
            />

            <span>
              Loading activity...
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="activity"
      className="mt-10 scroll-mt-24"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

        <div>
          <div className="flex items-center gap-2">
            <ActivityIcon
              size={24}
              className="text-slate-700"
            />

            <h2 className="text-2xl font-bold text-slate-900">
              Activity Feed
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {role === "ADMIN"
              ? "Global activity across all projects."
              : "Recent activity from your accessible projects."}
          </p>
        </div>

        {/* Live indicator */}
        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
            isLive
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isLive
                ? "animate-pulse bg-green-500"
                : "bg-slate-400"
            }`}
          />

          {isLive
            ? "Live"
            : "Connected"}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} />

          <span>{error}</span>
        </div>
      )}

      {/* Empty */}
      {activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <ActivityIcon
            size={40}
            className="mx-auto mb-3 text-slate-400"
          />

          <h3 className="text-lg font-semibold text-slate-900">
            No recent activity
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Project and task activity will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* Feed header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                Recent Activity
              </h3>

              <p className="text-xs text-slate-500">
                Showing the latest 20 events
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Radio size={14} />

              Real-time
            </div>
          </div>

          {/* Activities */}
          <div className="divide-y divide-slate-100">

            {activities.map(
              (activity) => (
                <div
                  key={activity.id}
                  className="px-5 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex gap-4">

                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <ActivityIcon
                        size={18}
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">

                      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">

                        <p className="text-sm text-slate-700">

                          <span className="font-semibold text-slate-900">
                            {activity.userName}
                          </span>

                          {" changed "}

                          <span className="font-semibold text-slate-900">
                            {activity.taskTitle}
                          </span>
                        </p>

                        <div className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                          <Clock
                            size={13}
                          />

                          {new Date(
                            activity.createdAt
                          ).toLocaleString()}
                        </div>
                      </div>

                      {/* Status change */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">

                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {statusLabel(
                            activity.fromStatus
                          )}
                        </span>

                        <span className="text-slate-400">
                          →
                        </span>

                        <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          {statusLabel(
                            activity.toStatus
                          )}
                        </span>
                      </div>

                      {/* User metadata */}
                      <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                        <User
                          size={13}
                        />

                        {activity.userRole}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ActivityFeed;