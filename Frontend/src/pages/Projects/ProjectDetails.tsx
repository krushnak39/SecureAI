import {
  Activity,
  ArrowLeft,
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
  Loader2,
  MessageSquare,
  Network,
  Play,
  RefreshCw,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "../../services/api";

interface ProjectAnalysis {
  id: string;
  status: string;
  trigger: string;
  branch: string | null;
  commitSha: string | null;

  healthScore: number | null;
  codeQuality: number | null;
  securityScore: number | null;
  performance: number | null;
  architecture: number | null;
  maintainability: number | null;

  filesAnalyzed: number;
  linesAnalyzed: number;

  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;

  errorMessage?: string | null;
}

interface ProjectRepository {
  id: string;
  provider: string;
  externalId: string | null;
  name: string;
  fullName: string;
  url: string;
  defaultBranch: string;
  branch: string | null;
  language: string | null;
  isPrivate: boolean;

  connectedAt: string;
  lastAnalyzed: string | null;

  latestAnalysis: ProjectAnalysis | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  repository: ProjectRepository | null;
}

interface ProjectResponse {
  success: boolean;
  project: Project;
}

interface RunAnalysisResponse {
  success: boolean;
  message: string;
  analysis: ProjectAnalysis;
  summary: {
    filesAnalyzed: number;
    linesAnalyzed: number;
    skippedFiles: number;
    archiveBytes: number;
    languages: Array<{
      language: string;
      files: number;
      lines: number;
    }>;
  };
}

const modules: {
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
  metric: string;
}[] = [
  {
    title: "Code Review",
    description:
      "AI findings across code quality and maintainability.",
    icon: Code2,
    route: "review",
    metric: "Analysis pending",
  },
  {
    title: "Security",
    description:
      "Security issues, exposure risks, and remediation.",
    icon: ShieldCheck,
    route: "security",
    metric: "Analysis pending",
  },
  {
    title: "Dependencies",
    description:
      "Package health, advisories, and upgrade intelligence.",
    icon: Boxes,
    route: "dependencies",
    metric: "Analysis pending",
  },
  {
    title: "Architecture",
    description:
      "System boundaries, relationships, and coupling signals.",
    icon: Network,
    route: "architecture",
    metric: "Analysis pending",
  },
  {
    title: "Performance",
    description:
      "Hotspots affecting API, database, and frontend speed.",
    icon: Zap,
    route: "performance",
    metric: "Analysis pending",
  },
  {
    title: "Codebase Chat",
    description:
      "Ask questions against repository-aware AI context.",
    icon: MessageSquare,
    route: "chat",
    metric: "RAG pending",
  },
  {
    title: "Documentation",
    description:
      "Generate and inspect repository documentation.",
    icon: FileCode2,
    route: "documentation",
    metric: "Generation pending",
  },
  {
    title: "CI/CD",
    description:
      "Pull request checks and automated analysis results.",
    icon: GitCommitHorizontal,
    route: "cicd",
    metric: "Integration pending",
  },
];

const pipelineSteps = [
  {
    step: "01",
    title: "Repository",
    icon: GitFork,
  },
  {
    step: "02",
    title: "Understand",
    icon: Code2,
  },
  {
    step: "03",
    title: "Analyze",
    icon: ScanSearch,
  },
  {
    step: "04",
    title: "Reason",
    icon: Bot,
  },
  {
    step: "05",
    title: "Act",
    icon: ArrowRight,
  },
] satisfies Array<{
  step: string;
  title: string;
  icon: LucideIcon;
}>;

function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] =
    useState<Project | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const [runningAnalysis, setRunningAnalysis] =
    useState(false);

  const [analysisMessage, setAnalysisMessage] =
    useState("");

  const [analysisError, setAnalysisError] =
    useState("");

  async function loadProject(
    showRefreshState = false,
  ) {
    if (!id) {
      setError("Project ID is missing.");
      setLoading(false);
      return;
    }

    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await apiRequest<ProjectResponse>(
          `/projects/${id}`,
        );

      setProject(response.project);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load project.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRunAnalysis() {
    if (!id) {
      setAnalysisError(
        "Project ID is missing.",
      );
      return;
    }

    if (!project?.repository) {
      setAnalysisError(
        "Connect a GitHub repository before running an analysis.",
      );
      return;
    }

    try {
      setRunningAnalysis(true);
      setAnalysisMessage("");
      setAnalysisError("");

      const response =
        await apiRequest<RunAnalysisResponse>(
          `/analysis/projects/${id}/analyze`,
          {
            method: "POST",
          },
        );

      setAnalysisMessage(
        `Analysis completed: ${response.summary.filesAnalyzed.toLocaleString()} files and ${response.summary.linesAnalyzed.toLocaleString()} lines analyzed.`,
      );

      await loadProject(true);
    } catch (err) {
      setAnalysisError(
        err instanceof Error
          ? err.message
          : "Unable to run repository analysis.",
      );
    } finally {
      setRunningAnalysis(false);
    }
  }

  useEffect(() => {
    loadProject();
  }, [id]);

  const analysis =
    project?.repository?.latestAnalysis;

  const metrics = useMemo(
    () => [
      {
        label: "PROJECT HEALTH",
        value: analysis?.healthScore,
        note: analysis
          ? "Latest analysis"
          : "Not analyzed",
      },
      {
        label: "CODE QUALITY",
        value: analysis?.codeQuality,
        note: analysis
          ? "Latest analysis"
          : "Not analyzed",
      },
      {
        label: "SECURITY",
        value: analysis?.securityScore,
        note: analysis
          ? "Latest analysis"
          : "Not analyzed",
      },
      {
        label: "PERFORMANCE",
        value: analysis?.performance,
        note: analysis
          ? "Latest analysis"
          : "Not analyzed",
      },
      {
        label: "ARCHITECTURE",
        value: analysis?.architecture,
        note: analysis
          ? "Latest analysis"
          : "Not analyzed",
      },
    ],
    [analysis],
  );

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Activity
            size={20}
            className="mx-auto animate-pulse text-violet-400"
          />

          <p className="mt-4 text-sm text-slate-400">
            Loading project...
          </p>

          <p className="mt-1 text-xs text-slate-700">
            Fetching repository intelligence.
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-[calc(100vh-4rem)]">
        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="flex items-center gap-2 text-xs text-slate-600 transition hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to projects
        </button>

        <div className="mt-8 border border-red-500/20 bg-red-500/5 p-8 text-center">
          <XCircle
            size={22}
            className="mx-auto text-red-400"
          />

          <h1 className="mt-4 text-lg font-semibold">
            Project unavailable
          </h1>

          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-red-400/80">
            {error ||
              "The requested project could not be found."}
          </p>

          <button
            type="button"
            onClick={() => loadProject()}
            className="mt-5 border border-red-500/20 px-4 py-2.5 text-xs text-red-300 transition hover:bg-red-500/5"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const repository = project.repository;

  const repositoryLanguage =
    repository?.language ?? "Not detected";

  /*
   * Canonical project workspace base.
   *
   * Every intelligence module is intentionally scoped
   * to this project so the project context is never lost.
   *
   * Example:
   * /projects/:id/review
   * /projects/:id/security
   * /projects/:id/chat
   */
  const projectWorkspacePath = `/projects/${project.id}`;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b border-slate-800/70 pb-6">
        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="mb-5 flex items-center gap-2 text-xs text-slate-600 transition hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to projects
        </button>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.18em] text-slate-600">
              <GitFork size={13} />
              PROJECT / REPOSITORY
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                {project.name}
              </h1>

              <span
                className={`border px-2 py-1 text-[9px] font-medium tracking-wider ${
                  project.status === "ACTIVE"
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                    : "border-slate-700 bg-slate-800/30 text-slate-500"
                }`}
              >
                {project.status}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {project.description ||
                "No project description has been added yet."}
            </p>

            {repository && (
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <GitFork size={13} />
                  {repository.fullName}
                </span>

                <span className="flex items-center gap-1.5">
                  <GitBranch size={13} />
                  {repository.branch ||
                    repository.defaultBranch}
                </span>

                <span className="flex items-center gap-1.5">
                  <Clock3 size={13} />
                  {repository.lastAnalyzed
                    ? `Analyzed ${new Date(
                        repository.lastAnalyzed,
                      ).toLocaleString()}`
                    : "Never analyzed"}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                loadProject(true)
              }
              disabled={
                refreshing ||
                runningAnalysis
              }
              className="flex items-center gap-2 border border-slate-700 bg-[#090e18] px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={
                runningAnalysis ||
                !repository
              }
              title={
                !repository
                  ? "Connect a GitHub repository first"
                  : undefined
              }
              className="flex items-center gap-2 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {runningAnalysis ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Play size={15} />
              )}

              {runningAnalysis
                ? "Analyzing..."
                : "Run analysis"}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis feedback */}
      {analysisMessage && (
        <section className="mt-6 border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={17}
              className="mt-0.5 text-emerald-400"
            />

            <div>
              <p className="text-sm font-medium text-emerald-300">
                Analysis completed
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-400/70">
                {analysisMessage}
              </p>
            </div>
          </div>
        </section>
      )}

      {analysisError && (
        <section className="mt-6 border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert
              size={17}
              className="mt-0.5 text-red-400"
            />

            <div>
              <p className="text-sm font-medium text-red-300">
                Analysis failed
              </p>

              <p className="mt-1 text-xs leading-5 text-red-400/70">
                {analysisError}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Repository connection status */}
      {!repository && (
        <section className="mt-6 border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <GitFork
              size={18}
              className="mt-0.5 text-amber-400"
            />

            <div>
              <p className="text-sm font-medium text-amber-300">
                No repository connected
              </p>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-amber-400/70">
                This project exists in SecureAI, but it
                is not connected to a repository yet. Connect
                a GitHub repository from the Projects workspace
                before running analysis.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Health Overview */}
      <section className="mt-6 border border-slate-800 bg-[#090e18]">
        <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              Repository health
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Scores appear here after SecureAI completes
              the corresponding analysis engines.
            </p>
          </div>

          <span className="text-[10px] tracking-wider text-slate-600">
            {analysis
              ? `ANALYSIS ${analysis.id
                  .slice(-6)
                  .toUpperCase()}`
              : "NO ANALYSIS YET"}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((item, index) => (
            <div
              key={item.label}
              className={`border-b border-slate-800 p-5 ${
                index < 4
                  ? "lg:border-r"
                  : ""
              }`}
            >
              <p className="text-[9px] tracking-[0.14em] text-slate-600">
                {item.label}
              </p>

              <div className="mt-3 flex items-end justify-between">
                <span className="text-3xl font-semibold">
                  {item.value ?? "—"}
                </span>

                <span className="text-[10px] text-slate-600">
                  {item.note}
                </span>
              </div>

              {item.value !== null &&
                item.value !== undefined && (
                  <div className="mt-4 h-1 bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                      style={{
                        width: `${item.value}%`,
                      }}
                    />
                  </div>
                )}
            </div>
          ))}
        </div>
      </section>

      {/* Repository Context */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="border border-slate-800 bg-[#090e18]">
          <div className="border-b border-slate-800 px-5 py-4">
            <p className="text-sm font-medium">
              Repository context
            </p>
          </div>

          <div className="space-y-4 p-5">
            <InfoRow
              label="Repository"
              value={
                repository?.fullName ??
                "Not connected"
              }
            />

            <InfoRow
              label="Provider"
              value={
                repository?.provider ??
                "Not connected"
              }
            />

            <InfoRow
              label="Branch"
              value={
                repository?.branch ??
                repository?.defaultBranch ??
                "—"
              }
            />

            <InfoRow
              label="Language"
              value={repositoryLanguage}
            />

            <InfoRow
              label="Visibility"
              value={
                repository
                  ? repository.isPrivate
                    ? "Private"
                    : "Public"
                  : "—"
              }
            />

            <InfoRow
              label="Connected"
              value={
                repository
                  ? new Date(
                      repository.connectedAt,
                    ).toLocaleString()
                  : "—"
              }
            />
          </div>
        </section>

        <section className="border border-slate-800 bg-[#090e18]">
          <div className="border-b border-slate-800 px-5 py-4">
            <p className="text-sm font-medium">
              Analysis statistics
            </p>
          </div>

          <div className="space-y-4 p-5">
            <InfoRow
              label="Files analyzed"
              value={
                analysis
                  ? analysis.filesAnalyzed.toLocaleString()
                  : "—"
              }
            />

            <InfoRow
              label="Lines analyzed"
              value={
                analysis
                  ? analysis.linesAnalyzed.toLocaleString()
                  : "—"
              }
            />

            <InfoRow
              label="Analysis status"
              value={
                analysis?.status ??
                "Not started"
              }
            />

            <InfoRow
              label="Trigger"
              value={
                analysis?.trigger ?? "—"
              }
            />

            <InfoRow
              label="Commit"
              value={
                analysis?.commitSha
                  ? analysis.commitSha.slice(
                      0,
                      8,
                    )
                  : "—"
              }
            />

            <InfoRow
              label="Last updated"
              value={
                analysis
                  ? new Date(
                      analysis.createdAt,
                    ).toLocaleString()
                  : "—"
              }
            />

            {analysis?.errorMessage && (
              <InfoRow
                label="Error"
                value={
                  analysis.errorMessage
                }
              />
            )}
          </div>
        </section>

        <section className="border border-slate-800 bg-[#090e18]">
          <div className="border-b border-slate-800 px-5 py-4">
            <p className="text-sm font-medium">
              Repository signals
            </p>
          </div>

          <div className="space-y-4 p-5">
            <Signal
              active={Boolean(repository)}
              text="Repository connected"
            />

            <Signal
              active={Boolean(repository)}
              text="Repository metadata available"
            />

            <Signal
              active={Boolean(analysis)}
              text="Repository analyzed"
            />

            <Signal
              active={
                analysis?.status ===
                "COMPLETED"
              }
              text="Analysis results available"
            />
          </div>
        </section>
      </div>

      {/* Engineering Intelligence */}
      <section className="mt-5 border border-slate-800 bg-[#090e18]">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <p className="text-sm font-medium">
              Engineering intelligence
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Analysis modules connected to this repository.
            </p>
          </div>

          <Layers3
            size={16}
            className="text-slate-600"
          />
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;
            const modulePath = `${projectWorkspacePath}/${module.route}`;

            return (
              <Link
                key={module.title}
                to={modulePath}
                className="group border-b border-slate-800 p-5 transition hover:bg-[#0d1422] sm:nth-[even]:border-l xl:border-r xl:nth-[4n]:border-r-0"
              >
                <div className="flex items-start justify-between">
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

      {/* Analysis pipeline */}
      <section className="mt-5 border border-slate-800 bg-[#090e18]">
        <div className="border-b border-slate-800 px-5 py-4">
          <p className="text-sm font-medium">
            SecureAI analysis pipeline
          </p>

          <p className="mt-1 text-xs text-slate-600">
            The repository moves through the analysis engine
            before results become available across the workspace.
          </p>
        </div>

        <div className="grid md:grid-cols-5">
          {pipelineSteps.map(
            (
              {
                step,
                title,
                icon: Icon,
              },
              index,
            ) => (
              <div
                key={title}
                className={`relative border-b border-slate-800 p-5 ${
                  index < 4
                    ? "md:border-r"
                    : ""
                }`}
              >
                <span className="text-[9px] tracking-[0.15em] text-slate-700">
                  {step}
                </span>

                <Icon
                  size={16}
                  className="mt-4 text-violet-400"
                />

                <p className="mt-3 text-xs font-medium">
                  {title}
                </p>
              </div>
            ),
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="border border-slate-800 bg-[#090e18]">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <p className="text-sm font-medium">
                Quick actions
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Jump directly into the engineering workspace.
              </p>
            </div>

            <BarChart3
              size={16}
              className="text-slate-600"
            />
          </div>

          <div className="grid sm:grid-cols-2">
            <QuickAction
              to={`${projectWorkspacePath}/review`}
              icon={Code2}
              label="Review code"
            />

            <QuickAction
              to={`${projectWorkspacePath}/security`}
              icon={ShieldCheck}
              label="Inspect security"
            />

            <QuickAction
              to={`${projectWorkspacePath}/chat`}
              icon={MessageSquare}
              label="Ask the codebase"
            />

            <QuickAction
              to={`${projectWorkspacePath}/cicd`}
              icon={Terminal}
              label="Inspect CI/CD"
            />
          </div>
        </section>

        <section className="border border-slate-800 bg-[#090e18]">
          <div className="border-b border-slate-800 px-5 py-4">
            <p className="text-sm font-medium">
              Current state
            </p>
          </div>

          <div className="space-y-4 p-5">
            <StateRow
              icon={
                repository
                  ? CheckCircle2
                  : ShieldAlert
              }
              label={
                repository
                  ? "Repository connected"
                  : "Repository connection pending"
              }
              active={Boolean(repository)}
            />

            <StateRow
              icon={
                analysis?.status ===
                "COMPLETED"
                  ? CheckCircle2
                  : Clock3
              }
              label={
                runningAnalysis
                  ? "Analysis currently running"
                  : analysis
                    ? `Analysis status: ${analysis.status}`
                    : "Analysis not yet performed"
              }
              active={
                runningAnalysis ||
                analysis?.status ===
                  "COMPLETED"
              }
            />

            <StateRow
              icon={Activity}
              label={
                analysis
                  ? `Latest analysis created ${new Date(
                      analysis.createdAt,
                    ).toLocaleString()}`
                  : "Analysis engine ready"
              }
              active
            />
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="mt-5 flex flex-col gap-2 border border-slate-800 bg-[#090e18] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Activity
            size={14}
            className="text-emerald-400"
          />
          SecureAI project workspace
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-700">
          <GitCommitHorizontal size={12} />
          Project ID: {project.id}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-5 text-xs">
      <span className="text-slate-600">
        {label}
      </span>

      <span className="max-w-[65%] break-words text-right text-slate-400">
        {value}
      </span>
    </div>
  );
}

function Signal({
  active,
  text,
}: {
  active: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {active ? (
        <CheckCircle2
          size={15}
          className="text-emerald-400"
        />
      ) : (
        <Clock3
          size={15}
          className="text-slate-600"
        />
      )}

      <span
        className={`text-xs ${
          active
            ? "text-slate-400"
            : "text-slate-600"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between border-b border-slate-800 p-4 text-xs text-slate-400 transition hover:bg-[#0d1422] hover:text-white sm:nth-[even]:border-l"
    >
      <span className="flex items-center gap-2">
        <Icon size={14} />
        {label}
      </span>

      <ArrowRight size={13} />
    </Link>
  );
}

function StateRow({
  icon: Icon,
  label,
  active,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon
        size={15}
        className={
          active
            ? "text-emerald-400"
            : "text-slate-600"
        }
      />

      <span className="text-xs text-slate-500">
        {label}
      </span>
    </div>
  );
}

export default ProjectDetails;