import {
  Activity,
  Box,
  Code2,
  FileText,
  Gauge,
  GitBranch,
  LayoutDashboard,
  MessageSquareCode,
  Network,
  Settings2,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const sections = [
  {
    title: "Repository",
    items: [
      {
        label: "Overview",
        icon: LayoutDashboard,
      },
      {
        label: "Code Review",
        icon: Code2,
      },
      {
        label: "Security",
        icon: ShieldCheck,
      },
      {
        label: "Dependencies",
        icon: Box,
      },
    ],
  },
  {
    title: "Analysis",
    items: [
      {
        label: "Architecture",
        icon: Network,
      },
      {
        label: "Performance",
        icon: Gauge,
      },
      {
        label: "Codebase Chat",
        icon: MessageSquareCode,
      },
      {
        label: "Documentation",
        icon: FileText,
      },
      {
        label: "CI/CD",
        icon: Workflow,
      },
    ],
  },
];

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-800/80 bg-[#070b12] lg:flex lg:flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-slate-800/80 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-violet-400/30 bg-violet-500/10 text-violet-300">
            <Activity size={17} />
          </div>

          <div>
            <div className="text-sm font-semibold tracking-tight text-white">
              SecureAI
            </div>

            <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
              Engineering Intelligence
            </div>
          </div>
        </div>
      </div>

      {/* Repository context */}
      <div className="border-b border-slate-800/80 p-4">
        <div className="border border-slate-800 bg-[#0a0f18] p-3">
          <div className="flex items-center gap-2">
            <GitBranch size={14} className="text-violet-400" />

            <span className="text-xs font-medium text-slate-200">
              SecureAI
            </span>
          </div>

          <p className="mt-1 truncate font-mono text-[10px] text-slate-500">
            krushnak39/SecureAI
          </p>

          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-500">
              feature
            </span>

            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              READY
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <div className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              {section.title}
            </div>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.label === "Overview";

                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`group flex w-full items-center gap-3 border-l px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? "border-violet-400 bg-violet-500/[0.07] text-white"
                        : "border-transparent text-slate-500 hover:border-slate-700 hover:bg-white/[0.025] hover:text-slate-200"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={
                        isActive
                          ? "text-violet-400"
                          : "text-slate-600 group-hover:text-slate-400"
                      }
                    />

                    <span>{item.label}</span>

                    {item.label === "Security" && (
                      <span className="ml-auto font-mono text-[9px] text-orange-400">
                        22
                      </span>
                    )}

                    {item.label === "Code Review" && (
                      <span className="ml-auto font-mono text-[9px] text-slate-600">
                        AI
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom status */}
      <div className="border-t border-slate-800/80 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-cyan-400/20 bg-cyan-400/5 text-cyan-400">
            <Settings2 size={15} />
          </div>

          <div>
            <p className="text-[11px] font-medium text-slate-300">
              Analysis Engine
            </p>

            <p className="mt-0.5 font-mono text-[9px] text-emerald-400">
              ONLINE · 42s
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;