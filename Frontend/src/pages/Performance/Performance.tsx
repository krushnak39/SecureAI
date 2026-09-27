import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  Gauge,
  GitBranch,
  Layers3,
  RefreshCw,
  Search,
  Server,
  Sparkles,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { apiRequest } from "../../services/api";

type PerformanceSeverity = "high" | "medium" | "low";

interface PerformanceIssue {
  id: string;
  severity: PerformanceSeverity;
  category: string;
  title: string;
  file: string;
  line: number | null;
  metric: string | null;
  currentValue: string | null;
  expectedValue: string | null;
  description: string;
  impact: string | null;
  recommendation: string | null;
  evidence: string | null;
}

interface PerformanceAnalysis {
  id: string;
  status: string;
  branch: string | null;
  commitSha: string | null;
  filesAnalyzed: number;
  linesAnalyzed: number;
  performance: number | null;
  completedAt: string | null;
}

interface PerformanceMetrics {
  performanceHealth: number | null;
  issueCount: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
}

interface PerformanceResponse {
  success: boolean;
  analysis: PerformanceAnalysis | null;
  metrics: PerformanceMetrics;
  issues: PerformanceIssue[];
}

const severityStyles: Record<
  PerformanceSeverity,
  string
> = {
  high: "text-red-400 border-red-500/20 bg-red-500/10",
  medium: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  low: "text-blue-400 border-blue-500/20 bg-blue-500/10",
};

function normalizeSeverity(
  severity: string,
): PerformanceSeverity {
  switch (severity.toUpperCase()) {
    case "HIGH":
    case "CRITICAL":
      return "high";

    case "MEDIUM":
      return "medium";

    default:
      return "low";
  }
}

function formatMetricValue(
  value: string | null,
): string {
  if (!value) {
    return "Not measured";
  }

  return value;
}

function formatLine(
  line: number | null,
): string {
  return line !== null ? String(line) : "—";
}

