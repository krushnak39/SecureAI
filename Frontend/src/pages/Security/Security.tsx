import {
  AlertOctagon,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

function Security() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck size={13} />
          <span>ANALYSIS / SECURITY</span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold text-white">
          Security Intelligence
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Detect vulnerabilities, exposed secrets, insecure patterns, and
          configuration risks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Security score" value="71" />
        <Metric label="Critical" value="0" />
        <Metric label="High" value="2" />
        <Metric label="Total findings" value="22" />
      </div>

      <div className="border border-slate-800 bg-[#080d15]">
        <div className="border-b border-slate-800 px-5 py-4">
          <span className="text-sm font-medium text-white">
            Security findings
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          <Finding
            icon={<KeyRound size={16} />}
            title="Potential hardcoded credential"
            file="src/config/auth.ts:31"
            severity="HIGH"
          />

          <Finding
            icon={<AlertOctagon size={16} />}
            title="Unsafe input handling"
            file="src/controllers/user.ts:67"
            severity="HIGH"
          />

          <Finding
            icon={<ShieldAlert size={16} />}
            title="Dependency requires security review"
            file="package.json"
            severity="MEDIUM"
          />
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-slate-800 bg-[#0a0f18] p-5">
      <p className="text-[10px] uppercase tracking-widest text-slate-600">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Finding({
  icon,
  title,
  file,
  severity,
}: {
  icon: React.ReactNode;
  title: string;
  file: string;
  severity: string;
}) {
  return (
    <div className="flex items-center gap-4 p-5">
      <div className="text-orange-400">{icon}</div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-200">{title}</p>
        <p className="mt-1 font-mono text-[10px] text-slate-600">{file}</p>
      </div>

      <span className="font-mono text-[9px] text-orange-400">
        {severity}
      </span>
    </div>
  );
}

export default Security;
