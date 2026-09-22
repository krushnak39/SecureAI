import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  FileCode2,
  FileText,
  FolderGit2,
  GitBranch,
  Info,
  LayoutTemplate,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Terminal,
  WandSparkles,
} from "lucide-react";

type DocumentationStatus = "complete" | "partial" | "missing";

interface DocumentationItem {
  id: string;
  title: string;
  type: string;
  status: DocumentationStatus;
  coverage: number;
  description: string;
  files: string[];
  lastGenerated: string;
}

const documentationItems: DocumentationItem[] = [
  {
    id: "readme",
    title: "README",
    type: "Project documentation",
    status: "complete",
    coverage: 96,
    description:
      "Project overview, feature summary, technology stack, setup instructions, and development workflow.",
    files: ["README.md"],
    lastGenerated: "12 min ago",
  },
  {
    id: "api",
    title: "API Documentation",
    type: "API reference",
    status: "complete",
    coverage: 91,
    description:
      "Documents backend routes, request parameters, responses, authentication requirements, and error handling.",
    files: [
      "src/routes/analysis.ts",
      "src/routes/auth.ts",
    ],
    lastGenerated: "18 min ago",
  },
  {
    id: "architecture",
    title: "Architecture Guide",
    type: "System documentation",
    status: "complete",
    coverage: 88,
    description:
      "Explains application boundaries, service relationships, data flow, analysis engines, and external integrations.",
    files: [
      "src/services/analyzer.ts",
      "src/integrations/github.ts",
    ],
    lastGenerated: "24 min ago",
  },
  {
    id: "setup",
    title: "Setup Guide",
    type: "Developer guide",
    status: "partial",
    coverage: 74,
    description:
      "Local development requirements, environment variables, database setup, and service startup instructions.",
    files: [
      "package.json",
      ".env.example",
      "docker-compose.yml",
    ],
    lastGenerated: "1 hr ago",
  },
  {
    id: "database",
    title: "Database Schema",
    type: "Data documentation",
    status: "partial",
    coverage: 68,
    description:
      "Documents PostgreSQL entities, relationships, analysis results, repository metadata, and vector storage.",
    files: ["prisma/schema.prisma"],
    lastGenerated: "2 hrs ago",
  },
  {
    id: "contributing",
    title: "Contribution Guide",
    type: "Team documentation",
    status: "missing",
    coverage: 22,
    description:
      "Branching strategy, pull request workflow, coding conventions, testing requirements, and review process.",
    files: ["CONTRIBUTING.md"],
    lastGenerated: "Not generated",
  },
];

const previewContent: Record<string, string> = {
  readme: `# SecureAI

AI-powered software engineering and security intelligence for your codebase.

## Overview

SecureAI analyzes GitHub repositories across code quality, security, dependencies, architecture, performance, and documentation.

## Core capabilities

- AI code review
- Security vulnerability detection
- Dependency intelligence
- Architecture analysis
- Performance analysis
- Codebase-aware AI chat
- Automated documentation
- CI/CD analysis

## Development

Clone the repository, configure the environment variables, install dependencies, and start the frontend and backend services.

## Analysis pipeline

Repository → Parser → Analysis Engines → AI Reasoning → Results → Developer Dashboard`,

  api: `# API Documentation

## POST /api/analysis/run

Starts repository analysis for the selected project.

### Request

{
  "repository": "krushnak39/SecureAI",
  "branch": "feature"
}

### Response

{
  "status": "started",
  "analysisId": "analysis_123"
}

### Pipeline

GitHub API → Repository Service → Analysis Orchestrator → Analysis Engines`,

  architecture: `# Architecture Guide

SecureAI uses a multi-service architecture.

Frontend
  ↓
Express API
  ↓
Analysis Orchestrator
  ├── Security Engine
  ├── Performance Analyzer
  ├── Architecture Analyzer
  └── AI Review Engine
  ↓
PostgreSQL + pgvector

External integrations include GitHub APIs, LLM providers, and GitHub Actions.`,

  setup: `# Setup Guide

## Requirements

- Node.js
- Python
- PostgreSQL
- Docker

## Environment

Configure the required GitHub, database, and LLM credentials.

## Start services

Start the frontend, API service, and AI analysis service.

## Database

Run Prisma migrations and initialize the pgvector extension.`,

  database: `# Database Schema

## Core entities

Repository
- repository metadata
- GitHub connection
- selected branch

Analysis
- analysis status
- health metrics
- timestamps

Finding
- severity
- category
- file
- line
- remediation

Embedding
- repository chunk
- vector representation
- source metadata`,

  contributing: `# Contributing Guide

## Branching

Create a feature branch for each meaningful change.

## Pull Requests

Include a clear description, testing information, and screenshots where applicable.

## Code Quality

Run linting, type checking, and tests before opening a pull request.

## Review

All changes should be reviewed before merging into the main branch.`,
};

