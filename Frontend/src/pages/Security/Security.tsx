import { useMemo, useState, type ReactNode } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCode2,
  Filter,
  KeyRound,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from "lucide-react";

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface SecurityFinding {
  id: number;
  severity: Severity;
  category: string;
  title: string;
  file: string;
  line: number;
  rule: string;
  description: string;
  impact: string;
  evidence: string;
  remediation: string;
  scanner: string;
}

const findings: SecurityFinding[] = [
  {
    id: 1,
    severity: "HIGH",
    category: "Secrets",
    title: "Potential hardcoded credential",
    file: "src/config/auth.ts",
    line: 31,
    rule: "secret-detection",
    description:
      "A credential-like value appears to be embedded directly in application source code.",
    impact:
      "If committed to a repository or exposed through a build artifact, the credential could be reused by an unauthorized party.",
    evidence:
      'const clientSecret = "sk_live_••••••••••";',
    remediation:
      "Move the credential to a protected environment variable or secret manager. Rotate the exposed credential if it is real.",
    scanner: "Secret Scanner",
  },
  {
    id: 2,
    severity: "HIGH",
    category: "Input Validation",
    title: "Unsafe input handling",
    file: "src/controllers/user.ts",
    line: 67,
    rule: "unsafe-input",
    description:
      "User-controlled request data reaches application logic without a visible validation boundary.",
    impact:
      "Unexpected or malicious input can reach sensitive operations and may increase the application's attack surface.",
    evidence:
      "const userData = req.body;\nawait userService.update(userId, userData);",
    remediation:
      "Validate the request body against a strict schema before passing it to the service layer.",
    scanner: "SecureAI Rules",
  },
  {
    id: 3,
    severity: "MEDIUM",
    category: "Dependencies",
    title: "Dependency requires security review",
    file: "package.json",
    line: 24,
    rule: "dependency-advisory",
    description:
      "A project dependency has been flagged for additional vulnerability review.",
    impact:
      "Known vulnerable dependencies can introduce security issues without changes to application code.",
    evidence:
      '"axios": "^1.8.0"',
    remediation:
      "Review the package advisory, update to a patched version where available, and rerun the dependency scan.",
    scanner: "Dependency Scanner",
  },
  {
    id: 4,
    severity: "MEDIUM",
    category: "Authentication",
    title: "Authentication failure path lacks explicit logging",
    file: "src/services/auth.ts",
    line: 118,
    rule: "auth-observability",
    description:
      "The authentication failure branch does not appear to emit structured security telemetry.",
    impact:
      "Reduced visibility can make suspicious authentication activity harder to investigate.",
    evidence:
      "if (!isValid) return unauthorized();",
    remediation:
      "Add structured security logging while ensuring credentials and sensitive user data are never logged.",
    scanner: "SecureAI Rules",
  },
  {
    id: 5,
    severity: "LOW",
    category: "Configuration",
    title: "Security-related configuration should be explicit",
    file: "src/config/server.ts",
    line: 42,
    rule: "secure-config",
    description:
      "A security-related server option is relying on an implicit default.",
    impact:
      "Explicit security configuration reduces ambiguity across environments.",
    evidence:
      "app.use(cors());",
    remediation:
      "Define an explicit allowlist and environment-specific CORS policy.",
    scanner: "SecureAI Rules",
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
    icon: AlertOctagon,
  },
  LOW: {
    text: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/[0.06]",
    icon: Shield,
  },
};

