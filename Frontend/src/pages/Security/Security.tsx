import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Code2,
  FileCode2,
  Filter,
  LockKeyhole,
  Search,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  XCircle,
} from "lucide-react";

type Severity = "Critical" | "High" | "Medium" | "Low";

type SecurityFinding = {
  id: string;
  rule: string;
  title: string;
  severity: Severity;
  file: string;
  line: number;
  description: string;
  impact: string;
  recommendation: string;
  evidence: string;
  confidence: number;
  status: "Open" | "Resolved";
};

const findings: SecurityFinding[] = [
  {
    id: "SEC-001",
    rule: "SEC001",
    title: "Hardcoded API key detected",
    severity: "High",
    file: "src/services/github.service.ts",
    line: 42,
    description:
      "A value matching the structure of an API credential was detected directly in source code.",
    impact:
      "Exposed credentials can be abused if the repository is shared, leaked, or accessed by an unauthorized user.",
    recommendation:
      "Move the credential to an environment variable or a managed secret store and rotate the exposed key.",
    evidence:
      'const apiKey = "sk_live_xxxxxxxxxxxxxxxxx";',
    confidence: 92,
    status: "Open",
  },
  {
    id: "SEC-002",
    rule: "SEC002",
    title: "Hardcoded secret detected",
    severity: "High",
    file: "Backend/src/config/auth.ts",
    line: 18,
    description:
      "A potentially sensitive secret appears to be embedded directly in application code.",
    impact:
      "Anyone with repository access could potentially obtain the secret and use it outside the application.",
    recommendation:
      "Store secrets outside source control and load them through validated environment configuration.",
    evidence:
      'const clientSecret = "secureai-development-secret";',
    confidence: 88,
    status: "Open",
  },
  {
    id: "SEC-003",
    rule: "SEC003",
    title: "Private key material detected",
    severity: "Critical",
    file: "config/github-app.pem",
    line: 1,
    description:
      "Private key material was detected inside the analyzed repository.",
    impact:
      "Compromise of a private signing key may allow unauthorized authentication or impersonation.",
    recommendation:
      "Remove the private key from the repository, rotate it immediately, and store it in a secure secret manager.",
    evidence: "-----BEGIN PRIVATE KEY-----",
    confidence: 99,
    status: "Open",
  },
  {
    id: "SEC-004",
    rule: "SEC004",
    title: "Potential SQL injection",
    severity: "High",
    file: "Backend/src/controllers/user.controller.ts",
    line: 73,
    description:
      "User-controlled input appears to be incorporated into a database query without sufficient parameterization.",
    impact:
      "An attacker may manipulate query input to access or modify data outside the intended operation.",
    recommendation:
      "Use parameterized queries or the ORM query builder instead of constructing SQL from raw input.",
    evidence:
      "query(`SELECT * FROM users WHERE id = ${userId}`)",
    confidence: 84,
    status: "Open",
  },
  {
    id: "SEC-005",
    rule: "SEC005",
    title: "Dangerous eval usage",
    severity: "High",
    file: "src/utils/parser.ts",
    line: 91,
    description:
      "Dynamic code execution was detected through eval().",
    impact:
      "Executing attacker-controlled content can result in arbitrary code execution.",
    recommendation:
      "Remove eval() and replace it with a safe parser or explicit execution logic.",
    evidence: "const result = eval(expression);",
    confidence: 96,
    status: "Open",
  },
  {
    id: "SEC-006",
    rule: "SEC006",
    title: "Potential command injection",
    severity: "High",
    file: "Backend/src/services/analyzer.service.ts",
    line: 117,
    description:
      "Input appears to influence a system command invocation.",
    impact:
      "Unsanitized input could allow an attacker to execute unintended operating-system commands.",
    recommendation:
      "Avoid shell interpolation, validate input against an allowlist, and use safe process APIs with argument arrays.",
    evidence: "exec(`git ${command}`);",
    confidence: 82,
    status: "Open",
  },
  {
    id: "SEC-007",
    rule: "SEC007",
    title: "Insecure HTTP connection",
    severity: "Medium",
    file: "src/services/api.ts",
    line: 12,
    description:
      "An HTTP endpoint was detected where HTTPS may be required.",
    impact:
      "Traffic sent over an insecure connection can potentially be intercepted or modified.",
    recommendation:
      "Use HTTPS for production API communication and enforce secure transport.",
    evidence: 'const API_URL = "http://api.example.com";',
    confidence: 91,
    status: "Open",
  },
  {
    id: "SEC-008",
    rule: "SEC008",
    title: "Weak cryptographic algorithm",
    severity: "Medium",
    file: "Backend/src/utils/hash.ts",
    line: 27,
    description:
      "A potentially weak hashing algorithm was detected.",
    impact:
      "Weak algorithms may make credentials or sensitive data easier to attack.",
    recommendation:
      "Use a modern password hashing algorithm such as Argon2id or bcrypt where appropriate.",
    evidence: 'createHash("md5")',
    confidence: 90,
    status: "Open",
  },
];