function formatCompletedAt(
  value: string | null,
): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function Performance() {
  const { projectId } = useParams<{
    projectId: string;
  }>();

  const [data, setData] =
    useState<PerformanceResponse | null>(null);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [filter, setFilter] =
    useState<"all" | PerformanceSeverity>("all");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [scanning, setScanning] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadPerformance =
    useCallback(async () => {
      if (!projectId) {
        setError("Project ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setError(null);

        const response =
          await apiRequest<PerformanceResponse>(
            `/projects/${projectId}/performance`,
          );

        setData(response);

        setSelectedId((currentSelectedId) => {
          const exists =
            response.issues.some(
              (issue) =>
                issue.id === currentSelectedId,
            );

          if (exists) {
            return currentSelectedId;
          }

          return response.issues[0]?.id ?? null;
        });
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Failed to load performance analysis.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }, [projectId]);

  useEffect(() => {
    void loadPerformance();
  }, [loadPerformance]);

  const handleScan =
    useCallback(async () => {
      if (!projectId || scanning) {
        return;
      }

      try {
        setScanning(true);
        setError(null);

        await apiRequest(
          `/analysis/projects/${projectId}/analyze`,
          {
            method: "POST",
          },
        );

        await loadPerformance();
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Failed to start performance scan.";

        setError(message);
      } finally {
        setScanning(false);
      }
    }, [
      projectId,
      scanning,
      loadPerformance,
    ]);

  const issues = useMemo(() => {
    return (
      data?.issues ?? []
    ).map((issue) => ({
      ...issue,
      severity: normalizeSeverity(
        issue.severity,
      ),
    }));
  }, [data]);

  const filteredIssues =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return issues.filter((issue) => {
        const matchesFilter =
          filter === "all" ||
          issue.severity === filter;

        if (!query) {
          return matchesFilter;
        }

        const searchableText = [
          issue.title,
          issue.category,
          issue.file,
          issue.metric ?? "",
          issue.description,
          issue.impact ?? "",
          issue.recommendation ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesFilter &&
          searchableText.includes(query)
        );
      });
    }, [issues, filter, search]);

  const selectedIssue =
    issues.find(
      (issue) =>
        issue.id === selectedId,
    ) ?? null;

  const performanceHealth =
    data?.metrics.performanceHealth;

  const analysis =
    data?.analysis ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-600">
          <Gauge size={12} />
          <span>
            Repository / Performance
          </span>
        </div>

        <div className="flex flex-col gap-5 border border-secure-border bg-secure-panel p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-cyan-400/20 bg-cyan-400/5 text-cyan-400">
                <Gauge size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Performance Intelligence
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Detect static performance
                  patterns, hotspots and
                  optimization opportunities.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 border border-slate-800 bg-[#0a0f18] px-3 py-1.5 font-mono text-[10px] text-slate-400">
                <GitBranch size={12} />
                {analysis?.branch ?? "—"}
              </span>

              <span className="border border-slate-800 bg-[#0a0f18] px-3 py-1.5 font-mono text-[10px] text-slate-400">
                {data?.metrics.issueCount ?? 0}{" "}
                hotspots
              </span>

              <span className="flex items-center gap-2 text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Static analyzer ready
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleScan()}
            disabled={scanning || loading}
            className="flex items-center justify-center gap-2 border border-slate-700 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                scanning
                  ? "animate-spin"
                  : ""
              }
            />

            {scanning
              ? "Running performance scan..."
              : "Run performance scan"}
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <section className="border border-red-500/20 bg-red-500/[0.04] px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={15}
              className="mt-0.5 shrink-0 text-red-400"
            />

            <div>
              <p className="text-xs font-medium text-red-300">
                Performance analysis error
              </p>

              <p className="mt-1 text-[10px] leading-5 text-red-400/70">
                {error}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Loading */}
      {loading && !data ? (
        <section className="border border-secure-border bg-secure-panel p-10">
          <div className="flex flex-col items-center justify-center text-center">
            <RefreshCw
              size={22}
              className="animate-spin text-cyan-400"
            />

            <p className="mt-4 text-sm text-slate-300">
              Loading performance intelligence...
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Reading the latest completed analysis.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* Metrics */}
          <section className="grid grid-cols-2 gap-px border border-secure-border bg-secure-border md:grid-cols-4">
            <Metric
              icon={Gauge}
              label="Performance health"
              value={
                performanceHealth !== null &&
                performanceHealth !== undefined
                  ? String(
                      performanceHealth,
                    )
                  : "—"
              }
              detail={
                performanceHealth !== null &&
                performanceHealth !== undefined
                  ? "/ 100"
                  : "not analyzed"
              }
              className="text-cyan-400"
            />

            <Metric
              icon={AlertTriangle}
              label="High severity"
              value={String(
                data?.metrics
                  .highSeverityCount ?? 0,
              )}
              detail="high / critical"
              className="text-red-400"
            />

            <Metric
              icon={Activity}
              label="Medium severity"
              value={String(
                data?.metrics
                  .mediumSeverityCount ?? 0,
              )}
              detail="optimization"
              className="text-amber-400"
            />

            <Metric
              icon={BarChart3}
              label="Total hotspots"
              value={String(
                data?.metrics
                  .issueCount ?? 0,
              )}
              detail={`${data?.metrics.lowSeverityCount ?? 0} low`}
              className="text-violet-400"
            />
          </section>

          {/* Static performance signals */}
          <section className="grid gap-4 md:grid-cols-3">
            <SignalCard
              icon={Gauge}
              title="Performance health"
              value={
                performanceHealth !== null &&
                performanceHealth !== undefined
                  ? `${performanceHealth} / 100`
                  : "Not measured"
              }
              target="static analysis score"
              progress={
                performanceHealth ?? 0
              }
              status={
                performanceHealth === null ||
                performanceHealth === undefined
                  ? "No analysis"
                  : performanceHealth >= 80
                    ? "Healthy"
                    : performanceHealth >= 60
                      ? "Needs review"
                      : "At risk"
              }
            />

            <SignalCard
              icon={Database}
              title="Database patterns"
              value={String(
                issues.filter(
                  (issue) =>
                    issue.category
                      .toLowerCase()
                      .includes("database") ||
                    issue.category
                      .toLowerCase()
                      .includes("query"),
                ).length,
              )}
              target="detected hotspots"
              progress={Math.min(
                100,
                issues.filter(
                  (issue) =>
                    issue.category
                      .toLowerCase()
                      .includes("database") ||
                    issue.category
                      .toLowerCase()
                      .includes("query"),
                ).length * 20,
              )}
              status="Static signal"
            />

            <SignalCard
              icon={Zap}
              title="Frontend patterns"
              value={String(
                issues.filter(
                  (issue) =>
                    issue.category
                      .toLowerCase()
                      .includes("frontend") ||
                    issue.category
                      .toLowerCase()
                      .includes("bundle") ||
                    issue.category
                      .toLowerCase()
                      .includes("asset"),
                ).length,
              )}
              target="detected hotspots"
              progress={Math.min(
                100,
                issues.filter(
                  (issue) =>
                    issue.category
                      .toLowerCase()
                      .includes("frontend") ||
                    issue.category
                      .toLowerCase()
                      .includes("bundle") ||
                    issue.category
                      .toLowerCase()
                      .includes("asset"),
                ).length * 20,
              )}
              status="Static signal"
            />
          </section>

          {/* Main workspace */}
          <section className="grid min-h-[650px] border border-secure-border bg-secure-panel lg:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)]">
            {/* Issues */}
            <div className="min-w-0 border-b border-secure-border lg:border-b-0 lg:border-r">
              <div className="border-b border-secure-border p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Activity
                        size={15}
                        className="text-violet-400"
                      />

                      <h2 className="text-sm font-medium text-white">
                        Performance hotspots
                      </h2>
                    </div>

                    <p className="mt-1 text-[10px] text-slate-600">
                      {filteredIssues.length}{" "}
                      performance issues in the
                      current view.
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
                      placeholder="Search hotspots..."
                      className="w-full border border-slate-800 bg-[#080d15] py-2 pl-9 pr-3 text-xs text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-slate-600"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(
                    [
                      ["all", "All"],
                      ["high", "High"],
                      ["medium", "Medium"],
                      ["low", "Low"],
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
                {filteredIssues.map(
                  (issue) => (
                    <PerformanceIssueRow
                      key={issue.id}
                      issue={issue}
                      selected={
                        issue.id ===
                        selectedId
                      }
                      onSelect={() =>
                        setSelectedId(
                          issue.id,
                        )
                      }
                    />
                  ),
                )}

                {filteredIssues.length ===
                  0 && (
                  <div className="flex min-h-56 items-center justify-center p-8 text-center">
                    <div>
                      <Search
                        size={22}
                        className="mx-auto text-slate-700"
                      />

                      <p className="mt-3 text-sm text-slate-400">
                        {issues.length === 0
                          ? "No performance issues found"
                          : "No matching performance issues"}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        {issues.length ===
                        0
                          ? "The latest analysis did not detect any static performance hotspots."
                          : "Try another search or severity filter."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detail */}
            <div className="bg-[#080d15]">
              {selectedIssue ? (
                <>
                  <div className="border-b border-slate-800 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Zap
                            size={15}
                            className="text-cyan-400"
                          />

                          <span className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
                            Hotspot detail
                          </span>
                        </div>

                        <h2 className="mt-2 text-sm font-medium text-white">
                          {selectedIssue.title}
                        </h2>

                        <p className="mt-1 font-mono text-[10px] text-slate-600">
                          {selectedIssue.file}
                          :
                          {formatLine(
                            selectedIssue.line,
                          )}
                        </p>
                      </div>

                      <span
                        className={`border px-2 py-1 text-[9px] uppercase tracking-wider ${severityStyles[selectedIssue.severity]}`}
                      >
                        {selectedIssue.severity}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6 p-5">
                    {/* Metric */}
                    <div className="grid grid-cols-2 gap-px border border-slate-800 bg-slate-800">
                      <div className="bg-[#0a0f18] p-4">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">
                          Observed
                        </p>

                        <p className="mt-2 font-mono text-sm text-red-300">
                          {formatMetricValue(
                            selectedIssue.currentValue,
                          )}
                        </p>
                      </div>

                      <div className="bg-[#0a0f18] p-4">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">
                          Target
                        </p>

                        <p className="mt-2 font-mono text-sm text-emerald-300">
                          {formatMetricValue(
                            selectedIssue.expectedValue,
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                        Observation
                      </p>

                      <p className="text-xs leading-5 text-slate-400">
                        {
                          selectedIssue.description
                        }
                      </p>
                    </div>

                    {/* Evidence */}
                    {selectedIssue.evidence && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                            Evidence
                          </p>

                          <span className="font-mono text-[9px] text-slate-700">
                            {
                              selectedIssue.file
                            }
                            :
                            {formatLine(
                              selectedIssue.line,
                            )}
                          </span>
                        </div>

                        <pre className="overflow-x-auto border border-slate-800 bg-[#050810] p-4 font-mono text-[10px] leading-5 text-slate-500">
                          <code>
                            {
                              selectedIssue.evidence
                            }
                          </code>
                        </pre>
                      </div>
                    )}

                    {/* Impact */}
                    {selectedIssue.impact && (
                      <div className="border border-amber-400/10 bg-amber-400/[0.025] p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle
                            size={14}
                            className="text-amber-400"
                          />

                          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-400/70">
                            Performance impact
                          </p>
                        </div>

                        <p className="mt-2 text-xs leading-5 text-slate-400">
                          {
                            selectedIssue.impact
                          }
                        </p>
                      </div>
                    )}

                    {/* Recommendation */}
                    {selectedIssue.recommendation && (
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <Sparkles
                            size={14}
                            className="text-violet-400"
                          />

                          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                            Optimization
                            recommendation
                          </p>
                        </div>

                        <p className="text-xs leading-5 text-slate-400">
                          {
                            selectedIssue.recommendation
                          }
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 border-t border-slate-800 pt-5">
                      <button
                        type="button"
                        disabled
                        className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 border border-slate-800 px-3 py-2.5 text-xs text-slate-600"
                        title="Source navigation will be connected to the repository viewer later."
                      >
                        <ArrowRight size={13} />
                        Open source
                      </button>

                      <button
                        type="button"
                        disabled
                        className="flex items-center justify-center gap-2 border border-slate-800 px-3 py-2.5 text-xs text-slate-600"
                        title="Finding suppression will be added later."
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-[500px] items-center justify-center p-8 text-center">
                  <div>
                    <CheckCircle2
                      size={24}
                      className="mx-auto text-emerald-400"
                    />

                    <p className="mt-3 text-sm text-slate-300">
                      No hotspot selected
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      The latest analysis has no
                      performance issues to inspect.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Pipeline */}
          <section className="border border-secure-border bg-secure-panel">
            <div className="border-b border-secure-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Layers3
                  size={15}
                  className="text-violet-400"
                />

                <h2 className="text-sm font-medium text-white">
                  Performance analysis pipeline
                </h2>
              </div>
            </div>

            <div className="grid md:grid-cols-5">
              {[
                [
                  "01",
                  "Static analysis",
                  "Performance patterns indexed",
                ],
                [
                  "02",
                  "Query analysis",
                  "Static query patterns detected",
                ],
                [
                  "03",
                  "Runtime profiling",
                  "Runtime metrics not collected yet",
                ],
                [
                  "04",
                  "Bundle analysis",
                  "Bundle metrics not collected yet",
                ],
                [
                  "05",
                  "AI reasoning",
                  "AI performance reasoning planned",
                ],
              ].map(
                (
                  [number, title, detail],
                  index,
                ) => (
                  <div
                    key={number}
                    className={`p-5 ${
                      index !== 4
                        ? "border-b border-slate-800 md:border-b-0 md:border-r"
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

                    <div
                      className={`mt-3 flex items-center gap-2 text-[10px] ${
                        index < 2
                          ? "text-emerald-400"
                          : "text-slate-600"
                      }`}
                    >
                      {index < 2 ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Server size={12} />
                      )}

                      {detail}
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>

          {/* Analysis information */}
          {analysis && (
            <section className="grid gap-px border border-secure-border bg-secure-border md:grid-cols-3">
              <AnalysisInfo
                label="Files analyzed"
                value={analysis.filesAnalyzed.toLocaleString()}
              />

              <AnalysisInfo
                label="Lines analyzed"
                value={analysis.linesAnalyzed.toLocaleString()}
              />

              <AnalysisInfo
                label="Completed"
                value={formatCompletedAt(
                  analysis.completedAt,
                )}
              />
            </section>
          )}

          {/* Notice */}
          <div className="flex items-start gap-3 border border-cyan-400/10 bg-cyan-400/[0.025] px-4 py-3">
            <Server
              size={14}
              className="mt-0.5 shrink-0 text-cyan-400"
            />

            <p className="text-[10px] leading-5 text-slate-600">
              Current performance intelligence is based
              on static repository analysis. SecureAI
              does not currently claim real runtime API
              latency, database query timings, browser
              render timings, or bundle-size measurements.
              Those metrics can be added later through
              dedicated profiling and build-analysis
              integrations.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

interface MetricProps {
  icon: typeof Gauge;
  label: string;
  value: string;
  detail: string;
  className: string;
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  className,
}: MetricProps) {
  return (
    <div className="bg-secure-panel p-5">
      <div className="flex items-center gap-2 text-slate-600">
        <Icon size={14} />

        <span className="text-[10px] uppercase tracking-wider">
          {label}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <p
          className={`text-2xl font-semibold ${className}`}
        >
          {value}
        </p>

        <span className="mb-1 text-[9px] text-slate-700">
          {detail}
        </span>
      </div>
    </div>
  );
}

interface SignalCardProps {
  icon: typeof Gauge;
  title: string;
  value: string;
  target: string;
  progress: number;
  status: string;
}

function SignalCard({
  icon: Icon,
  title,
  value,
  target,
  progress,
  status,
}: SignalCardProps) {
  return (
    <div className="border border-secure-border bg-secure-panel p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            size={15}
            className="text-slate-500"
          />

          <span className="text-xs font-medium text-slate-300">
            {title}
          </span>
        </div>

        <span className="font-mono text-[9px] text-amber-400">
          {status}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <span className="font-mono text-xl text-white">
          {value}
        </span>

        <span className="text-[9px] text-slate-600">
          {target}
        </span>
      </div>

      <div className="mt-4 h-1 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
          style={{
            width: `${Math.max(
              0,
              Math.min(100, progress),
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

interface PerformanceIssueRowProps {
  issue: PerformanceIssue;
  selected: boolean;
  onSelect: () => void;
}

function PerformanceIssueRow({
  issue,
  selected,
  onSelect,
}: PerformanceIssueRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full gap-4 p-4 text-left transition ${
        selected
          ? "bg-violet-500/[0.05]"
          : "hover:bg-white/[0.02]"
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border ${severityStyles[issue.severity]}`}
      >
        {issue.severity === "high" ? (
          <AlertTriangle size={14} />
        ) : issue.severity === "medium" ? (
          <Activity size={14} />
        ) : (
          <Zap size={14} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-200">
            {issue.title}
          </span>

          <span
            className={`border px-1.5 py-0.5 text-[8px] uppercase tracking-wider ${severityStyles[issue.severity]}`}
          >
            {issue.severity}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-[10px] text-slate-600">
            {issue.category}
          </span>

          <span className="font-mono text-[10px] text-slate-700">
            {issue.file}:
            {formatLine(issue.line)}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4">
          {issue.metric && (
            <span className="text-[9px] text-slate-600">
              {issue.metric}
            </span>
          )}

          {issue.currentValue && (
            <span className="font-mono text-[10px] text-red-300/80">
              {issue.currentValue}
            </span>
          )}

          {issue.currentValue &&
            issue.expectedValue && (
              <>
                <span className="text-[9px] text-slate-700">
                  ?
                </span>

                <span className="font-mono text-[10px] text-emerald-300/70">
                  {issue.expectedValue}
                </span>
              </>
            )}
        </div>
      </div>

      <ArrowRight
        size={14}
        className={`mt-1 shrink-0 ${
          selected
            ? "text-violet-400"
            : "text-slate-700"
        }`}
      />
    </button>
  );
}

interface AnalysisInfoProps {
  label: string;
  value: string;
}

function AnalysisInfo({
  label,
  value,
}: AnalysisInfoProps) {
  return (
    <div className="bg-secure-panel p-4">
      <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 font-mono text-xs text-slate-300">
        {value}
      </p>
    </div>
  );
}

export default Performance;
