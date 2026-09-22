import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  GitFork,
  Play,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Terminal,
  Timer,
  Workflow,
  XCircle,
  Zap,
} from "lucide-react";

type RunStatus = "success" | "failed" | "running";

type CheckStatus = "passed" | "failed" | "running";

interface WorkflowRun {
  id: string;
  workflow: string;
  branch: string;
  commit: string;
  message: string;
  status: RunStatus;
  duration: string;
  time: string;
  actor: string;
}

interface PullRequest {
  id: number;
  title: string;
  branch: string;
  author: string;
  checks: number;
  passed: number;
  findings: number;
  status: "ready" | "blocked" | "review";
}

interface Check {
  name: string;
  description: string;
  status: CheckStatus;
  duration: string;
  findings: number;
}

const workflowRuns: WorkflowRun[] = [
  {
    id: "run-1042",
    workflow: "SecureAI Analysis",
    branch: "feature",
    commit: "8f42c91",
    message: "feat: update architecture analysis",
    status: "success",
    duration: "2m 14s",
    time: "8 min ago",
    actor: "krushnak39",
  },
  {
    id: "run-1041",
    workflow: "Pull Request Review",
    branch: "feature/security",
    commit: "6c21ab8",
    message: "fix: sanitize repository input",
    status: "failed",
    duration: "1m 42s",
    time: "26 min ago",
    actor: "dev-user",
  },
  {
    id: "run-1040",
    workflow: "Security Scan",
    branch: "feature",
    commit: "3ab84e2",
    message: "chore: dependency update",
    status: "success",
    duration: "1m 08s",
    time: "1 hr ago",
    actor: "krushnak39",
  },
  {
    id: "run-1039",
    workflow: "Dependency Audit",
    branch: "main",
    commit: "12de9af",
    message: "build: refresh dependencies",
    status: "success",
    duration: "54s",
    time: "3 hrs ago",
    actor: "dependabot",
  },
  {
    id: "run-1038",
    workflow: "Performance Analysis",
    branch: "feature/performance",
    commit: "91ab42d",
    message: "perf: optimize repository queries",
    status: "running",
    duration: "—",
    time: "4 hrs ago",
    actor: "dev-user",
  },
];

const pullRequests: PullRequest[] = [
  {
    id: 142,
    title: "Add repository architecture analyzer",
    branch: "feature/architecture",
    author: "krushnak39",
    checks: 6,
    passed: 6,
    findings: 0,
    status: "ready",
  },
  {
    id: 141,
    title: "Improve repository input validation",
    branch: "feature/security",
    author: "dev-user",
    checks: 6,
    passed: 4,
    findings: 3,
    status: "blocked",
  },
  {
    id: 140,
    title: "Optimize analysis database queries",
    branch: "feature/performance",
    author: "dev-user",
    checks: 6,
    passed: 5,
    findings: 1,
    status: "review",
  },
];

const checks: Check[] = [
  {
    name: "AI Code Review",
    description: "Analyzes changed files for quality and maintainability issues.",
    status: "passed",
    duration: "38s",
    findings: 2,
  },
  {
    name: "Security Scan",
    description: "Scans changed code for vulnerabilities and exposed secrets.",
    status: "passed",
    duration: "24s",
    findings: 0,
  },
  {
    name: "Dependency Audit",
    description: "Checks package changes against known vulnerability advisories.",
    status: "passed",
    duration: "18s",
    findings: 1,
  },
  {
    name: "Performance Analysis",
    description: "Detects expensive operations and potential runtime regressions.",
    status: "running",
    duration: "41s",
    findings: 0,
  },
  {
    name: "Architecture Check",
    description: "Checks module boundaries, dependency direction, and coupling.",
    status: "passed",
    duration: "29s",
    findings: 1,
  },
];

const runStatusStyles: Record<
  RunStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    className: string;
  }
> = {
  success: {
    label: "PASSED",
    icon: CheckCircle2,
    className: "text-emerald-400",
  },
  failed: {
    label: "FAILED",
    icon: XCircle,
    className: "text-red-400",
  },
  running: {
    label: "RUNNING",
    icon: RefreshCw,
    className: "animate-spin text-cyan-400",
  },
};

const checkStatusStyles: Record<
  CheckStatus,
  {
    label: string;
    className: string;
  }
> = {
  passed: {
    label: "PASSED",
    className: "text-emerald-400",
  },
  failed: {
    label: "FAILED",
    className: "text-red-400",
  },
  running: {
    label: "RUNNING",
    className: "text-cyan-400",
  },
};