const severityStyles: Record<Severity, string> = {
  Critical:
    "border-red-500/30 bg-red-500/10 text-red-300",
  High:
    "border-orange-500/30 bg-orange-500/10 text-orange-300",
  Medium:
    "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  Low:
    "border-blue-500/30 bg-blue-500/10 text-blue-300",
};

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${severityStyles[severity]}`}
    >
      {severity === "Critical" || severity === "High" ? (
        <CircleAlert size={11} />
      ) : (
        <AlertTriangle size={11} />
      )}
      {severity}
    </span>
  );
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <div className="border border-secure-border bg-secure-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secure-muted">
          {label}
        </span>

        <Icon size={17} className="text-secure-cyan" />
      </div>

      <div className="text-3xl font-semibold tracking-tight text-secure-text">
        {value}
      </div>

      <div className="mt-2 text-xs text-secure-muted">
        {description}
      </div>
    </div>
  );
}

export default function Security() {
  const { id } = useParams<{ id: string }>();

  const [selectedFindingId, setSelectedFindingId] = useState(
    findings[0]?.id ?? "",
  );

  const [severityFilter, setSeverityFilter] =
    useState<Severity | "All">("All");

  const [search, setSearch] = useState("");

  const [showResolved, setShowResolved] = useState(false);

  const selectedFinding =
    findings.find((finding) => finding.id === selectedFindingId) ??
    findings[0];

  const filteredFindings = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return findings.filter((finding) => {
      const matchesSeverity =
        severityFilter === "All" ||
        finding.severity === severityFilter;

      const matchesStatus =
        showResolved || finding.status !== "Resolved";

      const matchesSearch =
        normalizedSearch.length === 0 ||
        finding.title.toLowerCase().includes(normalizedSearch) ||
        finding.file.toLowerCase().includes(normalizedSearch) ||
        finding.rule.toLowerCase().includes(normalizedSearch) ||
        finding.description.toLowerCase().includes(normalizedSearch);

      return (
        matchesSeverity &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [search, severityFilter, showResolved]);

  const criticalCount = findings.filter(
    (finding) => finding.severity === "Critical",
  ).length;

  const highCount = findings.filter(
    (finding) => finding.severity === "High",
  ).length;

  const mediumCount = findings.filter(
    (finding) => finding.severity === "Medium",
  ).length;

  const openCount = findings.filter(
    (finding) => finding.status === "Open",
  ).length;

  const securityScore = 71;

  return (
    <div className="min-h-full bg-secure-bg text-secure-text">
      {/* Header */}
      <div className="border-b border-secure-border bg-secure-panel/60">
        <div className="px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs text-secure-muted">
                <Link
                  to={`/projects/${id}`}
                  className="transition hover:text-secure-text"
                >
                  Project
                </Link>

                <ChevronRight size={13} />

                <span className="text-secure-text">
                  Security
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-red-500/25 bg-red-500/10">
                  <ShieldAlert
                    size={20}
                    className="text-red-400"
                  />
                </div>

                <div>
                  <h1 className="text-xl font-semibold tracking-tight">
                    Security Intelligence
                  </h1>

                  <p className="mt-1 text-xs text-secure-muted">
                    Repository vulnerabilities, exposure risks,
                    and remediation intelligence.
                  </p>
                </div>
              </div>
            </div>

            <Link
              to={`/projects/${id}`}
              className="inline-flex items-center gap-2 border border-secure-border bg-secure-panel-soft px-3 py-2 text-xs font-medium text-secure-muted transition hover:border-slate-600 hover:text-secure-text"
            >
              <ArrowLeft size={14} />
              Back to project
            </Link>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="space-y-6 p-6">
        {/* Security status */}
        <section className="border border-secure-border bg-secure-panel">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center border border-red-500/25 bg-red-500/5">
                <div className="text-center">
                  <div className="text-3xl font-semibold text-secure-text">
                    {securityScore}
                  </div>

                  <div className="text-[9px] uppercase tracking-[0.16em] text-secure-muted">
                    Score
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center gap-2">
                  <ShieldAlert
                    size={15}
                    className="text-orange-400"
                  />

                  <span className="text-sm font-semibold">
                    Security posture requires attention
                  </span>
                </div>

                <p className="max-w-xl text-xs leading-5 text-secure-muted">
                  The current analysis identified security findings
                  that should be reviewed before production deployment.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="border border-red-500/20 bg-red-500/5 px-2 py-1 text-[10px] text-red-300">
                    {criticalCount} critical
                  </span>

                  <span className="border border-orange-500/20 bg-orange-500/5 px-2 py-1 text-[10px] text-orange-300">
                    {highCount} high
                  </span>

                  <span className="border border-yellow-500/20 bg-yellow-500/5 px-2 py-1 text-[10px] text-yellow-300">
                    {mediumCount} medium
                  </span>
                </div>
              </div>
            </div>

            <div className="min-w-[220px]">
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-secure-muted">
                <span>Risk distribution</span>
                <span>{openCount} open</span>
              </div>

              <div className="h-2 overflow-hidden bg-slate-800">
                <div className="flex h-full">
                  <div
                    className="bg-red-500"
                    style={{
                      width: `${(criticalCount / findings.length) * 100}%`,
                    }}
                  />

                  <div
                    className="bg-orange-500"
                    style={{
                      width: `${(highCount / findings.length) * 100}%`,
                    }}
                  />

                  <div
                    className="bg-yellow-500"
                    style={{
                      width: `${(mediumCount / findings.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-secure-muted">
                <span>Critical / High / Medium</span>
                <span>8 findings</span>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Security Score"
            value={`${securityScore}/100`}
            description="Current repository posture"
            icon={ShieldCheck}
          />

          <StatCard
            label="Critical"
            value={String(criticalCount)}
            description="Immediate investigation"
            icon={XCircle}
          />

          <StatCard
            label="High Risk"
            value={String(highCount)}
            description="Requires remediation"
            icon={ShieldAlert}
          />

          <StatCard
            label="Open Findings"
            value={String(openCount)}
            description="Unresolved security issues"
            icon={Bug}
          />
        </section>

        {/* Findings workspace */}
        <section className="grid min-h-[650px] grid-cols-1 border border-secure-border bg-secure-panel xl:grid-cols-[430px_1fr]">
          {/* Findings list */}
          <div className="border-b border-secure-border xl:border-b-0 xl:border-r">
            <div className="border-b border-secure-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">
                    Security findings
                  </div>

                  <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-secure-muted">
                    Static analysis intelligence
                  </div>
                </div>

                <span className="border border-secure-border px-2 py-1 text-[10px] text-secure-muted">
                  {filteredFindings.length}
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-secure-muted"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search findings..."
                  className="w-full border border-secure-border bg-secure-panel-soft py-2.5 pl-9 pr-3 text-xs text-secure-text outline-none placeholder:text-slate-600 focus:border-slate-600"
                />
              </div>

              {/* Filters */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSeverityFilter("All")}
                  className={`border px-2.5 py-1.5 text-[10px] font-medium transition ${
                    severityFilter === "All"
                      ? "border-slate-500 bg-slate-800 text-white"
                      : "border-secure-border text-secure-muted hover:text-secure-text"
                  }`}
                >
                  All
                </button>

                {(
                  [
                    "Critical",
                    "High",
                    "Medium",
                  ] as Severity[]
                ).map((severity) => (
                  <button
                    key={severity}
                    type="button"
                    onClick={() =>
                      setSeverityFilter(severity)
                    }
                    className={`border px-2.5 py-1.5 text-[10px] font-medium transition ${
                      severityFilter === severity
                        ? "border-slate-500 bg-slate-800 text-white"
                        : "border-secure-border text-secure-muted hover:text-secure-text"
                    }`}
                  >
                    {severity}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setShowResolved((current) => !current)
                  }
                  className={`ml-auto inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[10px] transition ${
                    showResolved
                      ? "border-secure-cyan/30 bg-secure-cyan/5 text-secure-cyan"
                      : "border-secure-border text-secure-muted"
                  }`}
                >
                  <Filter size={11} />
                  Resolved
                </button>
              </div>
            </div>

            <div className="max-h-[560px] overflow-y-auto">
              {filteredFindings.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2
                    size={28}
                    className="mx-auto text-secure-success"
                  />

                  <div className="mt-3 text-sm font-medium">
                    No findings match
                  </div>

                  <div className="mt-1 text-xs text-secure-muted">
                    Try changing the search or severity filter.
                  </div>
                </div>
              ) : (
                filteredFindings.map((finding) => {
                  const isSelected =
                    finding.id === selectedFinding?.id;

                  return (
                    <button
                      key={finding.id}
                      type="button"
                      onClick={() =>
                        setSelectedFindingId(finding.id)
                      }
                      className={`w-full border-b border-secure-border p-4 text-left transition ${
                        isSelected
                          ? "bg-secure-panel-soft"
                          : "hover:bg-secure-panel-soft/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-2 flex items-center gap-2">
                            <SeverityBadge
                              severity={finding.severity}
                            />

                            <span className="text-[10px] text-secure-muted">
                              {finding.id}
                            </span>
                          </div>

                          <div className="truncate text-sm font-medium text-secure-text">
                            {finding.title}
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-[10px] text-secure-muted">
                            <FileCode2 size={11} />
                            <span className="truncate">
                              {finding.file}
                            </span>
                            <span>:</span>
                            <span>{finding.line}</span>
                          </div>
                        </div>

                        <ChevronRight
                          size={14}
                          className={
                            isSelected
                              ? "text-secure-cyan"
                              : "text-slate-700"
                          }
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Finding detail */}
          <div className="min-w-0">
            {selectedFinding ? (
              <>
                <div className="border-b border-secure-border p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <SeverityBadge
                          severity={selectedFinding.severity}
                        />

                        <span className="text-[10px] uppercase tracking-[0.14em] text-secure-muted">
                          {selectedFinding.rule}
                        </span>
                      </div>

                      <h2 className="text-lg font-semibold tracking-tight">
                        {selectedFinding.title}
                      </h2>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-secure-muted">
                        <Code2 size={13} />

                        <span>
                          {selectedFinding.file}
                        </span>

                        <span>:</span>

                        <span>
                          line {selectedFinding.line}
                        </span>
                      </div>
                    </div>

                    <div className="border border-secure-border bg-secure-panel-soft px-3 py-2">
                      <div className="text-[9px] uppercase tracking-[0.16em] text-secure-muted">
                        Confidence
                      </div>

                      <div className="mt-1 text-sm font-semibold">
                        {selectedFinding.confidence}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  {/* Description */}
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-secure-muted">
                      <CircleAlert size={13} />
                      Finding
                    </div>

                    <p className="text-sm leading-6 text-slate-300">
                      {selectedFinding.description}
                    </p>
                  </div>

                  {/* Evidence */}
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-secure-muted">
                      <Terminal size={13} />
                      Evidence
                    </div>

                    <div className="overflow-x-auto border border-secure-border bg-[#050810] p-4">
                      <pre className="font-mono text-xs leading-6 text-slate-300">
                        <code>
                          <span className="mr-4 select-none text-slate-700">
                            {selectedFinding.line}
                          </span>
                          {selectedFinding.evidence}
                        </code>
                      </pre>
                    </div>
                  </div>

                  {/* Impact / remediation */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="border border-secure-border bg-secure-panel-soft p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                        <LockKeyhole size={13} />
                        Impact
                      </div>

                      <p className="text-xs leading-5 text-secure-muted">
                        {selectedFinding.impact}
                      </p>
                    </div>

                    <div className="border border-secure-border bg-secure-panel-soft p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-secure-cyan">
                        <ShieldCheck size={13} />
                        Remediation
                      </div>

                      <p className="text-xs leading-5 text-secure-muted">
                        {selectedFinding.recommendation}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-3 border-t border-secure-border pt-5 sm:grid-cols-4">
                    <div>
                      <div className="text-[9px] uppercase tracking-[0.14em] text-secure-muted">
                        Rule
                      </div>

                      <div className="mt-1 text-xs font-medium">
                        {selectedFinding.rule}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase tracking-[0.14em] text-secure-muted">
                        Scanner
                      </div>

                      <div className="mt-1 text-xs font-medium">
                        SecureAI
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase tracking-[0.14em] text-secure-muted">
                        Status
                      </div>

                      <div className="mt-1 text-xs font-medium">
                        {selectedFinding.status}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase tracking-[0.14em] text-secure-muted">
                        Confidence
                      </div>

                      <div className="mt-1 text-xs font-medium">
                        {selectedFinding.confidence}%
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[500px] items-center justify-center p-8">
                <div className="text-center">
                  <ShieldCheck
                    size={32}
                    className="mx-auto text-secure-muted"
                  />

                  <div className="mt-3 text-sm">
                    Select a security finding
                  </div>

                  <div className="mt-1 text-xs text-secure-muted">
                    Detailed evidence will appear here.
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Scanner pipeline */}
        <section className="border border-secure-border bg-secure-panel">
          <div className="border-b border-secure-border px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">
                  Security analysis pipeline
                </div>

                <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-secure-muted">
                  Repository → detection → evidence → remediation
                </div>
              </div>

              <span className="inline-flex items-center gap-2 text-[10px] text-secure-success">
                <span className="h-1.5 w-1.5 rounded-full bg-secure-success" />
                Scanner ready
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y divide-secure-border md:grid-cols-4 md:divide-x md:divide-y-0">
            {[
              {
                number: "01",
                title: "Repository",
                text: "Source files and configuration analyzed.",
              },
              {
                number: "02",
                title: "Detection",
                text: "Security rules identify suspicious patterns.",
              },
              {
                number: "03",
                title: "Evidence",
                text: "File, line, rule, and confidence captured.",
              },
              {
                number: "04",
                title: "Remediation",
                text: "Actionable fixes generated for developers.",
              },
            ].map((step) => (
              <div key={step.number} className="p-5">
                <div className="mb-3 text-[10px] font-mono text-secure-cyan">
                  {step.number}
                </div>

                <div className="text-sm font-medium">
                  {step.title}
                </div>

                <div className="mt-1 text-xs leading-5 text-secure-muted">
                  {step.text}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Notice */}
        <div className="flex items-start gap-3 border border-yellow-500/20 bg-yellow-500/5 p-4">
          <AlertTriangle
            size={16}
            className="mt-0.5 shrink-0 text-yellow-400"
          />

          <div>
            <div className="text-xs font-semibold text-yellow-300">
              Analysis preview
            </div>

            <p className="mt-1 text-xs leading-5 text-secure-muted">
              The current interface displays the SecureAI security
              intelligence model. Findings will become repository-specific
              once the analysis API is connected to this project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}