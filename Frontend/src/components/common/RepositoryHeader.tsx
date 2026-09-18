import {
  Activity,
  GitBranch,
  GitFork,
  Play,
  RefreshCw,
} from "lucide-react";

interface RepositoryHeaderProps {
  repositoryName: string;
  repositoryPath: string;
  branch: string;
  lastAnalyzed: string;
}

function RepositoryHeader({
  repositoryName,
  repositoryPath,
  branch,
  lastAnalyzed,
}: RepositoryHeaderProps) {
  return (
    <section className="mb-8">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-xs text-secure-muted">
        <span>REPOSITORY</span>
        <span>/</span>
        <span className="text-slate-300">{repositoryName}</span>
      </div>

      {/* Main Repository Header */}
      <div className="flex flex-col gap-6 rounded-2xl border border-secure-border bg-secure-panel p-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Repository Information */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secure-border bg-secure-panel-soft">
              <GitFork size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {repositoryName}
              </h1>

              <p className="mt-1 text-sm text-secure-muted">
                {repositoryPath}
              </p>
            </div>
          </div>

          {/* Repository Metadata */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-secure-border bg-secure-panel-soft px-3 py-1.5 text-xs text-slate-400">
              <GitBranch size={13} />
              <span>{branch}</span>
            </div>

            <div className="rounded-lg border border-secure-border bg-secure-panel-soft px-3 py-1.5 text-xs text-slate-400">
              TypeScript
            </div>

            <div className="rounded-lg border border-secure-border bg-secure-panel-soft px-3 py-1.5 text-xs text-slate-400">
              React
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Analysis complete</span>
            </div>
          </div>
        </div>

        {/* Analysis Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="text-left sm:text-right">
            <p className="text-[11px] uppercase tracking-wider text-secure-muted">
              Last analyzed
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {lastAnalyzed}
            </p>
          </div>

          <button
            type="button"
            className="group flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-slate-200"
          >
            <Play
              size={15}
              className="transition-transform group-hover:scale-110"
            />

            <span>Run Analysis</span>
          </button>

          <button
            type="button"
            aria-label="Refresh repository analysis"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-secure-border bg-secure-panel-soft text-slate-400 transition hover:border-slate-600 hover:text-white"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Analysis Status */}
      <div className="mt-2 flex items-center gap-2 px-1 text-[11px] text-secure-muted">
        <Activity size={12} />

        <span>
          SecureAI continuously monitors repository intelligence.
        </span>
      </div>
    </section>
  );
}

export default RepositoryHeader;