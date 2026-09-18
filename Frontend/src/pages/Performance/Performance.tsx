import { Gauge, Zap } from "lucide-react";

function Performance() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Gauge size={13} />
          <span>ANALYSIS / PERFORMANCE</span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold text-white">
          Performance Intelligence
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Identify inefficient code paths, expensive operations, and runtime
          bottlenecks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Performance score" value="89" />
        <Stat label="Hotspots" value="6" />
        <Stat label="Optimization opportunities" value="14" />
      </div>

      <div className="border border-slate-800 bg-[#080d15]">
        <div className="border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-cyan-400" />
            <span className="text-sm font-medium text-white">
              Detected hotspots
            </span>
          </div>
        </div>

        {["Repository scan loop", "API response serialization", "Database query batching"].map(
          (item, index) => (
            <div
              key={item}
              className="flex items-center gap-4 border-b border-slate-800 p-5 last:border-b-0"
            >
              <span className="font-mono text-[10px] text-slate-600">
                0{index + 1}
              </span>

              <span className="flex-1 text-sm text-slate-300">
                {item}
              </span>

              <span className="font-mono text-[9px] text-cyan-400">
                OPTIMIZE
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-800 bg-[#0a0f18] p-5">
      <p className="text-[10px] uppercase tracking-widest text-slate-600">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default Performance;