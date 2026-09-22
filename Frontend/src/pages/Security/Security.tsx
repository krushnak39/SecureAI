import {
  AlertTriangle,
  ArrowUpRight,
  Box,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  GitBranch,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

type DependencyStatus =
  | "healthy"
  | "outdated"
  | "vulnerable"
  | "deprecated";

type DependencyType = "direct" | "transitive";

interface Dependency {
  id: number;
  name: string;
  ecosystem: string;
  type: DependencyType;
  currentVersion: string;
  latestVersion: string;
  status: DependencyStatus;
  severity: "critical" | "high" | "medium" | "low" | "none";
  description: string;
  advisory?: string;
  advisoryId?: string;
  impact: string;
  recommendation: string;
  files: string[];
  dependents: number;
}

const dependencies: Dependency[] = [
  {
    id: 1,
    name: "express",
    ecosystem: "npm",
    type: "direct",
    currentVersion: "4.18.2",
    latestVersion: "5.1.0",
    status: "outdated",
    severity: "medium",
    description:
      "Fast, minimalist web framework for Node.js applications.",
    impact:
      "The installed major version is behind the current release and may miss security, performance, and maintenance improvements.",
    recommendation:
      "Review the Express 5 migration guide and upgrade after validating middleware compatibility.",
    files: ["package.json", "src/server.ts"],
    dependents: 4,
  },
  {
    id: 2,
    name: "axios",
    ecosystem: "npm",
    type: "direct",
    currentVersion: "1.6.2",
    latestVersion: "1.12.2",
    status: "vulnerable",
    severity: "high",
    description:
      "Promise-based HTTP client for browser and Node.js environments.",
    advisory:
      "Installed version is affected by a published security advisory.",
    advisoryId: "GHSA-8hc4-vh64-cxmj",
    impact:
      "A vulnerable HTTP client can expose applications to unexpected request handling and security issues depending on how untrusted URLs and responses are processed.",
    recommendation:
      "Upgrade to the latest compatible release and run the application's HTTP integration tests.",
    files: ["package.json", "src/services/github.ts"],
    dependents: 6,
  },
  {
    id: 3,
    name: "jsonwebtoken",
    ecosystem: "npm",
    type: "direct",
    currentVersion: "9.0.1",
    latestVersion: "9.0.2",
    status: "healthy",
    severity: "none",
    description:
      "Implementation of JSON Web Tokens for authentication and authorization.",
    impact:
      "No dependency risk was detected in the current static analysis snapshot.",
    recommendation:
      "Keep the package updated and continue validating token configuration during security analysis.",
    files: ["package.json", "src/auth/token.ts"],
    dependents: 3,
  },
  {
    id: 4,
    name: "lodash",
    ecosystem: "npm",
    type: "transitive",
    currentVersion: "4.17.19",
    latestVersion: "4.17.21",
    status: "vulnerable",
    severity: "high",
    description:
      "Utility library included transitively by another application dependency.",
    advisory:
      "Installed version contains known security issues addressed by later releases.",
    advisoryId: "GHSA-35jh-r3h4-6jhm",
    impact:
      "Because this package enters the application through the dependency tree, vulnerable utility code may still be reachable by application code.",
    recommendation:
      "Upgrade the parent dependency or use an npm override to resolve the vulnerable transitive version.",
    files: ["package-lock.json"],
    dependents: 8,
  },
  {
    id: 5,
    name: "cors",
    ecosystem: "npm",
    type: "direct",
    currentVersion: "2.8.5",
    latestVersion: "2.8.5",
    status: "healthy",
    severity: "none",
    description:
      "Node.js middleware for enabling Cross-Origin Resource Sharing.",
    impact:
      "No package-level vulnerability was detected in this snapshot.",
    recommendation:
      "Keep the package version pinned and review runtime CORS configuration separately.",
    files: ["package.json", "src/server.ts"],
    dependents: 2,
  },
  {
    id: 6,
    name: "dotenv",
    ecosystem: "npm",
    type: "direct",
    currentVersion: "16.4.1",
    latestVersion: "17.2.2",
    status: "outdated",
    severity: "low",
    description:
      "Loads environment variables from a .env file into process.env.",
    impact:
      "The dependency is behind the current release but no known vulnerability is associated with the installed version in this snapshot.",
    recommendation:
      "Upgrade during the next maintenance cycle and verify environment-loading behavior.",
    files: ["package.json", "src/config/env.ts"],
    dependents: 2,
  },
  {
    id: 7,
    name: "prisma",
    ecosystem: "npm",
    type: "direct",
    currentVersion: "6.19.0",
    latestVersion: "6.19.0",
    status: "healthy",
    severity: "none",
    description:
      "Type-safe ORM and database toolkit used by the backend.",
    impact:
      "The installed package matches the analyzed latest version.",
    recommendation:
      "No upgrade required. Continue monitoring Prisma security advisories.",
    files: ["package.json", "prisma/schema.prisma"],
    dependents: 5,
  },
  {
    id: 8,
    name: "minimist",
    ecosystem: "npm",
    type: "transitive",
    currentVersion: "1.2.5",
    latestVersion: "1.2.8",
    status: "deprecated",
    severity: "medium",
    description:
      "Small argument parser present in the transitive dependency tree.",
    impact:
      "Deprecated transitive packages increase maintenance risk and may prevent the dependency tree from receiving future fixes.",
    recommendation:
      "Identify the parent dependency and upgrade it to a release that removes the deprecated package.",
    files: ["package-lock.json"],
    dependents: 3,
  },
];

const statusConfig: Record<
  DependencyStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    className: string;
  }
