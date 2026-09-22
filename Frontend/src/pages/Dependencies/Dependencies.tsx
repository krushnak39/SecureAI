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
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { apiRequest } from "../../services/api";

type DependencyStatus =
  | "HEALTHY"
  | "OUTDATED"
  | "VULNERABLE"
  | "DEPRECATED";

type DependencyType =
  | "DIRECT"
  | "TRANSITIVE";

type DependencySeverity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | null;

interface Dependency {
  id: string;
  name: string;
  ecosystem: string;
  type: DependencyType;
  currentVersion: string;
  latestVersion: string | null;
  status: DependencyStatus;
  severity: DependencySeverity;
  description: string | null;
  advisory: string | null;
  advisoryId: string | null;
  impact: string | null;
  recommendation: string | null;
  files: unknown;
  dependents: unknown;
}

interface DependencyRepository {
  id: string;
  name: string;
  fullName: string;
  branch: string | null;
  defaultBranch: string;
  lastAnalyzed: string | null;
}

interface DependencyResponse {
  projectId: string;
  repository: DependencyRepository | null;
  dependencies: Dependency[];
  summary: {
    total: number;
    direct: number;
    transitive: number;
    vulnerable: number;
    outdated: number;
    healthy: number;
  };
}

type Filter =
  | "all"
  | "HEALTHY"
  | "OUTDATED"
  | "VULNERABLE"
  | "DEPRECATED";

const statusConfig: Record<
  DependencyStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    className: string;
  }
> = {
  HEALTHY: {
    label: "Healthy",
    icon: CheckCircle2,
    className: "text-emerald-400",
  },
  OUTDATED: {
    label: "Outdated",
    icon: TrendingUp,
    className: "text-amber-400",
  },
  VULNERABLE: {
    label: "Vulnerable",
    icon: CircleAlert,
    className: "text-red-400",
  },
  DEPRECATED: {
    label: "Deprecated",
    icon: AlertTriangle,
    className: "text-orange-400",
  },
};

const severityClass: Record<
  Exclude<DependencySeverity, null>,
  string
> = {
  CRITICAL:
    "text-red-300 border-red-500/20 bg-red-500/10",
  HIGH:
    "text-orange-300 border-orange-500/20 bg-orange-500/10",
  MEDIUM:
    "text-amber-300 border-amber-500/20 bg-amber-500/10",
  LOW:
    "text-blue-300 border-blue-500/20 bg-blue-500/10",
};

function getFiles(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string",
  );
}

function getDependentsCount(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  return 0;
}

function formatStatus(status: DependencyStatus) {
  return statusConfig[status];
}

function formatEcosystem(ecosystem: string) {
  return ecosystem.toLowerCase();
}

