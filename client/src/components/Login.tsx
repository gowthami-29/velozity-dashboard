
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  AlertCircle,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { login } from "../services/api";

interface LoginProps {
  onLogin: (user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
  }) => void;
  onRegister: () => void;
}

const Login = ({
  onLogin,
  onRegister,
}: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login(
        email,
        password
      );

      if (data.user) {
        onLogin(data.user);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed"
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
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-900">
              <ShieldCheck size={24} />
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

          {/* Hero text */}
          <div className="mt-24 max-w-lg">
            <h2 className="text-4xl font-bold leading-tight">
              Welcome back.
              <br />
              Let's get things done.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-400">
              Manage projects, track tasks,
              collaborate with your team and
              stay updated in real time.
            </p>
          </div>
        </div>

        <div className="text-sm text-slate-500">
          Secure project management
          workspace
        </div>
      </div>

      {/* Login area */}
      <div className="flex w-full items-center justify-center px-5 py-10 lg:w-1/2">

        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <ShieldCheck size={21} />
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

          {/* Login card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            {/* Heading */}
            <div className="mb-7">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <LockKeyhole size={22} />
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                Sign in
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Sign in to continue to your
                dashboard.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="login-email"
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
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Sign in */}
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

                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* Register */}
            <div className="mt-6 border-t border-slate-100 pt-5 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account?
              </p>

              <button
                type="button"
                onClick={onRegister}
                className="mt-2 text-sm font-semibold text-slate-900 hover:underline"
              >
                Create Account
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

export default Login;

