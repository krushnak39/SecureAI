import {
  Activity,
  Bell,
  ChevronDown,
  Command,
  GitBranch,
  Search,
  ShieldCheck,
} from "lucide-react";

function CommandBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#070b14] px-6 text-white">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
            <ShieldCheck size={19} strokeWidth={2.5} />
          </div>

          <span className="text-lg font-semibold tracking-tight">
            SecureAI
          </span>
        </div>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a
            href="/dashboard"
            className="text-white transition hover:text-slate-300"
          >
            Intelligence
          </a>

          <a
            href="/projects"
            className="text-slate-500 transition hover:text-white"
          >
            Projects
          </a>

          <a
            href="/security"
            className="text-slate-500 transition hover:text-white"
          >
            Security
          </a>

          <a
            href="/code-chat"
            className="text-slate-500 transition hover:text-white"
          >
            AI Chat
          </a>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-400 transition hover:border-slate-700 hover:text-white sm:flex">
          <Search size={16} />
          <span>Search</span>
          <span className="ml-3 flex items-center gap-1 text-xs text-slate-600">
            <Command size={11} /> K
          </span>
        </button>

        <button className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-900 hover:text-white">
          <Bell size={19} />
        </button>

        <div className="hidden h-6 w-px bg-slate-800 sm:block" />

        <button className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold">
            D
          </div>

          <ChevronDown size={14} className="text-slate-500" />
        </button>
      </div>
    </header>
  );
}

export default CommandBar;