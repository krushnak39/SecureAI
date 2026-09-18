import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  GitCommit,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";

import MetricCard from "../../components/common/MetricCard";
import RepositoryHeader from "../../components/common/RepositoryHeader";
import SectionCard from "../../components/common/SectionCard";
import StatusBadge from "../../components/common/StatusBadge";

function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Repository Header */}
      <RepositoryHeader
        repositoryName="SecureAI"
        repositoryPath="krushnak39/SecureAI"
        branch="feature"
        lastAnalyzed="4 minutes ago"
      />

      {/* Engineering Intelligence */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-400">
              Engineering Intelligence
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Project Health
            </h2>

            <p className="mt-1 text-sm text-secure-muted">
              A high-level view of your repository's engineering health.
            </p>
          </div>

          <div className="hidden items-center gap-2 text-xs text-secure-muted sm:flex">
            <Activity size={14} />
            Live repository intelligence
          </div>
        </div>

        {/* Health Overview */}
        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr_1fr_1fr]">
          {/* Overall Health */}
          <div className="rounded-2xl border border-secure-border bg-secure-panel p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-secure-muted">
                  Overall Health
                </p>

                <div className="mt-3 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-tight text-white">
                    82
                  </span>

                  <span className="mb-1 text-sm text-secure-muted">
                    / 100
                  </span>
                </div>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-400">
                <Sparkles size={20} />
              </div>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                style={{ width: "82%" }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-secure-muted">
                Engineering health score
              </span>

              <span className="text-emerald-400">
                +5.6% this analysis
              </span>
            </div>
          </div>

          {/* Checks */}
          <div className="rounded-2xl border border-secure-border bg-secure-panel p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-secure-muted">
                Checks
              </p>

              <CheckCircle2
                size={18}
                className="text-emerald-400"
              />
            </div>

            <p className="mt-5 text-3xl font-semibold text-white">
              164
            </p>

            <p className="mt-2 text-xs text-secure-muted">
              Total checks performed
            </p>

            <div className="mt-5 flex items-center gap-2">
              <span className="text-sm font-medium text-emerald-400">
                142 passed
              </span>

              <span className="text-xs text-slate-600">
                •
              </span>

              <span className="text-sm text-orange-400">
                22 issues
              </span>
            </div>
          </div>

          {/* Findings */}
          <div className="rounded-2xl border border-secure-border bg-secure-panel p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-secure-muted">
                Findings
              </p>

              <ShieldAlert
                size={18}
                className="text-orange-400"
              />
            </div>

            <p className="mt-5 text-3xl font-semibold text-white">
              22
            </p>

            <p className="mt-2 text-xs text-secure-muted">
              Issues requiring review
            </p>

            <div className="mt-5 flex gap-3 text-xs">
              <span className="text-red-400">
                2 high
              </span>

              <span className="text-amber-400">
                8 medium
              </span>

              <span className="text-slate-400">
                12 low
              </span>
            </div>
          </div>

          {/* Analysis Time */}
          <div className="rounded-2xl border border-secure-border bg-secure-panel p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-secure-muted">
                Analysis Time
              </p>

              <Zap
                size={18}
                className="text-cyan-400"
              />
            </div>

            <p className="mt-5 text-3xl font-semibold text-white">
              42s
            </p>

            <p className="mt-2 text-xs text-secure-muted">
              Repository analysis duration
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs text-emerald-400">
              <ArrowUpRight size={13} />
              18% faster than previous run
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Metrics */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-medium text-white">
            Engineering Metrics
          </h2>

          <p className="mt-1 text-xs text-secure-muted">
            SecureAI's analysis across the major engineering dimensions.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Code Quality"
            value={86}
            change="+4.2%"
          />

          <MetricCard
            label="Security"
            value={71}
            change="-2.1%"
          />

          <MetricCard
            label="Performance"
            value={89}
            change="+7.8%"
          />

          <MetricCard
            label="Architecture"
            value={78}
            change="+3.4%"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Maintainability"
            value={84}
            change="+5.1%"
          />

          <MetricCard
            label="Dependencies"
            value={91}
            change="+2.8%"
          />

          <MetricCard
            label="Test Coverage"
            value={76}
            change="+6.3%"
          />

          <MetricCard
            label="Documentation"
            value={68}
            change="+9.4%"
          />
        </div>
      </section>

      {/* Analysis Overview + AI Brief */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Analysis Overview */}
        <SectionCard
          title="Analysis Overview"
          subtitle="Latest findings across your repository"
          action={
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
            >
              View all
              <ArrowUpRight size={13} />
            </button>
          }
        >
          <div className="space-y-3">
            {/* Security */}
            <div className="flex items-center justify-between rounded-xl border border-secure-border bg-secure-panel-soft p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                  <ShieldAlert size={17} />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Security Analysis
                  </p>

                  <p className="mt-1 text-xs text-secure-muted">
                    2 high-severity findings detected
                  </p>
                </div>
              </div>

              <StatusBadge
                status="high"
                label="Attention"
              />
            </div>

            {/* Performance */}
            <div className="flex items-center justify-between rounded-xl border border-secure-border bg-secure-panel-soft p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Zap size={17} />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Performance Analysis
                  </p>

                  <p className="mt-1 text-xs text-secure-muted">
                    No critical performance regressions
                  </p>
                </div>
              </div>

              <StatusBadge
                status="healthy"
                label="Healthy"
              />
            </div>

            {/* Code Intelligence */}
            <div className="flex items-center justify-between rounded-xl border border-secure-border bg-secure-panel-soft p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                  <Sparkles size={17} />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Code Intelligence
                  </p>

                  <p className="mt-1 text-xs text-secure-muted">
                    18 maintainability recommendations
                  </p>
                </div>
              </div>

              <StatusBadge
                status="medium"
                label="Review"
              />
            </div>

            {/* Dependency Analysis */}
            <div className="flex items-center justify-between rounded-xl border border-secure-border bg-secure-panel-soft p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <CheckCircle2 size={17} />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Dependency Analysis
                  </p>

                  <p className="mt-1 text-xs text-secure-muted">
                    142 checks passed successfully
                  </p>
                </div>
              </div>

              <StatusBadge
                status="healthy"
                label="Healthy"
              />
            </div>
          </div>
        </SectionCard>

        {/* AI Engineering Brief */}
        <SectionCard
          title="AI Engineering Brief"
          subtitle="Generated from repository intelligence"
        >
          <div className="rounded-xl border border-violet-500/10 bg-violet-500/[0.04] p-5">
            <div className="flex items-center gap-2 text-violet-400">
              <Sparkles size={16} />

              <span className="text-xs font-medium">
                SecureAI Intelligence
              </span>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-300">
              Your repository shows strong performance characteristics,
              but the security layer requires attention.
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />

                <p className="text-xs leading-5 text-slate-400">
                  Authentication logic appears across multiple modules.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />

                <p className="text-xs leading-5 text-slate-400">
                  Database queries may occur inside iterative operations.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />

                <p className="text-xs leading-5 text-slate-400">
                  Input validation should be reviewed across API boundaries.
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-violet-500/10 pt-5">
              <p className="text-[11px] uppercase tracking-wider text-secure-muted">
                Recommended first action
              </p>

              <p className="mt-2 text-sm font-medium text-white">
                Review authentication middleware.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Repository Activity */}
      <SectionCard
        title="Repository Activity"
        subtitle="Recent engineering events"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-secure-border bg-secure-panel-soft p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                <GitCommit size={16} />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Latest commit
                </p>

                <p className="mt-1 text-xs text-secure-muted">
                  Feature development branch updated
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-secure-border bg-secure-panel-soft p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Analysis completed
                </p>

                <p className="mt-1 text-xs text-secure-muted">
                  Repository intelligence is up to date
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-secure-border bg-secure-panel-soft p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <Sparkles size={16} />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  AI insights generated
                </p>

                <p className="mt-1 text-xs text-secure-muted">
                  18 recommendations available
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export default Dashboard;