> = {
  healthy: {
    label: "Healthy",
    icon: CheckCircle2,
    className: "text-emerald-400",
  },
  outdated: {
    label: "Outdated",
    icon: TrendingUp,
    className: "text-amber-400",
  },
  vulnerable: {
    label: "Vulnerable",
    icon: CircleAlert,
    className: "text-red-400",
  },
  deprecated: {
    label: "Deprecated",
    icon: AlertTriangle,
    className: "text-orange-400",
  },
};

const severityClass: Record<Dependency["severity"], string> = {
  critical: "text-red-300 border-red-500/20 bg-red-500/10",
  high: "text-orange-300 border-orange-500/20 bg-orange-500/10",
  medium: "text-amber-300 border-amber-500/20 bg-amber-500/10",
  low: "text-blue-300 border-blue-500/20 bg-blue-500/10",
  none: "text-slate-500 border-slate-700 bg-slate-800/30",
};

function Dependencies() {
  const [selectedId, setSelectedId] = useState(2);
  const [filter, setFilter] = useState<"all" | DependencyStatus>("all");
  const [search, setSearch] = useState("");

  const selectedDependency =
    dependencies.find((dependency) => dependency.id === selectedId) ??
    dependencies[0];

  const filteredDependencies = useMemo(() => {
    return dependencies.filter((dependency) => {
      const matchesFilter =
        filter === "all" || dependency.status === filter;

      const searchValue = search.toLowerCase();

      const matchesSearch =
        dependency.name.toLowerCase().includes(searchValue) ||
        dependency.ecosystem.toLowerCase().includes(searchValue) ||
        dependency.type.toLowerCase().includes(searchValue);

      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  const healthyCount = dependencies.filter(
    (dependency) => dependency.status === "healthy",
  ).length;

  const outdatedCount = dependencies.filter(
    (dependency) => dependency.status === "outdated",
  ).length;

  const vulnerableCount = dependencies.filter(
    (dependency) => dependency.status === "vulnerable",
  ).length;

  const deprecatedCount = dependencies.filter(
    (dependency) => dependency.status === "deprecated",
  ).length;

  const directCount = dependencies.filter(
    (dependency) => dependency.type === "direct",
  ).length;

  const transitiveCount = dependencies.filter(
    (dependency) => dependency.type === "transitive",
  ).length;

  const StatusIcon = statusConfig[selectedDependency.status].icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-600">
          <Package size={12} />
          <span>Repository / Dependencies</span>
        </div>

        <div className="flex flex-col gap-5 border border-secure-border bg-secure-panel p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-cyan-400/20 bg-cyan-400/5 text-cyan-400">
                <Box size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Dependency Intelligence
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Dependency inventory, upgrade intelligence and supply-chain
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
                package-lock.json
              </span>

              <span className="flex items-center gap-2 text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Dependency graph ready
              </span>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 border border-slate-700 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-slate-200"
          >
            <RefreshCw size={15} />
            Rescan dependencies
          </button>
        </div>
      </section>

      {/* Overview */}
      <section className="grid grid-cols-2 gap-px border border-secure-border bg-secure-border md:grid-cols-3 xl:grid-cols-6">
        <div className="bg-secure-panel p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Total
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {dependencies.length}
          </p>
          <p className="mt-1 text-[10px] text-slate-600">
            packages analyzed
          </p>
        </div>

        <div className="bg-secure-panel p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Healthy
          </p>
          <p className="mt-3 text-2xl font-semibold text-emerald-400">
            {healthyCount}
          </p>
          <p className="mt-1 text-[10px] text-slate-600">
            no package risk
          </p>
        </div>

        <div className="bg-secure-panel p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Vulnerable
          </p>
          <p className="mt-3 text-2xl font-semibold text-red-400">
            {vulnerableCount}
          </p>
          <p className="mt-1 text-[10px] text-slate-600">
            require attention
          </p>
        </div>

        <div className="bg-secure-panel p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Outdated
          </p>
          <p className="mt-3 text-2xl font-semibold text-amber-400">
            {outdatedCount}
          </p>
          <p className="mt-1 text-[10px] text-slate-600">
            upgrade candidates
          </p>
        </div>

        <div className="bg-secure-panel p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Direct
          </p>
          <p className="mt-3 text-2xl font-semibold text-cyan-400">
            {directCount}
          </p>
          <p className="mt-1 text-[10px] text-slate-600">
            declared packages
          </p>
        </div>

        <div className="bg-secure-panel p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Transitive
          </p>
          <p className="mt-3 text-2xl font-semibold text-violet-400">
            {transitiveCount}
          </p>
          <p className="mt-1 text-[10px] text-slate-600">
            indirect packages
          </p>
        </div>
      </section>

      {/* Main workspace */}
      <section className="grid min-h-[650px] border border-secure-border bg-secure-panel lg:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)]">
        {/* Inventory */}
        <div className="min-w-0 border-b border-secure-border lg:border-b-0 lg:border-r">
          <div className="border-b border-secure-border p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Terminal size={15} className="text-violet-400" />
                  <h2 className="text-sm font-medium text-white">
                    Package inventory
                  </h2>
                </div>
                <p className="mt-1 text-[11px] text-slate-600">
                  {filteredDependencies.length} dependencies match the current
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
                  placeholder="Search packages..."
                  className="w-full border border-slate-800 bg-[#080d15] py-2 pl-9 pr-3 text-xs text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-slate-600"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["vulnerable", "Vulnerable"],
                  ["outdated", "Outdated"],
                  ["deprecated", "Deprecated"],
                  ["healthy", "Healthy"],
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
            {filteredDependencies.map((dependency) => {
              const config = statusConfig[dependency.status];
              const Icon = config.icon;
              const isSelected = dependency.id === selectedId;

              return (
                <button
                  key={dependency.id}
                  type="button"
                  onClick={() => setSelectedId(dependency.id)}
                  className={`flex w-full items-center gap-4 p-4 text-left transition ${
                    isSelected
                      ? "bg-violet-500/[0.055]"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center border ${
                      isSelected
                        ? "border-violet-400/20 bg-violet-500/10"
                        : "border-slate-800 bg-[#080d15]"
                    }`}
                  >
                    <Package
                      size={16}
                      className={
                        isSelected
                          ? "text-violet-300"
                          : "text-slate-600"
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-slate-200">
                        {dependency.name}
                      </span>

                      <span className="border border-slate-800 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-slate-600">
                        {dependency.type}
                      </span>

                      {dependency.severity !== "none" && (
                        <span
                          className={`border px-1.5 py-0.5 text-[8px] uppercase tracking-wider ${severityClass[dependency.severity]}`}
                        >
                          {dependency.severity}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-slate-600">
                      <span>
                        {dependency.currentVersion} →{" "}
                        {dependency.latestVersion}
                      </span>
                      <span>{dependency.ecosystem}</span>
                    </div>
                  </div>

                  <div className="hidden items-center gap-2 sm:flex">
                    <Icon size={14} className={config.className} />
                    <span className={`text-[10px] ${config.className}`}>
                      {config.label}
                    </span>
                  </div>

                  <ChevronRight
                    size={15}
                    className={`shrink-0 ${
                      isSelected ? "text-violet-400" : "text-slate-700"
                    }`}
                  />
                </button>
              );
            })}

            {filteredDependencies.length === 0 && (
              <div className="flex min-h-56 items-center justify-center p-8 text-center">
                <div>
                  <Search
                    size={22}
                    className="mx-auto text-slate-700"
                  />
                  <p className="mt-3 text-sm text-slate-400">
                    No dependencies found
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Try changing the filter or search query.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="bg-[#080d15]">
          <div className="border-b border-slate-800 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-cyan-400" />
                  <span className="font-mono text-lg font-medium text-white">
                    {selectedDependency.name}
                  </span>
                </div>

                <p className="mt-1 text-[10px] text-slate-600">
                  {selectedDependency.ecosystem} ·{" "}
                  {selectedDependency.type} dependency
                </p>
              </div>

              <div
                className={`flex items-center gap-1.5 text-[10px] ${statusConfig[selectedDependency.status].className}`}
              >
                <StatusIcon size={13} />
                {statusConfig[selectedDependency.status].label}
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5">
            {/* Version comparison */}
            <div>
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Version state
              </p>

              <div className="grid grid-cols-2 gap-px border border-slate-800 bg-slate-800">
                <div className="bg-[#0a0f18] p-4">
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">
                    Installed
                  </p>
                  <p className="mt-2 font-mono text-sm text-slate-200">
                    {selectedDependency.currentVersion}
                  </p>
                </div>

                <div className="bg-[#0a0f18] p-4">
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">
                    Latest
                  </p>
                  <p className="mt-2 font-mono text-sm text-cyan-300">
                    {selectedDependency.latestVersion}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Package
              </p>
              <p className="text-xs leading-5 text-slate-400">
                {selectedDependency.description}
              </p>
            </div>

            {/* Advisory */}
            {selectedDependency.advisory && (
              <div className="border border-red-500/20 bg-red-500/[0.045] p-4">
                <div className="flex items-center gap-2 text-red-400">
                  <ShieldCheck size={15} />
                  <span className="text-xs font-medium">
                    Security advisory
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {selectedDependency.advisory}
                </p>

                {selectedDependency.advisoryId && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-red-300">
                      {selectedDependency.advisoryId}
                    </span>

                    <button
                      type="button"
                      className="flex items-center gap-1 text-[10px] text-slate-500 transition hover:text-white"
                    >
                      Advisory details
                      <ExternalLink size={11} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Impact */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <CircleAlert size={14} className="text-amber-400" />
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Risk impact
                </p>
              </div>

              <p className="text-xs leading-5 text-slate-400">
                {selectedDependency.impact}
              </p>
            </div>

            {/* Recommendation */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <ArrowUpRight size={14} className="text-emerald-400" />
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Upgrade recommendation
                </p>
              </div>

              <p className="text-xs leading-5 text-slate-400">
                {selectedDependency.recommendation}
              </p>
            </div>

            {/* Files */}
            <div>
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Referenced files
              </p>

              <div className="space-y-1.5">
                {selectedDependency.files.map((file) => (
                  <div
                    key={file}
                    className="flex items-center gap-2 border border-slate-800 bg-[#0a0f18] px-3 py-2"
                  >
                    <Terminal size={12} className="text-slate-600" />
                    <span className="font-mono text-[10px] text-slate-400">
                      {file}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dependents */}
            <div className="border-t border-slate-800 pt-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600">
                  Dependency consumers
                </span>

                <span className="font-mono text-xs text-slate-300">
                  {selectedDependency.dependents} references
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-slate-800 pt-5">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 border border-slate-700 bg-white px-3 py-2.5 text-xs font-medium text-black transition hover:bg-slate-200"
              >
                <ArrowUpRight size={13} />
                Review upgrade
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

      {/* Scanner pipeline */}
      <section className="border border-secure-border bg-secure-panel">
        <div className="border-b border-secure-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-violet-400" />
            <h2 className="text-sm font-medium text-white">
              Dependency analysis pipeline
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-4">
          {[
            ["01", "Manifest discovery", "package.json detected"],
            ["02", "Dependency graph", "8 packages indexed"],
            ["03", "Advisory scan", "Security database checked"],
            ["04", "Upgrade analysis", "Recommendations generated"],
          ].map(([number, title, detail], index) => (
            <div
              key={number}
              className={`p-5 ${
                index !== 3 ? "border-b md:border-b-0 md:border-r" : ""
              } border-slate-800`}
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

      {/* Static-data notice */}
      <div className="flex items-start gap-3 border border-cyan-400/10 bg-cyan-400/[0.025] px-4 py-3">
        <CircleAlert
          size={14}
          className="mt-0.5 shrink-0 text-cyan-400"
        />
        <p className="text-[10px] leading-5 text-slate-600">
          Current dependency intelligence is represented with structured
          frontend data. The same interface will later consume real
          package manifests, dependency graphs, vulnerability databases and
          upgrade analysis from the SecureAI backend.
        </p>
      </div>

      {/* Hidden reference so deprecated count remains intentionally represented */}
      <span className="hidden">{deprecatedCount}</span>
    </div>
  );
}

export default Dependencies;
