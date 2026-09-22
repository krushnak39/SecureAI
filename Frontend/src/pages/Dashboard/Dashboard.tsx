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

function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] =
    useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        if (!mounted) return;

        setProjects(projectList);

        if (projectList.length > 0) {
          setSelectedProjectId(projectList[0].id);
        }
      } catch (err) {
        if (!mounted) return;

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
   * Project-aware routes.
   *
   * IMPORTANT:
   * Every intelligence module belongs to a project.
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

  const latestAnalysis = selectedProject?.latestAnalysis;

  const hasCompletedAnalysis =
    latestAnalysis?.status === "COMPLETED";

  const securityScore =
    latestAnalysis?.securityScore ?? 71;

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
                    setSelectedProjectId(event.target.value)
                  }
                  disabled={
                    loading || projects.length === 0
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
              Create a project and connect a GitHub repository
              to start using SecureAI intelligence.
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
      {!loading && !error && selectedProject && (
        <>
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
                  A high-level view of this project's engineering
                  health.
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
                        82
                      </span>

                      <span className="mb-1 text-sm text-secure-muted">
                        / 100
                      </span>
                    </div>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center border border-violet-500/20 bg-violet-500/10 text-violet-400">
                    <Sparkles size={20} />
                  </div>
                </div>

                <div className="mt-6 h-2 overflow-hidden bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
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
              <div className="border border-secure-border bg-secure-panel p-6">
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
              <div className="border border-secure-border bg-secure-panel p-6">
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
                Intelligence for {selectedProject.name}.
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
                value={securityScore}
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
                  Vulnerabilities, secrets, exposure risks,
                  and remediation.
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
                  Packages, versions, vulnerabilities, and
                  dependency health.
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
                  Components, relationships, coupling, and
                  system structure.
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
                  Ask questions about the repository using
                  code context.
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
                  README, API docs, architecture docs, and
                  setup guides.
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
                  GitHub Actions, PR checks, and automated
                  analysis.
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
              subtitle="Latest findings across this repository"
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
                        {hasCompletedAnalysis
                          ? "Latest repository security analysis completed"
                          : "Review security findings and exposure risks"}
                      </p>
                    </div>
                  </div>

                  <StatusBadge
                    status="high"
                    label="Attention"
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
                        Performance hotspots and optimization
                        signals
                      </p>
                    </div>
                  </div>

                  <StatusBadge
                    status="healthy"
                    label="Healthy"
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
                        AI review and maintainability
                        recommendations
                      </p>
                    </div>
                  </div>

                  <StatusBadge
                    status="medium"
                    label="Review"
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
                        Package health and vulnerability
                        intelligence
                      </p>
                    </div>
                  </div>

                  <StatusBadge
                    status="healthy"
                    label="Healthy"
                  />
                </Link>
              </div>
            </SectionCard>

            {/* AI Engineering Brief */}
            <SectionCard
              title="AI Engineering Brief"
              subtitle="Generated from project intelligence"
            >
              <div className="border border-violet-500/10 bg-violet-500/[0.04] p-5">
                <div className="flex items-center gap-2 text-violet-400">
                  <Sparkles size={16} />

                  <span className="text-xs font-medium">
                    SecureAI Intelligence
                  </span>
                </div>

                <p className="mt-5 text-sm leading-6 text-slate-300">
                  {selectedProject.name} shows strong engineering
                  characteristics, while security findings require
                  review.
                </p>

                <div className="mt-5 space-y-3">
                  <div className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-violet-400" />

                    <p className="text-xs leading-5 text-slate-400">
                      Review authentication and API security
                      boundaries.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-violet-400" />

                    <p className="text-xs leading-5 text-slate-400">
                      Inspect database access patterns for
                      inefficient operations.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-violet-400" />

                    <p className="text-xs leading-5 text-slate-400">
                      Review external input validation across
                      API boundaries.
                    </p>
                  </div>
                </div>

                <Link
                  to={reviewPath}
                  className="mt-6 flex items-center justify-between border-t border-violet-500/10 pt-5"
                >
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-secure-muted">
                      Recommended first action
                    </p>

                    <p className="mt-2 text-sm font-medium text-white">
                      Review authentication middleware.
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
            subtitle="Recent engineering events"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border border-secure-border bg-secure-panel-soft p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center bg-slate-800 text-slate-300">
                    <GitCommit size={16} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      Latest commit
                    </p>

                    <p className="mt-1 text-xs text-secure-muted">
                      {branch} branch
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
                      {latestAnalysis?.status ??
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
                      Project intelligence
                    </p>

                    <p className="mt-1 text-xs text-secure-muted">
                      {hasCompletedAnalysis
                        ? "Repository analysis available"
                        : "Run analysis to generate intelligence"}
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