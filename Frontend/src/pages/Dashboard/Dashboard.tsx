import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  GitCommit,
  GitFork,
  ShieldAlert,
  Sparkles,
  Zap,
  FolderGit2,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";

import MetricCard from "../../components/common/MetricCard";
import SectionCard from "../../components/common/SectionCard";
import StatusBadge from "../../components/common/StatusBadge";
import { apiRequest } from "../../services/api";

type Project = {
  id: string;
  name: string;
  description?: string | null;

  repository?: {
    id?: string;
    name?: string;
    fullName?: string;
    url?: string;
    branch?: string | null;
    defaultBranch?: string | null;
    language?: string | null;
    isPrivate?: boolean;
  } | null;

  latestAnalysis?: {
    id?: string;
    status?: string;
    securityScore?: number | null;
    filesAnalyzed?: number | null;
    linesAnalyzed?: number | null;
    completedAt?: string | null;
  } | null;
};

type Finding = {
  id: string;
  severity: string;
  title?: string;
  category?: string;
};

type FindingsResponse = {
  success: boolean;

  analysis: {
    id: string;
    status: string;
    filesAnalyzed: number | null;
    linesAnalyzed: number | null;
    codeQuality: number | null;
    securityScore: number | null;
    performance: number | null;
    architecture: number | null;
    maintainability: number | null;
    healthScore: number | null;
    completedAt: string | null;
  } | null;

  findings: Finding[];
};

type PerformanceResponse = {
  success: boolean;

  analysis: {
    id: string;
    status: string;
    branch: string | null;
    commitSha: string | null;
    filesAnalyzed: number | null;
    linesAnalyzed: number | null;
    performance: number | null;
    completedAt: string | null;
  } | null;

  metrics: {
    performanceHealth: number | null;
    issueCount: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
  };

  issues: unknown[];
};

type DependencyResponse = {
  projectId: string;

  repository: {
    id: string;
    name: string;
    fullName: string;
    branch: string | null;
    defaultBranch: string | null;
    lastAnalyzed: string | null;
  } | null;

  dependencies: unknown[];

  summary: {
    total: number;
    direct: number;
    transitive: number;
    vulnerable: number;
    outdated: number;
    healthy: number;
  };
};

type ArchitectureResponse = {
  success: boolean;

  data: {
    analysis: {
      id: string;
      branch: string | null;
      commitSha: string | null;
      createdAt: string;
      completedAt: string | null;
    } | null;

    architecture: {
      health: number | null;
      components: unknown[];
      relationships: unknown[];
      findings: Finding[];
    };
  };
};

type DashboardData = {
  findings: FindingsResponse | null;
  performance: PerformanceResponse | null;
  dependencies: DependencyResponse | null;
  architecture: ArchitectureResponse | null;
};

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return value.toLocaleString();
}

