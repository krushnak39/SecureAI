import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Database,
  GitBranch,
  Layers3,
  Network,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";

type ComponentType =
  | "frontend"
  | "api"
  | "backend"
  | "database"
  | "ai"
  | "external";

interface ArchitectureComponent {
  id: string;
  name: string;
  type: ComponentType;
  technology: string;
  description: string;
  files: string[];
  dependencies: string[];
  dependents: string[];
  health: "healthy" | "warning" | "risk";
}

interface ArchitectureFinding {
  id: number;
  severity: "high" | "medium" | "low";
  title: string;
  component: string;
  description: string;
  impact: string;
  recommendation: string;
}

const components: ArchitectureComponent[] = [
  {
    id: "frontend",
    name: "Web Application",
    type: "frontend",
    technology: "React + TypeScript",
    description:
      "Developer-facing interface responsible for repository intelligence, findings, analysis controls and codebase interaction.",
    files: [
      "src/pages",
      "src/components",
      "src/services",
      "src/routes",
    ],
    dependencies: ["api"],
    dependents: [],
    health: "healthy",
  },
  {
    id: "api",
    name: "Application API",
    type: "api",
    technology: "Express + TypeScript",
    description:
      "Primary HTTP boundary between the frontend, repository services, analysis engines and persistence layer.",
    files: [
      "Backend/src/routes",
      "Backend/src/controllers",
      "Backend/src/middleware",
    ],
    dependencies: ["backend", "database", "github"],
    dependents: ["frontend"],
    health: "healthy",
  },
  {
    id: "backend",
    name: "Analysis Orchestrator",
    type: "backend",
    technology: "Node.js",
    description:
      "Coordinates repository analysis jobs and communicates with the specialized AI and security analysis services.",
    files: [
      "Backend/src/services",
      "Backend/src/jobs",
      "Backend/src/analyzers",
    ],
    dependencies: ["database", "ai", "security", "github"],
    dependents: ["api"],
    health: "warning",
  },
  {
    id: "database",
    name: "Data Layer",
    type: "database",
    technology: "PostgreSQL + pgvector",
    description:
      "Stores repositories, analysis results, findings, embeddings and persistent project intelligence.",
    files: [
      "prisma/schema.prisma",
      "Backend/src/db",
    ],
    dependencies: [],
    dependents: ["api", "backend", "ai"],
    health: "healthy",
  },
  {
    id: "ai",
    name: "AI Analysis Service",
    type: "ai",
    technology: "FastAPI + LLM + RAG",
    description:
      "Provides code understanding, AI review, semantic retrieval, documentation generation and codebase conversations.",
    files: [
      "AI/app",
      "AI/embeddings",
      "AI/retrieval",
      "AI/prompts",
    ],
    dependencies: ["database", "llm"],
    dependents: ["backend"],
    health: "healthy",
  },
  {
    id: "github",
    name: "GitHub Integration",
    type: "external",
    technology: "GitHub API",
    description:
      "Provides repository metadata, source files, pull requests, branches and CI/CD context.",
    files: [
      "Backend/src/integrations/github",
    ],
    dependencies: [],
    dependents: ["api", "backend"],
    health: "healthy",
  },
  {
    id: "security",
    name: "Security Engine",
    type: "ai",
    technology: "Semgrep + scanners",
    description:
      "Runs static security analysis, secret detection and dependency-oriented security checks.",
    files: [
      "AI/security",
      "AI/scanners",
    ],
    dependencies: [],
    dependents: ["backend"],
    health: "healthy",
  },
  {
    id: "llm",
    name: "LLM Provider",
    type: "external",
    technology: "LLM API",
    description:
      "External language model provider used by the AI analysis service for reasoning and generation.",
    files: [],
    dependencies: [],
    dependents: ["ai"],
    health: "healthy",
  },
];

