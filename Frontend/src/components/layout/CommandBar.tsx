import {
  Bell,
  ChevronDown,
  Command,
  GitBranch,
  Search,
} from "lucide-react";

function CommandBar() {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800/80 bg-[#070b12]/95 backdrop-blur">
      <div className="flex h-full items-center justify-between px-5 lg:px-7">
        {/* Left */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center border border-violet-400/30 bg-violet-500/10 text-violet-300">
              <Command size={16} />
            </div>

            <span className="text-sm font-semibold text-white">
              SecureAI
            </span>
          </div>

          <div className="hidden items-center gap-2 text-xs lg:flex">
            <span className="font-mono text-slate-600">
              SECUREAI
            </span>

            <span className="text-slate-700">/</span>

            <span className="text-slate-400">
              krushnak39/SecureAI
            </span>

            <span className="text-slate-700">/</span>

            <div className="flex items-center gap-1.5 text-slate-300">
              <GitBranch size={12} />
              <span className="font-mono">feature</span>
            </div>
          </div>
        </div>

        {/* Center search */}
        <button
          type="button"
          className="hidden w-full max-w-sm items-center justify-between border border-slate-800 bg-[#0a0f18] px-3 py-2 text-left transition hover:border-slate-700 md:flex"
        >
          <div className="flex items-center gap-2">
            <Search size={15} className="text-slate-600" />

            <span className="text-xs text-slate-500">
              Search repository, findings, files...
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-600">
            <kbd className="border border-slate-800 px-1.5 py-0.5">
              Ctrl
            </kbd>

            <kbd className="border border-slate-800 px-1.5 py-0.5">
              K
            </kbd>
          </div>
        </button>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 border border-emerald-400/10 bg-emerald-400/[0.03] px-2.5 py-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400">
              Engine live
            </span>
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="flex h-8 w-8 items-center justify-center text-slate-500 transition hover:text-white"
          >
            <Bell size={16} />
          </button>

          <div className="h-5 w-px bg-slate-800" />

          <button
            type="button"
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800 font-mono text-xs text-slate-300">
              D
            </div>

            <ChevronDown
              size={13}
              className="text-slate-600"
            />
          </button>
        </div>
      </div>
    </header>
  );
}

export default CommandBar;