function formatScore(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function getSeverityCounts(findings: Finding[]) {
  return {
    critical: findings.filter(
      (finding) => finding.severity === "CRITICAL",
    ).length,

    high: findings.filter(
      (finding) => finding.severity === "HIGH",
    ).length,

    medium: findings.filter(
      (finding) => finding.severity === "MEDIUM",
    ).length,

    low: findings.filter(
      (finding) => finding.severity === "LOW",
    ).length,
  };
}

function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] =
    useState<string>("");

  const [dashboardData, setDashboardData] =
    useState<DashboardData>({
      findings: null,
      performance: null,
      dependencies: null,
      architecture: null,
    });

  const [loading, setLoading] = useState(true);
  const [intelligenceLoading, setIntelligenceLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [intelligenceError, setIntelligenceError] =
    useState("");

  /*
   * Load projects.
   */
  useEffect(() => {
    let mounted = true;

    async function loadProjects() {
      try {
        setLoading(true);
        setError("");

        const response = await apiRequest<
          Project[] | { projects: Project[] }
        >("/projects");

        const projectList = Array.isArray(response)
          ? response
          : response.projects ?? [];

        if (!mounted) {
          return;
        }

        setProjects(projectList);

        if (projectList.length > 0) {
          setSelectedProjectId((currentId) => {
            const stillExists = projectList.some(
              (project) => project.id === currentId,
            );

            return stillExists
              ? currentId
              : projectList[0].id;
          });
        }
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load projects.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) => project.id === selectedProjectId,
      ) ?? null,
    [projects, selectedProjectId],
  );

  /*
   * Load intelligence for the selected project.
   *
   * These are all existing SecureAI backend APIs.
   */
  useEffect(() => {
    if (!selectedProjectId) {
      setDashboardData({
        findings: null,
        performance: null,
        dependencies: null,
        architecture: null,
      });

      return;
    }

    let mounted = true;

    async function loadIntelligence() {
      try {
        setIntelligenceLoading(true);
        setIntelligenceError("");

        const [
          findingsResult,
          performanceResult,
          dependencyResult,
          architectureResult,
        ] = await Promise.allSettled([
          apiRequest<FindingsResponse>(
            `/projects/${selectedProjectId}/findings`,
          ),

          apiRequest<PerformanceResponse>(
            `/projects/${selectedProjectId}/performance`,
          ),

          apiRequest<DependencyResponse>(
            `/projects/${selectedProjectId}/dependencies`,
          ),

          apiRequest<ArchitectureResponse>(
            `/projects/${selectedProjectId}/architecture`,
          ),
        ]);

        if (!mounted) {
          return;
        }

        const nextData: DashboardData = {
          findings:
            findingsResult.status === "fulfilled"
              ? findingsResult.value
              : null,

          performance:
            performanceResult.status === "fulfilled"
              ? performanceResult.value
              : null,

          dependencies:
            dependencyResult.status === "fulfilled"
              ? dependencyResult.value
              : null,

          architecture:
            architectureResult.status === "fulfilled"
              ? architectureResult.value
              : null,
        };

        setDashboardData(nextData);

        const failedRequests = [
          findingsResult,
          performanceResult,
          dependencyResult,
          architectureResult,
        ].filter(
          (result) => result.status === "rejected",
        ).length;

        if (failedRequests > 0) {
          setIntelligenceError(
            `${failedRequests} intelligence module${
              failedRequests > 1 ? "s" : ""
            } could not be loaded.`,
          );
        }
      } catch (err) {
        if (!mounted) {
          return;
        }

        setIntelligenceError(
          err instanceof Error
            ? err.message
            : "Unable to load project intelligence.",
        );
      } finally {
        if (mounted) {
          setIntelligenceLoading(false);
        }
      }
    }

    loadIntelligence();

    return () => {
      mounted = false;
    };
  }, [selectedProjectId]);

  /*
   * Project-aware routes.
   */
  const projectPath = selectedProject
    ? `/projects/${selectedProject.id}`
    : "/projects";

  const reviewPath = selectedProject
    ? `/projects/${selectedProject.id}/review`
    : "/projects";

  const securityPath = selectedProject
    ? `/projects/${selectedProject.id}/security`
    : "/projects";

  const dependenciesPath = selectedProject
    ? `/projects/${selectedProject.id}/dependencies`
    : "/projects";

  const architecturePath = selectedProject
    ? `/projects/${selectedProject.id}/architecture`
    : "/projects";

  const performancePath = selectedProject
    ? `/projects/${selectedProject.id}/performance`
    : "/projects";

  const chatPath = selectedProject
    ? `/projects/${selectedProject.id}/chat`
    : "/projects";

  const documentationPath = selectedProject
    ? `/projects/${selectedProject.id}/documentation`
    : "/projects";

  const cicdPath = selectedProject
    ? `/projects/${selectedProject.id}/cicd`
    : "/projects";

  const repositoryPath =
    selectedProject?.repository?.fullName ||
    selectedProject?.name ||
    "Create or connect a repository";

  const branch =
    selectedProject?.repository?.branch ||
    selectedProject?.repository?.defaultBranch ||
    "main";

  /*
   * Real analysis data.
   *
   * Findings API is the main source because it returns
   * the complete latest completed analysis scores.
   */
  const analysis =
    dashboardData.findings?.analysis ?? null;

  const findings =
    dashboardData.findings?.findings ?? [];

  const performanceMetrics =
    dashboardData.performance?.metrics ?? null;

  const dependencySummary =
    dashboardData.dependencies?.summary ?? null;

  const architecture =
    dashboardData.architecture?.data.architecture ?? null;

  const hasCompletedAnalysis =
    analysis?.status === "COMPLETED";

  const healthScore =
    formatScore(analysis?.healthScore);

  const codeQualityScore =
    formatScore(analysis?.codeQuality);

  const securityScore =
    formatScore(analysis?.securityScore);

  const performanceScore =
    formatScore(
      analysis?.performance ??
        performanceMetrics?.performanceHealth,
    );

  const architectureScore =
    formatScore(
      analysis?.architecture ??
        architecture?.health,
    );

  const maintainabilityScore =
    formatScore(analysis?.maintainability);

  const dependencyScore =
    dependencySummary &&
    dependencySummary.total > 0
      ? Math.round(
          (dependencySummary.healthy /
            dependencySummary.total) *
            100,
        )
      : null;

  const severityCounts =
    getSeverityCounts(findings);

  const totalFindingCount =
    findings.length;

  const totalPerformanceIssues =
    performanceMetrics?.issueCount ?? 0;

  const totalIssues =
    totalFindingCount +
    totalPerformanceIssues;

  const filesAnalyzed =
    analysis?.filesAnalyzed ??
    selectedProject?.latestAnalysis?.filesAnalyzed ??
    null;

  const linesAnalyzed =
    analysis?.linesAnalyzed ??
    selectedProject?.latestAnalysis?.linesAnalyzed ??
    null;

  const completedAt =
    analysis?.completedAt ??
    selectedProject?.latestAnalysis?.completedAt ??
    null;

  /*
   * Generate the dashboard brief from actual data.
   */
  const briefItems = useMemo(() => {
    const items: string[] = [];

    if (severityCounts.critical > 0) {
      items.push(
        `${severityCounts.critical} critical security/code finding${
          severityCounts.critical > 1 ? "s" : ""
        } require immediate attention.`,
      );
    }

    if (severityCounts.high > 0) {
      items.push(
        `${severityCounts.high} high-severity finding${
          severityCounts.high > 1 ? "s" : ""
        } should be reviewed.`,
      );
    }

    if (
      dependencySummary &&
      dependencySummary.vulnerable > 0
    ) {
      items.push(
        `${dependencySummary.vulnerable} vulnerable dependenc${
          dependencySummary.vulnerable > 1
            ? "ies"
            : "y"
        } detected.`,
      );
    }

    if (
      dependencySummary &&
      dependencySummary.outdated > 0
    ) {
      items.push(
        `${dependencySummary.outdated} outdated dependenc${
          dependencySummary.outdated > 1
            ? "ies"
            : "y"
        } may need upgrades.`,
      );
    }

    if (
      performanceMetrics &&
      performanceMetrics.highSeverityCount > 0
    ) {
      items.push(
        `${performanceMetrics.highSeverityCount} high-severity performance issue${
          performanceMetrics.highSeverityCount > 1
            ? "s"
            : ""
        } detected.`,
      );
    }

    if (
      architecture &&
      architecture.findings.length > 0
    ) {
      items.push(
        `${architecture.findings.length} architecture finding${
          architecture.findings.length > 1
            ? "s"
            : ""
        } detected across the repository.`,
      );
    }

    if (items.length === 0) {
      if (hasCompletedAnalysis) {
        items.push(
          "No major issues were reported by the currently available intelligence modules.",
        );
      } else {
        items.push(
          "Run a repository analysis to generate project intelligence.",
        );
      }
    }

    return items.slice(0, 4);
  }, [
    severityCounts,
    dependencySummary,
    performanceMetrics,
    architecture,
    hasCompletedAnalysis,
  ]);

  const recommendedAction =
    severityCounts.critical > 0 ||
    severityCounts.high > 0
      ? "Review high-severity findings."
      : dependencySummary?.vulnerable
        ? "Review vulnerable dependencies."
        : performanceMetrics &&
            performanceMetrics.highSeverityCount >
              0
          ? "Review performance hotspots."
          : architecture &&
              architecture.findings.length > 0
            ? "Review architecture findings."
            : "Run the next repository analysis.";

  return (
    <div className="space-y-8">
      {/* Project selector / repository header */}
      <section className="border border-secure-border bg-secure-panel">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-violet-500/20 bg-violet-500/10 text-violet-400">
              <FolderGit2 size={21} />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secure-muted">
                Active Project
              </p>

              <div className="relative mt-1">
                <select
                  value={selectedProjectId}
                  onChange={(event) =>
                    setSelectedProjectId(
                      event.target.value,
                    )
                  }
                  disabled={
                    loading ||
                    projects.length === 0
                  }
                  className="cursor-pointer appearance-none bg-transparent pr-7 text-lg font-semibold text-white outline-none disabled:cursor-not-allowed disabled:text-slate-600"
                >
                  {projects.length === 0 ? (
                    <option value="">
                      No projects available
                    </option>
                  ) : (
                    projects.map((project) => (
                      <option
                        key={project.id}
                        value={project.id}
                        className="bg-slate-900 text-white"
                      >
                        {project.name}
                      </option>
                    ))
                  )}
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-secure-muted"
                />
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-secure-muted">
                <GitFork size={12} />

                <span>{repositoryPath}</span>

                <span>•</span>

                <span>{branch}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedProject && (
              <>
                <Link
                  to={projectPath}
                  className="inline-flex items-center gap-2 border border-secure-border bg-secure-panel-soft px-3 py-2 text-xs font-medium text-secure-muted transition hover:border-slate-600 hover:text-white"
                >
                  Open project
                  <ArrowRight size={13} />
                </Link>

                <Link
                  to={securityPath}
                  className="inline-flex items-center gap-2 border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                >
                  <ShieldAlert size={13} />
                  Security
                </Link>
              </>
            )}

            <Link
              to="/projects"
              className="inline-flex items-center gap-2 border border-secure-border px-3 py-2 text-xs font-medium text-secure-muted transition hover:border-slate-600 hover:text-white"
            >
              Manage projects
            </Link>
          </div>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="border border-secure-border bg-secure-panel p-8 text-center">
          <div className="text-sm text-secure-muted">
            Loading projects...
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-red-300">
            <ShieldAlert size={16} />
            Unable to load projects
          </div>

          <p className="mt-2 text-xs text-secure-muted">
            {error}
          </p>

          <Link
            to="/projects"
            className="mt-4 inline-flex items-center gap-2 border border-red-500/20 px-3 py-2 text-xs text-red-300"
          >
            Open project manager
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* No projects */}
      {!loading &&
        !error &&
        projects.length === 0 && (
          <div className="border border-secure-border bg-secure-panel p-10 text-center">
            <FolderGit2
              size={32}
              className="mx-auto text-secure-muted"
            />

            <h2 className="mt-4 text-lg font-semibold text-white">
              No projects yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-secure-muted">
              Create a project and connect a GitHub
              repository to start using SecureAI
              intelligence.
            </p>

            <Link
              to="/projects"
              className="mt-5 inline-flex items-center gap-2 bg-violet-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-violet-500"
            >
              Create your first project
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

      {/* Project dashboard */}
      {!loading &&
        !error &&
        selectedProject && (
          <>
            {/* Intelligence loading indicator */}
            {intelligenceLoading && (
              <div className="border border-violet-500/10 bg-violet-500/[0.03] px-4 py-3 text-xs text-secure-muted">
                Loading project intelligence...
              </div>
            )}

            {intelligenceError && (
              <div className="border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300">
                {intelligenceError}
              </div>
            )}

            {/* Engineering Intelligence */}
            <section>
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-400">
                    Engineering Intelligence
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {selectedProject.name} Health
                  </h2>

                  <p className="mt-1 text-sm text-secure-muted">
                    A high-level view of this project's
                    engineering health.
                  </p>
                </div>

                <div className="hidden items-center gap-2 text-xs text-secure-muted sm:flex">
                  <Activity size={14} />
                  Project intelligence
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr_1fr_1fr]">
                {/* Overall Health */}
                <div className="border border-secure-border bg-secure-panel p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-secure-muted">
                        Overall Health
                      </p>

                      <div className="mt-3 flex items-end gap-2">
                        <span className="text-5xl font-semibold tracking-tight text-white">
                          {healthScore ?? "—"}
                        </span>

                        {healthScore !== null && (
                          <span className="mb-1 text-sm text-secure-muted">
                            / 100
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center border border-violet-500/20 bg-violet-500/10 text-violet-400">
                      <Sparkles size={20} />
                    </div>
                  </div>

                  {healthScore !== null && (
                    <div className="mt-6 h-2 overflow-hidden bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                        style={{
                          width: `${healthScore}%`,
                        }}
                      />
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-secure-muted">
                      Engineering health score
                    </span>

                    <span className="text-secure-muted">
                      {hasCompletedAnalysis
                        ? "Latest completed analysis"
                        : "Analysis unavailable"}
                    </span>
                  </div>
                </div>

                {/* Files Analyzed */}
                <div className="border border-secure-border bg-secure-panel p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-secure-muted">
                      Files Analyzed
                    </p>

                    <CheckCircle2
                      size={18}
                      className="text-emerald-400"
                    />
                  </div>

                  <p className="mt-5 text-3xl font-semibold text-white">
                    {formatNumber(filesAnalyzed)}
                  </p>

                  <p className="mt-2 text-xs text-secure-muted">
                    Repository files processed
                  </p>

                  <div className="mt-5 text-xs text-secure-muted">
                    {formatNumber(linesAnalyzed)} lines analyzed
                  </div>
                </div>

                {/* Findings */}
                <div className="border border-secure-border bg-secure-panel p-6">
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
                    {totalFindingCount}
                  </p>

                  <p className="mt-2 text-xs text-secure-muted">
                    Issues requiring review
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3 text-xs">
                    {severityCounts.critical > 0 && (
                      <span className="text-red-400">
                        {severityCounts.critical} critical
                      </span>
                    )}

                    <span className="text-red-400">
                      {severityCounts.high} high
                    </span>

                    <span className="text-amber-400">
                      {severityCounts.medium} medium
                    </span>

                    <span className="text-slate-400">
                      {severityCounts.low} low
                    </span>
                  </div>
                </div>

                {/* Repository Scope */}
                <div className="border border-secure-border bg-secure-panel p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-secure-muted">
                      Repository Scope
                    </p>

                    <Zap
                      size={18}
                      className="text-cyan-400"
                    />
                  </div>

                  <p className="mt-5 text-3xl font-semibold text-white">
                    {formatNumber(totalIssues)}
                  </p>

                  <p className="mt-2 text-xs text-secure-muted">
                    Findings + performance issues
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-xs text-secure-muted">
                    <span>
                      {formatNumber(linesAnalyzed)}
                    </span>
                    <span>lines analyzed</span>
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
                  Real intelligence scores from the latest
                  completed analysis.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {codeQualityScore !== null && (
                  <MetricCard
                    label="Code Quality"
                    value={codeQualityScore}
                  />
                )}

                {securityScore !== null && (
                  <MetricCard
                    label="Security"
                    value={securityScore}
                  />
                )}

                {performanceScore !== null && (
                  <MetricCard
                    label="Performance"
                    value={performanceScore}
                  />
                )}

                {architectureScore !== null && (
                  <MetricCard
                    label="Architecture"
                    value={architectureScore}
                  />
                )}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {maintainabilityScore !== null && (
                  <MetricCard
                    label="Maintainability"
                    value={maintainabilityScore}
                  />
                )}

                {dependencyScore !== null && (
                  <MetricCard
                    label="Dependencies"
                    value={dependencyScore}
                  />
                )}
              </div>
            </section>

            {/* Project Intelligence */}
            <section>
              <div className="mb-5">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-white">
                      Project Intelligence
                    </h2>

                    <p className="mt-1 text-xs text-secure-muted">
                      Open an intelligence module for{" "}
                      {selectedProject.name}.
                    </p>
                  </div>

                  <Link
                    to={projectPath}
                    className="hidden items-center gap-1.5 text-xs text-secure-muted transition hover:text-white sm:flex"
                  >
                    Project workspace
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Link
                  to={reviewPath}
                  className="group border border-secure-border bg-secure-panel p-5 transition hover:border-violet-500/30 hover:bg-secure-panel-soft"
                >
                  <Sparkles
                    size={18}
                    className="text-violet-400"
                  />

                  <h3 className="mt-4 text-sm font-medium text-white">
                    AI Code Review
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-secure-muted">
                    Code quality, patterns, and developer
                    recommendations.
                  </p>

                  <div className="mt-4 flex items-center gap-1 text-[10px] text-secure-muted group-hover:text-violet-300">
                    Open module
                    <ArrowRight size={11} />
                  </div>
                </Link>

                <Link
                  to={securityPath}
                  className="group border border-secure-border bg-secure-panel p-5 transition hover:border-red-500/30 hover:bg-secure-panel-soft"
                >
                  <ShieldAlert
                    size={18}
                    className="text-red-400"
                  />

                  <h3 className="mt-4 text-sm font-medium text-white">
                    Security
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-secure-muted">
                    Vulnerabilities, secrets, exposure
                    risks, and remediation.
                  </p>

                  <div className="mt-4 flex items-center gap-1 text-[10px] text-secure-muted group-hover:text-red-300">
                    Open module
                    <ArrowRight size={11} />
                  </div>
                </Link>

                <Link
                  to={dependenciesPath}
                  className="group border border-secure-border bg-secure-panel p-5 transition hover:border-cyan-500/30 hover:bg-secure-panel-soft"
                >
                  <GitFork
                    size={18}
                    className="text-cyan-400"
                  />

                  <h3 className="mt-4 text-sm font-medium text-white">
                    Dependencies
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-secure-muted">
                    Packages, versions, vulnerabilities,
                    and dependency health.
                  </p>

                  <div className="mt-4 flex items-center gap-1 text-[10px] text-secure-muted group-hover:text-cyan-300">
                    Open module
                    <ArrowRight size={11} />
                  </div>
                </Link>

                <Link
                  to={architecturePath}
                  className="group border border-secure-border bg-secure-panel p-5 transition hover:border-blue-500/30 hover:bg-secure-panel-soft"
                >
                  <Activity
                    size={18}
                    className="text-blue-400"
                  />

                  <h3 className="mt-4 text-sm font-medium text-white">
                    Architecture
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-secure-muted">
                    Components, relationships, coupling,
                    and system structure.
                  </p>

                  <div className="mt-4 flex items-center gap-1 text-[10px] text-secure-muted group-hover:text-blue-300">
                    Open module
                    <ArrowRight size={11} />
                  </div>
                </Link>

                <Link
                  to={performancePath}
                  className="group border border-secure-border bg-secure-panel p-5 transition hover:border-emerald-500/30 hover:bg-secure-panel-soft"
                >
                  <Zap
                    size={18}
                    className="text-emerald-400"
                  />

                  <h3 className="mt-4 text-sm font-medium text-white">
                    Performance
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-secure-muted">
                    Hotspots, inefficient operations, and
                    optimization signals.
                  </p>

                  <div className="mt-4 flex items-center gap-1 text-[10px] text-secure-muted group-hover:text-emerald-300">
                    Open module
                    <ArrowRight size={11} />
                  </div>
                </Link>

                <Link
                  to={chatPath}
                  className="group border border-secure-border bg-secure-panel p-5 transition hover:border-violet-500/30 hover:bg-secure-panel-soft"
                >
                  <Sparkles
                    size={18}
                    className="text-violet-400"
                  />

                  <h3 className="mt-4 text-sm font-medium text-white">
                    Codebase Chat
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-secure-muted">
                    Ask questions about the repository
                    using code context.
                  </p>

                  <div className="mt-4 flex items-center gap-1 text-[10px] text-secure-muted group-hover:text-violet-300">
                    Open module
                    <ArrowRight size={11} />
                  </div>
                </Link>

                <Link
                  to={documentationPath}
                  className="group border border-secure-border bg-secure-panel p-5 transition hover:border-amber-500/30 hover:bg-secure-panel-soft"
                >
                  <FolderGit2
                    size={18}
                    className="text-amber-400"
                  />

                  <h3 className="mt-4 text-sm font-medium text-white">
                    Documentation
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-secure-muted">
                    README, API docs, architecture docs,
                    and setup guides.
                  </p>

                  <div className="mt-4 flex items-center gap-1 text-[10px] text-secure-muted group-hover:text-amber-300">
                    Open module
                    <ArrowRight size={11} />
                  </div>
                </Link>

                <Link
                  to={cicdPath}
                  className="group border border-secure-border bg-secure-panel p-5 transition hover:border-orange-500/30 hover:bg-secure-panel-soft"
                >
                  <GitCommit
                    size={18}
                    className="text-orange-400"
                  />

                  <h3 className="mt-4 text-sm font-medium text-white">
                    CI / CD
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-secure-muted">
                    GitHub Actions, PR checks, and
                    automated analysis.
                  </p>

                  <div className="mt-4 flex items-center gap-1 text-[10px] text-secure-muted group-hover:text-orange-300">
                    Open module
                    <ArrowRight size={11} />
                  </div>
                </Link>
              </div>
            </section>

            {/* Analysis Overview + AI Brief */}
            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <SectionCard
                title="Analysis Overview"
                subtitle="Latest intelligence across this repository"
                action={
                  <Link
                    to={projectPath}
                    className="flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
                  >
                    View project
                    <ArrowUpRight size={13} />
                  </Link>
                }
              >
                <div className="space-y-3">
                  <Link
                    to={securityPath}
                    className="flex items-center justify-between border border-secure-border bg-secure-panel-soft p-4 transition hover:border-red-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center bg-red-500/10 text-red-400">
                        <ShieldAlert size={17} />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-white">
                          Security Analysis
                        </p>

                        <p className="mt-1 text-xs text-secure-muted">
                          {securityScore !== null
                            ? `Security score: ${securityScore}/100`
                            : "Security analysis unavailable"}
                        </p>
                      </div>
                    </div>

                    <StatusBadge
                      status={
                        severityCounts.critical > 0 ||
                        severityCounts.high > 0
                          ? "high"
                          : "healthy"
                      }
                      label={
                        severityCounts.critical > 0 ||
                        severityCounts.high > 0
                          ? "Attention"
                          : "Healthy"
                      }
                    />
                  </Link>

                  <Link
                    to={performancePath}
                    className="flex items-center justify-between border border-secure-border bg-secure-panel-soft p-4 transition hover:border-emerald-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center bg-emerald-500/10 text-emerald-400">
                        <Zap size={17} />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-white">
                          Performance Analysis
                        </p>

                        <p className="mt-1 text-xs text-secure-muted">
                          {performanceScore !== null
                            ? `Performance score: ${performanceScore}/100`
                            : "Performance analysis unavailable"}
                        </p>
                      </div>
                    </div>

                    <StatusBadge
                      status={
                        performanceMetrics &&
                        performanceMetrics.highSeverityCount >
                          0
                          ? "high"
                          : "healthy"
                      }
                      label={
                        performanceMetrics &&
                        performanceMetrics.highSeverityCount >
                          0
                          ? "Attention"
                          : "Healthy"
                      }
                    />
                  </Link>

                  <Link
                    to={reviewPath}
                    className="flex items-center justify-between border border-secure-border bg-secure-panel-soft p-4 transition hover:border-violet-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center bg-violet-500/10 text-violet-400">
                        <Sparkles size={17} />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-white">
                          Code Intelligence
                        </p>

                        <p className="mt-1 text-xs text-secure-muted">
                          {codeQualityScore !== null
                            ? `Code quality: ${codeQualityScore}/100`
                            : "Code intelligence unavailable"}
                        </p>
                      </div>
                    </div>

                    <StatusBadge
                      status={
                        codeQualityScore !== null &&
                        codeQualityScore >= 80
                          ? "healthy"
                          : "medium"
                      }
                      label={
                        codeQualityScore !== null &&
                        codeQualityScore >= 80
                          ? "Healthy"
                          : "Review"
                      }
                    />
                  </Link>

                  <Link
                    to={dependenciesPath}
                    className="flex items-center justify-between border border-secure-border bg-secure-panel-soft p-4 transition hover:border-cyan-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center bg-cyan-500/10 text-cyan-400">
                        <CheckCircle2 size={17} />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-white">
                          Dependency Analysis
                        </p>

                        <p className="mt-1 text-xs text-secure-muted">
                          {dependencySummary
                            ? `${dependencySummary.total} dependencies • ${dependencySummary.vulnerable} vulnerable • ${dependencySummary.outdated} outdated`
                            : "Dependency intelligence unavailable"}
                        </p>
                      </div>
                    </div>

                    <StatusBadge
                      status={
                        dependencySummary?.vulnerable
                          ? "high"
                          : dependencySummary?.outdated
                            ? "medium"
                            : "healthy"
                      }
                      label={
                        dependencySummary?.vulnerable
                          ? "Attention"
                          : dependencySummary?.outdated
                            ? "Review"
                            : "Healthy"
                      }
                    />
                  </Link>
                </div>
              </SectionCard>

              {/* AI Engineering Brief */}
              <SectionCard
                title="AI Engineering Brief"
                subtitle="Generated from current project intelligence"
              >
                <div className="border border-violet-500/10 bg-violet-500/[0.04] p-5">
                  <div className="flex items-center gap-2 text-violet-400">
                    <Sparkles size={16} />

                    <span className="text-xs font-medium">
                      SecureAI Intelligence
                    </span>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-slate-300">
                    {selectedProject.name} currently has{" "}
                    <span className="font-medium text-white">
                      {totalFindingCount}
                    </span>{" "}
                    code/security finding
                    {totalFindingCount !== 1
                      ? "s"
                      : ""}
                    {dependencySummary
                      ? ` and ${dependencySummary.vulnerable} vulnerable dependenc${
                          dependencySummary.vulnerable !==
                          1
                            ? "ies"
                            : "y"
                        }`
                      : ""}
                    .
                  </p>

                  <div className="mt-5 space-y-3">
                    {briefItems.map(
                      (item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="flex gap-3"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-violet-400" />

                          <p className="text-xs leading-5 text-slate-400">
                            {item}
                          </p>
                        </div>
                      ),
                    )}
                  </div>

                  <Link
                    to={
                      severityCounts.critical > 0 ||
                      severityCounts.high > 0
                        ? securityPath
                        : reviewPath
                    }
                    className="mt-6 flex items-center justify-between border-t border-violet-500/10 pt-5"
                  >
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-secure-muted">
                        Recommended first action
                      </p>

                      <p className="mt-2 text-sm font-medium text-white">
                        {recommendedAction}
                      </p>
                    </div>

                    <ArrowRight
                      size={15}
                      className="text-violet-400"
                    />
                  </Link>
                </div>
              </SectionCard>
            </div>

            {/* Repository Activity */}
            <SectionCard
              title="Repository Activity"
              subtitle="Latest engineering state"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div className="border border-secure-border bg-secure-panel-soft p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center bg-slate-800 text-slate-300">
                      <GitCommit size={16} />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white">
                        Repository
                      </p>

                      <p className="mt-1 text-xs text-secure-muted">
                        {repositoryPath}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-secure-border bg-secure-panel-soft p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 size={16} />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white">
                        Analysis status
                      </p>

                      <p className="mt-1 text-xs text-secure-muted">
                        {analysis?.status ??
                          selectedProject.latestAnalysis
                            ?.status ??
                          "No analysis available"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-secure-border bg-secure-panel-soft p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center bg-violet-500/10 text-violet-400">
                      <Sparkles size={16} />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white">
                        Last completed
                      </p>

                      <p className="mt-1 text-xs text-secure-muted">
                        {completedAt
                          ? new Date(
                              completedAt,
                            ).toLocaleString()
                          : "No completed analysis"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </>
        )}
    </div>
  );
}

export default Dashboard;