function CICD() {
  const [selectedRun, setSelectedRun] =
    useState<WorkflowRun>(workflowRuns[0]);
  const [runFilter, setRunFilter] = useState<
    "all" | RunStatus
  >("all");
  const [search, setSearch] = useState("");
  const [triggered, setTriggered] = useState(false);

  const filteredRuns = useMemo(() => {
    const query = search.toLowerCase().trim();

    return workflowRuns.filter((run) => {
      const matchesFilter =
        runFilter === "all" || run.status === runFilter;

      const matchesSearch =
        !query ||
        run.workflow.toLowerCase().includes(query) ||
        run.branch.toLowerCase().includes(query) ||
        run.commit.toLowerCase().includes(query) ||
        run.message.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [runFilter, search]);

  const handleRunAnalysis = () => {
    setTriggered(true);

    setTimeout(() => {
      setTriggered(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-secure-muted">
            <span>AUTOMATION</span>
            <ChevronRight size={13} />
            <span className="text-slate-300">
              CI/CD
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-cyan-500/20 bg-cyan-500/10">
              <Workflow
                size={20}
                className="text-cyan-400"
              />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                CI/CD Intelligence
              </h1>

              <p className="mt-1 text-sm text-secure-muted">
                Automated repository analysis for pull requests and GitHub Actions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            GITHUB ACTIONS CONNECTED
          </div>

          <button
            type="button"
            onClick={handleRunAnalysis}
            className="flex items-center gap-2 bg-violet-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-violet-500"
          >
            <Play size={13} />
            Run Analysis
          </button>
        </div>
      </div>

      {/* Trigger notification */}
      {triggered && (
        <div className="flex items-center gap-3 border border-cyan-500/20 bg-cyan-500/5 px-5 py-4">
          <RefreshCw
            size={15}
            className="animate-spin text-cyan-400"
          />

          <div>
            <p className="text-sm font-medium text-white">
              Analysis workflow triggered
            </p>

            <p className="mt-1 text-xs text-slate-500">
              SecureAI would dispatch a GitHub Actions workflow for the selected repository.
            </p>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-px overflow-hidden border border-secure-border bg-secure-border md:grid-cols-4">
        <div className="bg-secure-panel p-5">
          <p className="text-[10px] font-semibold tracking-wider text-secure-muted">
            WORKFLOW SUCCESS
          </p>

          <p className="mt-3 text-3xl font-semibold text-white">
            94.2%
          </p>

          <p className="mt-1 text-xs text-emerald-400">
            Last 30 runs
          </p>
        </div>

        <div className="bg-secure-panel p-5">
          <p className="text-[10px] font-semibold tracking-wider text-secure-muted">
            ACTIVE WORKFLOWS
          </p>

          <p className="mt-3 text-3xl font-semibold text-white">
            5
          </p>

          <p className="mt-1 text-xs text-slate-500">
            GitHub Actions
          </p>
        </div>

        <div className="bg-secure-panel p-5">
          <p className="text-[10px] font-semibold tracking-wider text-secure-muted">
            PRs ANALYZED
          </p>

          <p className="mt-3 text-3xl font-semibold text-white">
            37
          </p>

          <p className="mt-1 text-xs text-slate-500">
            This month
          </p>
        </div>

        <div className="bg-secure-panel p-5">
          <p className="text-[10px] font-semibold tracking-wider text-secure-muted">
            AVG. ANALYSIS
          </p>

          <p className="mt-3 text-3xl font-semibold text-white">
            1m 42s
          </p>

          <p className="mt-1 text-xs text-slate-500">
            End-to-end
          </p>
        </div>
      </div>

      {/* Pipeline */}
      <div className="border border-secure-border bg-secure-panel">
        <div className="flex items-center justify-between border-b border-secure-border px-5 py-4">
          <div>
            <p className="text-sm font-medium text-white">
              Pull Request Analysis Pipeline
            </p>

            <p className="mt-1 text-xs text-slate-600">
              SecureAI automatically evaluates every configured pull request.
            </p>
          </div>

          <GitPullRequest
            size={15}
            className="text-violet-400"
          />
        </div>

        <div className="overflow-x-auto px-5 py-5">
          <div className="flex min-w-[850px] items-center">
            {[
              {
                number: "01",
                title: "Pull Request",
                description: "Code changes",
                icon: GitPullRequest,
              },
              {
                number: "02",
                title: "Build",
                description: "Install + test",
                icon: Terminal,
              },
              {
                number: "03",
                title: "AI Review",
                description: "Quality analysis",
                icon: Zap,
              },
              {
                number: "04",
                title: "Security",
                description: "Threat scanning",
                icon: ShieldCheck,
              },
              {
                number: "05",
                title: "Architecture",
                description: "Boundary checks",
                icon: Code2,
              },
              {
                number: "06",
                title: "PR Report",
                description: "Findings + status",
                icon: Rocket,
              },
            ].map((step, index, array) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="flex flex-1 items-center"
                >
                  <div className="min-w-[120px] border border-secure-border bg-secure-panel-soft p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold text-violet-400">
                        {step.number}
                      </span>

                      <Icon
                        size={13}
                        className="text-slate-500"
                      />
                    </div>

                    <p className="mt-3 text-xs font-medium text-white">
                      {step.title}
                    </p>

                    <p className="mt-1 text-[9px] text-slate-600">
                      {step.description}
                    </p>
                  </div>

                  {index < array.length - 1 && (
                    <div className="mx-2 h-px flex-1 bg-slate-800" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
        {/* Workflow runs */}
        <section className="border border-secure-border bg-secure-panel">
          <div className="border-b border-secure-border px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  Workflow Runs
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  Recent GitHub Actions execution history.
                </p>
              </div>

              <div className="relative">
                <SearchIcon />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search runs..."
                  className="w-full border border-secure-border bg-secure-panel-soft py-2 pl-8 pr-3 text-xs text-white outline-none placeholder:text-slate-600 lg:w-56"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-1 overflow-x-auto">
              {(
                [
                  ["all", "ALL"],
                  ["success", "PASSED"],
                  ["failed", "FAILED"],
                  ["running", "RUNNING"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRunFilter(value)}
                  className={`px-3 py-1.5 text-[9px] font-medium tracking-wider transition ${
                    runFilter === value
                      ? "bg-slate-800 text-white"
                      : "text-slate-600 hover:text-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-secure-border">
            {filteredRuns.map((run) => {
              const status = runStatusStyles[run.status];
              const StatusIcon = status.icon;
              const isSelected =
                selectedRun.id === run.id;

              return (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => setSelectedRun(run)}
                  className={`w-full p-5 text-left transition ${
                    isSelected
                      ? "bg-violet-500/5"
                      : "hover:bg-secure-panel-soft"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <StatusIcon
                      size={16}
                      className={`mt-0.5 shrink-0 ${status.className}`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-medium text-white">
                            {run.workflow}
                          </p>

                          <p className="mt-1 truncate text-[10px] text-slate-500">
                            {run.message}
                          </p>
                        </div>

                        <span
                          className={`text-[9px] font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <GitBranch size={10} />
                          {run.branch}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <GitCommitHorizontal size={10} />
                          {run.commit}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Timer size={10} />
                          {run.duration}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Clock3 size={10} />
                          {run.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected run */}
        <section className="border border-secure-border bg-secure-panel">
          <div className="border-b border-secure-border px-5 py-4">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-secure-muted">
              RUN DETAILS
            </p>

            <p className="mt-2 text-sm font-medium text-white">
              {selectedRun.workflow}
            </p>

            <p className="mt-1 text-[10px] text-slate-600">
              {selectedRun.commit} · {selectedRun.branch}
            </p>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-secure-border bg-secure-panel-soft p-3">
                <p className="text-[9px] text-slate-600">
                  STATUS
                </p>

                <p
                  className={`mt-2 text-xs font-medium ${
                    runStatusStyles[selectedRun.status]
                      .className
                  }`}
                >
                  {runStatusStyles[selectedRun.status].label}
                </p>
              </div>

              <div className="border border-secure-border bg-secure-panel-soft p-3">
                <p className="text-[9px] text-slate-600">
                  DURATION
                </p>

                <p className="mt-2 text-xs font-medium text-white">
                  {selectedRun.duration}
                </p>
              </div>

              <div className="border border-secure-border bg-secure-panel-soft p-3">
                <p className="text-[9px] text-slate-600">
                  COMMIT
                </p>

                <p className="mt-2 text-xs font-medium text-white">
                  {selectedRun.commit}
                </p>
              </div>

              <div className="border border-secure-border bg-secure-panel-soft p-3">
                <p className="text-[9px] text-slate-600">
                  ACTOR
                </p>

                <p className="mt-2 truncate text-xs font-medium text-white">
                  {selectedRun.actor}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-secure-muted">
                CHECKS
              </p>

              <div className="mt-3 space-y-2">
                {checks.map((check) => {
                  const status =
                    checkStatusStyles[check.status];

                  return (
                    <div
                      key={check.name}
                      className="border border-secure-border bg-secure-panel-soft p-3"
                    >
                      <div className="flex items-start gap-3">
                        <CircleDot
                          size={13}
                          className={`mt-0.5 ${status.className}`}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-medium text-slate-300">
                              {check.name}
                            </p>

                            <span
                              className={`text-[8px] font-medium ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </div>

                          <p className="mt-1 text-[9px] leading-4 text-slate-600">
                            {check.description}
                          </p>

                          <div className="mt-2 flex items-center gap-3 text-[8px] text-slate-600">
                            <span>{check.duration}</span>
                            <span>
                              {check.findings} findings
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedRun.status === "failed" && (
              <div className="mt-5 border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={15}
                    className="mt-0.5 shrink-0 text-red-400"
                  />

                  <div>
                    <p className="text-xs font-medium text-red-300">
                      Workflow failed
                    </p>

                    <p className="mt-2 text-[10px] leading-5 text-slate-500">
                      One or more SecureAI checks reported blocking findings.
                      Review the generated PR report before merging.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              className="mt-5 flex w-full items-center justify-center gap-2 border border-secure-border py-2.5 text-[10px] text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <Terminal size={12} />
              View workflow logs
            </button>
          </div>
        </section>
      </div>

      {/* Pull requests */}
      <section className="border border-secure-border bg-secure-panel">
        <div className="flex items-center justify-between border-b border-secure-border px-5 py-4">
          <div>
            <p className="text-sm font-medium text-white">
              Pull Request Intelligence
            </p>

            <p className="mt-1 text-xs text-slate-600">
              SecureAI findings attached to active pull requests.
            </p>
          </div>

          <GitFork
            size={16}
            className="text-slate-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-secure-border text-[9px] font-semibold tracking-wider text-slate-600">
                <th className="px-5 py-3">PULL REQUEST</th>
                <th className="px-5 py-3">BRANCH</th>
                <th className="px-5 py-3">CHECKS</th>
                <th className="px-5 py-3">FINDINGS</th>
                <th className="px-5 py-3">STATUS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-secure-border">
              {pullRequests.map((pr) => (
                <tr
                  key={pr.id}
                  className="transition hover:bg-secure-panel-soft"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <GitPullRequest
                        size={14}
                        className="text-violet-400"
                      />

                      <div>
                        <p className="text-xs font-medium text-slate-300">
                          #{pr.id} {pr.title}
                        </p>

                        <p className="mt-1 text-[9px] text-slate-600">
                          opened by {pr.author}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2 text-[10px] text-slate-500">
                      <GitBranch size={11} />
                      {pr.branch}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-300">
                      {pr.passed}/{pr.checks}
                    </span>
                    <span className="ml-2 text-[9px] text-slate-600">
                      passed
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={
                        pr.findings > 0
                          ? "text-xs text-amber-400"
                          : "text-xs text-emerald-400"
                      }
                    >
                      {pr.findings}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {pr.status === "ready" ? (
                      <span className="flex items-center gap-2 text-[9px] font-medium text-emerald-400">
                        <CheckCircle2 size={11} />
                        READY
                      </span>
                    ) : pr.status === "blocked" ? (
                      <span className="flex items-center gap-2 text-[9px] font-medium text-red-400">
                        <XCircle size={11} />
                        BLOCKED
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-[9px] font-medium text-amber-400">
                        <CircleDot size={11} />
                        REVIEW
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom status */}
      <div className="flex flex-col gap-3 border border-secure-border bg-secure-panel px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

          <span className="text-[10px] text-slate-500">
            GitHub Actions integration configured
          </span>
        </div>

        <div className="flex flex-wrap gap-4 text-[9px] text-slate-600">
          <span>5 workflows</span>
          <span>37 PRs analyzed</span>
          <span>6 analysis checks</span>
          <span>Automated reporting enabled</span>
        </div>
      </div>

      {/* Static notice */}
      <div className="flex items-start gap-3 border border-secure-border bg-secure-panel px-5 py-4">
        <GitFork
          size={14}
          className="mt-0.5 shrink-0 text-slate-500"
        />

        <div>
          <p className="text-xs font-medium text-slate-300">
            CI/CD intelligence preview
          </p>

          <p className="mt-1 text-[10px] leading-5 text-slate-600">
            The current interface uses representative workflow and pull
            request data. Later, SecureAI will connect this workspace to
            GitHub Actions, repository webhooks, analysis services, and
            automated PR reporting.
          </p>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export default CICD;