import {
  CheckCircle2,
  GitBranch,
  Workflow,
  XCircle,
} from "lucide-react";

function CICD() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Workflow size={13} />
          <span>ENGINEERING / CI/CD</span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold text-white">
          CI/CD Intelligence
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Analyze pipelines, pull requests, checks, and automated engineering
          feedback.
        </p>
      </div>

      <div className="border border-slate-800 bg-[#080d15]">
        <div className="border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <GitBranch size={15} className="text-violet-400" />
            <span className="text-sm font-medium text-white">
              Recent pipeline activity
            </span>
          </div>
        </div>

        <Pipeline name="feature" status="PASSED" />
        <Pipeline name="security-scan" status="PASSED" />
        <Pipeline name="dependency-update" status="FAILED" />
      </div>
    </div>
  );
}

function Pipeline({
  name,
  status,
}: {
  name: string;
  status: string;
}) {
  const passed = status === "PASSED";

  return (
    <div className="flex items-center gap-4 border-b border-slate-800 p-5 last:border-b-0">
      {passed ? (
        <CheckCircle2 size={16} className="text-emerald-400" />
      ) : (
        <XCircle size={16} className="text-red-400" />
      )}

      <span className="flex-1 font-mono text-sm text-slate-300">
        {name}
      </span>

      <span
        className={`font-mono text-[9px] ${
          passed ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

export default CICD;
