import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  FileCode2,
  Sparkles,
} from "lucide-react";

function CodeReview() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Code2 size={13} />
          <span>ANALYSIS / CODE REVIEW</span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          AI Code Review
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Review repository code for quality, correctness, maintainability,
          and engineering risks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="border border-slate-800 bg-[#0a0f18] p-5">
          <p className="text-[10px] uppercase tracking-widest text-slate-600">
            Files reviewed
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">142</p>
        </div>

        <div className="border border-slate-800 bg-[#0a0f18] p-5">
          <p className="text-[10px] uppercase tracking-widest text-slate-600">
            Findings
          </p>
          <p className="mt-3 text-3xl font-semibold text-orange-400">22</p>
        </div>

        <div className="border border-slate-800 bg-[#0a0f18] p-5">
          <p className="text-[10px] uppercase tracking-widest text-slate-600">
            AI confidence
          </p>
          <p className="mt-3 text-3xl font-semibold text-cyan-400">91%</p>
        </div>
      </div>

      <div className="border border-slate-800 bg-[#080d15]">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-violet-400" />
            <span className="text-sm font-medium text-white">
              Review findings
            </span>
          </div>

          <span className="font-mono text-[10px] text-slate-600">
            AI ENGINE
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          <div className="flex gap-4 p-5">
            <AlertTriangle size={17} className="mt-0.5 text-orange-400" />

            <div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-200">
                  Repeated database access inside iteration
                </span>

                <span className="font-mono text-[9px] text-orange-400">
                  HIGH
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Consider batching the database operation to reduce repeated
                queries and improve runtime efficiency.
              </p>

              <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-slate-600">
                <FileCode2 size={12} />
                src/services/repository.ts:84
              </div>
            </div>
          </div>

          <div className="flex gap-4 p-5">
            <CheckCircle2 size={17} className="mt-0.5 text-emerald-400" />

            <div>
              <span className="text-sm font-medium text-slate-200">
                Authentication service passed review
              </span>

              <p className="mt-2 text-xs text-slate-500">
                No significant correctness or maintainability issues detected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeReview;