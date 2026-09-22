import { useEffect, useState } from "react";
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
import { NavLink, useLocation } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

function Sidebar() {
  const location = useLocation();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  /*
   * If we are already inside a project route, use that project's ID.
   *
   * Example:
   * /projects/cmu8ry2hd0001sktx5mcpoos/security
   */
  const projectRouteMatch = location.pathname.match(
    /^\/projects\/([^/]+)/,
  );

  const projectId =
    projectRouteMatch?.[1] ?? selectedProjectId;

  /*
   * Dashboard does not contain a project ID in its URL.
   * Fetch the first project so the sidebar can still generate
   * project-aware links from /dashboard.
   */
  useEffect(() => {
    if (projectRouteMatch) {
      return;
    }

    async function loadProject() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/projects`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        const projects = Array.isArray(data)
          ? data
          : data.projects;

        if (Array.isArray(projects) && projects.length > 0) {
          setSelectedProjectId(projects[0].id);
        }
      } catch {
        // Keep the sidebar usable even if projects cannot be loaded.
      }
    }

    loadProject();
  }, [location.pathname, projectRouteMatch]);

  const projectPath = projectId
    ? `/projects/${projectId}`
    : "/projects";

  const reviewPath = projectId
    ? `/projects/${projectId}/review`
    : "/projects";

  const securityPath = projectId
    ? `/projects/${projectId}/security`
    : "/projects";

  const dependenciesPath = projectId
    ? `/projects/${projectId}/dependencies`
    : "/projects";

  const architecturePath = projectId
    ? `/projects/${projectId}/architecture`
    : "/projects";

  const performancePath = projectId
    ? `/projects/${projectId}/performance`
    : "/projects";

  const chatPath = projectId
    ? `/projects/${projectId}/chat`
    : "/projects";

  const documentationPath = projectId
    ? `/projects/${projectId}/documentation`
    : "/projects";

  const cicdPath = projectId
    ? `/projects/${projectId}/cicd`
    : "/projects";

  const sections = [
    {
      title: "Repository",
      items: [
        {
          label: "Overview",
          icon: LayoutDashboard,
          path: projectPath,
        },
        {
          label: "Code Review",
          icon: Code2,
          path: reviewPath,
        },
        {
          label: "Security",
          icon: ShieldCheck,
          path: securityPath,
        },
        {
          label: "Dependencies",
          icon: Box,
          path: dependenciesPath,
        },
      ],
    },
    {
      title: "Analysis",
      items: [
        {
          label: "Architecture",
          icon: Network,
          path: architecturePath,
        },
        {
          label: "Performance",
          icon: Gauge,
          path: performancePath,
        },
        {
          label: "Codebase Chat",
          icon: MessageSquareCode,
          path: chatPath,
        },
        {
          label: "Documentation",
          icon: FileText,
          path: documentationPath,
        },
        {
          label: "CI/CD",
          icon: Workflow,
          path: cicdPath,
        },
      ],
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-800/80 bg-[#070b12] lg:flex lg:flex-col">
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

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <div className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              {section.title}
            </div>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    end={item.label === "Overview"}
                    className={({ isActive }) =>
                      `group flex w-full items-center gap-3 border-l px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? "border-violet-400 bg-violet-500/[0.07] text-white"
                          : "border-transparent text-slate-500 hover:border-slate-700 hover:bg-white/[0.025] hover:text-slate-200"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
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
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

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