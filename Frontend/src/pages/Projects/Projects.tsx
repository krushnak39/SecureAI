import {
  Activity,
  ArrowRight,
  Clock3,
  Code2,
  GitBranch,
  GitFork,
  Plus,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";

type Project = {
  id: string;
  name: string;
  repository: string;
  branch: string;
  health: number;
  security: number;
  quality: number;
  findings: number;
  lastAnalyzed: string;
  technologies: string[];
  status: "healthy" | "attention" | "critical";
};

const projects: Project[] = [
  {
    id: "secureai",
    name: "SecureAI",
    repository: "krushnak39/SecureAI",
    branch: "feature",
    health: 82,
    security: 71,
    quality: 86,
    findings: 22,
    lastAnalyzed: "42 seconds ago",
    technologies: ["React", "Node.js", "Python", "PostgreSQL"],
    status: "attention",
  },
  {
    id: "careerpilot",
    name: "CareerPilot AI",
    repository: "krushnak39/CareerPilot-AI",
    branch: "main",
    health: 88,
    security: 84,
    quality: 91,
    findings: 9,
    lastAnalyzed: "2 hours ago",
    technologies: ["React", "Express", "Prisma", "PostgreSQL"],
    status: "healthy",
  },
  {
    id: "api-service",
    name: "Developer API",
    repository: "krushnak39/developer-api",
    branch: "develop",
    health: 64,
    security: 58,
    quality: 72,
    findings: 37,
    lastAnalyzed: "Yesterday",
    technologies: ["Node.js", "Express", "MongoDB"],
    status: "critical",
  },
];

const statusConfig = {
  healthy: {
    label: "HEALTHY",
    className: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  },
  attention: {
    label: "ATTENTION",
    className: "text-amber-400 border-amber-500/20 bg-amber-500/5",
  },
  critical: {
    label: "CRITICAL",
    className: "text-red-400 border-red-500/20 bg-red-500/5",
  },
};

function Projects() {
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
            Manage repositories, monitor engineering health, and jump directly
            into analysis workspaces.
          </p>
        </div>

        <button
          type="button"
          className="flex items-center justify-center gap-2 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          <Plus size={16} />
          Connect repository
        </button>
      </div>

      {/* Metrics */}
      <div className="grid border-x border-b border-slate-800/70 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["03", "Repositories"],
          ["82", "Average health"],
          ["68", "Open findings"],
          ["02", "Needs attention"],
        ].map(([value, label]) => (
          <div
            key={label}
            className="border-b border-slate-800/70 p-5 last:border-b-0 sm:border-r lg:border-b-0"
          >
            <p className="text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-[10px] tracking-[0.15em] text-slate-600">
              {label.toUpperCase()}
            </p>
          </div>
        ))}
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
            placeholder="Search repositories..."
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

      {/* Project cards */}
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {projects.map((project) => {
          const status = statusConfig[project.status];

          return (
            <article
              key={project.id}
              className="group border border-slate-800 bg-[#090e18] transition hover:border-slate-600"
            >
              {/* Card header */}
              <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-slate-700 bg-[#050810]">
                    <Code2 size={19} className="text-violet-400" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{project.name}</h2>

                      <span
                        className={`border px-2 py-1 text-[8px] font-medium tracking-wider ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                      <GitFork size={12} />
                      {project.repository}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/projects/${project.id}`}
                  className="flex items-center gap-1.5 text-xs text-violet-400 transition hover:text-violet-300"
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
                    {project.health}
                  </p>
                </div>

                <div className="border-x border-slate-800 p-5">
                  <p className="text-[9px] tracking-wider text-slate-600">
                    SECURITY
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {project.security}
                  </p>
                </div>

                <div className="p-5">
                  <p className="text-[9px] tracking-wider text-slate-600">
                    QUALITY
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {project.quality}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((technology) => (
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
                    <span>{project.branch}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <ShieldAlert size={13} />
                    <span>{project.findings} findings</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock3 size={13} />
                    <span>{project.lastAnalyzed}</span>
                  </div>
                </div>

                <div className="mt-5 h-1 bg-slate-800">
                  <div
                    className={`h-full ${
                      project.status === "healthy"
                        ? "bg-emerald-400"
                        : project.status === "attention"
                          ? "bg-amber-400"
                          : "bg-red-400"
                    }`}
                    style={{ width: `${project.health}%` }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Analysis status */}
      <div className="mt-5 flex flex-col gap-3 border border-slate-800 bg-[#090e18] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-emerald-500/20 bg-emerald-500/5">
            <Activity size={14} className="text-emerald-400" />
          </div>

          <div>
            <p className="text-xs font-medium">Analysis engine online</p>
            <p className="mt-0.5 text-[10px] text-slate-600">
              Repository intelligence services are ready.
            </p>
          </div>
        </div>

        <span className="text-[10px] tracking-wider text-emerald-400">
          ALL SYSTEMS OPERATIONAL
        </span>
      </div>
    </div>
  );
}

export default Projects;