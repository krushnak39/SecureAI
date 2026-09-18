import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  FileCode2,
  Filter,
  GitPullRequest,
  Info,
  Search,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface Finding {
  id: number;
  severity: Severity;
  category: string;
  title: string;
  file: string;
  line: number;
  functionName: string;
  problem: string;
  why: string;
  evidence: string;
  fix: string;
  confidence: number;
}

const findings: Finding[] = [
  {
    id: 1,
    severity: "HIGH",
    category: "Performance",
    title: "Repeated database access inside iteration",
    file: "src/services/repository.ts",
    line: 84,
    functionName: "syncRepositories()",
    problem:
      "A database query is executed for every repository inside the iteration.",
    why:
      "Repeated database round trips can significantly increase execution time as the repository count grows.",
    evidence:
      "repositories.map(async (repo) => { await db.repository.findUnique(...) })",
    fix:
      "Collect the required repository IDs first and replace the repeated queries with a single batched database operation.",
    confidence: 96,
  },
  {
    id: 2,
    severity: "HIGH",
    category: "Security",
    title: "Potential unsafe input handling",
    file: "src/controllers/user.ts",
    line: 67,
    functionName: "updateUser()",
    problem:
      "Request data is passed into a database operation without an explicit validation step.",
    why:
      "Unvalidated input can allow unexpected values to reach sensitive application logic.",
    evidence:
      "const userData = req.body; await userService.update(userId, userData);",
    fix:
      "Validate and sanitize the request body against a strict schema before passing it to the service layer.",
    confidence: 93,
  },
  {
    id: 3,
    severity: "MEDIUM",
    category: "Maintainability",
    title: "High cyclomatic complexity",
    file: "src/utils/parser.ts",
    line: 122,
    functionName: "parseRepository()",
    problem:
      "The function contains multiple nested branches and handles several responsibilities.",
    why:
      "Highly complex functions are harder to test, modify, and reason about.",
    evidence:
      "if (...) { if (...) { switch (...) { ... } } }",
    fix:
      "Extract parsing strategies into smaller functions with one responsibility each.",
    confidence: 89,
  },
  {
    id: 4,
    severity: "MEDIUM",
    category: "Code Quality",
    title: "Duplicate transformation logic",
    file: "src/services/analyzer.ts",
    line: 201,
    functionName: "buildAnalysisResult()",
    problem:
      "Similar data transformation logic is repeated across multiple branches.",
    why:
      "Duplicated logic increases maintenance cost and can cause inconsistent behavior after changes.",
    evidence:
      "result.files = files.map(...)\nresult.dependencies = files.map(...)",
    fix:
      "Extract the shared transformation into a reusable helper.",
    confidence: 86,
  },
  {
    id: 5,
    severity: "LOW",
    category: "Style",
    title: "Variable can be declared closer to usage",
    file: "src/components/ReviewPanel.tsx",
    line: 41,
    functionName: "ReviewPanel()",
    problem:
      "A variable is initialized significantly earlier than where it is consumed.",
    why:
      "Keeping declarations close to their usage improves local readability.",
    evidence: "const reviewContext = buildContext();",
    fix:
      "Move the declaration closer to the code that consumes reviewContext.",
    confidence: 81,
  },
];

const severityConfig: Record<
  Severity,
  {
    text: string;
    border: string;
    bg: string;
    icon: typeof AlertTriangle;
  }
> = {
  CRITICAL: {
    text: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/[0.06]",
    icon: ShieldAlert,
  },
  HIGH: {
    text: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/[0.06]",
    icon: AlertTriangle,
  },
  MEDIUM: {
    text: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/[0.06]",
    icon: Info,
  },
  LOW: {
    text: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/[0.06]",
    icon: Info,
  },
};

