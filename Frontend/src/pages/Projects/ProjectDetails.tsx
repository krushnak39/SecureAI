import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  FileCode2,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  Layers3,
  MessageSquare,
  Network,
  Play,
  RefreshCw,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const modules = [
  {
    title: "Code Review",
    description: "AI findings across code quality and maintainability.",
    icon: Code2,
    path: "/dashboard/review",
    metric: "14 findings",
  },
  {
    title: "Security",
    description: "Security issues, exposure risks, and remediation.",
    icon: ShieldCheck,
    path: "/dashboard/security",
    metric: "8 findings",
  },
  {
    title: "Dependencies",
    description: "Package health, advisories, and upgrade intelligence.",
    icon: Boxes,
    path: "/dashboard/dependencies",
    metric: "3 outdated",
  },
  {
    title: "Architecture",
    description: "System boundaries, relationships, and coupling signals.",
    icon: Network,
    path: "/dashboard/architecture",
    metric: "78 health",
  },
  {
    title: "Performance",
    description: "Hotspots affecting API, database, and frontend speed.",
    icon: Zap,
    path: "/dashboard/performance",
    metric: "6 hotspots",
  },
  {
    title: "Codebase Chat",
    description: "Ask questions against repository-aware AI context.",
    icon: MessageSquare,
    path: "/dashboard/chat",
    metric: "RAG ready",
  },
  {
    title: "Documentation",
    description: "Generate and inspect repository documentation.",
    icon: FileCode2,
    path: "/dashboard/documentation",
    metric: "4 sections",
  },
  {
    title: "CI/CD",
    description: "Pull request checks and automated analysis results.",
    icon: GitCommitHorizontal,
    path: "/dashboard/cicd",
    metric: "12 checks",
  },
];

const recentActivity = [
  {
    type: "Security scan",
    description: "Detected 2 new medium-severity findings",
    time: "8 min ago",
    icon: ShieldAlert,
  },
  {
    type: "Code review",
    description: "AI review completed across 127 files",
    time: "19 min ago",
    icon: Bot,
  },
  {
    type: "Dependency analysis",
    description: "3 packages require upgrade review",
    time: "27 min ago",
    icon: Boxes,
  },
  {
    type: "Architecture analysis",
    description: "13 repository relationships analyzed",
    time: "42 min ago",
    icon: Network,
  },
];