function Security() {
  const [selectedId, setSelectedId] = useState(1);
  const [filter, setFilter] = useState<"ALL" | Severity>("ALL");
  const [search, setSearch] = useState("");
  const [resolved, setResolved] = useState<number[]>([]);

  const filteredFindings = useMemo(() => {
    return findings.filter((finding) => {
      const matchesFilter =
        filter === "ALL" || finding.severity === filter;

      const query = search.toLowerCase();

      const matchesSearch =
        query.length === 0 ||
        finding.title.toLowerCase().includes(query) ||
        finding.file.toLowerCase().includes(query) ||
        finding.category.toLowerCase().includes(query) ||
        finding.rule.toLowerCase().includes(query);

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
      {/* Header */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck size={13} />
            <span>ANALYSIS / SECURITY</span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Security Intelligence
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Detect exposed secrets, insecure patterns, dependency risks,
            and configuration weaknesses across the repository.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
              Security engine live
            </span>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 border border-slate-700 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-slate-200"
          >
            Run security scan
          </button>
        </div>
      </div>

      {/* Security overview */}
      <div className="grid gap-px border border-slate-800 bg-slate-800 md:grid-cols-2 xl:grid-cols-5">
        <SecurityMetric
          label="Security score"
          value="71"
          meta="Needs attention"
          icon={Shield}
          score
        />

        <SecurityMetric
          label="Critical"
          value={String(criticalCount)}
          meta="Immediate action"
          icon={ShieldAlert}
        />

        <SecurityMetric
          label="High"
          value={String(highCount)}
          meta="Priority findings"
          icon={AlertTriangle}
        />

        <SecurityMetric
          label="Medium"
          value={String(mediumCount)}
          meta="Review recommended"
          icon={AlertOctagon}
        />

        <SecurityMetric
          label="Low"
          value={String(lowCount)}
          meta="Informational risk"
          icon={ShieldCheck}
        />
      </div>

      {/* Scanner status */}
      <div className="grid gap-px border border-slate-800 bg-slate-800 md:grid-cols-3">
        <ScannerStatus
          name="Secret Scanner"
          description="Credentials & API keys"
          status="PASSED"
          icon={<KeyRound size={15} />}
        />

        <ScannerStatus
          name="SecureAI Rules"
          description="Application security patterns"
          status="22 findings"
          icon={<ShieldAlert size={15} />}
        />

        <ScannerStatus
          name="Dependency Scanner"
          description="Known package advisories"
          status="3 advisories"
          icon={<Terminal size={15} />}
        />
      </div>

      {/* Findings */}
      <div className="border border-slate-800 bg-[#080d15]">
        <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              Security findings
            </p>

            <p className="mt-1 text-[11px] text-slate-600">
              Findings are mapped to source locations and scanner rules.
            </p>
          </div>

          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span className="text-red-400">
              {criticalCount} CRITICAL
            </span>

            <span className="text-orange-400">
              {highCount} HIGH
            </span>

            <span className="text-amber-400">
              {mediumCount} MEDIUM
            </span>

            <span className="text-blue-400">
              {lowCount} LOW
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 text-slate-600">
            <Filter size={14} />

            <span className="font-mono text-[10px] uppercase tracking-wider">
              Severity
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
              placeholder="Search security findings..."
              className="w-full border border-slate-800 bg-[#0a0f18] py-2 pl-9 pr-3 text-xs text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-slate-600"
            />
          </div>
        </div>

        {/* Security workspace */}
        <div className="grid min-h-[590px] lg:grid-cols-[390px_minmax(0,1fr)]">
          {/* Finding list */}
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
                    No security findings match your search.
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
                          <div className="flex items-center gap-2">
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
                  RULE / {selectedFinding.rule}
                </span>
              </div>
            </div>

            <div className="space-y-6 p-5">
              {/* Finding title */}
              <div>
                <h2 className="text-lg font-medium text-white">
                  {selectedFinding.title}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-slate-600">
                  <FileCode2 size={12} />

                  <span>{selectedFinding.file}</span>

                  <span>:</span>

                  <span>{selectedFinding.line}</span>
                </div>
              </div>

              {/* Description */}
              <DetailSection title="Description">
                <p className="text-sm leading-6 text-slate-400">
                  {selectedFinding.description}
                </p>
              </DetailSection>

              {/* Evidence */}
              <DetailSection title="Evidence">
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
              </DetailSection>

              {/* Impact */}
              <DetailSection title="Security impact">
                <div className="border-l border-orange-400/30 bg-orange-400/[0.025] px-4 py-3">
                  <p className="text-sm leading-6 text-slate-400">
                    {selectedFinding.impact}
                  </p>
                </div>
              </DetailSection>

              {/* Remediation */}
              <DetailSection
                title="Recommended remediation"
                icon={<ShieldCheck size={13} />}
              >
                <div className="border border-emerald-400/15 bg-emerald-400/[0.025] p-4">
                  <p className="text-sm leading-6 text-slate-300">
                    {selectedFinding.remediation}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-emerald-400/10 pt-3">
                    <span className="font-mono text-[9px] text-slate-600">
                      DETECTION SOURCE
                    </span>

                    <span className="font-mono text-[10px] text-emerald-400">
                      {selectedFinding.scanner}
                    </span>
                  </div>
                </div>
              </DetailSection>

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
                  Open source
                </button>

                <button
                  type="button"
                  className="border border-slate-800 px-3 py-2 text-xs text-slate-500 transition hover:border-slate-700 hover:text-slate-200"
                >
                  Suppress finding
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanner pipeline */}
      <div className="border border-slate-800 bg-[#080d15]">
        <div className="border-b border-slate-800 px-5 py-4">
          <p className="text-sm font-medium text-white">
            Security analysis pipeline
          </p>

          <p className="mt-1 text-[11px] text-slate-600">
            Multiple analysis layers contribute to the repository security
            model.
          </p>
        </div>

        <div className="grid gap-px bg-slate-800 md:grid-cols-4">
          <PipelineStep
            number="01"
            title="Source scan"
            description="Repository files inspected"
          />

          <PipelineStep
            number="02"
            title="Pattern detection"
            description="Rules & secret detection"
          />

          <PipelineStep
            number="03"
            title="Risk classification"
            description="Severity & impact mapping"
          />

          <PipelineStep
            number="04"
            title="Remediation"
            description="Developer guidance generated"
          />
        </div>
      </div>
    </div>
  );
}

function SecurityMetric({
  label,
  value,
  meta,
  icon: Icon,
  score = false,
}: {
  label: string;
  value: string;
  meta: string;
  icon: typeof Shield;
  score?: boolean;
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
            score ? "text-orange-400" : "text-slate-700"
          }
        />
      </div>

      <p
        className={`mt-4 text-2xl font-semibold tracking-tight ${
          score ? "text-orange-400" : "text-white"
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

function ScannerStatus({
  name,
  description,
  status,
  icon,
}: {
  name: string;
  description: string;
  status: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 bg-[#0a0f18] p-4">
      <div className="text-cyan-400">{icon}</div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-300">
          {name}
        </p>

        <p className="mt-1 text-[10px] text-slate-600">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

        <span className="font-mono text-[9px] text-emerald-400">
          {status}
        </span>
      </div>
    </div>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        {icon && (
          <span className="text-emerald-400">
            {icon}
          </span>
        )}

        <h3 className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

function PipelineStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-[#0a0f18] p-5">
      <span className="font-mono text-[9px] text-violet-400">
        {number}
      </span>

      <p className="mt-3 text-xs font-medium text-slate-300">
        {title}
      </p>

      <p className="mt-1 text-[10px] leading-5 text-slate-600">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <CheckCircle2
          size={12}
          className="text-emerald-400"
        />

        <span className="font-mono text-[9px] text-emerald-400">
          COMPLETE
        </span>
      </div>
    </div>
  );
}

export default Security;