
import {
  Settings,
  UserCircle,
  ShieldCheck,
  Mail,
  LockKeyhole,
  Info,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role:
    | "ADMIN"
    | "PROJECT_MANAGER"
    | "DEVELOPER";
}

interface SettingsPageProps {
  user: User;
}

const SettingsPage = ({
  user,
}: SettingsPageProps) => {
  const roleLabel =
    user.role === "PROJECT_MANAGER"
      ? "Project Manager"
      : user.role === "DEVELOPER"
        ? "Developer"
        : "Administrator";

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Settings size={23} />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your account and workspace
            information.
          </p>
        </div>

      </div>

      {/* Profile */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <UserCircle size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Profile
              </h2>

              <p className="text-xs text-slate-500">
                Your account information
              </p>
            </div>

          </div>
        </div>

        <div className="divide-y divide-slate-100">

          {/* Name */}
          <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">
              <UserCircle
                size={18}
                className="text-slate-400"
              />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Name
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {user.name}
                </p>
              </div>
            </div>

          </div>

          {/* Email */}
          <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">
              <Mail
                size={18}
                className="text-slate-400"
              />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Email
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {user.email}
                </p>
              </div>
            </div>

          </div>

          {/* Role */}
          <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">
              <ShieldCheck
                size={18}
                className="text-slate-400"
              />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Role
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {roleLabel}
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {user.role}
            </span>

          </div>

        </div>
      </section>

      {/* Security */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <LockKeyhole size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Security
              </h2>

              <p className="text-xs text-slate-500">
                Authentication and account security
              </p>
            </div>

          </div>
        </div>

        <div className="px-6 py-5">

          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">

            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-green-600"
            />

            <div>
              <p className="text-sm font-semibold text-green-800">
                Secure authentication enabled
              </p>

              <p className="mt-1 text-xs leading-5 text-green-700">
                Your account uses JWT authentication
                with protected access and refresh
                tokens.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* System information */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Info size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                About
              </h2>

              <p className="text-xs text-slate-500">
                Dashboard information
              </p>
            </div>

          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Application
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              Velozity Project Dashboard
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Access Level
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {roleLabel}
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};

export default SettingsPage;
