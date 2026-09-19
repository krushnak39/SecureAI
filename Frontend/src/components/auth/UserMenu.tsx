import {
  ChevronDown,
  FolderKanban,
  LogOut,
  Settings,
  UserCircle2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

function UserMenu() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);
      setOpen(false);

      await logout();

      navigate("/", { replace: true });
    } catch {
      setLoggingOut(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label="Open account menu"
        className="flex items-center gap-2 border border-slate-800 bg-[#090e18] px-2 py-1.5 transition hover:border-slate-600"
      >
        <div className="flex h-7 w-7 items-center justify-center bg-violet-500/10 text-[10px] font-semibold text-violet-300">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div className="hidden max-w-[120px] text-left sm:block">
          <p className="truncate text-[10px] font-medium text-slate-300">
            {user.name}
          </p>

          <p className="truncate text-[9px] text-slate-700">
            {user.email}
          </p>
        </div>

        <ChevronDown
          size={13}
          className={`text-slate-600 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute right-0 top-full z-50 mt-2 w-64 border border-slate-800 bg-[#090e18] shadow-2xl">
            <div className="border-b border-slate-800 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-violet-500/10 text-sm font-semibold text-violet-300">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white">
                    {user.name}
                  </p>

                  <p className="mt-1 truncate text-[10px] text-slate-600">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <Link
                to="/projects"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-xs text-slate-500 transition hover:bg-slate-800/40 hover:text-white"
              >
                <FolderKanban size={15} />
                Projects
              </Link>

              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-xs text-slate-500 transition hover:bg-slate-800/40 hover:text-white"
              >
                <Settings size={15} />
                Settings
              </Link>

              <div className="my-2 h-px bg-slate-800" />

              <div className="px-3 py-2 text-[9px] tracking-[0.15em] text-slate-700">
                ACCOUNT
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-xs text-red-400 transition hover:bg-red-500/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut size={15} />

                {loggingOut
                  ? "Signing out..."
                  : "Sign out"}
              </button>
            </div>

            <div className="border-t border-slate-800 px-3 py-2.5">
              <div className="flex items-center gap-2 text-[9px] text-slate-700">
                <UserCircle2 size={13} />
                SecureAI account
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default UserMenu;