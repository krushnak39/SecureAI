import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  GitFork,
  Globe2,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

function Login() {
  const navigate = useNavigate();

  const {
    login,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setSubmitting(true);

      await login(email.trim(), password);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1fr_0.9fr]">
        {/* Left panel */}
        <div className="relative hidden overflow-hidden border-r border-slate-800/70 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(124,58,237,0.12),transparent_35%)]" />

          <div className="relative flex w-full flex-col justify-between p-10 xl:p-14">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center border border-violet-500/30 bg-violet-500/10">
                <ScanSearch
                  size={19}
                  className="text-violet-400"
                />
              </div>

              <div>
                <p className="text-sm font-semibold tracking-[0.18em]">
                  SECUREAI
                </p>

                <p className="text-[9px] tracking-[0.2em] text-slate-500">
                  ENGINEERING INTELLIGENCE
                </p>
              </div>
            </Link>

            <div className="max-w-xl">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-violet-400">
                YOUR CODEBASE, UNDERSTOOD
              </p>

              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
                Continue building with
                <span className="block text-slate-500">
                  engineering intelligence.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-500">
                Return to your SecureAI workspace and inspect code quality,
                security, architecture, performance, and CI/CD intelligence
                from one place.
              </p>

              <div className="mt-9 grid gap-3 sm:grid-cols-3">
                {[
                  ["82", "Health"],
                  ["22", "Findings"],
                  ["89", "Performance"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="border border-slate-800 bg-[#090e18] p-4"
                  >
                    <p className="text-2xl font-semibold">
                      {value}
                    </p>

                    <p className="mt-1 text-[10px] tracking-wider text-slate-600">
                      {label.toUpperCase()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-700">
              SecureAI · AI-powered software engineering platform
            </p>
          </div>
        </div>

        {/* Login panel */}
        <div className="flex min-h-screen items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="mb-10 inline-flex items-center gap-2 text-xs text-slate-600 transition hover:text-slate-300"
            >
              <ArrowLeft size={14} />
              Back to SecureAI
            </Link>

            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center border border-violet-500/30 bg-violet-500/10">
                  <ScanSearch
                    size={19}
                    className="text-violet-400"
                  />
                </div>

                <p className="text-sm font-semibold tracking-[0.18em]">
                  SECUREAI
                </p>
              </div>
            </div>

            <div>
              <div className="mb-6 flex h-11 w-11 items-center justify-center border border-slate-700 bg-[#090e18]">
                <LockKeyhole
                  size={19}
                  className="text-violet-400"
                />
              </div>

              <h2 className="text-3xl font-semibold tracking-tight">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to continue to your engineering workspace.
              </p>
            </div>

            <form
              className="mt-8 space-y-5"
              onSubmit={handleSubmit}
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-medium text-slate-400"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={submitting}
                  className="w-full border border-slate-700 bg-[#090e18] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-violet-500/60 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-medium text-slate-400"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-[11px] text-violet-400 transition hover:text-violet-300"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={submitting}
                    className="w-full border border-slate-700 bg-[#090e18] px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-violet-500/60 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current,
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs leading-5 text-red-400">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="group flex w-full items-center justify-center gap-2 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign in

                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* OAuth */}
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-800" />

              <span className="text-[10px] tracking-wider text-slate-700">
                OR CONTINUE WITH
              </span>

              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="flex items-center justify-center gap-2 border border-slate-700 bg-[#090e18] px-3 py-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                <GitFork size={17} />
                GitHub
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 border border-slate-700 bg-[#090e18] px-3 py-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                <Globe2 size={17} />
                Google
              </button>
            </div>

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-600">
              <ShieldCheck
                size={14}
                className="text-emerald-500"
              />
              Secure authentication
            </div>

            <p className="mt-7 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-violet-400 transition hover:text-violet-300"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;