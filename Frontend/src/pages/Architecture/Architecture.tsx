import { Network, Server, Database, Globe } from "lucide-react";

function Architecture() {
  return (
    <div className="space-y-6">
      <Header />

      <div className="border border-slate-800 bg-[#080d15] p-6">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-white">
            Repository architecture graph
          </span>

          <span className="font-mono text-[9px] text-slate-600">
            37 NODES · 64 EDGES
          </span>
        </div>

        <div className="grid min-h-[380px] place-items-center border border-dashed border-slate-800 bg-[#060a11]">
          <div className="grid grid-cols-3 gap-10">
            <Node icon={<Globe size={18} />} label="Frontend" />
            <Node icon={<Server size={18} />} label="API" />
            <Node icon={<Database size={18} />} label="Database" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <Network size={13} />
        <span>ANALYSIS / ARCHITECTURE</span>
      </div>

      <h1 className="mt-2 text-2xl font-semibold text-white">
        Architecture Intelligence
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Understand services, dependencies, coupling, and repository structure.
      </p>
    </div>
  );
}

function Node({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 border border-slate-700 bg-[#0b111b] px-8 py-5">
      <div className="text-violet-400">{icon}</div>
      <span className="font-mono text-xs text-slate-300">{label}</span>
    </div>
  );
}

export default Architecture;