function Dependencies() {
  const { projectId } = useParams<{
    projectId: string;
  }>();

  const [dependencies, setDependencies] =
    useState<Dependency[]>([]);

  const [repository, setRepository] =
    useState<DependencyRepository | null>(null);

  const [summary, setSummary] =
    useState<DependencyResponse["summary"]>({
      total: 0,
      direct: 0,
      transitive: 0,
      vulnerable: 0,
      outdated: 0,
      healthy: 0,
    });

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [filter, setFilter] =
    useState<Filter>("all");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [rescanning, setRescanning] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function loadDependencies() {
    if (!projectId) {
      setError("Project ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const data =
        await apiRequest<DependencyResponse>(
          `/projects/${projectId}/dependencies`,
        );

      setDependencies(data.dependencies);
      setRepository(data.repository);
      setSummary(data.summary);

      setSelectedId((currentSelectedId) => {
        const stillExists =
          currentSelectedId &&
          data.dependencies.some(
            (dependency) =>
              dependency.id === currentSelectedId,
          );

        if (stillExists) {
          return currentSelectedId;
        }

        return data.dependencies[0]?.id ?? null;
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load dependency intelligence.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRescan() {
    if (!projectId) {
      return;
    }

    try {
      setRescanning(true);
      setError(null);

      await apiRequest(
        `/analysis/projects/${projectId}/analyze`,
        {
          method: "POST",
        },
      );

      await loadDependencies();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to start repository analysis.",
      );
    } finally {
      setRescanning(false);
    }
  }

  useEffect(() => {
    void loadDependencies();
  }, [projectId]);

  const selectedDependency =
    dependencies.find(
      (dependency) =>
        dependency.id === selectedId,
    ) ?? dependencies[0] ?? null;

  const filteredDependencies = useMemo(() => {
    const searchValue =
      search.toLowerCase().trim();

    return dependencies.filter(
      (dependency) => {
        const matchesFilter =
          filter === "all" ||
          dependency.status === filter;

        const matchesSearch =
          !searchValue ||
          dependency.name
            .toLowerCase()
            .includes(searchValue) ||
          dependency.ecosystem
            .toLowerCase()
            .includes(searchValue) ||
          dependency.type
            .toLowerCase()
            .includes(searchValue);

        return (
          matchesFilter &&
          matchesSearch
        );
      },
    );
  }, [
    dependencies,
    filter,
    search,
  ]);

  const selectedFiles = selectedDependency
    ? getFiles(selectedDependency.files)
    : [];

  const selectedDependents =
    selectedDependency
      ? getDependentsCount(
          selectedDependency.dependents,
        )
      : 0;

  const StatusIcon = selectedDependency
    ? formatStatus(
        selectedDependency.status,
      ).icon
    : Package;

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <RefreshCw
            size={16}
            className="animate-spin text-violet-400"
          />
          Loading dependency intelligence...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-600">
          <Package size={12} />
          <span>
            Repository / Dependencies
          </span>
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

                {repository?.branch ??
                  repository?.defaultBranch ??
                  "—"}
              </span>

              {repository && (
                <span className="border border-slate-800 bg-[#0a0f18] px-3 py-1.5 font-mono text-[10px] text-slate-400">
                  {repository.fullName}
                </span>
              )}

              <span className="flex items-center gap-2 text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Dependency inventory ready
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRescan}
            disabled={rescanning}
            className="flex items-center justify-center gap-2 border border-slate-700 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                rescanning
                  ? "animate-spin"
                  : ""
              }
            />

            {rescanning
              ? "Analyzing..."
              : "Rescan dependencies"}
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 border border-red-500/20 bg-red-500/[0.045] px-4 py-3">
          <CircleAlert
            size={15}
            className="mt-0.5 shrink-0 text-red-400"
          />

          <div>
            <p className="text-xs font-medium text-red-300">
              Dependency analysis error
            </p>

            <p className="mt-1 text-[10px] leading-5 text-slate-500">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Overview */}
      <section className="grid grid-cols-2 gap-px border border-secure-border bg-secure-border md:grid-cols-3 xl:grid-cols-6">
        <div className="bg-secure-panel p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Total
          </p>

          <p className="mt-3 text-2xl font-semibold text-white">
            {summary.total}
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
            {summary.healthy}
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
            {summary.vulnerable}
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
            {summary.outdated}
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
            {summary.direct}
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
            {summary.transitive}
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
                  <Terminal
                    size={15}
                    className="text-violet-400"
                  />

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
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search packages..."
                  className="w-full border border-slate-800 bg-[#080d15] py-2 pl-9 pr-3 text-xs text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-slate-600"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  [
                    "VULNERABLE",
                    "Vulnerable",
                  ],
                  ["OUTDATED", "Outdated"],
                  [
                    "DEPRECATED",
                    "Deprecated",
                  ],
                  ["HEALTHY", "Healthy"],
                ] as const
              ).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFilter(value)
                    }
                    className={`border px-3 py-1.5 text-[10px] transition ${
                      filter === value
                        ? "border-violet-400/30 bg-violet-500/10 text-violet-300"
                        : "border-slate-800 bg-[#080d15] text-slate-600 hover:border-slate-700 hover:text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-800/70">
            {filteredDependencies.map(
              (dependency) => {
                const config =
                  formatStatus(
                    dependency.status,
                  );

                const Icon =
                  config.icon;

                const isSelected =
                  dependency.id ===
                  selectedId;

                return (
                  <button
                    key={dependency.id}
                    type="button"
                    onClick={() =>
                      setSelectedId(
                        dependency.id,
                      )
                    }
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
                          {dependency.type.toLowerCase()}
                        </span>

                        {dependency.severity && (
                          <span
                            className={`border px-1.5 py-0.5 text-[8px] uppercase tracking-wider ${
                              severityClass[
                                dependency.severity
                              ]
                            }`}
                          >
                            {dependency.severity.toLowerCase()}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-slate-600">
                        <span>
                          {dependency.currentVersion}{" "}
                          →{" "}
                          {dependency.latestVersion ??
                            "latest version unavailable"}
                        </span>

                        <span>
                          {formatEcosystem(
                            dependency.ecosystem,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="hidden items-center gap-2 sm:flex">
                      <Icon
                        size={14}
                        className={
                          config.className
                        }
                      />

                      <span
                        className={`text-[10px] ${config.className}`}
                      >
                        {config.label}
                      </span>
                    </div>

                    <ChevronRight
                      size={15}
                      className={`shrink-0 ${
                        isSelected
                          ? "text-violet-400"
                          : "text-slate-700"
                      }`}
                    />
                  </button>
                );
              },
            )}

            {filteredDependencies.length ===
              0 && (
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
                    {dependencies.length ===
                    0
                      ? "Run a repository analysis to build the dependency inventory."
                      : "Try changing the filter or search query."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="bg-[#080d15]">
          {selectedDependency ? (
            <>
              <div className="border-b border-slate-800 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Package
                        size={16}
                        className="text-cyan-400"
                      />

                      <span className="font-mono text-lg font-medium text-white">
                        {selectedDependency.name}
                      </span>
                    </div>

                    <p className="mt-1 text-[10px] text-slate-600">
                      {formatEcosystem(
                        selectedDependency.ecosystem,
                      )}{" "}
                      ·{" "}
                      {selectedDependency.type.toLowerCase()}{" "}
                      dependency
                    </p>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 text-[10px] ${
                      formatStatus(
                        selectedDependency.status,
                      ).className
                    }`}
                  >
                    <StatusIcon size={13} />

                    {
                      formatStatus(
                        selectedDependency.status,
                      ).label
                    }
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
                        {
                          selectedDependency.currentVersion
                        }
                      </p>
                    </div>

                    <div className="bg-[#0a0f18] p-4">
                      <p className="text-[9px] uppercase tracking-wider text-slate-600">
                        Latest
                      </p>

                      <p className="mt-2 font-mono text-sm text-cyan-300">
                        {selectedDependency.latestVersion ??
                          "Not checked yet"}
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
                    {selectedDependency.description ??
                      "No package description is available from the current dependency inventory."}
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
                      {
                        selectedDependency.advisory
                      }
                    </p>

                    {selectedDependency.advisoryId && (
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-mono text-[10px] text-red-300">
                          {
                            selectedDependency.advisoryId
                          }
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
                    <CircleAlert
                      size={14}
                      className="text-amber-400"
                    />

                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                      Risk impact
                    </p>
                  </div>

                  <p className="text-xs leading-5 text-slate-400">
                    {selectedDependency.impact ??
                      "No dependency-specific risk impact has been calculated yet."}
                  </p>
                </div>

                {/* Recommendation */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <ArrowUpRight
                      size={14}
                      className="text-emerald-400"
                    />

                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                      Recommendation
                    </p>
                  </div>

                  <p className="text-xs leading-5 text-slate-400">
                    {selectedDependency.recommendation ??
                      "No upgrade recommendation has been generated yet."}
                  </p>
                </div>

                {/* Files */}
                <div>
                  <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Referenced files
                  </p>

                  <div className="space-y-1.5">
                    {selectedFiles.length >
                    0 ? (
                      selectedFiles.map(
                        (file) => (
                          <div
                            key={file}
                            className="flex items-center gap-2 border border-slate-800 bg-[#0a0f18] px-3 py-2"
                          >
                            <Terminal
                              size={12}
                              className="text-slate-600"
                            />

                            <span className="font-mono text-[10px] text-slate-400">
                              {file}
                            </span>
                          </div>
                        ),
                      )
                    ) : (
                      <p className="text-[10px] text-slate-600">
                        No referenced files recorded.
                      </p>
                    )}
                  </div>
                </div>

                {/* Dependents */}
                <div className="border-t border-slate-800 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">
                      Dependency consumers
                    </span>

                    <span className="font-mono text-xs text-slate-300">
                      {selectedDependents}{" "}
                      references
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
            </>
          ) : (
            <div className="flex min-h-[650px] items-center justify-center p-8 text-center">
              <div>
                <Package
                  size={24}
                  className="mx-auto text-slate-700"
                />

                <p className="mt-3 text-sm text-slate-400">
                  No dependency selected
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  Run a repository analysis to populate the inventory.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Analysis pipeline */}
      <section className="border border-secure-border bg-secure-panel">
        <div className="border-b border-secure-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck
              size={15}
              className="text-violet-400"
            />

            <h2 className="text-sm font-medium text-white">
              Dependency analysis pipeline
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-4">
          {[
            [
              "01",
              "Manifest discovery",
              summary.total > 0
                ? "Manifest dependencies detected"
                : "No dependency manifests detected",
            ],
            [
              "02",
              "Dependency inventory",
              `${summary.total} packages indexed`,
            ],
            [
              "03",
              "Advisory intelligence",
              summary.vulnerable > 0
                ? `${summary.vulnerable} vulnerable package${
                    summary.vulnerable === 1
                      ? ""
                      : "s"
                  } detected`
                : "No advisory data available yet",
            ],
            [
              "04",
              "Upgrade analysis",
              summary.outdated > 0
                ? `${summary.outdated} upgrade candidate${
                    summary.outdated === 1
                      ? ""
                      : "s"
                  }`
                : "Version intelligence pending",
            ],
          ].map(
            ([number, title, detail], index) => (
              <div
                key={number}
                className={`p-5 ${
                  index !== 3
                    ? "border-b md:border-b-0 md:border-r"
                    : ""
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
            ),
          )}
        </div>
      </section>

      {/* Backend status notice */}
      <div className="flex items-start gap-3 border border-emerald-400/10 bg-emerald-400/[0.025] px-4 py-3">
        <CheckCircle2
          size={14}
          className="mt-0.5 shrink-0 text-emerald-400"
        />

        <p className="text-[10px] leading-5 text-slate-600">
          Dependency inventory is now connected to the SecureAI backend.
          Package records are sourced from the analyzed repository and
          persisted in PostgreSQL. Vulnerability and latest-version
          intelligence will be added in the next dependency analysis layer.
        </p>
      </div>
    </div>
  );
}

export default Dependencies;