function CodeReview() {
  const [selectedId, setSelectedId] = useState(1);
  const [filter, setFilter] = useState<"ALL" | Severity>("ALL");
  const [search, setSearch] = useState("");
  const [resolved, setResolved] = useState<number[]>([]);

  const filteredFindings = useMemo(() => {
    return findings.filter((finding) => {
      const matchesFilter =
        filter === "ALL" || finding.severity === filter;

      const searchText = search.toLowerCase();

      const matchesSearch =
        searchText.length === 0 ||
        finding.title.toLowerCase().includes(searchText) ||
        finding.file.toLowerCase().includes(searchText) ||
        finding.category.toLowerCase().includes(searchText);

      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  const selectedFinding =
    findings.find((finding) => finding.id === selectedId) ??
    findings[0];

  const criticalCount = findings.filter(
    (finding) => finding.severity === "CRITICAL",
  ).length;

  const highCount = findings.filter(
    (finding) => finding.severity === "HIGH",
  ).length;

  const mediumCount = findings.filter(
    (finding) => finding.severity === "MEDIUM",
  ).length;

  const lowCount = findings.filter(
    (finding) => finding.severity === "LOW",
  ).length;

  const toggleResolved = (id: number) => {
    setResolved((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Code2 size={13} />
            <span>ANALYSIS / CODE REVIEW</span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            AI Code Review
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            AI-powered analysis of correctness, maintainability,
            performance, and engineering risks across the repository.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-2">
            <Sparkles size={14} className="text-emerald-400" />

            <span className="font-mono text-[10px] text-emerald-400">
              REVIEW ENGINE READY
            </span>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 border border-slate-700 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-slate-200"
          >
            <GitPullRequest size={14} />
            Review changes
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-px border border-slate-800 bg-slate-800 md:grid-cols-2 xl:grid-cols-5">
        <Summary
          label="Files reviewed"
          value="142"
          meta="100% analyzed"
          icon={FileCode2}
        />

        <Summary
          label="Findings"
          value={String(findings.length)}
          meta={`${resolved.length} resolved`}
          icon={AlertTriangle}
        />

        <Summary
          label="AI confidence"
          value="91%"
          meta="High confidence"
          icon={Sparkles}
        />

        <Summary
          label="Quality impact"
          value="−12"
          meta="Potential score impact"
          icon={Zap}
        />

        <Summary
          label="Review status"
          value="ACTIVE"
          meta="Analysis complete"
          icon={CheckCircle2}
          accent
        />
      </div>

      {/* Severity strip */}
      <div className="border border-slate-800 bg-[#080d15]">
        <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              Review findings
            </p>

            <p className="mt-1 text-[11px] text-slate-600">
              Prioritized by severity and engineering impact.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-[10px]">
            <SeverityCount
              label="CRITICAL"
              count={criticalCount}
              className="text-red-400"
            />

            <SeverityCount
              label="HIGH"
              count={highCount}
              className="text-orange-400"
            />

            <SeverityCount
              label="MEDIUM"
              count={mediumCount}
              className="text-amber-400"
            />

            <SeverityCount
              label="LOW"
              count={lowCount}
              className="text-blue-400"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 text-slate-600">
            <Filter size={14} />

            <span className="font-mono text-[10px] uppercase tracking-wider">
              Filter
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`border px-3 py-1.5 font-mono text-[9px] transition ${
                    filter === item
                      ? "border-violet-400/30 bg-violet-500/[0.08] text-violet-300"
                      : "border-transparent text-slate-600 hover:border-slate-800 hover:text-slate-300"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <div className="relative ml-auto w-full lg:max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search findings..."
              className="w-full border border-slate-800 bg-[#0a0f18] py-2 pl-9 pr-3 text-xs text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-slate-600"
            />
          </div>
        </div>

        {/* Main review workspace */}
        <div className="grid min-h-[560px] lg:grid-cols-[390px_minmax(0,1fr)]">
          {/* Findings */}
          <div className="border-b border-slate-800 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <span className="font-mono text-[9px] uppercase tracking-wider text-slate-600">
                Findings
              </span>

              <span className="font-mono text-[9px] text-slate-700">
                {filteredFindings.length} RESULTS
              </span>
            </div>

            <div className="divide-y divide-slate-800">
              {filteredFindings.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-500">
                    No findings match this filter.
                  </p>
                </div>
              ) : (
                filteredFindings.map((finding) => {
                  const config = severityConfig[finding.severity];
                  const Icon = config.icon;
                  const isSelected = finding.id === selectedFinding.id;
                  const isResolved = resolved.includes(finding.id);

                  return (
                    <button
                      key={finding.id}
                      type="button"
                      onClick={() => setSelectedId(finding.id)}
                      className={`w-full border-l-2 p-4 text-left transition ${
                        isSelected
                          ? "border-violet-400 bg-violet-500/[0.045]"
                          : "border-transparent hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-0.5 ${config.text}`}>
                          <Icon size={15} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <span
                              className={`font-mono text-[9px] ${config.text}`}
                            >
                              {finding.severity}
                            </span>

                            {isResolved && (
                              <span className="font-mono text-[9px] text-emerald-400">
                                RESOLVED
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-1 text-sm ${
                              isResolved
                                ? "text-slate-600 line-through"
                                : "text-slate-200"
                            }`}
                          >
                            {finding.title}
                          </p>

                          <div className="mt-2 flex items-center gap-1.5 font-mono text-[9px] text-slate-600">
                            <FileCode2 size={11} />
                            <span className="truncate">
                              {finding.file}
                            </span>

                            <span>:</span>

                            <span>{finding.line}</span>
                          </div>

                          <div className="mt-2 text-[9px] text-slate-700">
                            {finding.category}
                          </div>
                        </div>

                        <ChevronRight
                          size={14}
                          className={`mt-1 shrink-0 ${
                            isSelected
                              ? "text-violet-400"
                              : "text-slate-800"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Finding details */}
          <div className="min-w-0">
            <div className="border-b border-slate-800 px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`border px-2 py-1 font-mono text-[9px] ${
                    severityConfig[selectedFinding.severity].border
                  } ${
                    severityConfig[selectedFinding.severity].bg
                  } ${
                    severityConfig[selectedFinding.severity].text
                  }`}
                >
                  {selectedFinding.severity}
                </span>

                <span className="border border-slate-800 px-2 py-1 font-mono text-[9px] text-slate-600">
                  {selectedFinding.category}
                </span>

                <span className="ml-auto font-mono text-[9px] text-slate-700">
                  FINDING #{String(selectedFinding.id).padStart(3, "0")}
                </span>
              </div>
            </div>

            <div className="space-y-6 p-5">
              <div>
                <h2 className="text-lg font-medium text-white">
                  {selectedFinding.title}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-slate-600">
                  <FileCode2 size={12} />

                  <span>{selectedFinding.file}</span>

                  <span>:</span>

                  <span>{selectedFinding.line}</span>

                  <span className="text-slate-800">·</span>

                  <span>{selectedFinding.functionName}</span>
                </div>
              </div>

              {/* Problem */}
              <DetailBlock title="Problem">
                <p className="text-sm leading-6 text-slate-400">
                  {selectedFinding.problem}
                </p>
              </DetailBlock>

              {/* Evidence */}
              <DetailBlock title="Evidence">
                <div className="overflow-x-auto border border-slate-800 bg-[#050810]">
                  <div className="flex min-w-max font-mono text-[10px]">
                    <div className="select-none border-r border-slate-800 px-3 py-3 text-right text-slate-700">
                      {selectedFinding.line}
                    </div>

                    <pre className="px-4 py-3 leading-6 text-slate-400">
                      <code>{selectedFinding.evidence}</code>
                    </pre>
                  </div>
                </div>
              </DetailBlock>

              {/* Why */}
              <DetailBlock title="Why it matters">
                <div className="border-l border-amber-400/30 bg-amber-400/[0.025] px-4 py-3">
                  <p className="text-sm leading-6 text-slate-400">
                    {selectedFinding.why}
                  </p>
                </div>
              </DetailBlock>

              {/* AI recommendation */}
              <DetailBlock
                title="AI recommendation"
                icon={<Sparkles size={13} />}
              >
                <div className="border border-violet-400/15 bg-violet-500/[0.025] p-4">
                  <p className="text-sm leading-6 text-slate-300">
                    {selectedFinding.fix}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-violet-400/10 pt-3">
                    <span className="font-mono text-[9px] text-slate-600">
                      AI CONFIDENCE
                    </span>

                    <span className="font-mono text-[10px] text-violet-300">
                      {selectedFinding.confidence}%
                    </span>
                  </div>
                </div>
              </DetailBlock>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={() => toggleResolved(selectedFinding.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition ${
                    resolved.includes(selectedFinding.id)
                      ? "border border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-400"
                      : "bg-white text-black hover:bg-slate-200"
                  }`}
                >
                  <Check size={14} />

                  {resolved.includes(selectedFinding.id)
                    ? "Resolved"
                    : "Mark resolved"}
                </button>

                <button
                  type="button"
                  className="border border-slate-800 px-3 py-2 text-xs text-slate-500 transition hover:border-slate-700 hover:text-slate-200"
                >
                  Open file
                </button>

                <button
                  type="button"
                  className="border border-slate-800 px-3 py-2 text-xs text-slate-500 transition hover:border-slate-700 hover:text-slate-200"
                >
                  Ignore finding
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom engineering note */}
      <div className="flex items-start gap-3 border border-slate-800 bg-[#080d15] px-5 py-4">
        <Info size={14} className="mt-0.5 shrink-0 text-cyan-400" />

        <div>
          <p className="text-xs font-medium text-slate-300">
            SecureAI review pipeline
          </p>

          <p className="mt-1 text-[11px] leading-5 text-slate-600">
            Repository → parser → code intelligence → AI reasoning →
            finding classification → developer recommendation.
          </p>
        </div>
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
  meta,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  meta: string;
  icon: typeof FileCode2;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#0a0f18] p-5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
          {label}
        </span>

        <Icon
          size={14}
          className={
            accent ? "text-emerald-400" : "text-slate-700"
          }
        />
      </div>

      <p
        className={`mt-4 text-2xl font-semibold tracking-tight ${
          accent ? "text-emerald-400" : "text-white"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 font-mono text-[9px] text-slate-700">
        {meta}
      </p>
    </div>
  );
}

function SeverityCount({
  label,
  count,
  className,
}: {
  label: string;
  count: number;
  className: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span className={className}>{label}</span>
      <span className="text-slate-400">{count}</span>
    </span>
  );
}

function DetailBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        {icon && <span className="text-violet-400">{icon}</span>}

        <h3 className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

export default CodeReview;