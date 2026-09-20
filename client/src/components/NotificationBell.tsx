
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bell,
  Check,
  CheckCheck,
  X,
} from "lucide-react";

import { apiFetch } from "../services/api";
import { useSocket } from "../context/SocketContext";

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

const NotificationBell = () => {
  const { socket } = useSocket();

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [open, setOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const dropdownRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * Load notifications when component mounts.
   */
  useEffect(() => {
    loadNotifications();
  }, []);

  /*
   * Listen for real-time notifications.
   */
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: {
      notification: Notification;
      unreadCount: number;
    }) => {
      setNotifications((current) => {
        const exists = current.some(
          (notification) =>
            notification.id ===
            data.notification.id
        );

        if (exists) {
          return current;
        }

        return [
          data.notification,
          ...current,
        ].slice(0, 20);
      });

      setUnreadCount(data.unreadCount);
    };

    socket.on(
      "notification-created",
      handleNotification
    );

    return () => {
      socket.off(
        "notification-created",
        handleNotification
      );
    };
  }, [socket]);

  /*
   * Close dropdown when clicking outside.
   */
  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const response = await apiFetch(
        "/notifications"
      );

      const data =
        (await response.json()) as NotificationsResponse & {
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load notifications"
        );
      }

      setNotifications(
        data.notifications ?? []
      );

      setUnreadCount(
        data.unreadCount ?? 0
      );
    } catch (error) {
      console.error(
        "Load notifications error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (
    notificationId: string
  ) => {
    try {
      const response = await apiFetch(
        `/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to mark notification as read"
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id ===
          notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );

      setUnreadCount(
        data.unreadCount ?? 0
      );
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error
      );
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications =
      notifications.filter(
        (notification) =>
          !notification.isRead
      );

    if (
      unreadNotifications.length === 0
    ) {
      return;
    }

    /*
     * The backend currently exposes
     * individual mark-as-read.
     *
     * Mark each unread notification.
     */
    try {
      await Promise.all(
        unreadNotifications.map(
          (notification) =>
            apiFetch(
              `/notifications/${notification.id}/read`,
              {
                method: "PATCH",
              }
            )
        )
      );

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Mark all notifications read error:",
        error
      );

      /*
       * Reload from server if one of the
       * individual requests failed.
       */
      await loadNotifications();
    }
  };

  const formatTime = (
    createdAt: string
  ) => {
    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();

    const difference =
      now.getTime() -
      date.getTime();

    const minutes = Math.floor(
      difference / 60000
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
      }
    );
  };

  const getNotificationTitle = (
    type: string
  ) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return "New task assigned";

      case "TASK_STATUS_CHANGED":
        return "Task status updated";

      case "TASK_OVERDUE":
        return "Task overdue";

      default:
        return "Notification";
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="relative"
    >

      {/* Bell */}
      <button
        type="button"
        onClick={() =>
          setOpen((current) => !current)
        }
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Notifications"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Notifications
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>

            <div className="flex items-center gap-1">

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  title="Mark all as read"
                >
                  <CheckCheck
                    size={17}
                  />
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                title="Close"
              >
                <X size={17} />
              </button>

            </div>

          </div>

          {/* Notifications */}
          <div className="max-h-[420px] overflow-y-auto">

            {loading && (
              <div className="p-8 text-center">

                <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />

                <p className="text-xs text-slate-500">
                  Loading notifications...
                </p>

              </div>
            )}

            {!loading &&
              notifications.length ===
                0 && (
                <div className="px-6 py-10 text-center">

                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Bell size={19} />
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    No notifications
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    New updates will appear here.
                  </p>

                </div>
              )}

            {!loading &&
              notifications.map(
                (notification) => (
                  <div
                    key={notification.id}
                    className={`
                      border-b border-slate-100 px-4 py-3
                      transition
                      ${
                        notification.isRead
                          ? "bg-white"
                          : "bg-slate-50"
                      }
                    `}
                  >

                    <div className="flex gap-3">

                      {/* Status dot */}
                      <div className="pt-1">

                        <div
                          className={`
                            h-2.5 w-2.5 rounded-full
                            ${
                              notification.isRead
                                ? "bg-slate-200"
                                : "bg-blue-500"
                            }
                          `}
                        />

                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-2">

                          <p className="text-xs font-bold text-slate-800">
                            {getNotificationTitle(
                              notification.type
                            )}
                          </p>

                          <span className="shrink-0 text-[10px] text-slate-400">
                            {formatTime(
                              notification.createdAt
                            )}
                          </span>

                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {notification.message}
                        </p>

                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={() =>
                              markAsRead(
                                notification.id
                              )
                            }
                            className="mt-2 inline-flex items-center gap-1 rounded-md text-[11px] font-semibold text-slate-600 transition hover:text-slate-900"
                          >
                            <Check
                              size={13}
                            />
                            Mark as read
                          </button>
                        )}

                      </div>

                    </div>

                  </div>
                )
              )}

          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5">

              <p className="text-center text-[10px] font-medium text-slate-400">
                Showing your latest{" "}
                {notifications.length}{" "}
                notifications
              </p>

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default NotificationBell;

