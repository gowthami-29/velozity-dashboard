import {
  FormEvent,
  useState,
} from "react";

import {
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

const API_URL =
  "http://localhost:5000/api";

interface RegisterProps {
  onRegistered: () => void;
  onBackToLogin: () => void;
}

const Register = ({
  onRegistered,
  onBackToLogin,
}: RegisterProps) => {
  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [role, setRole] = useState<
    "PROJECT_MANAGER" | "DEVELOPER"
  >("DEVELOPER");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name,
            email,
            password,
            role,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.message ||
            "Registration failed"
        );
      }

      setSuccess(
        "Registration successful. Please login."
      );

      setName("");
      setEmail("");
      setPassword("");

      setTimeout(() => {
        onRegistered();
      }, 1000);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Left branding panel */}
      <div className="hidden w-1/2 bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">

        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-900">
              <ShieldCheck
                size={24}
              />
            </div>

            <div>
              <h1 className="text-xl font-bold">
                Velozity
              </h1>

              <p className="text-xs text-slate-400">
                Project Dashboard
              </p>
            </div>
          </div>

          <div className="mt-24 max-w-lg">
            <h2 className="text-4xl font-bold leading-tight">
              Build. Manage.
              <br />
              Deliver.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-400">
              Collaborate with your team,
              manage projects and track
              development in real time.
            </p>
          </div>
        </div>

        <div className="text-sm text-slate-500">
          Secure project management
          workspace
        </div>
      </div>

      {/* Right registration area */}
      <div className="flex w-full items-center justify-center px-5 py-10 lg:w-1/2">

        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <ShieldCheck
                size={21}
              />
            </div>

            <div>
              <h1 className="font-bold text-slate-900">
                Velozity
              </h1>

              <p className="text-xs text-slate-500">
                Project Dashboard
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            {/* Heading */}
            <div className="mb-7">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <UserPlus size={22} />
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                Create Account
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Join your Velozity workspace.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {error}
                </span>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {success}
                </span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Name */}
              <div>
                <label
                  htmlFor="register-name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Full Name
                </label>

                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Enter your name"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="register-email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="register-password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Create a password"
                  minLength={6}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Minimum 6 characters
                </p>
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="register-role"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Account Role
                </label>

                <select
                  id="register-role"
                  value={role}
                  onChange={(event) =>
                    setRole(
                      event.target
                        .value as
                        | "PROJECT_MANAGER"
                        | "DEVELOPER"
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="DEVELOPER">
                    Developer
                  </option>

                  <option value="PROJECT_MANAGER">
                    Project Manager
                  </option>
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus
                      size={17}
                    />

                    Create Account
                  </>
                )}
              </button>
            </form>

            {/* Back to login */}
            <div className="mt-6 border-t border-slate-100 pt-5 text-center">
              <button
                type="button"
                onClick={onBackToLogin}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                <ArrowLeft
                  size={16}
                />

                Back to Login
              </button>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            © Velozity Dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;