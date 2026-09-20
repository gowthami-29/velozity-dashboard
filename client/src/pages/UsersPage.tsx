import { useEffect, useState } from "react";
import {
  Users,
  UserCircle,
  Mail,
  RefreshCw,
  ShieldCheck,
  Briefcase,
  Code2,
  AlertCircle,
} from "lucide-react";

import { apiFetch } from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role:
    | "ADMIN"
    | "PROJECT_MANAGER"
    | "DEVELOPER";
}

interface UsersPageProps {
  user: User;
}

interface UsersResponse {
  users: User[];
}

const UsersPage = ({
  user,
}: UsersPageProps) => {
  const [users, setUsers] = useState<User[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadUsers = async (
    showRefresh = false
  ) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiFetch(
        "/users"
      );

      const data: UsersResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          (data as any)?.message ||
            "Failed to load users"
        );
      }

      setUsers(data.users || []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load users"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const getRoleLabel = (
    role: User["role"]
  ) => {
    if (role === "PROJECT_MANAGER") {
      return "Project Manager";
    }

    if (role === "DEVELOPER") {
      return "Developer";
    }

    return "Administrator";
  };

  const getRoleIcon = (
    role: User["role"]
  ) => {
    if (role === "PROJECT_MANAGER") {
      return <Briefcase size={16} />;
    }

    if (role === "DEVELOPER") {
      return <Code2 size={16} />;
    }

    return <ShieldCheck size={16} />;
  };

  const getRoleClasses = (
    role: User["role"]
  ) => {
    if (role === "PROJECT_MANAGER") {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }

    if (role === "DEVELOPER") {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }

    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Users size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Users
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View users and their assigned roles.
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={() => loadUsers(true)}
          disabled={refreshing}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* Admin information */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <UserCircle
              size={21}
              className="text-slate-600"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Signed in as {user.name}
            </p>

            <p className="text-xs text-slate-500">
              {user.email}
            </p>
          </div>

        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Unable to load users
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />

          <p className="text-sm font-medium text-slate-600">
            Loading users...
          </p>
        </div>
      )}

      {/* Users */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">

              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    User
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Role
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {users.map((item) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-slate-50"
                  >

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <UserCircle
                            size={20}
                          />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.name}
                          </p>
                        </div>

                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={15} />
                        {item.email}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`
                          inline-flex items-center gap-2
                          rounded-full border px-3 py-1.5
                          text-xs font-semibold
                          ${getRoleClasses(
                            item.role
                          )}
                        `}
                      >
                        {getRoleIcon(
                          item.role
                        )}

                        {getRoleLabel(
                          item.role
                        )}
                      </span>
                    </td>

                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-slate-100 md:hidden">

            {users.map((item) => (
              <div
                key={item.id}
                className="p-5"
              >

                <div className="flex items-start justify-between gap-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <UserCircle
                        size={21}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.name}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail size={13} />
                        {item.email}
                      </div>
                    </div>

                  </div>

                  <span
                    className={`
                      inline-flex shrink-0 items-center gap-1.5
                      rounded-full border px-2.5 py-1
                      text-[11px] font-semibold
                      ${getRoleClasses(
                        item.role
                      )}
                    `}
                  >
                    {getRoleIcon(
                      item.role
                    )}

                    {getRoleLabel(
                      item.role
                    )}
                  </span>

                </div>

              </div>
            ))}

          </div>

          {/* Empty state */}
          {users.length === 0 && (
            <div className="p-10 text-center">
              <Users
                size={32}
                className="mx-auto mb-3 text-slate-300"
              />

              <p className="text-sm font-semibold text-slate-700">
                No users found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                There are no users to display.
              </p>
            </div>
          )}

        </div>
      )}

      {/* Count */}
      {!loading && !error && (
        <p className="text-xs text-slate-400">
          {users.length} user
          {users.length === 1
            ? ""
            : "s"}{" "}
          available
        </p>
      )}

    </div>
  );
};

export default UsersPage;
