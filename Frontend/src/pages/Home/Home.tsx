import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Code2,
  GitBranch,
  GitFork,
  LockKeyhole,
  Network,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const capabilities = [
  {
    icon: Code2,
    title: "AI Code Review",
    description:
      "Understand real code paths, identify engineering issues, and get actionable fixes with file and line-level context.",
    tag: "INTELLIGENCE",
  },
  {
    icon: ShieldCheck,
    title: "Security Analysis",
    description:
      "Detect secrets, injection risks, insecure configurations, dependency vulnerabilities, and authentication weaknesses.",
    tag: "SECURITY",
  },
  {
    icon: Network,
    title: "Architecture Intelligence",
    description:
      "Map services, dependencies, data flow, and project boundaries to understand how your system actually fits together.",
    tag: "ARCHITECTURE",
  },
  {
    icon: Zap,
    title: "Performance Analysis",
    description:
      "Surface slow queries, expensive operations, bundle problems, and performance hotspots before they become production issues.",
    tag: "PERFORMANCE",
  },
  {
    icon: Bot,
    title: "Codebase Chat",
    description:
      "Ask questions about your repository and get answers grounded in your actual code using retrieval-augmented generation.",
    tag: "RAG",
  },
  {
    icon: GitBranch,
    title: "CI/CD Intelligence",
    description:
      "Analyze pull requests and GitHub Actions with automated code, security, and engineering feedback.",
    tag: "DEVOPS",
  },
];

const findings = [
  {
    severity: "HIGH",
    file: "src/services/repository.ts",
    line: "84",
    title: "Repeated database queries inside request loop",
  },
  {
    severity: "CRITICAL",
    file: "src/config/auth.ts",
    line: "21",
    title: "Hardcoded credential detected",
  },
  {
    severity: "MEDIUM",
    file: "src/components/Graph.tsx",
    line: "67",
    title: "Architecture graph recalculated on every render",
  },
];

