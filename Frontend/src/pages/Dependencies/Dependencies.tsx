import { Box, CircleAlert, PackageCheck } from "lucide-react";

function Dependencies() {
  return (
    <div className="space-y-6">
      <Header
        icon={<Box size={13} />}
        label="ANALYSIS / DEPENDENCIES"
        title="Dependency Intelligence"
        description="Track packages, versions, outdated dependencies, and vulnerability exposure."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total packages" value="48" />
        <Stat label="Outdated" value="7" />
        <Stat label="Security advisories" value="3" />
      </div>

      <div className="border border-slate-800 bg-[#080d15]">
        <div className="border-b border-slate-800 px-5 py-4 text-sm font-medium text-white">
          Dependency inventory
        </div>

        <Dependency name="react" version="19.1.0" status="CURRENT" />
        <Dependency name="express" version="5.1.0" status="CURRENT" />
        <Dependency name="prisma" version="6.19.0" status="UPDATE" />
        <Dependency name="axios" version="1.8.0" status="REVIEW" />
      </div>
    </div>
  );
}

function Header({
  icon,
  label,
  title,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-slate-600">
        {icon}
        <span>{label}</span>
      </div>

      <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>

      <p className="mt-1 text-sm text-slate-500">{description}</p>
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

function Dependency({
  name,
  version,
  status,
}: {
  name: string;
  version: string;
  status: string;
}) {
  return (
    <div className="flex items-center gap-4 border-t border-slate-800 p-5">
      <PackageCheck size={16} className="text-slate-600" />

      <div className="flex-1">
        <p className="font-mono text-sm text-slate-200">{name}</p>
        <p className="mt-1 font-mono text-[10px] text-slate-600">
          v{version}
        </p>
      </div>

      <span
        className={`font-mono text-[9px] ${
          status === "CURRENT"
            ? "text-emerald-400"
            : status === "REVIEW"
              ? "text-orange-400"
              : "text-amber-400"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

export default Dependencies;