const findings: ArchitectureFinding[] = [
  {
    id: 1,
    severity: "high",
    title: "Analysis orchestrator has high dependency fan-out",
    component: "Analysis Orchestrator",
    description:
      "The orchestration layer communicates with persistence, AI, security and repository integrations.",
    impact:
      "A highly connected orchestration layer can become difficult to test and change as the number of analysis capabilities grows.",
    recommendation:
      "Introduce explicit service boundaries and job-level interfaces so individual analysis engines remain independently replaceable.",
  },
  {
    id: 2,
    severity: "medium",
    title: "AI service depends directly on persistence",
    component: "AI Analysis Service",
    description:
      "The AI layer currently reads and writes repository intelligence through the database layer.",
    impact:
      "Direct persistence coupling can make AI workflows harder to reuse independently from the application's storage implementation.",
    recommendation:
      "Place a repository-context abstraction between retrieval workflows and database-specific operations.",
  },
  {
    id: 3,
    severity: "medium",
    title: "External integrations are concentrated in orchestration",
    component: "GitHub Integration",
    description:
      "Repository acquisition and analysis coordination are closely connected.",
    impact:
      "Changes to GitHub-specific behavior may propagate into analysis workflows.",
    recommendation:
      "Expose provider-neutral repository interfaces and isolate GitHub-specific API models inside the integration layer.",
  },
  {
    id: 4,
    severity: "low",
    title: "Frontend service boundaries should remain explicit",
    component: "Web Application",
    description:
      "The frontend communicates with multiple analysis capabilities through the application API.",
    impact:
      "Directly coupling UI modules to internal backend implementation details could make future API evolution harder.",
    recommendation:
      "Keep API calls centralized in typed frontend service modules and avoid embedding backend assumptions inside page components.",
  },
];

const typeConfig: Record<
  ComponentType,
  {
    label: string;
    icon: typeof Boxes;
    className: string;
  }
> = {
  frontend: {
    label: "Frontend",
    icon: Boxes,
    className: "text-cyan-400",
  },
  api: {
    label: "API",
    icon: Network,
    className: "text-violet-400",
  },
  backend: {
    label: "Backend",
    icon: Server,
    className: "text-blue-400",
  },
  database: {
    label: "Database",
    icon: Database,
    className: "text-emerald-400",
  },
  ai: {
    label: "Analysis",
    icon: Sparkles,
    className: "text-fuchsia-400",
  },
  external: {
    label: "External",
    icon: GitBranch,
    className: "text-amber-400",
  },
};

const healthConfig = {
  healthy: {
    label: "Healthy",
    className: "text-emerald-400",
  },
  warning: {
    label: "Review",
    className: "text-amber-400",
  },
  risk: {
    label: "Risk",
    className: "text-red-400",
  },
};

