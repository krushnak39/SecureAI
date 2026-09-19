import {
  ArrowLeft,
  ArrowRight,
  Check,
  GitFork,
  Globe2,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

function Register() {
  const navigate = useNavigate();

  const {
    register,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const passwordStrength = useMemo(() => {
    if (!password) {
      return {
        width: "0%",
        label: "Use at least 8 characters",
      };
    }

    if (password.length < 8) {
      return {
        width: "33%",
        label: "Too short",
      };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    const score = [
      password.length >= 8,
      hasUppercase,
      hasNumber,
      hasSpecial,
    ].filter(Boolean).length;

    if (score <= 1) {
      return {
        width: "33%",
        label: "Weak password",
      };
    }

    if (score <= 2) {
      return {
        width: "66%",
        label: "Moderate password",
      };
    }

    return {
      width: "100%",
      label: "Strong password",
    };
  }, [password]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError(
        "Please accept the Terms of Service and Privacy Policy.",
      );
      return;
    }

    try {
      setSubmitting(true);

      await register(
        name.trim(),
        email.trim(),
        password,
      );

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1fr]">
        {/* Register form */}
        <div className="flex min-h-screen items-center justify-center px-6 py-10 lg:order-1">
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

              <h1 className="text-3xl font-semibold tracking-tight">
                Create your workspace
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Start analyzing your repositories with SecureAI.
              </p>
            </div>

            <form
              className="mt-8 space-y-5"
              onSubmit={handleSubmit}
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-xs font-medium text-slate-400"
                >
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Your name"
                  autoComplete="name"
                  disabled={submitting}
                  className="w-full border border-slate-700 bg-[#090e18] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-violet-500/60 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="mb-2 block text-xs font-medium text-slate-400"
                >
                  Email address
                </label>

                <input
                  id="register-email"
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

              <div>
                <label
                  htmlFor="register-password"
                  className="mb-2 block text-xs font-medium text-slate-400"
                >
                  Password
                </label>

                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  disabled={submitting}
                  className="w-full border border-slate-700 bg-[#090e18] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-violet-500/60 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-600">
                  <span className="h-1 flex-1 bg-slate-800">
                    <span
                      className="block h-full bg-violet-500/60 transition-all duration-300"
                      style={{
                        width: passwordStrength.width,
                      }}
                    />
                  </span>

                  {passwordStrength.label}
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-xs font-medium text-slate-400"
                >
                  Confirm password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={submitting}
                  className="w-full border border-slate-700 bg-[#090e18] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-violet-500/60 disabled:cursor-not-allowed disabled:opacity-60"
                />

                {confirmPassword &&
                  password !== confirmPassword && (
                    <p className="mt-2 text-[10px] text-red-400">
                      Passwords do not match.
                    </p>
                  )}
              </div>

              <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-500">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={acceptedTerms}
                  onClick={() =>
                    setAcceptedTerms((current) => !current)
                  }
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border transition ${
                    acceptedTerms
                      ? "border-violet-500/50 bg-violet-500/10"
                      : "border-slate-700 bg-[#090e18]"
                  }`}
                >
                  <Check
                    size={11}
                    className={
                      acceptedTerms
                        ? "text-violet-400"
                        : "text-transparent"
                    }
                  />
                </button>

                <span>
                  I agree to the{" "}
                  <button
                    type="button"
                    className="text-violet-400 hover:text-violet-300"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="text-violet-400 hover:text-violet-300"
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>

              {error && (
                <div className="border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs leading-5 text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group flex w-full items-center justify-center gap-2 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  "Creating workspace..."
                ) : (
                  <>
                    Create workspace

                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-800" />

              <span className="text-[10px] tracking-wider text-slate-700">
                OR SIGN UP WITH
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
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-violet-400 transition hover:text-violet-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Information panel */}
        <div className="relative hidden overflow-hidden border-r border-slate-800/70 bg-[#070b13] lg:order-2 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(34,211,238,0.08),transparent_35%)]" />

          <div className="relative flex w-full flex-col justify-between p-10 xl:p-14">
            <div className="flex justify-end">
              <Link
                to="/login"
                className="text-xs text-slate-600 transition hover:text-slate-300"
              >
                Already registered?
                <span className="ml-2 text-violet-400">
                  Sign in →
                </span>
              </Link>
            </div>

            <div className="max-w-xl">
              <div className="mb-7 flex items-center gap-2 text-[10px] tracking-[0.2em] text-cyan-400">
                <span className="h-px w-8 bg-cyan-400" />
                BUILT FOR SOFTWARE ENGINEERS
              </div>

              <h2 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
                Turn your repository into
                <span className="block text-slate-500">
                  actionable intelligence.
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-sm leading-7 text-slate-500">
                SecureAI analyzes the systems you build — from individual
                functions and dependencies to architecture, security,
                performance, and delivery pipelines.
              </p>

              <div className="mt-10 space-y-3">
                {[
                  [
                    "Code-level intelligence",
                    "Find issues with file and line-level context.",
                  ],
                  [
                    "Security visibility",
                    "Detect risks before they reach production.",
                  ],
                  [
                    "System understanding",
                    "Map architecture and repository relationships.",
                  ],
                  [
                    "AI-powered assistance",
                    "Ask questions grounded in your codebase.",
                  ],
                ].map(([title, description]) => (
                  <div
                    key={title}
                    className="flex gap-4 border border-slate-800 bg-[#090e18] p-4"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-violet-500/20 bg-violet-500/5">
                      <Check
                        size={13}
                        className="text-violet-400"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-300">
                        {title}
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-slate-600">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-700">
              <span>SECUREAI</span>
              <span>AI ENGINEERING INTELLIGENCE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;