function ProjectDetails() {
  const { id } = useParams();

  const repositoryName =
    id === "careerpilot"
      ? "CareerPilot AI"
      : id === "api-service"
        ? "Developer API"
        : "SecureAI";

  const repositoryPath =
    id === "careerpilot"
      ? "krushnak39/CareerPilot-AI"
      : id === "api-service"
        ? "krushnak39/developer-api"
        : "krushnak39/SecureAI";

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Repository Header */}
      <div className="border-b border-slate-800/70 pb-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.18em] text-slate-600">
              <GitFork size={13} />
              PROJECT / REPOSITORY
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                {repositoryName}
              </h1>

              <span className="border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[9px] font-medium tracking-wider text-emerald-400">
                ANALYSIS READY
              </span>
            </div>

            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <GitFork size={14} />
              {repositoryPath}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <GitBranch size={13} />
                feature
              </span>

              <span className="flex items-center gap-1.5">
                <Clock3 size={13} />
                Last analyzed 42 seconds ago
              </span>

              <span className="flex items-center gap-1.5">
                <Activity size={13} />
                Engine online
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="flex items-center gap-2 border border-slate-700 bg-[#090e18] px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <RefreshCw size={15} />
              Re-analyze
            </button>

            <button
              type="button"
              className="flex items-center gap-2 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              <Play size={15} />
              Run analysis
            </button>
          </div>
        </div>
      </div>

      {/* Health Overview */}
      <section className="mt-6 border border-slate-800 bg-[#090e18]">
        <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Repository health</p>
            <p className="mt-1 text-xs text-slate-600">
              Consolidated engineering signals from the latest analysis.
            </p>
          </div>

          <span className="text-[10px] tracking-wider text-slate-600">
            ANALYSIS #042
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: "PROJECT HEALTH",
              value: "82",
              note: "Overall",
            },
            {
              label: "CODE QUALITY",
              value: "86",
              note: "Good",
            },
            {
              label: "SECURITY",
              value: "71",
              note: "Attention",
            },
            {
              label: "PERFORMANCE",
              value: "89",
              note: "Strong",
            },
            {
              label: "ARCHITECTURE",
              value: "78",
              note: "Review",
            },
          ].map((item, index) => (
            <div
              key={item.label}
              className={`border-b border-slate-800 p-5 ${
                index < 4 ? "lg:border-r" : ""
              }`}
            >
              <p className="text-[9px] tracking-[0.14em] text-slate-600">
                {item.label}
              </p>

              <div className="mt-3 flex items-end justify-between">
                <span className="text-3xl font-semibold">{item.value}</span>

                <span className="text-[10px] text-slate-600">
                  {item.note}
                </span>
              </div>

              <div className="mt-4 h-1 bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Grid */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        {/* Intelligence Modules */}
        <section className="border border-slate-800 bg-[#090e18]">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <p className="text-sm font-medium">Engineering intelligence</p>
              <p className="mt-1 text-xs text-slate-600">
                Open a module to inspect repository-level analysis.
              </p>
            </div>

            <Layers3 size={16} className="text-slate-600" />
          </div>

          <div className="grid sm:grid-cols-2">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <Link
                  key={module.title}
                  to={module.path}
                  className="group border-b border-slate-800 p-5 transition hover:bg-[#0d1422] sm:even:border-l"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-9 w-9 items-center justify-center border border-slate-800 bg-[#050810]">
                      <Icon
                        size={16}
                        className="text-violet-400"
                      />
                    </div>

                    <ArrowRight
                      size={14}
                      className="text-slate-700 transition group-hover:translate-x-1 group-hover:text-slate-400"
                    />
                  </div>

                  <h3 className="mt-4 text-sm font-medium">
                    {module.title}
                  </h3>

                  <p className="mt-1.5 text-xs leading-5 text-slate-600">
                    {module.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] tracking-wider text-slate-500">
                      {module.metric}
                    </span>

                    <ChevronRight
                      size={13}
                      className="text-slate-700"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Findings */}
        <section className="border border-slate-800 bg-[#090e18]">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <p className="text-sm font-medium">Open findings</p>
              <p className="mt-1 text-xs text-slate-600">
                Current issues requiring developer attention.
              </p>
            </div>

            <ScanSearch size={16} className="text-slate-600" />
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-[9px] tracking-wider text-red-400">
                  CRITICAL
                </p>
                <p className="mt-2 text-2xl font-semibold text-red-300">
                  2
                </p>
              </div>

              <div className="border border-orange-500/20 bg-orange-500/5 p-4">
                <p className="text-[9px] tracking-wider text-orange-400">
                  HIGH
                </p>
                <p className="mt-2 text-2xl font-semibold text-orange-300">
                  6
                </p>
              </div>

              <div className="border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-[9px] tracking-wider text-amber-400">
                  MEDIUM
                </p>
                <p className="mt-2 text-2xl font-semibold text-amber-300">
                  9
                </p>
              </div>

              <div className="border border-blue-500/20 bg-blue-500/5 p-4">
                <p className="text-[9px] tracking-wider text-blue-400">
                  LOW
                </p>
                <p className="mt-2 text-2xl font-semibold text-blue-300">
                  5
                </p>
              </div>
            </div>

            <Link
              to="/dashboard/security"
              className="mt-5 flex items-center justify-between border border-slate-800 px-4 py-3 text-xs text-slate-400 transition hover:border-slate-600 hover:text-white"
            >
              View all security findings
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>

      {/* Repository Context */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="border border-slate-800 bg-[#090e18]">
          <div className="border-b border-slate-800 px-5 py-4">
            <p className="text-sm font-medium">Repository context</p>
          </div>

          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Files analyzed</span>
              <span>127</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Lines of code</span>
              <span>18,492</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Languages</span>
              <span>6</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Dependencies</span>
              <span>42</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Recent commits</span>
              <span>18</span>
            </div>
          </div>
        </section>

        <section className="border border-slate-800 bg-[#090e18]">
          <div className="border-b border-slate-800 px-5 py-4">
            <p className="text-sm font-medium">Technology stack</p>
          </div>

          <div className="flex flex-wrap gap-2 p-5">
            {[
              "React",
              "TypeScript",
              "Tailwind",
              "Node.js",
              "Express",
              "Python",
              "FastAPI",
              "PostgreSQL",
              "pgvector",
              "Prisma",
              "GitHub API",
              "Docker",
            ].map((technology) => (
              <span
                key={technology}
                className="border border-slate-800 bg-[#050810] px-3 py-2 text-[10px] text-slate-500"
              >
                {technology}
              </span>
            ))}
          </div>
        </section>

        <section className="border border-slate-800 bg-[#090e18]">
          <div className="border-b border-slate-800 px-5 py-4">
            <p className="text-sm font-medium">Repository signals</p>
          </div>

          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2
                size={15}
                className="text-emerald-400"
              />
              <span className="text-xs text-slate-400">
                Repository connected
              </span>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle2
                size={15}
                className="text-emerald-400"
              />
              <span className="text-xs text-slate-400">
                Analysis engine available
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Activity
                size={15}
                className="text-cyan-400"
              />
              <span className="text-xs text-slate-400">
                RAG context indexed
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ShieldAlert
                size={15}
                className="text-amber-400"
              />
              <span className="text-xs text-slate-400">
                Findings require review
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Activity + Actions */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="border border-slate-800 bg-[#090e18]">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <p className="text-sm font-medium">Recent analysis activity</p>
              <p className="mt-1 text-xs text-slate-600">
                Latest repository intelligence events.
              </p>
            </div>

            <BarChart3 size={16} className="text-slate-600" />
          </div>

          <div>
            {recentActivity.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.type}
                  className="flex items-start gap-3 border-b border-slate-800 p-5 last:border-b-0"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-slate-800 bg-[#050810]">
                    <Icon size={14} className="text-slate-500" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{item.type}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {item.description}
                    </p>
                  </div>

                  <span className="shrink-0 text-[10px] text-slate-700">
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border border-slate-800 bg-[#090e18]">
          <div className="border-b border-slate-800 px-5 py-4">
            <p className="text-sm font-medium">Quick actions</p>
            <p className="mt-1 text-xs text-slate-600">
              Jump directly into common engineering tasks.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-1">
            <Link
              to="/dashboard/review"
              className="flex items-center justify-between border-b border-slate-800 p-4 text-xs text-slate-400 transition hover:bg-[#0d1422] hover:text-white"
            >
              <span className="flex items-center gap-2">
                <Code2 size={14} />
                Review code
              </span>
              <ArrowRight size={13} />
            </Link>

            <Link
              to="/dashboard/security"
              className="flex items-center justify-between border-b border-slate-800 p-4 text-xs text-slate-400 transition hover:bg-[#0d1422] hover:text-white"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck size={14} />
                Inspect security
              </span>
              <ArrowRight size={13} />
            </Link>

            <Link
              to="/dashboard/chat"
              className="flex items-center justify-between border-b border-slate-800 p-4 text-xs text-slate-400 transition hover:bg-[#0d1422] hover:text-white"
            >
              <span className="flex items-center gap-2">
                <MessageSquare size={14} />
                Ask the codebase
              </span>
              <ArrowRight size={13} />
            </Link>

            <Link
              to="/dashboard/cicd"
              className="flex items-center justify-between p-4 text-xs text-slate-400 transition hover:bg-[#0d1422] hover:text-white"
            >
              <span className="flex items-center gap-2">
                <Terminal size={14} />
                Inspect CI/CD
              </span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </section>
      </div>

      {/* Bottom Status */}
      <div className="mt-5 flex flex-col gap-2 border border-slate-800 bg-[#090e18] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Activity size={14} className="text-emerald-400" />
          SecureAI analysis engine operational
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-700">
          <GitCommitHorizontal size={12} />
          Latest analyzed commit: 7e31ac4
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;