function Architecture() {
  const [selectedId, setSelectedId] = useState("backend");

  const selectedComponent =
    components.find((component) => component.id === selectedId) ??
    components[0];

  const selectedType = typeConfig[selectedComponent.type];
  const SelectedIcon = selectedType.icon;

  const highFindings = findings.filter(
    (finding) => finding.severity === "high",
  ).length;

  const mediumFindings = findings.filter(
    (finding) => finding.severity === "medium",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-600">
          <Network size={12} />
          <span>Repository / Architecture</span>
        </div>

        <div className="flex flex-col gap-5 border border-secure-border bg-secure-panel p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-violet-400/20 bg-violet-500/5 text-violet-400">
                <Network size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Architecture Intelligence
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Understand system boundaries, dependencies and architectural
                  risk.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 border border-slate-800 bg-[#0a0f18] px-3 py-1.5 font-mono text-[10px] text-slate-400">
                <GitBranch size={12} />
                feature
              </span>

              <span className="border border-slate-800 bg-[#0a0f18] px-3 py-1.5 font-mono text-[10px] text-slate-400">
                8 components
              </span>

              <span className="flex items-center gap-2 text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Architecture graph ready
              </span>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 border border-slate-700 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-slate-200"
          >
            <RefreshCw size={15} />
            Rebuild architecture
          </button>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-2 gap-px border border-secure-border bg-secure-border md:grid-cols-4">
        <div className="bg-secure-panel p-5">
          <div className="flex items-center gap-2 text-slate-600">
            <Layers3 size={14} />
            <span className="text-[10px] uppercase tracking-wider">
              Components
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">8</p>
          <p className="mt-1 text-[10px] text-slate-600">
            logical system nodes
          </p>
        </div>

        <div className="bg-secure-panel p-5">
          <div className="flex items-center gap-2 text-slate-600">
            <GitBranch size={14} />
            <span className="text-[10px] uppercase tracking-wider">
              Relationships
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-cyan-400">13</p>
          <p className="mt-1 text-[10px] text-slate-600">
            dependency edges
          </p>
        </div>

        <div className="bg-secure-panel p-5">
          <div className="flex items-center gap-2 text-slate-600">
            <TriangleAlert size={14} />
            <span className="text-[10px] uppercase tracking-wider">
              Findings
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-amber-400">
            {findings.length}
          </p>
          <p className="mt-1 text-[10px] text-slate-600">
            architecture observations
          </p>
        </div>

        <div className="bg-secure-panel p-5">
          <div className="flex items-center gap-2 text-slate-600">
            <Activity size={14} />
            <span className="text-[10px] uppercase tracking-wider">
              Architecture Health
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-emerald-400">
            78
          </p>
          <p className="mt-1 text-[10px] text-slate-600">
            analysis score
          </p>
        </div>
      </section>

      {/* Architecture graph */}
      <section className="border border-secure-border bg-secure-panel">
        <div className="flex flex-col gap-3 border-b border-secure-border px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Network size={15} className="text-violet-400" />
              <h2 className="text-sm font-medium text-white">
                System topology
              </h2>
            </div>

            <p className="mt-1 text-[10px] text-slate-600">
              Select a component to inspect its architectural relationships.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {Object.entries(typeConfig).map(([type, config]) => {
              const Icon = config.icon;

              return (
                <div
                  key={type}
                  className="flex items-center gap-1.5 text-[9px] text-slate-600"
                >
                  <Icon size={11} className={config.className} />
                  {config.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto p-6">
          <div className="min-w-[900px]">
            {/* Layer 1 */}
            <div className="grid grid-cols-3 gap-5">
              <ArchitectureNode
                component={components[0]}
                selected={selectedId === components[0].id}
                onSelect={() => setSelectedId(components[0].id)}
              />

              <div className="flex items-center justify-center">
                <FlowArrow />
              </div>

              <ArchitectureNode
                component={components[1]}
                selected={selectedId === components[1].id}
                onSelect={() => setSelectedId(components[1].id)}
              />
            </div>

            <div className="flex justify-center py-3">
              <ArrowDown size={18} className="text-slate-700" />
            </div>

            {/* Layer 2 */}
            <div className="grid grid-cols-5 gap-4">
              <div />

              <ArchitectureNode
                component={components[2]}
                selected={selectedId === components[2].id}
                onSelect={() => setSelectedId(components[2].id)}
              />

              <div className="flex items-center justify-center">
                <FlowArrow />
              </div>

              <ArchitectureNode
                component={components[3]}
                selected={selectedId === components[3].id}
                onSelect={() => setSelectedId(components[3].id)}
              />

              <div />
            </div>

            <div className="flex justify-center py-3">
              <ArrowDown size={18} className="text-slate-700" />
            </div>

            {/* Layer 3 */}
            <div className="grid grid-cols-5 gap-4">
              <ArchitectureNode
                component={components[5]}
                selected={selectedId === components[5].id}
                onSelect={() => setSelectedId(components[5].id)}
              />

              <div />

              <ArchitectureNode
                component={components[4]}
                selected={selectedId === components[4].id}
                onSelect={() => setSelectedId(components[4].id)}
              />

              <div />

              <ArchitectureNode
                component={components[6]}
                selected={selectedId === components[6].id}
                onSelect={() => setSelectedId(components[6].id)}
              />
            </div>

            <div className="flex justify-center py-3">
              <ArrowDown size={18} className="text-slate-700" />
            </div>

            {/* Layer 4 */}
            <div className="flex justify-center">
              <ArchitectureNode
                component={components[7]}
                selected={selectedId === components[7].id}
                onSelect={() => setSelectedId(components[7].id)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Detail + Findings */}
      <section className="grid border border-secure-border bg-secure-panel lg:grid-cols-[0.9fr_1.1fr]">
        {/* Component detail */}
        <div className="border-b border-secure-border lg:border-b-0 lg:border-r">
          <div className="border-b border-secure-border p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-slate-800 bg-[#080d15]">
                  <SelectedIcon
                    size={17}
                    className={selectedType.className}
                  />
                </div>

                <div>
                  <p className="font-mono text-sm text-white">
                    {selectedComponent.name}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-600">
                    {selectedComponent.technology}
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] ${
                  healthConfig[selectedComponent.health].className
                }`}
              >
                {healthConfig[selectedComponent.health].label}
              </span>
            </div>
          </div>

          <div className="space-y-6 p-5">
            <div>
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Responsibility
              </p>

              <p className="text-xs leading-5 text-slate-400">
                {selectedComponent.description}
              </p>
            </div>

            <div>
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Dependencies
              </p>

              {selectedComponent.dependencies.length > 0 ? (
                <div className="space-y-2">
                  {selectedComponent.dependencies.map((dependency) => {
                    const target = components.find(
                      (component) => component.id === dependency,
                    );

                    if (!target) return null;

                    return (
                      <button
                        key={dependency}
                        type="button"
                        onClick={() => setSelectedId(dependency)}
                        className="flex w-full items-center justify-between border border-slate-800 bg-[#080d15] px-3 py-2 text-left transition hover:border-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight
                            size={12}
                            className="text-slate-700"
                          />
                          <span className="font-mono text-[10px] text-slate-400">
                            {target.name}
                          </span>
                        </div>

                        <span className="text-[9px] text-slate-700">
                          {target.technology}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-slate-600">
                  No downstream dependencies detected.
                </p>
              )}
            </div>

            <div>
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Referenced paths
              </p>

              <div className="space-y-1.5">
                {selectedComponent.files.length > 0 ? (
                  selectedComponent.files.map((file) => (
                    <div
                      key={file}
                      className="border border-slate-800 bg-[#080d15] px-3 py-2 font-mono text-[10px] text-slate-500"
                    >
                      {file}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-600">
                    External component — no repository path.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600">
                  Upstream consumers
                </span>

                <span className="font-mono text-xs text-slate-300">
                  {selectedComponent.dependents.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Findings */}
        <div>
          <div className="border-b border-secure-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <TriangleAlert
                    size={15}
                    className="text-amber-400"
                  />
                  <h2 className="text-sm font-medium text-white">
                    Architecture findings
                  </h2>
                </div>

                <p className="mt-1 text-[10px] text-slate-600">
                  Structural observations generated from dependency analysis.
                </p>
              </div>

              <div className="flex items-center gap-3 font-mono text-[9px]">
                <span className="text-red-400">
                  {highFindings} HIGH
                </span>
                <span className="text-amber-400">
                  {mediumFindings} MEDIUM
                </span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-800/70">
            {findings.map((finding) => (
              <ArchitectureFindingRow
                key={finding.id}
                finding={finding}
                selected={finding.component === selectedComponent.name}
                onSelect={() => {
                  const component = components.find(
                    (item) => item.name === finding.component,
                  );

                  if (component) {
                    setSelectedId(component.id);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Analysis pipeline */}
      <section className="border border-secure-border bg-secure-panel">
        <div className="border-b border-secure-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-violet-400" />
            <h2 className="text-sm font-medium text-white">
              Architecture analysis pipeline
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-5">
          {[
            ["01", "AST parsing", "Source structure indexed"],
            ["02", "Import graph", "Dependencies extracted"],
            ["03", "Boundary detection", "Layers identified"],
            ["04", "Graph analysis", "Relationships mapped"],
            ["05", "AI reasoning", "Findings generated"],
          ].map(([number, title, detail], index) => (
            <div
              key={number}
              className={`p-5 ${
                index !== 4
                  ? "border-b md:border-b-0 md:border-r border-slate-800"
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

      {/* Static data notice */}
      <div className="flex items-start gap-3 border border-cyan-400/10 bg-cyan-400/[0.025] px-4 py-3">
        <CircleAlert
          size={14}
          className="mt-0.5 shrink-0 text-cyan-400"
        />

        <p className="text-[10px] leading-5 text-slate-600">
          Current architecture intelligence uses structured frontend data.
          Later, SecureAI will derive the graph automatically from repository
          source code using AST parsing, import analysis, dependency
          extraction and graph generation.
        </p>
      </div>
    </div>
  );
}

interface ArchitectureNodeProps {
  component: ArchitectureComponent;
  selected: boolean;
  onSelect: () => void;
}

function ArchitectureNode({
  component,
  selected,
  onSelect,
}: ArchitectureNodeProps) {
  const config = typeConfig[component.type];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative w-full border p-4 text-left transition ${
        selected
          ? "border-violet-400/40 bg-violet-500/[0.06]"
          : "border-slate-800 bg-[#080d15] hover:border-slate-700 hover:bg-[#0a0f18]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-slate-800 bg-[#050810]">
            <Icon size={15} className={config.className} />
          </div>

          <div>
            <p className="font-mono text-xs text-slate-200">
              {component.name}
            </p>

            <p className="mt-1 text-[9px] text-slate-600">
              {component.technology}
            </p>
          </div>
        </div>

        <span
          className={`h-1.5 w-1.5 rounded-full ${
            component.health === "healthy"
              ? "bg-emerald-400"
              : component.health === "warning"
                ? "bg-amber-400"
                : "bg-red-400"
          }`}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wider text-slate-700">
          {config.label}
        </span>

        <ChevronRight
          size={12}
          className={`transition ${
            selected
              ? "text-violet-400"
              : "text-slate-700 group-hover:text-slate-500"
          }`}
        />
      </div>
    </button>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center gap-1">
      <div className="h-px w-8 bg-slate-800" />
      <ArrowRight size={14} className="text-slate-700" />
    </div>
  );
}

interface ArchitectureFindingRowProps {
  finding: ArchitectureFinding;
  selected: boolean;
  onSelect: () => void;
}

function ArchitectureFindingRow({
  finding,
  selected,
  onSelect,
}: ArchitectureFindingRowProps) {
  const severityStyles = {
    high: "text-red-400 border-red-500/20 bg-red-500/10",
    medium: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    low: "text-blue-400 border-blue-500/20 bg-blue-500/10",
  };

  const SeverityIcon =
    finding.severity === "high"
      ? CircleAlert
      : finding.severity === "medium"
        ? AlertTriangle
        : CheckCircle2;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full p-5 text-left transition ${
        selected ? "bg-violet-500/[0.04]" : "hover:bg-white/[0.015]"
      }`}
    >
      <div className="flex gap-4">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center border ${severityStyles[finding.severity]}`}
        >
          <SeverityIcon size={14} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-medium text-slate-200">
              {finding.title}
            </h3>

            <span
              className={`border px-1.5 py-0.5 text-[8px] uppercase tracking-wider ${severityStyles[finding.severity]}`}
            >
              {finding.severity}
            </span>
          </div>

          <p className="mt-1.5 text-[10px] text-slate-600">
            {finding.component}
          </p>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            {finding.description}
          </p>

          {selected && (
            <div className="mt-4 grid gap-4 border-t border-slate-800 pt-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-[9px] uppercase tracking-wider text-slate-700">
                  Impact
                </p>
                <p className="text-[10px] leading-5 text-slate-500">
                  {finding.impact}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[9px] uppercase tracking-wider text-slate-700">
                  Recommendation
                </p>
                <p className="text-[10px] leading-5 text-slate-500">
                  {finding.recommendation}
                </p>
              </div>
            </div>
          )}
        </div>

        <ChevronRight
          size={14}
          className={`mt-1 shrink-0 ${
            selected ? "text-violet-400" : "text-slate-700"
          }`}
        />
      </div>
    </button>
  );
}

export default Architecture;