function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#050810] text-white">
      {/* Navigation */}
      <header className="border-b border-slate-800/70 bg-[#050810]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-violet-500/30 bg-violet-500/10">
              <ScanSearch size={19} className="text-violet-400" />
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

          <nav className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
            <a href="#capabilities" className="transition hover:text-white">
              Capabilities
            </a>
            <a href="#analysis" className="transition hover:text-white">
              Analysis
            </a>
            <a href="#workflow" className="transition hover:text-white">
              Workflow
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden text-sm text-slate-400 transition hover:text-white sm:block"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="flex items-center gap-2 border border-violet-500/40 bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400"
            >
              Get started
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="relative border-b border-slate-800/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(124,58,237,0.14),transparent_35%)]" />

          <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 lg:pb-28 lg:pt-28">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="mb-7 inline-flex items-center gap-2 border border-violet-500/20 bg-violet-500/5 px-3 py-1.5 text-[11px] font-medium tracking-[0.15em] text-violet-300">
                  <span className="h-1.5 w-1.5 bg-emerald-400" />
                  AI-POWERED SOFTWARE ENGINEERING
                </div>

                <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                  Understand your
                  <span className="block text-slate-500">
                    codebase.
                  </span>
                  Secure your
                  <span className="block bg-gradient-to-r from-violet-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
                    software.
                  </span>
                </h1>

                <p className="mt-7 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
                  SecureAI combines AI code review, security scanning,
                  architecture intelligence, performance analysis, RAG-powered
                  codebase chat, and CI/CD analysis in one engineering
                  workspace.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/register"
                    className="group flex items-center justify-center gap-2 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                  >
                    Connect your repository
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>

                  <a
                    href="#analysis"
                    className="flex items-center justify-center gap-2 border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
                  >
                    Explore the platform
                    <ChevronRight size={16} />
                  </a>
                </div>

                <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs text-slate-500">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    Repository-aware analysis
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    Security-first
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    Built for developers
                  </span>
                </div>
              </div>

              {/* Dashboard Preview */}
              <div className="relative">
                <div className="absolute -inset-8 bg-violet-500/10 blur-3xl" />

                <div className="relative border border-slate-700 bg-[#090e18] shadow-2xl shadow-black/40">
                  <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Terminal size={15} className="text-violet-400" />
                      <span className="text-xs font-medium">
                        SecureAI / SecureAI
                      </span>
                      <span className="text-[10px] text-slate-600">
                        feature
                      </span>
                    </div>

                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      ANALYSIS LIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-[150px_1fr]">
                    <div className="border-r border-slate-800 p-4">
                      <p className="mb-4 text-[9px] font-semibold tracking-[0.18em] text-slate-600">
                        REPOSITORY
                      </p>

                      {[
                        "Overview",
                        "Code Review",
                        "Security",
                        "Dependencies",
                        "Architecture",
                        "Performance",
                      ].map((item, index) => (
                        <div
                          key={item}
                          className={`mb-1 px-2.5 py-2 text-[10px] ${
                            index === 0
                              ? "bg-violet-500/10 text-violet-300"
                              : "text-slate-500"
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>

                    <div className="p-5">
                      <div className="mb-5 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] tracking-[0.16em] text-slate-500">
                            PROJECT HEALTH
                          </p>
                          <p className="mt-1 text-4xl font-semibold">
                            82
                            <span className="ml-1 text-sm text-slate-600">
                              /100
                            </span>
                          </p>
                        </div>

                        <div className="border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-[9px] text-emerald-400">
                          HEALTHY
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ["QUALITY", "86"],
                          ["SECURITY", "71"],
                          ["PERFORMANCE", "89"],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="border border-slate-800 bg-[#0d1422] p-3"
                          >
                            <p className="text-[8px] tracking-wider text-slate-600">
                              {label}
                            </p>
                            <p className="mt-2 text-lg font-medium">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 border border-slate-800 bg-[#0d1422]">
                        <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2.5">
                          <span className="text-[9px] font-medium tracking-wider text-slate-400">
                            ACTIVE FINDINGS
                          </span>
                          <span className="text-[9px] text-violet-400">
                            22 detected
                          </span>
                        </div>

                        {findings.slice(0, 2).map((finding) => (
                          <div
                            key={finding.file}
                            className="flex items-center gap-3 border-b border-slate-800/70 px-3 py-3 last:border-0"
                          >
                            <span
                              className={`h-1.5 w-1.5 ${
                                finding.severity === "CRITICAL"
                                  ? "bg-red-400"
                                  : "bg-orange-400"
                              }`}
                            />

                            <div className="min-w-0">
                              <p className="truncate text-[9px] text-slate-300">
                                {finding.title}
                              </p>
                              <p className="mt-1 text-[8px] text-slate-600">
                                {finding.file}:{finding.line}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-5 -left-5 hidden border border-cyan-500/20 bg-[#090e18] px-4 py-3 shadow-xl sm:block">
                  <div className="flex items-center gap-3">
                    <Sparkles size={15} className="text-cyan-300" />
                    <div>
                      <p className="text-[9px] text-slate-500">
                        AI ANALYSIS
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-white">
                        14 recommendations generated
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section id="capabilities" className="border-b border-slate-800/70">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-violet-400">
                ONE ENGINEERING WORKSPACE
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                From source code to
                <span className="text-slate-500"> system intelligence.</span>
              </h2>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                SecureAI connects multiple analysis layers so developers can
                understand quality, security, architecture, performance, and
                delivery from one place.
              </p>
            </div>

            <div className="mt-12 grid gap-px overflow-hidden border border-slate-800 bg-slate-800 md:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((capability) => {
                const Icon = capability.icon;

                return (
                  <div
                    key={capability.title}
                    className="group bg-[#090e18] p-7 transition hover:bg-[#0d1422]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center border border-slate-700 bg-slate-900">
                        <Icon size={18} className="text-violet-400" />
                      </div>

                      <span className="text-[8px] tracking-[0.18em] text-slate-600">
                        {capability.tag}
                      </span>
                    </div>

                    <h3 className="mt-7 text-base font-semibold">
                      {capability.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {capability.description}
                    </p>

                    <div className="mt-6 flex items-center gap-1 text-[10px] text-slate-600 transition group-hover:text-violet-400">
                      Explore module
                      <ArrowRight size={11} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Analysis */}
        <section id="analysis" className="border-b border-slate-800/70">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
            <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.2em] text-cyan-400">
                  EVIDENCE OVER GUESSWORK
                </p>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Every finding should lead
                  <span className="block text-slate-500">
                    back to the code.
                  </span>
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500">
                  SecureAI is designed around repository context. Findings
                  include files, lines, evidence, impact, and remediation so
                  developers can move from detection to understanding to fix.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    "Repository parsing and code understanding",
                    "AST and dependency analysis",
                    "Security and secret detection",
                    "AI reasoning with repository context",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm text-slate-300"
                    >
                      <CheckCircle2
                        size={16}
                        className="shrink-0 text-cyan-400"
                      />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-slate-800 bg-[#090e18]">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <LockKeyhole size={15} className="text-red-400" />
                    <span className="text-xs font-medium">
                      Security finding
                    </span>
                  </div>

                  <span className="border border-red-500/20 bg-red-500/10 px-2 py-1 text-[9px] text-red-400">
                    CRITICAL
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-sm font-medium">
                    Hardcoded credential detected
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    A credential appears directly in the authentication
                    configuration instead of being loaded from a secure
                    environment or secret store.
                  </p>

                  <div className="mt-5 border border-slate-800 bg-[#050810]">
                    <div className="border-b border-slate-800 px-3 py-2 text-[9px] text-slate-600">
                      src/config/auth.ts : 21
                    </div>

                    <pre className="overflow-x-auto p-4 text-[11px] leading-6 text-slate-400">
{`const authConfig = {
  provider: "github",
  clientSecret: "sk_live_••••••••"
};`}
                    </pre>
                  </div>

                  <div className="mt-4 border-l-2 border-violet-500/60 bg-violet-500/5 px-4 py-3">
                    <p className="text-[9px] font-semibold tracking-wider text-violet-300">
                      AI RECOMMENDATION
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-400">
                      Move the credential to environment configuration and
                      rotate the exposed secret before deploying.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="border-b border-slate-800/70">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
            <div className="text-center">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-violet-400">
                ANALYSIS PIPELINE
              </p>

              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                One repository.
                <span className="text-slate-500">
                  {" "}
                  Multiple intelligence layers.
                </span>
              </h2>
            </div>

            <div className="mt-14 grid border border-slate-800 md:grid-cols-5">
              {[
                ["01", "Repository", "GitHub API"],
                ["02", "Understand", "AST + Parser"],
                ["03", "Analyze", "Security + AI"],
                ["04", "Reason", "RAG + LLM"],
                ["05", "Act", "Dashboard + CI/CD"],
              ].map(([number, title, description], index) => (
                <div
                  key={number}
                  className={`relative bg-[#090e18] p-6 ${
                    index < 4 ? "border-b md:border-b-0 md:border-r" : ""
                  } border-slate-800`}
                >
                  <span className="text-[10px] font-semibold tracking-wider text-violet-400">
                    {number}
                  </span>

                  <h3 className="mt-8 text-sm font-semibold">{title}</h3>

                  <p className="mt-2 text-xs text-slate-600">
                    {description}
                  </p>

                  {index < 4 && (
                    <ChevronRight
                      size={14}
                      className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 bg-[#090e18] text-slate-600 md:block"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GitHub CTA */}
        <section>
          <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
            <div className="relative overflow-hidden border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-[#090e18] to-cyan-500/5 p-8 sm:p-12 lg:p-16">
              <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

              <div className="relative max-w-3xl">
                <div className="flex h-11 w-11 items-center justify-center border border-slate-700 bg-[#050810]">
                  <GitFork size={20} />
                </div>

                <h2 className="mt-7 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Bring your repository into the
                  <span className="text-violet-300">
                    {" "}
                    engineering workspace.
                  </span>
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
                  Connect a GitHub repository and let SecureAI build an
                  evidence-driven view of its code quality, security,
                  architecture, performance, and delivery pipeline.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/register"
                    className="flex items-center justify-center gap-2 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                  >
                    Start with SecureAI
                    <ArrowRight size={16} />
                  </Link>

                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-7 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ScanSearch size={13} />
            <span>SECUREAI</span>
            <span>·</span>
            <span>AI Engineering Intelligence</span>
          </div>

          <div className="flex items-center gap-5">
            <Link to="/login" className="hover:text-slate-300">
              Sign in
            </Link>
            <Link to="/register" className="hover:text-slate-300">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;