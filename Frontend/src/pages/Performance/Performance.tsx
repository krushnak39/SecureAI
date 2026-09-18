import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  GitBranch,
  Layers3,
  Network,
  RefreshCw,
  Search,
  Server,
  Sparkles,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type PerformanceSeverity = "high" | "medium" | "low";

interface PerformanceIssue {
  id: number;
  severity: PerformanceSeverity;
  category: string;
  title: string;
  file: string;
  line: number;
  metric: string;
  currentValue: string;
  expectedValue: string;
  description: string;
  impact: string;
  recommendation: string;
  evidence: string;
}

const issues: PerformanceIssue[] = [
  {
    id: 1,
    severity: "high",
    category: "Database",
    title: "Repeated database queries inside request loop",
    file: "src/services/repository.ts",
    line: 84,
    metric: "Query count",
    currentValue: "48 queries / request",
    expectedValue: "< 10 queries / request",
    description:
      "Repository analysis performs individual database lookups while iterating over discovered files.",
    impact:
      "Query amplification can significantly increase API latency as repository size grows.",
    recommendation:
      "Batch the required records before entering the loop and use a single indexed query where possible.",
    evidence:
      "for (const file of files) {\n  await prisma.file.findUnique({\n    where: { path: file.path },\n  });\n}",
  },
  {
    id: 2,
    severity: "high",
    category: "API",
    title: "Repository analysis endpoint exceeds latency budget",
    file: "src/routes/analysis.ts",
    line: 142,
    metric: "p95 latency",
    currentValue: "1.84 s",
    expectedValue: "< 800 ms",
    description:
      "The analysis request performs multiple synchronous operations before returning the response.",
    impact:
      "Long request times reduce responsiveness and can cause timeout pressure for larger repositories.",
    recommendation:
      "Move long-running analysis work into a background job and return a tracked analysis job ID.",
    evidence:
      "const result = await runRepositoryAnalysis(repo);\nres.json(result);",
  },
  {
    id: 3,
    severity: "medium",
    category: "Frontend",
    title: "Dashboard bundle contains avoidable dependency weight",
    file: "src/pages/Dashboard/Dashboard.tsx",
    line: 31,
    metric: "Initial JS",
    currentValue: "486 KB",
    expectedValue: "< 350 KB",
    description:
      "Several dashboard-only modules are loaded during the initial application render.",
    impact:
      "Larger JavaScript payloads increase initial load time and browser parsing work.",
    recommendation:
      "Lazy-load heavy dashboard modules with route-level code splitting.",
    evidence:
      "import Architecture from '../Architecture/Architecture';\nimport Performance from '../Performance/Performance';",
  },
  {
    id: 4,
    severity: "medium",
    category: "Runtime",
    title: "Large repository graph recalculated on every render",
    file: "src/components/architecture/Graph.tsx",
    line: 67,
    metric: "Render work",
    currentValue: "126 ms",
    expectedValue: "< 50 ms",
    description:
      "Graph transformation work is repeated even when the underlying dependency data has not changed.",
    impact:
      "Repeated computation can create visible UI lag when the architecture graph becomes large.",
    recommendation:
      "Memoize derived graph structures and separate expensive transformations from presentational renders.",
    evidence:
      "const nodes = buildGraph(repositoryDependencies);\nconst edges = buildEdges(repositoryDependencies);",
  },
  {
    id: 5,
    severity: "low",
    category: "Caching",
    title: "GitHub repository metadata is not cached",
    file: "src/integrations/github/repository.ts",
    line: 29,
    metric: "Cache hit rate",
    currentValue: "0%",
    expectedValue: "> 70%",
    description:
      "Repeated requests retrieve repository metadata even when the data has not changed.",
    impact:
      "Unnecessary external API requests increase latency and consume GitHub API quota.",
    recommendation:
      "Cache repository metadata with a short TTL and invalidate it when repository state changes.",
    evidence:
      "const repository = await github.repos.get({\n  owner,\n  repo,\n});",
  },
  {
    id: 6,
    severity: "low",
    category: "Assets",
    title: "Static assets are missing compression strategy",
    file: "Frontend/vite.config.ts",
    line: 18,
    metric: "Asset transfer",
    currentValue: "1.2 MB",
    expectedValue: "< 700 KB",
    description:
      "Production assets can be reduced through compression and optimized delivery.",
    impact:
      "Larger transferred assets increase page load time on slower networks.",
    recommendation:
      "Enable production compression and review asset sizes during the build pipeline.",
    evidence:
      "build: {\n  assetsDir: 'assets'\n}",
  },
];

