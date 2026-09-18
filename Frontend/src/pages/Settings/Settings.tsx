import {
  Bell,
  Check,
  ChevronRight,
  GitFork,
  KeyRound,
  Monitor,
  Palette,
  Save,
  ScanSearch,
  ShieldCheck,
  User,
} from "lucide-react";
import { useState } from "react";

type Section = "profile" | "analysis" | "security" | "notifications" | "appearance";

const sections = [
  {
    id: "profile" as Section,
    label: "Profile",
    description: "Account and workspace identity",
    icon: User,
  },
  {
    id: "analysis" as Section,
    label: "Analysis",
    description: "Repository intelligence preferences",
    icon: ScanSearch,
  },
  {
    id: "security" as Section,
    label: "Security",
    description: "Scanning and authentication",
    icon: ShieldCheck,
  },
  {
    id: "notifications" as Section,
    label: "Notifications",
    description: "Alerts and engineering events",
    icon: Bell,
  },
  {
    id: "appearance" as Section,
    label: "Appearance",
    description: "Interface preferences",
    icon: Palette,
  },
];

function Settings() {
  const [activeSection, setActiveSection] =
    useState<Section>("profile");

  const [saved, setSaved] = useState(false);

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [prAlerts, setPrAlerts] = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  const [secretScanning, setSecretScanning] = useState(true);

  const handleSave = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2200);
  };

  const renderProfile = () => (
    <div className="space-y-5">
      <SectionHeader
        title="Profile"
        description="Manage the identity associated with your SecureAI workspace."
      />

      <div className="border border-slate-800 bg-[#090e18] p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center border border-violet-500/20 bg-violet-500/10 text-xl font-semibold text-violet-300">
            K
          </div>

          <div>
            <p className="text-sm font-medium">Krushna</p>
            <p className="mt-1 text-xs text-slate-600">
              SecureAI developer workspace
            </p>

            <button
              type="button"
              className="mt-3 text-xs text-violet-400 hover:text-violet-300"
            >
              Change profile image
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <InputField
            label="Full name"
            defaultValue="Krushna"
          />

          <InputField
            label="Email address"
            defaultValue="krushna@example.com"
            type="email"
          />

          <InputField
            label="Workspace name"
            defaultValue="SecureAI Workspace"
          />

          <InputField
            label="Role"
            defaultValue="Developer"
          />
        </div>
      </div>

      <div className="border border-slate-800 bg-[#090e18] p-6">
        <div className="flex items-start gap-3">
          <GitFork
            size={17}
            className="mt-0.5 text-violet-400"
          />

          <div>
            <p className="text-sm font-medium">
              Repository provider
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              Connect your repository provider to import projects and
              enable automated analysis workflows.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border border-slate-800 bg-[#050810] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium">
              GitHub account
            </p>

            <p className="mt-1 text-[10px] text-emerald-400">
              Connected
            </p>
          </div>

          <button
            type="button"
            className="border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:border-slate-500 hover:text-white"
          >
            Manage connection
          </button>
        </div>
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-5">
      <SectionHeader
        title="Analysis"
        description="Control how SecureAI analyzes repositories and generates engineering intelligence."
      />

      <SettingToggle
        title="Automatic repository analysis"
        description="Run analysis automatically when a connected repository receives relevant changes."
        enabled={autoAnalysis}
        onChange={setAutoAnalysis}
      />

      <SettingToggle
        title="Secret detection"
        description="Scan source files and configuration for exposed credentials, tokens, and API keys."
        enabled={secretScanning}
        onChange={setSecretScanning}
      />

      <div className="border border-slate-800 bg-[#090e18]">
        <div className="border-b border-slate-800 p-5">
          <p className="text-sm font-medium">
            Analysis engines
          </p>

          <p className="mt-1 text-xs text-slate-600">
            Engines used by the SecureAI intelligence pipeline.
          </p>
        </div>

        {[
          ["AST / Code Parser", "Active"],
          ["Security Scanner", "Active"],
          ["Dependency Analyzer", "Active"],
          ["Performance Analyzer", "Active"],
          ["Architecture Engine", "Active"],
          ["RAG / Codebase Intelligence", "Ready"],
        ].map(([name, status]) => (
          <div
            key={name}
            className="flex items-center justify-between border-b border-slate-800 p-4 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400">
                {name}
              </span>
            </div>

            <span className="text-[10px] tracking-wider text-emerald-400">
              {status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      <div className="border border-slate-800 bg-[#090e18] p-5">
        <div className="flex items-start gap-3">
          <KeyRound
            size={16}
            className="mt-0.5 text-amber-400"
          />

          <div>
            <p className="text-sm font-medium">
              AI provider
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              LLM provider configuration will be managed by the backend
              once SecureAI's analysis services are connected.
            </p>

            <span className="mt-3 inline-block border border-amber-500/20 bg-amber-500/5 px-2 py-1 text-[9px] tracking-wider text-amber-400">
              BACKEND CONFIGURATION PENDING
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-5">
      <SectionHeader
        title="Security"
        description="Manage security-related controls for your SecureAI workspace."
      />

      <div className="border border-slate-800 bg-[#090e18]">
        <div className="border-b border-slate-800 p-5">
          <p className="text-sm font-medium">
            Security controls
          </p>
        </div>

        <SettingToggle
          title="Critical vulnerability alerts"
          description="Notify the workspace when a critical security finding is detected."
          enabled={criticalAlerts}
          onChange={setCriticalAlerts}
        />

        <div className="border-t border-slate-800">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium">
                Session security
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Authentication and OAuth security will be handled by the
                backend authentication service.
              </p>
            </div>

            <ShieldCheck
              size={18}
              className="text-emerald-400"
            />
          </div>
        </div>
      </div>

      <div className="border border-slate-800 bg-[#090e18] p-5">
        <p className="text-sm font-medium">
          API access
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-600">
          Personal API tokens will be available here when the SecureAI
          backend API layer is connected.
        </p>

        <button
          type="button"
          disabled
          className="mt-4 border border-slate-800 px-3 py-2 text-xs text-slate-700"
        >
          Generate API token
        </button>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-5">
      <SectionHeader
        title="Notifications"
        description="Choose which engineering events should generate workspace alerts."
      />

      <SettingToggle
        title="Email notifications"
        description="Receive important SecureAI events by email."
        enabled={emailAlerts}
        onChange={setEmailAlerts}
      />

      <SettingToggle
        title="Critical findings"
        description="Receive alerts when critical security or engineering findings appear."
        enabled={criticalAlerts}
        onChange={setCriticalAlerts}
      />

      <SettingToggle
        title="Pull request analysis"
        description="Notify when automated PR analysis completes."
        enabled={prAlerts}
        onChange={setPrAlerts}
      />

      <div className="border border-slate-800 bg-[#090e18] p-5">
        <div className="flex items-center gap-3">
          <Bell size={16} className="text-violet-400" />

          <div>
            <p className="text-sm font-medium">
              Notification channels
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Email, in-app, and future webhook notification channels
              will be configurable here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-5">
      <SectionHeader
        title="Appearance"
        description="Customize the SecureAI engineering workspace interface."
      />

      <div className="border border-slate-800 bg-[#090e18] p-5">
        <p className="text-sm font-medium">
          Theme
        </p>

        <p className="mt-1 text-xs text-slate-600">
          Select the interface theme used across SecureAI.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["Dark", true],
            ["System", false],
            ["Light", false],
          ].map(([theme, selected]) => (
            <button
              key={theme as string}
              type="button"
              className={`flex items-center justify-between border p-4 text-xs transition ${
                selected
                  ? "border-violet-500/40 bg-violet-500/5 text-white"
                  : "border-slate-800 bg-[#050810] text-slate-500 hover:border-slate-600"
              }`}
            >
              <span className="flex items-center gap-2">
                <Monitor size={14} />
                {theme as string}
              </span>

              {selected && (
                <Check
                  size={14}
                  className="text-violet-400"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-slate-800 bg-[#090e18] p-5">
        <p className="text-sm font-medium">
          Interface density
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {["Compact", "Comfortable", "Spacious"].map(
            (density, index) => (
              <button
                key={density}
                type="button"
                className={`border px-4 py-2 text-xs ${
                  index === 0
                    ? "border-violet-500/40 bg-violet-500/5 text-violet-300"
                    : "border-slate-800 text-slate-500 hover:border-slate-600 hover:text-white"
                }`}
              >
                {density}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );

  const content = {
    profile: renderProfile,
    analysis: renderAnalysis,
    security: renderSecurity,
    notifications: renderNotifications,
    appearance: renderAppearance,
  }[activeSection]();

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-800/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] tracking-[0.18em] text-slate-600">
            WORKSPACE / SETTINGS
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Configure your SecureAI workspace, analysis behavior,
            security controls, and interface preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center justify-center gap-2 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          {saved ? (
            <>
              <Check size={15} />
              Saved
            </>
          ) : (
            <>
              <Save size={15} />
              Save changes
            </>
          )}
        </button>
      </div>

      {/* Settings Layout */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[270px_1fr]">
        {/* Navigation */}
        <aside className="h-fit border border-slate-800 bg-[#090e18]">
          <div className="border-b border-slate-800 p-4">
            <p className="text-[9px] tracking-[0.16em] text-slate-600">
              CONFIGURATION
            </p>
          </div>

          <div className="p-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`mb-1 flex w-full items-center gap-3 p-3 text-left transition ${
                    active
                      ? "bg-violet-500/10 text-white"
                      : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
                  }`}
                >
                  <Icon
                    size={15}
                    className={
                      active
                        ? "text-violet-400"
                        : "text-slate-600"
                    }
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium">
                      {section.label}
                    </span>

                    <span className="mt-0.5 block truncate text-[9px] text-slate-700">
                      {section.description}
                    </span>
                  </span>

                  <ChevronRight
                    size={13}
                    className={
                      active
                        ? "text-violet-400"
                        : "text-slate-800"
                    }
                  />
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />

              <span className="text-[10px] text-slate-600">
                SecureAI engine online
              </span>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0">
          {content}
        </main>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-2">
      <h2 className="text-xl font-semibold">{title}</h2>

      <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function InputField({
  label,
  defaultValue,
  type = "text",
}: {
  label: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-wider text-slate-600">
        {label.toUpperCase()}
      </span>

      <input
        type={type}
        defaultValue={defaultValue}
        className="mt-2 w-full border border-slate-800 bg-[#050810] px-3 py-2.5 text-sm text-white outline-none transition focus:border-slate-600"
      />
    </label>
  );
}

function SettingToggle({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4 border border-slate-800 bg-[#090e18] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-medium">{title}</p>

        <p className="mt-1 text-xs leading-5 text-slate-600">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        aria-label={`Toggle ${title}`}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
          enabled
            ? "border-violet-500/40 bg-violet-500/20"
            : "border-slate-700 bg-slate-900"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full transition ${
            enabled
              ? "left-6 bg-violet-400"
              : "left-0.5 bg-slate-600"
          }`}
        />
      </button>
    </div>
  );
}

export default Settings;