const statusStyles: Record<
  DocumentationStatus,
  {
    label: string;
    className: string;
  }
> = {
  complete: {
    label: "COMPLETE",
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  },
  partial: {
    label: "PARTIAL",
    className:
      "border-amber-500/20 bg-amber-500/10 text-amber-400",
  },
  missing: {
    label: "MISSING",
    className:
      "border-red-500/20 bg-red-500/10 text-red-400",
  },
};

function Documentation() {
  const [selectedId, setSelectedId] = useState("readme");
  const [filter, setFilter] = useState<
    "all" | DocumentationStatus
  >("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();

    return documentationItems.filter((item) => {
      const matchesFilter =
        filter === "all" || item.status === filter;

      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  const selectedItem =
    documentationItems.find((item) => item.id === selectedId) ??
    documentationItems[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        previewContent[selectedItem.id],
      );
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-secure-muted">
            <span>INTELLIGENCE</span>
            <ChevronRight size={13} />
            <span className="text-slate-300">
              DOCUMENTATION
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-cyan-500/20 bg-cyan-500/10">
              <BookOpen
                size={20}
                className="text-cyan-400"
              />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Documentation Intelligence
              </h1>

              <p className="mt-1 text-sm text-secure-muted">
                Generate and maintain technical documentation from repository context.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            AI ENGINE READY
          </div>

          <button
            type="button"
            onClick={() => setGenerated(true)}
            className="flex items-center gap-2 bg-violet-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-violet-500"
          >
            <WandSparkles size={14} />
            Generate Docs
          </button>
        </div>
      </div>

      {/* Generation banner */}
      {generated && (
        <div className="flex items-center justify-between border border-violet-500/20 bg-violet-500/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <Sparkles
              size={16}
              className="text-violet-400"
            />

            <div>
              <p className="text-sm font-medium text-white">
                Documentation generation queued
              </p>

              <p className="mt-1 text-xs text-slate-500">
                SecureAI will use repository structure, source code, and analysis results as context.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setGenerated(false)}
            className="text-xs text-slate-500 transition hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-px overflow-hidden border border-secure-border bg-secure-border md:grid-cols-4">
        <div className="bg-secure-panel p-5">
          <p className="text-[10px] font-semibold tracking-wider text-secure-muted">
            DOCUMENTATION HEALTH
          </p>

          <p className="mt-3 text-3xl font-semibold text-white">
            84%
          </p>

          <p className="mt-1 text-xs text-emerald-400">
            +12% since last analysis
          </p>
        </div>

        <div className="bg-secure-panel p-5">
          <p className="text-[10px] font-semibold tracking-wider text-secure-muted">
            DOCUMENTS
          </p>

          <p className="mt-3 text-3xl font-semibold text-white">
            6
          </p>

          <p className="mt-1 text-xs text-slate-500">
            5 generated · 1 missing
          </p>
        </div>

        <div className="bg-secure-panel p-5">
          <p className="text-[10px] font-semibold tracking-wider text-secure-muted">
            SOURCE COVERAGE
          </p>

          <p className="mt-3 text-3xl font-semibold text-white">
            91%
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Repository context indexed
          </p>
        </div>

        <div className="bg-secure-panel p-5">
          <p className="text-[10px] font-semibold tracking-wider text-secure-muted">
            LAST SYNC
          </p>

          <p className="mt-3 text-3xl font-semibold text-white">
            12m
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Documentation context
          </p>
        </div>
      </div>

      {/* Main workspace */}
      <div className="grid min-h-[720px] grid-cols-1 overflow-hidden border border-secure-border bg-secure-panel xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* Document inventory */}
        <aside className="border-b border-secure-border xl:border-r xl:border-b-0">
          <div className="border-b border-secure-border px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-secure-muted">
                  DOCUMENT INVENTORY
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Repository-generated documentation
                </p>
              </div>

              <FolderGit2
                size={15}
                className="text-slate-600"
              />
            </div>

            <div className="relative mt-4">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search documents..."
                className="w-full border border-secure-border bg-secure-panel-soft py-2 pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-slate-600"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1 overflow-x-auto border-b border-secure-border p-3">
            {(
              [
                ["all", "ALL"],
                ["complete", "COMPLETE"],
                ["partial", "PARTIAL"],
                ["missing", "MISSING"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`whitespace-nowrap px-2.5 py-1.5 text-[9px] font-medium tracking-wider transition ${
                  filter === value
                    ? "bg-slate-800 text-white"
                    : "text-slate-600 hover:text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-1 p-3">
            {filteredItems.map((item) => {
              const status = statusStyles[item.status];

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full border p-3 text-left transition ${
                    selectedItem.id === item.id
                      ? "border-violet-500/20 bg-violet-500/10"
                      : "border-transparent hover:border-secure-border hover:bg-secure-panel-soft"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {item.status === "complete" ? (
                        <CheckCircle2
                          size={14}
                          className="text-emerald-400"
                        />
                      ) : item.status === "partial" ? (
                        <Info
                          size={14}
                          className="text-amber-400"
                        />
                      ) : (
                        <FileText
                          size={14}
                          className="text-red-400"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-medium text-slate-300">
                          {item.title}
                        </p>

                        <span
                          className={`shrink-0 border px-1.5 py-0.5 text-[8px] font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <p className="mt-1 text-[10px] text-slate-600">
                        {item.type}
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden bg-slate-800">
                          <div
                            className="h-full bg-violet-500"
                            style={{
                              width: `${item.coverage}%`,
                            }}
                          />
                        </div>

                        <span className="text-[9px] text-slate-500">
                          {item.coverage}%
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Document editor / preview */}
        <section className="min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-secure-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <FileText
                size={16}
                className="shrink-0 text-cyan-400"
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {selectedItem.title}
                </p>

                <p className="mt-1 text-[10px] text-slate-600">
                  {selectedItem.files.join(" · ")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 border border-secure-border px-3 py-2 text-[10px] text-slate-400 transition hover:bg-secure-panel-soft hover:text-white"
              >
                <Copy size={12} />
                {copied ? "Copied" : "Copy"}
              </button>

              <button
                type="button"
                className="flex items-center gap-2 border border-secure-border px-3 py-2 text-[10px] text-slate-400 transition hover:bg-secure-panel-soft hover:text-white"
              >
                <RefreshCw size={12} />
                Regenerate
              </button>

              <button
                type="button"
                className="flex items-center gap-2 border border-secure-border px-3 py-2 text-[10px] text-slate-400 transition hover:bg-secure-panel-soft hover:text-white"
              >
                <Settings2 size={12} />
                Configure
              </button>
            </div>
          </div>

          <div className="grid min-h-[650px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px]">
            {/* Preview */}
            <div className="min-w-0 border-b border-secure-border lg:border-r lg:border-b-0">
              <div className="border-b border-secure-border bg-secure-panel-soft px-5 py-3">
                <div className="flex items-center gap-2">
                  <LayoutTemplate
                    size={12}
                    className="text-slate-500"
                  />

                  <span className="text-[9px] font-semibold tracking-wider text-slate-500">
                    GENERATED PREVIEW
                  </span>

                  <span className="ml-auto text-[9px] text-emerald-400">
                    AI VERIFIED
                  </span>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto p-6">
                <div className="mb-6 border-b border-secure-border pb-5">
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <GitBranch size={11} />
                    krushnak39/SecureAI
                    <span>·</span>
                    feature
                  </div>

                  <h2 className="mt-4 text-xl font-semibold text-white">
                    {selectedItem.title}
                  </h2>

                  <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                    {selectedItem.description}
                  </p>
                </div>

                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-6 text-slate-400">
                  {previewContent[selectedItem.id]}
                </pre>
              </div>
            </div>

            {/* Metadata */}
            <aside className="p-5">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-secure-muted">
                  DOCUMENT STATUS
                </p>

                <div className="mt-4 border border-secure-border bg-secure-panel-soft p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Coverage
                    </span>

                    <span className="text-sm font-medium text-white">
                      {selectedItem.coverage}%
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden bg-slate-800">
                    <div
                      className="h-full bg-violet-500"
                      style={{
                        width: `${selectedItem.coverage}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {selectedItem.status === "complete" ? (
                      <CheckCircle2
                        size={13}
                        className="text-emerald-400"
                      />
                    ) : (
                      <Info
                        size={13}
                        className="text-amber-400"
                      />
                    )}

                    <span className="text-[10px] text-slate-400">
                      {statusStyles[selectedItem.status].label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-secure-muted">
                  SOURCE CONTEXT
                </p>

                <div className="mt-3 space-y-1">
                  {selectedItem.files.map((file) => (
                    <div
                      key={file}
                      className="flex items-center gap-2 border border-secure-border bg-secure-panel-soft px-3 py-2.5"
                    >
                      <FileCode2
                        size={12}
                        className="text-slate-500"
                      />

                      <span className="truncate text-[10px] text-slate-400">
                        {file}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-secure-muted">
                  GENERATION
                </p>

                <div className="mt-3 space-y-3 border border-secure-border bg-secure-panel-soft p-4">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-600">
                      Last generated
                    </span>

                    <span className="text-[10px] text-slate-400">
                      {selectedItem.lastGenerated}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-600">
                      Context sources
                    </span>

                    <span className="text-[10px] text-slate-400">
                      {selectedItem.files.length}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-600">
                      AI confidence
                    </span>

                    <span className="text-[10px] text-emerald-400">
                      94%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border border-violet-500/10 bg-violet-500/5 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={13}
                    className="text-violet-400"
                  />

                  <span className="text-[10px] font-semibold tracking-wider text-violet-400">
                    AI CONTEXT
                  </span>
                </div>

                <p className="mt-3 text-[10px] leading-5 text-slate-500">
                  Documentation is generated from indexed source code, repository structure, dependency metadata, architecture findings, and analysis results.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>

      {/* Documentation pipeline */}
      <div className="border border-secure-border bg-secure-panel">
        <div className="border-b border-secure-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Terminal
              size={14}
              className="text-cyan-400"
            />

            <div>
              <p className="text-sm font-medium text-white">
                Documentation Generation Pipeline
              </p>

              <p className="mt-1 text-[10px] text-slate-600">
                Repository context is transformed into structured engineering documentation.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-secure-border md:grid-cols-5 md:divide-x md:divide-y-0">
          {[
            ["01", "Repository", "Files + metadata"],
            ["02", "Context", "Analysis results"],
            ["03", "AI Generation", "LLM reasoning"],
            ["04", "Validation", "Structure + coverage"],
            ["05", "Output", "Docs + references"],
          ].map(([number, title, description]) => (
            <div key={number} className="p-5">
              <p className="text-[9px] font-semibold text-violet-400">
                {number}
              </p>

              <p className="mt-3 text-xs font-medium text-white">
                {title}
              </p>

              <p className="mt-1 text-[10px] text-slate-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Static notice */}
      <div className="flex items-start gap-3 border border-secure-border bg-secure-panel px-5 py-4">
        <Code2
          size={14}
          className="mt-0.5 shrink-0 text-slate-500"
        />

        <div>
          <p className="text-xs font-medium text-slate-300">
            Documentation intelligence preview
          </p>

          <p className="mt-1 text-[10px] leading-5 text-slate-600">
            The current frontend uses representative repository data. Later,
            this workspace will connect to the SecureAI documentation service
            and generate documentation from the actual analyzed repository.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Documentation;