const severityStyles = {
  high: "text-red-400 border-red-500/20 bg-red-500/10",
  medium: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  low: "text-blue-400 border-blue-500/20 bg-blue-500/10",
};

function Performance() {
  const [selectedId, setSelectedId] = useState(1);
  const [filter, setFilter] = useState<
    "all" | PerformanceSeverity
  >("all");
  const [search, setSearch] = useState("");

  const selectedIssue =
    issues.find((issue) => issue.id === selectedId) ?? issues[0];

  const filteredIssues = useMemo(() => {
    const query = search.toLowerCase();

    return issues.filter((issue) => {
      const matchesFilter =
        filter === "all" || issue.severity === filter;

      const matchesSearch =
        issue.title.toLowerCase().includes(query) ||
        issue.category.toLowerCase().includes(query) ||
        issue.file.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-600">
          <Gauge size={12} />
          <span>Repository / Performance</span>
        </div>

        <div className="flex flex-col gap-5 border border-secure-border bg-secure-panel p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-cyan-400/20 bg-cyan-400/5 text-cyan-400">
                <Gauge size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Performance Intelligence
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Detect latency, runtime, database and frontend performance
                  bottlenecks.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 border border-slate-800 bg-[#0a0f18] px-3 py-1.5 font-mono text-[10px] text-slate-400">
                <GitBranch size={12} />
                feature
              </span>

              <span className="border border-slate-800 bg-[#0a0f18] px-3 py-1.5 font-mono text-[10px] text-slate-400">
                6 hotspots
              </span>

              <span className="flex items-center gap-2 text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Profiler ready
              </span>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 border border-slate-700 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-slate-200"
          >
            <RefreshCw size={15} />
            Run performance scan
          </button>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-2 gap-px border border-secure-border bg-secure-border md:grid-cols-4">
        <Metric
          icon={Gauge}
          label="Performance health"
          value="89"
          detail="/ 100"
          className="text-cyan-400"
        />

        <Metric
          icon={Clock3}
          label="API p95"
          value="1.84s"
          detail="target 800ms"
          className="text-amber-400"
        />

        <Metric
          icon={Database}
          label="Query hotspots"
          value="7"
          detail="3 critical paths"
          className="text-red-400"
        />

        <Metric
          icon={BarChart3}
          label="Bundle size"
          value="486KB"
          detail="initial JS"
          className="text-violet-400"
        />
      </section>

      {/* Performance signals */}
      <section className="grid gap-4 md:grid-cols-3">
        <SignalCard
          icon={Network}
          title="API latency"
          value="1.84 s"
          target="< 800 ms"
          progress={72}
          status="Above target"
        />

        <SignalCard
          icon={Database}
          title="Database efficiency"
          value="48"
          target="queries / request"
          progress={38}
          status="Optimization needed"
        />

        <SignalCard
          icon={Zap}
          title="Frontend responsiveness"
          value="126 ms"
          target="render work"
          progress={64}
          status="Review hotspots"
        />
      </section>

      {/* Main workspace */}
      <section className="grid min-h-[650px] border border-secure-border bg-secure-panel lg:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)]">
        {/* Issues */}
        <div className="min-w-0 border-b border-secure-border lg:border-b-0 lg:border-r">
          <div className="border-b border-secure-border p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-violet-400" />
                  <h2 className="text-sm font-medium text-white">
                    Performance hotspots
                  </h2>
                </div>

                <p className="mt-1 text-[10px] text-slate-600">
                  {filteredIssues.length} performance issues in the current
                  view.
                </p>
              </div>

              <div className="relative w-full xl:max-w-xs">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search hotspots..."
                  className="w-full border border-slate-800 bg-[#080d15] py-2 pl-9 pr-3 text-xs text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-slate-600"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["high", "High"],
                  ["medium", "Medium"],
                  ["low", "Low"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`border px-3 py-1.5 text-[10px] transition ${
                    filter === value
                      ? "border-violet-400/30 bg-violet-500/10 text-violet-300"
                      : "border-slate-800 bg-[#080d15] text-slate-600 hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-800/70">
            {filteredIssues.map((issue) => (
              <PerformanceIssueRow
                key={issue.id}
                issue={issue}
                selected={issue.id === selectedId}
                onSelect={() => setSelectedId(issue.id)}
              />
            ))}

            {filteredIssues.length === 0 && (
              <div className="flex min-h-56 items-center justify-center p-8 text-center">
                <div>
                  <Search
                    size={22}
                    className="mx-auto text-slate-700"
                  />

                  <p className="mt-3 text-sm text-slate-400">
                    No performance issues found
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Try another search or severity filter.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="bg-[#080d15]">
          <div className="border-b border-slate-800 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-cyan-400" />

                  <span className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
                    Hotspot detail
                  </span>
                </div>

                <h2 className="mt-2 text-sm font-medium text-white">
                  {selectedIssue.title}
                </h2>

                <p className="mt-1 font-mono text-[10px] text-slate-600">
                  {selectedIssue.file}:{selectedIssue.line}
                </p>
              </div>

              <span
                className={`border px-2 py-1 text-[9px] uppercase tracking-wider ${severityStyles[selectedIssue.severity]}`}
              >
                {selectedIssue.severity}
              </span>
            </div>
          </div>

          <div className="space-y-6 p-5">
            {/* Metric */}
            <div className="grid grid-cols-2 gap-px border border-slate-800 bg-slate-800">
              <div className="bg-[#0a0f18] p-4">
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Observed
                </p>

                <p className="mt-2 font-mono text-sm text-red-300">
                  {selectedIssue.currentValue}
                </p>
              </div>

              <div className="bg-[#0a0f18] p-4">
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Target
                </p>

                <p className="mt-2 font-mono text-sm text-emerald-300">
                  {selectedIssue.expectedValue}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Observation
              </p>

              <p className="text-xs leading-5 text-slate-400">
                {selectedIssue.description}
              </p>
            </div>

            {/* Evidence */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Evidence
                </p>

                <span className="font-mono text-[9px] text-slate-700">
                  {selectedIssue.file}:{selectedIssue.line}
                </span>
              </div>

              <pre className="overflow-x-auto border border-slate-800 bg-[#050810] p-4 font-mono text-[10px] leading-5 text-slate-500">
                <code>{selectedIssue.evidence}</code>
              </pre>
            </div>

            {/* Impact */}
            <div className="border border-amber-400/10 bg-amber-400/[0.025] p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" />

                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-400/70">
                  Performance impact
                </p>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                {selectedIssue.impact}
              </p>
            </div>

            {/* Recommendation */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-violet-400" />

                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Optimization recommendation
                </p>
              </div>

              <p className="text-xs leading-5 text-slate-400">
                {selectedIssue.recommendation}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-slate-800 pt-5">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 border border-slate-700 bg-white px-3 py-2.5 text-xs font-medium text-black transition hover:bg-slate-200"
              >
                <ArrowRight size={13} />
                Open source
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 border border-slate-800 px-3 py-2.5 text-xs text-slate-500 transition hover:border-slate-700 hover:text-white"
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="border border-secure-border bg-secure-panel">
        <div className="border-b border-secure-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Layers3 size={15} className="text-violet-400" />

            <h2 className="text-sm font-medium text-white">
              Performance analysis pipeline
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-5">
          {[
            ["01", "Static analysis", "Performance patterns indexed"],
            ["02", "Query analysis", "Database hotspots detected"],
            ["03", "Runtime profiling", "Latency signals collected"],
            ["04", "Bundle analysis", "Frontend weight measured"],
            ["05", "AI reasoning", "Optimization advice generated"],
          ].map(([number, title, detail], index) => (
            <div
              key={number}
              className={`p-5 ${
                index !== 4
                  ? "border-b border-slate-800 md:border-b-0 md:border-r"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-violet-400">
                  {number}
                </span>

                <span className="text-xs font-medium text-slate-300">
                  {title}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-400">
                <CheckCircle2 size={12} />
                {detail}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Notice */}
      <div className="flex items-start gap-3 border border-cyan-400/10 bg-cyan-400/[0.025] px-4 py-3">
        <Server
          size={14}
          className="mt-0.5 shrink-0 text-cyan-400"
        />

        <p className="text-[10px] leading-5 text-slate-600">
          Current performance signals are structured frontend data. Later,
          SecureAI will collect real runtime metrics, database query timings,
          bundle statistics and static performance patterns from the analysis
          backend.
        </p>
      </div>
    </div>
  );
}

interface MetricProps {
  icon: typeof Gauge;
  label: string;
  value: string;
  detail: string;
  className: string;
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  className,
}: MetricProps) {
  return (
    <div className="bg-secure-panel p-5">
      <div className="flex items-center gap-2 text-slate-600">
        <Icon size={14} />
        <span className="text-[10px] uppercase tracking-wider">
          {label}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <p className={`text-2xl font-semibold ${className}`}>
          {value}
        </p>

        <span className="mb-1 text-[9px] text-slate-700">
          {detail}
        </span>
      </div>
    </div>
  );
}

interface SignalCardProps {
  icon: typeof Gauge;
  title: string;
  value: string;
  target: string;
  progress: number;
  status: string;
}

function SignalCard({
  icon: Icon,
  title,
  value,
  target,
  progress,
  status,
}: SignalCardProps) {
  return (
    <div className="border border-secure-border bg-secure-panel p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-slate-500" />

          <span className="text-xs font-medium text-slate-300">
            {title}
          </span>
        </div>

        <span className="font-mono text-[9px] text-amber-400">
          {status}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <span className="font-mono text-xl text-white">
          {value}
        </span>

        <span className="text-[9px] text-slate-600">
          {target}
        </span>
      </div>

      <div className="mt-4 h-1 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

interface PerformanceIssueRowProps {
  issue: PerformanceIssue;
  selected: boolean;
  onSelect: () => void;
}

function PerformanceIssueRow({
  issue,
  selected,
  onSelect,
}: PerformanceIssueRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full gap-4 p-4 text-left transition ${
        selected
          ? "bg-violet-500/[0.05]"
          : "hover:bg-white/[0.02]"
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border ${severityStyles[issue.severity]}`}
      >
        {issue.severity === "high" ? (
          <AlertTriangle size={14} />
        ) : issue.severity === "medium" ? (
          <Clock3 size={14} />
        ) : (
          <Zap size={14} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-200">
            {issue.title}
          </span>

          <span
            className={`border px-1.5 py-0.5 text-[8px] uppercase tracking-wider ${severityStyles[issue.severity]}`}
          >
            {issue.severity}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-[10px] text-slate-600">
            {issue.category}
          </span>

          <span className="font-mono text-[10px] text-slate-700">
            {issue.file}:{issue.line}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4">
          <span className="text-[9px] text-slate-600">
            {issue.metric}
          </span>

          <span className="font-mono text-[10px] text-red-300/80">
            {issue.currentValue}
          </span>

          <span className="text-[9px] text-slate-700">
            →
          </span>

          <span className="font-mono text-[10px] text-emerald-300/70">
            {issue.expectedValue}
          </span>
        </div>
      </div>

      <ArrowRight
        size={14}
        className={`mt-1 shrink-0 ${
          selected ? "text-violet-400" : "text-slate-700"
        }`}
      />
    </button>
  );
}

export default Performance;