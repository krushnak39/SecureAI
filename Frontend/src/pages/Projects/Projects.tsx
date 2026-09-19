import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Code2,
  GitBranch,
  GitFork,
  Plus,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../services/api";

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
  latestAnalysis: {
    id: string;
    status: string;
    healthScore: number | null;
    securityScore: number | null;
    codeQuality: number | null;
    performance: number | null;
    architecture: number | null;
    maintainability: number | null;
    filesAnalyzed: number;
    linesAnalyzed: number;
    createdAt: string;
  } | null;
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

interface ProjectsResponse {
  success: boolean;
  projects: Project[];
}

interface CreateProjectResponse {
  success: boolean;
  message: string;
  project: Project;
}

function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] =
    useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const response =
        await apiRequest<ProjectsResponse>(
          "/projects",
        );

      setProjects(response.projects);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load projects.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleCreateProject(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setCreateError("");

    if (!projectName.trim()) {
      setCreateError("Please enter a project name.");
      return;
    }

    try {
      setCreating(true);

      const response =
        await apiRequest<CreateProjectResponse>(
          "/projects",
          {
            method: "POST",
            body: JSON.stringify({
              name: projectName.trim(),
              description:
                projectDescription.trim() || undefined,
            }),
          },
        );

      setProjects((current) => [
        response.project,
        ...current,
      ]);

      setProjectName("");
      setProjectDescription("");
      setShowCreateModal(false);
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Unable to create project.",
      );
    } finally {
      setCreating(false);
    }
  }

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(query) ||
        project.description
          ?.toLowerCase()
          .includes(query) ||
        project.repository?.fullName
          .toLowerCase()
          .includes(query)
      );
    });
  }, [projects, search]);

  const averageHealth = useMemo(() => {
    const analyzedProjects = projects.filter(
      (project) =>
        project.repository?.latestAnalysis
          ?.healthScore !== null &&
        project.repository?.latestAnalysis
          ?.healthScore !== undefined,
    );

    if (analyzedProjects.length === 0) {
      return 0;
    }

    const total = analyzedProjects.reduce(
      (sum, project) =>
        sum +
        (project.repository?.latestAnalysis
          ?.healthScore ?? 0),
      0,
    );

    return Math.round(
      total / analyzedProjects.length,
    );
  }, [projects]);

  const totalFindings = useMemo(() => {
    /*
     * The current Project API doesn't return finding
     * counts yet, so we deliberately don't invent them.
     * This will become real when the Analysis API is added.
     */
    return null;
  }, []);

  const projectsNeedingAttention = useMemo(() => {
    return projects.filter((project) => {
      const health =
        project.repository?.latestAnalysis?.healthScore;

      return (
        health !== null &&
        health !== undefined &&
        health < 80
      );
    }).length;
  }, [projects]);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-slate-800/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.18em] text-slate-600">
            <GitFork size={13} />
            PROJECTS
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Repository workspace
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage projects, inspect repository intelligence, and
            move into engineering analysis from one workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateError("");
            setShowCreateModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          <Plus size={16} />
          Create project
        </button>
      </div>

      {/* Metrics */}
      <div className="grid border-x border-b border-slate-800/70 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-b border-slate-800/70 p-5 sm:border-r lg:border-b-0">
          <p className="text-2xl font-semibold">
            {projects.length.toString().padStart(2, "0")}
          </p>

          <p className="mt-1 text-[10px] tracking-[0.15em] text-slate-600">
            PROJECTS
          </p>
        </div>

        <div className="border-b border-slate-800/70 p-5 lg:border-r lg:border-b-0">
          <p className="text-2xl font-semibold">
            {averageHealth || "—"}
          </p>

          <p className="mt-1 text-[10px] tracking-[0.15em] text-slate-600">
            AVERAGE HEALTH
          </p>
        </div>

        <div className="border-b border-slate-800/70 p-5 sm:border-r lg:border-b-0">
          <p className="text-2xl font-semibold">
            {totalFindings ?? "—"}
          </p>

          <p className="mt-1 text-[10px] tracking-[0.15em] text-slate-600">
            OPEN FINDINGS
          </p>
        </div>

        <div className="p-5">
          <p className="text-2xl font-semibold">
            {projectsNeedingAttention
              .toString()
              .padStart(2, "0")}
          </p>

          <p className="mt-1 text-[10px] tracking-[0.15em] text-slate-600">
            NEEDS ATTENTION
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-7 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search projects or repositories..."
            className="w-full border border-slate-800 bg-[#090e18] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-slate-600"
          />
        </div>

        <button
          type="button"
          className="flex items-center justify-center gap-2 border border-slate-800 bg-[#090e18] px-4 py-3 text-sm text-slate-400 transition hover:border-slate-600 hover:text-white"
        >
          <SlidersHorizontal size={15} />
          All projects
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-5 border border-slate-800 bg-[#090e18] p-10 text-center">
          <Activity
            size={18}
            className="mx-auto animate-pulse text-violet-400"
          />

          <p className="mt-3 text-sm text-slate-400">
            Loading projects...
          </p>

          <p className="mt-1 text-xs text-slate-700">
            Fetching your repository workspace.
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-5 border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert
              size={17}
              className="mt-0.5 text-red-400"
            />

            <div>
              <p className="text-sm font-medium text-red-300">
                Unable to load projects
              </p>

              <p className="mt-1 text-xs leading-5 text-red-400/80">
                {error}
              </p>

              <button
                type="button"
                onClick={loadProjects}
                className="mt-4 border border-red-500/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/5"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading &&
        !error &&
        filteredProjects.length === 0 && (
          <div className="mt-5 border border-dashed border-slate-800 bg-[#090e18] p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center border border-slate-800 bg-[#050810]">
              <GitFork
                size={20}
                className="text-slate-600"
              />
            </div>

            <h2 className="mt-4 text-sm font-medium">
              {search
                ? "No matching projects"
                : "No projects yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-600">
              {search
                ? "Try a different project or repository search."
                : "Create your first SecureAI project. Repository connection will be added through the GitHub integration phase."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(true)
                }
                className="mt-5 inline-flex items-center gap-2 bg-white px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                <Plus size={14} />
                Create project
              </button>
            )}
          </div>
        )}

      {/* Project cards */}
      {!loading &&
        !error &&
        filteredProjects.length > 0 && (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {filteredProjects.map((project) => {
              const analysis =
                project.repository?.latestAnalysis;

              const health =
                analysis?.healthScore ?? null;

              const security =
                analysis?.securityScore ?? null;

              const quality =
                analysis?.codeQuality ?? null;

              const projectStatus =
                health === null
                  ? "NOT ANALYZED"
                  : health >= 80
                    ? "HEALTHY"
                    : health >= 60
                      ? "ATTENTION"
                      : "CRITICAL";

              const statusClass =
                projectStatus === "HEALTHY"
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                  : projectStatus === "ATTENTION"
                    ? "border-amber-500/20 bg-amber-500/5 text-amber-400"
                    : projectStatus === "CRITICAL"
                      ? "border-red-500/20 bg-red-500/5 text-red-400"
                      : "border-slate-700 bg-slate-800/20 text-slate-500";

              return (
                <article
                  key={project.id}
                  className="group border border-slate-800 bg-[#090e18] transition hover:border-slate-600"
                >
                  {/* Card header */}
                  <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-slate-700 bg-[#050810]">
                        <Code2
                          size={19}
                          className="text-violet-400"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold">
                            {project.name}
                          </h2>

                          <span
                            className={`border px-2 py-1 text-[8px] font-medium tracking-wider ${statusClass}`}
                          >
                            {projectStatus}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-600">
                          {project.description ||
                            "No project description"}
                        </p>

                        {project.repository && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                            <GitFork size={12} />
                            {project.repository.fullName}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      to={`/projects/${project.id}`}
                      className="flex shrink-0 items-center gap-1.5 text-xs text-violet-400 transition hover:text-violet-300"
                    >
                      Open project
                      <ArrowRight
                        size={13}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  </div>

                  {/* Health */}
                  <div className="grid grid-cols-3 border-b border-slate-800">
                    <div className="p-5">
                      <p className="text-[9px] tracking-wider text-slate-600">
                        HEALTH
                      </p>

                      <p className="mt-2 text-2xl font-semibold">
                        {health ?? "—"}
                      </p>
                    </div>

                    <div className="border-x border-slate-800 p-5">
                      <p className="text-[9px] tracking-wider text-slate-600">
                        SECURITY
                      </p>

                      <p className="mt-2 text-2xl font-semibold">
                        {security ?? "—"}
                      </p>
                    </div>

                    <div className="p-5">
                      <p className="text-[9px] tracking-wider text-slate-600">
                        QUALITY
                      </p>

                      <p className="mt-2 text-2xl font-semibold">
                        {quality ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5">
                    {project.repository ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {[
                            project.repository.language,
                            project.repository.provider,
                            project.repository.isPrivate
                              ? "Private"
                              : "Public",
                          ]
                            .filter(Boolean)
                            .map((technology) => (
                              <span
                                key={technology}
                                className="border border-slate-800 bg-[#050810] px-2.5 py-1.5 text-[9px] text-slate-500"
                              >
                                {technology}
                              </span>
                            ))}
                        </div>

                        <div className="mt-5 grid gap-3 text-xs sm:grid-cols-3">
                          <div className="flex items-center gap-2 text-slate-500">
                            <GitBranch size={13} />

                            <span>
                              {project.repository.branch ||
                                project.repository
                                  .defaultBranch}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-500">
                            {analysis ? (
                              <CheckCircle2
                                size={13}
                                className="text-emerald-400"
                              />
                            ) : (
                              <Activity size={13} />
                            )}

                            <span>
                              {analysis
                                ? `${analysis.filesAnalyzed} files`
                                : "Not analyzed"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-500">
                            <Clock3 size={13} />

                            <span>
                              {project.repository
                                .lastAnalyzed
                                ? new Date(
                                    project.repository.lastAnalyzed,
                                  ).toLocaleString()
                                : "Never analyzed"}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="border border-dashed border-slate-800 p-4">
                        <div className="flex items-center gap-3">
                          <GitFork
                            size={15}
                            className="text-slate-600"
                          />

                          <div>
                            <p className="text-xs font-medium text-slate-400">
                              No repository connected
                            </p>

                            <p className="mt-1 text-[10px] text-slate-700">
                              GitHub repository connection will be
                              available in the next integration phase.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {health !== null && (
                      <div className="mt-5 h-1 bg-slate-800">
                        <div
                          className={`h-full ${
                            health >= 80
                              ? "bg-emerald-400"
                              : health >= 60
                                ? "bg-amber-400"
                                : "bg-red-400"
                          }`}
                          style={{
                            width: `${health}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

      {/* Engine status */}
      <div className="mt-5 flex flex-col gap-3 border border-slate-800 bg-[#090e18] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-emerald-500/20 bg-emerald-500/5">
            <Activity
              size={14}
              className="text-emerald-400"
            />
          </div>

          <div>
            <p className="text-xs font-medium">
              Analysis engine online
            </p>

            <p className="mt-0.5 text-[10px] text-slate-600">
              Project data is loaded from the SecureAI API.
            </p>
          </div>
        </div>

        <span className="text-[10px] tracking-wider text-emerald-400">
          API CONNECTED
        </span>
      </div>

      {/* Create project modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
          <div className="w-full max-w-lg border border-slate-800 bg-[#090e18] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <p className="text-sm font-medium">
                  Create project
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  Create a workspace for a repository you want SecureAI
                  to analyze.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(false)
                }
                className="text-slate-600 transition hover:text-white"
                aria-label="Close create project dialog"
              >
                <X size={17} />
              </button>
            </div>

            <form
              onSubmit={handleCreateProject}
              className="space-y-5 p-5"
            >
              <div>
                <label
                  htmlFor="project-name"
                  className="mb-2 block text-[10px] tracking-wider text-slate-600"
                >
                  PROJECT NAME
                </label>

                <input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(event) =>
                    setProjectName(event.target.value)
                  }
                  placeholder="My SecureAI Project"
                  disabled={creating}
                  className="w-full border border-slate-800 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-slate-600 disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="project-description"
                  className="mb-2 block text-[10px] tracking-wider text-slate-600"
                >
                  DESCRIPTION
                </label>

                <textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(event) =>
                    setProjectDescription(
                      event.target.value,
                    )
                  }
                  placeholder="What are you building?"
                  rows={4}
                  disabled={creating}
                  className="w-full resize-none border border-slate-800 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-slate-600 disabled:opacity-60"
                />
              </div>

              {createError && (
                <div className="border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400">
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                  disabled={creating}
                  className="border border-slate-800 px-4 py-2.5 text-xs text-slate-400 transition hover:border-slate-600 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 bg-white px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={14} />

                  {creating
                    ? "Creating..."
                    : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;