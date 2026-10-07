import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  GitPullRequest,
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
type RunStatus = "success" | "failed" | "running" | "queued" | "cancelled";
type CheckStatus =
  | "passed"
  | "failed"
  | "running"
  | "queued"
  | "cancelled";
type PullRequestStatus = "ready" | "blocked" | "review";
interface CICheck {
  id: string;
  name: string;
  status: string;
  conclusion: string | null;
  logsUrl: string | null;
  createdAt: string;
  completedAt: string | null;
}
interface WorkflowRun {
  id: string;
  externalId: string | null;
  branch: string | null;
  commitSha: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  checks: CICheck[];
  workflowName: string;
  workflowFile: string;
}
interface Workflow {
  id: string;
  name: string;
  workflowFile: string;
  createdAt: string;
  updatedAt: string;
}
interface PullRequest {
  id: string;
  externalId: number | null;
  number: number | null;
  title: string;
  author: string | null;
  sourceBranch: string | null;
  targetBranch: string | null;
  status: "OPEN" | "CLOSED" | "MERGED";
  url: string | null;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
}
interface CICDMetrics {
  workflowSuccessRate: number;
  activeWorkflows: number;
  pullRequests: number;
  averageDuration: number | string | null;
  totalRuns: number;
}
interface CICDOverview {
  repository: {
    id: string;
    fullName: string;
    defaultBranch: string;
  };
  metrics: CICDMetrics;
  workflows: Workflow[];
  runs: WorkflowRun[];
  prs: PullRequest[];
}
interface ApiError {
  message?: string;
}
const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api";
async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;
  if (!response.ok) {
    const error = data as ApiError | null;
    throw new Error(
      error?.message ||
        `Request failed with status ${response.status}.`,
    );
  }
  return data as T;
}
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
  queued: {
    label: "QUEUED",
    icon: Clock3,
    className: "text-amber-400",
  },
  cancelled: {
    label: "CANCELLED",
    icon: XCircle,
    className: "text-slate-500",
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
  queued: {
    label: "QUEUED",
    className: "text-amber-400",
  },
  cancelled: {
    label: "CANCELLED",
    className: "text-slate-500",
  },
};
function normalizeRunStatus(status: string): RunStatus {
  switch (status.toUpperCase()) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "failed";
    case "RUNNING":
      return "running";
    case "CANCELLED":
      return "cancelled";
    case "QUEUED":
    default:
      return "queued";
  }
}
function normalizeCheckStatus(status: string): CheckStatus {
  switch (status.toUpperCase()) {
    case "SUCCESS":
      return "passed";
    case "FAILED":
      return "failed";
    case "RUNNING":
      return "running";
    case "CANCELLED":
      return "cancelled";
    case "QUEUED":
    default:
      return "queued";
  }
}
function normalizePRStatus(status: PullRequest["status"]): PullRequestStatus {
  switch (status) {
    case "MERGED":
      return "ready";
    case "CLOSED":
      return "blocked";
    case "OPEN":
    default:
      return "review";
  }
}
function formatDuration(
  startedAt: string | null,
  completedAt: string | null,
): string {
  if (!startedAt) {
    return "—";
  }
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) {
    return "—";
  }
  const end = completedAt
    ? new Date(completedAt).getTime()
    : Date.now();
  if (Number.isNaN(end) || end < start) {
    return "—";
  }
  const totalSeconds = Math.floor((end - start) / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
function formatRelativeTime(dateString: string): string {
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) {
    return "—";
  }
  const difference = Date.now() - timestamp;
  const seconds = Math.max(0, Math.floor(difference / 1000));
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
function formatAverageDuration(
  duration: number | string | null,
): string {
  if (duration === null || duration === undefined) {
    return "—";
  }
  if (typeof duration === "string") {
    return duration;
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    return "—";
  }
  return formatSeconds(duration);
}
function formatSeconds(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
function getCommitLabel(commitSha: string | null): string {
  if (!commitSha) {
    return "—";
  }
  return commitSha.length > 9
    ? commitSha.slice(0, 9)
    : commitSha;
}
function getCheckCounts(checks: CICheck[]) {
  const passed = checks.filter(
    (check) => normalizeCheckStatus(check.status) === "passed",
  ).length;
  return {
    total: checks.length,
    passed,
  };
}
function getRunMessage(run: WorkflowRun): string {
  if (run.commitSha) {
    return `Commit ${getCommitLabel(run.commitSha)}`;
  }
  return "GitHub Actions workflow execution";
}
function CICD() {
  const { id: projectId } = useParams<{ id: string }>();
  const [data, setData] = useState<CICDOverview | null>(null);
  const [selectedRun, setSelectedRun] =
    useState<WorkflowRun | null>(null);
  const [runFilter, setRunFilter] = useState<
    "all" | RunStatus
  >("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [notification, setNotification] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const loadOverview = async () => {
    if (!projectId) {
      setError("Project ID is missing from the URL.");
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const result = await apiRequest<CICDOverview>(
        `/projects/${projectId}/cicd`,
      );
      setData(result);
      setSelectedRun((current) => {
        if (current) {
          const updated = result.runs.find(
            (run) => run.id === current.id,
          );
          return updated || result.runs[0] || null;
        }
        return result.runs[0] || null;
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load CI/CD intelligence.",
      );
    } finally {
      setLoading(false);
    }
  };
  const syncCICD = async () => {
    if (!projectId || syncing) {
      return;
    }
    try {
      setSyncing(true);
      setError(null);
      const result = await apiRequest<CICDOverview>(
        `/projects/${projectId}/cicd/sync`,
        {
          method: "POST",
        },
      );
      setData(result);
      setSelectedRun((current) => {
        if (current) {
          const updated = result.runs.find(
            (run) => run.id === current.id,
          );
          return updated || result.runs[0] || null;
        }
        return result.runs[0] || null;
      });
      setNotification(
        "GitHub Actions, workflow runs, checks, and pull requests synchronized.",
      );
      window.setTimeout(() => {
        setNotification(null);
      }, 3500);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to synchronize CI/CD data.",
      );
    } finally {
      setSyncing(false);
    }
  };
  const handleRunAnalysis = async () => {
    if (!projectId || triggering) {
      return;
    }
    try {
      setTriggering(true);
      setError(null);
      const result = await apiRequest<{
        workflow: string;
        name: string;
        file: string;
        branch: string;
      }>(`/projects/${projectId}/cicd/run`, {
        method: "POST",
      });
      setNotification(
        `GitHub Actions workflow "${result.name}" dispatched on ${result.branch}.`,
      );
      window.setTimeout(() => {
        setNotification(null);
      }, 5000);
      window.setTimeout(() => {
        void loadOverview();
      }, 2500);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to trigger GitHub Actions workflow.",
      );
    } finally {
      setTriggering(false);
    }
  };
  useEffect(() => {
    void loadOverview();
  }, [projectId]);
  const workflows = data?.workflows || [];
  const workflowRuns = data?.runs || [];
  const pullRequests = data?.prs || [];
  const metrics = data?.metrics;
  const filteredRuns = useMemo(() => {
    const query = search.toLowerCase().trim();
    return workflowRuns.filter((run) => {
      const normalizedStatus = normalizeRunStatus(run.status);
      const matchesFilter =
        runFilter === "all" ||
        normalizedStatus === runFilter;
      const matchesSearch =
        !query ||
        run.workflowName.toLowerCase().includes(query) ||
        (run.branch || "").toLowerCase().includes(query) ||
        (run.commitSha || "").toLowerCase().includes(query) ||
        getRunMessage(run).toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [workflowRuns, runFilter, search]);
  const selectedRunChecks = selectedRun?.checks || [];
  const selectedRunCheckCounts =
    getCheckCounts(selectedRunChecks);
  const selectedRunLogsUrl =
    selectedRunChecks.find((check) => check.logsUrl)?.logsUrl ||
    null;
  const pipelineSteps = [
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
  ];
  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <RefreshCw
            size={16}
            className="animate-spin text-cyan-400"
          />
          Loading CI/CD intelligence...
        </div>
      </div>
    );
  }
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
            onClick={() => void syncCICD()}
            disabled={syncing}
            className="flex items-center gap-2 border border-secure-border bg-secure-panel-soft px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={13}
              className={syncing ? "animate-spin" : ""}
            />
            {syncing ? "Syncing..." : "Sync GitHub"}
          </button>
          <button
            type="button"
            onClick={() => void handleRunAnalysis()}
            disabled={triggering}
            className="flex items-center gap-2 bg-violet-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {triggering ? (
              <RefreshCw
                size={13}
                className="animate-spin"
              />
            ) : (
              <Play size={13} />
            )}
            {triggering ? "Starting..." : "Run Analysis"}
          </button>
        </div>
      </div>
      {/* Repository */}
      {data?.repository && (
        <div className="flex flex-wrap items-center gap-3 border border-secure-border bg-secure-panel px-5 py-3">
          <GitFork
            size={14}
            className="text-violet-400"
          />
          <span className="text-xs text-slate-300">
            {data.repository.fullName}
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-2 text-[10px] text-slate-500">
            <GitBranch size={11} />
            {data.repository.defaultBranch}
          </span>
        </div>
      )}
      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 border border-red-500/20 bg-red-500/5 px-5 py-4">
          <AlertCircle
            size={15}
            className="mt-0.5 shrink-0 text-red-400"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-red-300">
              CI/CD request failed
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadOverview()}
            className="text-[10px] text-slate-400 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}
      {/* Notification */}
      {notification && (
        <div className="flex items-center gap-3 border border-cyan-500/20 bg-cyan-500/5 px-5 py-4">
          <CheckCircle2
            size={15}
            className="text-cyan-400"
          />
          <div>
            <p className="text-sm font-medium text-white">
              CI/CD operation completed
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {notification}
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
            {metrics
              ? `${Number(metrics.workflowSuccessRate || 0).toFixed(1)}%`
              : "—"}
          </p>
          <p className="mt-1 text-xs text-emerald-400">
            Recent workflow runs
          </p>
        </div>
        <div className="bg-secure-panel p-5">
          <p className="text-[10px] font-semibold tracking-wider text-secure-muted">
            ACTIVE WORKFLOWS
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {metrics?.activeWorkflows ?? workflows.length}
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
            {metrics?.pullRequests ?? pullRequests.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            GitHub pull requests
          </p>
        </div>
        <div className="bg-secure-panel p-5">
          <p className="text-[10px] font-semibold tracking-wider text-secure-muted">
            AVG. ANALYSIS
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {formatAverageDuration(
              metrics?.averageDuration ?? null,
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Workflow execution
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
              SecureAI evaluates repository changes through the connected CI/CD workflow.
            </p>
          </div>
          <GitPullRequest
            size={15}
            className="text-violet-400"
          />
        </div>
        <div className="overflow-x-auto px-5 py-5">
          <div className="flex min-w-[850px] items-center">
            {pipelineSteps.map((step, index, array) => {
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
          {filteredRuns.length === 0 ? (
            <div className="flex min-h-[260px] items-center justify-center px-5">
              <div className="text-center">
                <Workflow
                  size={22}
                  className="mx-auto text-slate-700"
                />
                <p className="mt-3 text-sm text-slate-400">
                  No workflow runs found
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Sync GitHub to fetch the latest Actions history.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-secure-border">
              {filteredRuns.map((run) => {
                const normalizedStatus =
                  normalizeRunStatus(run.status);
                const status =
                  runStatusStyles[normalizedStatus];
                const StatusIcon = status.icon;
                const isSelected =
                  selectedRun?.id === run.id;
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
                              {run.workflowName}
                            </p>
                            <p className="mt-1 truncate text-[10px] text-slate-500">
                              {getRunMessage(run)}
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
                            {run.branch || "—"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <GitCommitHorizontal size={10} />
                            {getCommitLabel(run.commitSha)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Timer size={10} />
                            {formatDuration(
                              run.startedAt,
                              run.completedAt,
                            )}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock3 size={10} />
                            {formatRelativeTime(run.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
        {/* Selected run */}
        <section className="border border-secure-border bg-secure-panel">
          <div className="border-b border-secure-border px-5 py-4">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-secure-muted">
              RUN DETAILS
            </p>
            {selectedRun ? (
              <>
                <p className="mt-2 text-sm font-medium text-white">
                  {selectedRun.workflowName}
                </p>
                <p className="mt-1 text-[10px] text-slate-600">
                  {getCommitLabel(selectedRun.commitSha)} ·{" "}
                  {selectedRun.branch || "unknown branch"}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Select a workflow run
              </p>
            )}
          </div>
          <div className="p-5">
            {selectedRun ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-secure-border bg-secure-panel-soft p-3">
                    <p className="text-[9px] text-slate-600">
                      STATUS
                    </p>
                    <p
                      className={`mt-2 text-xs font-medium ${
                        runStatusStyles[
                          normalizeRunStatus(selectedRun.status)
                        ].className
                      }`}
                    >
                      {
                        runStatusStyles[
                          normalizeRunStatus(selectedRun.status)
                        ].label
                      }
                    </p>
                  </div>
                  <div className="border border-secure-border bg-secure-panel-soft p-3">
                    <p className="text-[9px] text-slate-600">
                      DURATION
                    </p>
                    <p className="mt-2 text-xs font-medium text-white">
                      {formatDuration(
                        selectedRun.startedAt,
                        selectedRun.completedAt,
                      )}
                    </p>
                  </div>
                  <div className="border border-secure-border bg-secure-panel-soft p-3">
                    <p className="text-[9px] text-slate-600">
                      COMMIT
                    </p>
                    <p className="mt-2 text-xs font-medium text-white">
                      {getCommitLabel(selectedRun.commitSha)}
                    </p>
                  </div>
                  <div className="border border-secure-border bg-secure-panel-soft p-3">
                    <p className="text-[9px] text-slate-600">
                      CHECKS
                    </p>
                    <p className="mt-2 text-xs font-medium text-white">
                      {selectedRunCheckCounts.passed}/
                      {selectedRunCheckCounts.total}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-secure-muted">
                    CHECKS
                  </p>
                  {selectedRunChecks.length === 0 ? (
                    <div className="mt-3 border border-secure-border bg-secure-panel-soft p-4">
                      <p className="text-xs text-slate-500">
                        No check runs were returned for this workflow run.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {selectedRunChecks.map((check) => {
                        const normalizedStatus =
                          normalizeCheckStatus(check.status);
                        const status =
                          checkStatusStyles[normalizedStatus];
                        return (
                          <div
                            key={check.id}
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
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-[8px] text-slate-600">
                                  {check.conclusion && (
                                    <span>
                                      {check.conclusion}
                                    </span>
                                  )}
                                  {check.completedAt &&
                                    check.createdAt && (
                                      <span>
                                        {formatDuration(
                                          check.createdAt,
                                          check.completedAt,
                                        )}
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {normalizeRunStatus(selectedRun.status) ===
                  "failed" && (
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
                          GitHub Actions reported a failed workflow execution.
                          Review the associated checks and logs before merging.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  disabled={!selectedRunLogsUrl}
                  onClick={() => {
                    if (selectedRunLogsUrl) {
                      window.open(
                        selectedRunLogsUrl,
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }
                  }}
                  className="mt-5 flex w-full items-center justify-center gap-2 border border-secure-border py-2.5 text-[10px] text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Terminal size={12} />
                  View workflow logs
                </button>
              </>
            ) : (
              <div className="flex min-h-[300px] items-center justify-center text-center">
                <div>
                  <Workflow
                    size={22}
                    className="mx-auto text-slate-700"
                  />
                  <p className="mt-3 text-sm text-slate-500">
                    No workflow run selected
                  </p>
                </div>
              </div>
            )}
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
              Pull requests synchronized from the connected GitHub repository.
            </p>
          </div>
          <GitFork
            size={16}
            className="text-slate-500"
          />
        </div>
        {pullRequests.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center px-5 text-center">
            <div>
              <GitPullRequest
                size={22}
                className="mx-auto text-slate-700"
              />
              <p className="mt-3 text-sm text-slate-500">
                No pull requests found
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Sync GitHub to retrieve repository pull requests.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-secure-border text-[9px] font-semibold tracking-wider text-slate-600">
                  <th className="px-5 py-3">
                    PULL REQUEST
                  </th>
                  <th className="px-5 py-3">
                    BRANCH
                  </th>
                  <th className="px-5 py-3">
                    STATUS
                  </th>
                  <th className="px-5 py-3">
                    AUTHOR
                  </th>
                  <th className="px-5 py-3">
                    UPDATED
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secure-border">
                {pullRequests.map((pr) => {
                  const status = normalizePRStatus(
                    pr.status,
                  );
                  return (
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
                              #{pr.number ?? "—"} {pr.title}
                            </p>
                            <p className="mt-1 text-[9px] text-slate-600">
                              {pr.targetBranch
                                ? `→ ${pr.targetBranch}`
                                : "GitHub pull request"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-[10px] text-slate-500">
                          <GitBranch size={11} />
                          {pr.sourceBranch || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {status === "ready" ? (
                          <span className="flex items-center gap-2 text-[9px] font-medium text-emerald-400">
                            <CheckCircle2 size={11} />
                            MERGED
                          </span>
                        ) : status === "blocked" ? (
                          <span className="flex items-center gap-2 text-[9px] font-medium text-red-400">
                            <XCircle size={11} />
                            CLOSED
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-[9px] font-medium text-amber-400">
                            <CircleDot size={11} />
                            OPEN
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] text-slate-500">
                          {pr.author || "Unknown"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] text-slate-600">
                          {formatRelativeTime(pr.updatedAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* Bottom status */}
      <div className="flex flex-col gap-3 border border-secure-border bg-secure-panel px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-slate-500">
            GitHub Actions integration connected
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-[9px] text-slate-600">
          <span>{workflows.length} workflows</span>
          <span>{pullRequests.length} pull requests</span>
          <span>{workflowRuns.length} workflow runs</span>
          <span>Live GitHub synchronization</span>
        </div>
      </div>
      {/* Integration status */}
      <div className="flex items-start gap-3 border border-secure-border bg-secure-panel px-5 py-4">
        <GitFork
          size={14}
          className="mt-0.5 shrink-0 text-slate-500"
        />
        <div>
          <p className="text-xs font-medium text-slate-300">
            CI/CD intelligence connected
          </p>
          <p className="mt-1 text-[10px] leading-5 text-slate-600">
            SecureAI is now connected to the repository's GitHub Actions,
            workflow runs, check runs, and pull requests through the backend
            CI/CD intelligence service.
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
