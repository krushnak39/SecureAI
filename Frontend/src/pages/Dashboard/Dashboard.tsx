import type { ReactNode } from "react";

import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  GitBranch,
  GitCommit,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";

const metrics = [
  {
    label: "Code Quality",
    value: 86,
    change: "+4.2%",
  },
  {
    label: "Security",
    value: 71,
    change: "-2.1%",
  },
  {
    label: "Performance",
    value: 89,
    change: "+7.8%",
  },
  {
    label: "Architecture",
    value: 78,
    change: "+3.4%",
  },
  {
    label: "Maintainability",
    value: 84,
    change: "+5.1%",
  },
];

function Dashboard() {
  return (
    <main className="px-6 py-8 lg:px-10">
      {/* Project Header */}
      <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
            <GitBranch size={14} />
            <span>PROJECT</span>
            <span>/</span>
            <span className="text-slate-300">SecureAI</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Engineering Intelligence
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            github.com/krushnak39/SecureAI
          </p>
        </div>

        <button className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-slate-200">
          <Sparkles size={16} />
          Run Analysis
        </button>
      </section>

      {/* Health Hero */}
      <section className="relative mb-5 overflow-hidden rounded-2xl border border-slate-800 bg-[#0a0f1a] p-7">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-slate-700/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              <Activity size={14} />
              Project Health
            </div>

            <div className="flex items-end gap-3">
              <span className="text-7xl font-semibold tracking-tighter">
                82
              </span>

              <span className="mb-3 text-sm text-slate-500">/ 100</span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Overall engineering health score
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 border-l border-slate-800 pl-8">
            <div>
              <p className="text-xs text-slate-600">Checks</p>
              <p className="mt-1 text-xl font-medium">164</p>
            </div>

            <div>
              <p className="text-xs text-slate-600">Passed</p>
              <p className="mt-1 text-xl font-medium">142</p>
            </div>

            <div>
              <p className="text-xs text-slate-600">Issues</p>
              <p className="mt-1 text-xl font-medium">22</p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-slate-800 bg-[#090e18] p-5 transition hover:border-slate-700"
          >
            <p className="text-xs text-slate-500">{metric.label}</p>

            <div className="mt-4 flex items-end justify-between">
              <span className="text-3xl font-semibold tracking-tight">
                {metric.value}
              </span>

              <span className="text-xs text-slate-500">
                {metric.change}
              </span>
            </div>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-slate-300"
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </section>

      {/* Lower Dashboard */}
      <section className="grid gap-5 lg:grid-cols-3">
        {/* Analysis */}
        <div className="rounded-2xl border border-slate-800 bg-[#090e18] p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-medium">Analysis Overview</h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest repository intelligence
              </p>
            </div>

            <button className="text-slate-500 transition hover:text-white">
              <ArrowUpRight size={18} />
            </button>
          </div>

          <div className="space-y-2">
            <AnalysisRow
              icon={<ShieldAlert size={17} />}
              title="Security Analysis"
              description="2 high-severity findings detected"
              status="Attention"
            />

            <AnalysisRow
              icon={<Zap size={17} />}
              title="Performance Analysis"
              description="No critical performance regressions"
              status="Healthy"
            />

            <AnalysisRow
              icon={<GitCommit size={17} />}
              title="Code Intelligence"
              description="18 maintainability recommendations"
              status="Review"
            />

            <AnalysisRow
              icon={<CheckCircle2 size={17} />}
              title="Dependency Analysis"
              description="142 checks passed successfully"
              status="Healthy"
            />
          </div>
        </div>

        {/* AI Insight */}
        <div className="rounded-2xl border border-slate-800 bg-[#090e18] p-6">
          <div className="mb-6 flex items-center gap-2">
            <Sparkles size={17} />
            <h2 className="font-medium">AI Insight</h2>
          </div>

          <p className="text-sm leading-6 text-slate-400">
            Your repository shows strong performance characteristics, but the
            security layer requires attention. SecureAI detected patterns that
            may increase risk around input validation and configuration
            management.
          </p>

          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800/50 hover:text-white">
            Explore Findings
            <ArrowUpRight size={15} />
          </button>
        </div>
      </section>
    </main>
  );
}

function AnalysisRow({
  icon,
  title,
  description,
  status,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-400">
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium">{title}</p>

          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      </div>

      <span className="hidden text-xs text-slate-500 sm:block">
        {status}
      </span>
    </div>
  );
}

export default Dashboard;