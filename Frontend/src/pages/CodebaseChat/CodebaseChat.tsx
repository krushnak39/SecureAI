import { useMemo, useState } from "react";
import {
  Bot,
  BrainCircuit,
  ChevronRight,
  Code2,
  FileCode2,
  GitBranch,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Terminal,
  User,
  Zap,
} from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  files?: string[];
  code?: string;
}

interface SourceFile {
  name: string;
  path: string;
  relevance: number;
  type: string;
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: "user",
    content:
      "How does repository analysis flow through the backend?",
  },
  {
    id: 2,
    role: "assistant",
    content:
      "Repository analysis starts at the analysis route, passes through the orchestrator, collects repository metadata and source files, then sends the code through parsing and analysis stages. Results are persisted so the dashboard can surface findings, architecture relationships, and performance signals.",
    files: [
      "src/routes/analysis.ts",
      "src/services/repository.ts",
      "src/services/analyzer.ts",
    ],
    code: `const repository = await github.getRepository(owner, repo);

const files = await repositoryService.collectFiles(
  repository
);

const analysis = await analyzer.run(files);

return analysis;`,
  },
];

const sourceFiles: SourceFile[] = [
  {
    name: "analysis.ts",
    path: "src/routes/analysis.ts",
    relevance: 98,
    type: "route",
  },
  {
    name: "repository.ts",
    path: "src/services/repository.ts",
    relevance: 94,
    type: "service",
  },
  {
    name: "analyzer.ts",
    path: "src/services/analyzer.ts",
    relevance: 91,
    type: "service",
  },
  {
    name: "github.ts",
    path: "src/integrations/github.ts",
    relevance: 86,
    type: "integration",
  },
];

const suggestions = [
  "How does authentication work?",
  "Find potential security risks",
  "Explain the architecture",
  "Where are database queries handled?",
];

function CodebaseChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [selectedSource, setSelectedSource] =
    useState<SourceFile>(sourceFiles[0]);
  const [search, setSearch] = useState("");

  const filteredSources = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return sourceFiles;
    }

    return sourceFiles.filter(
      (file) =>
        file.name.toLowerCase().includes(query) ||
        file.path.toLowerCase().includes(query) ||
        file.type.toLowerCase().includes(query),
    );
  }, [search]);

  const sendMessage = (message?: string) => {
    const content = (message ?? input).trim();

    if (!content) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");

    setTimeout(() => {
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "Based on the indexed repository context, this request would be answered by retrieving the most relevant code chunks, analyzing their relationships, and passing the retrieved context to the AI reasoning layer. The production version will connect this workspace to SecureAI's RAG pipeline.",
        files: [
          "src/services/repository.ts",
          "src/services/analyzer.ts",
        ],
      };

      setMessages((current) => [...current, assistantMessage]);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-secure-muted">
            <span>INTELLIGENCE</span>
            <ChevronRight size={13} />
            <span className="text-slate-300">CODEBASE CHAT</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-violet-500/20 bg-violet-500/10">
              <BrainCircuit
                size={20}
                className="text-violet-400"
              />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Codebase Chat
              </h1>
              <p className="mt-1 text-sm text-secure-muted">
                Ask questions about your repository using indexed code context.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            RAG ENGINE ONLINE
          </div>

          <div className="border border-secure-border bg-secure-panel px-3 py-2 text-xs text-slate-400">
            1,284 chunks indexed
          </div>
        </div>
      </div>

      {/* RAG pipeline */}
      <div className="border border-secure-border bg-secure-panel">
        <div className="flex items-center justify-between border-b border-secure-border px-5 py-4">
          <div>
            <h2 className="text-sm font-medium text-white">
              Retrieval Pipeline
            </h2>
            <p className="mt-1 text-xs text-secure-muted">
              How SecureAI builds repository-aware answers.
            </p>
          </div>

          <Sparkles size={16} className="text-violet-400" />
        </div>

        <div className="overflow-x-auto px-5 py-5">
          <div className="flex min-w-[800px] items-center">
            {[
              {
                label: "Repository",
                icon: GitBranch,
              },
              {
                label: "Parser",
                icon: Code2,
              },
              {
                label: "Chunks",
                icon: FileCode2,
              },
              {
                label: "Embeddings",
                icon: BrainCircuit,
              },
              {
                label: "Vector DB",
                icon: Terminal,
              },
              {
                label: "Retriever",
                icon: Search,
              },
              {
                label: "LLM",
                icon: Bot,
              },
            ].map((step, index, array) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.label}
                  className="flex flex-1 items-center"
                >
                  <div className="flex items-center gap-2 border border-secure-border bg-secure-panel-soft px-3 py-2.5">
                    <Icon
                      size={14}
                      className={
                        index === array.length - 1
                          ? "text-violet-400"
                          : "text-slate-400"
                      }
                    />
                    <span className="whitespace-nowrap text-xs text-slate-300">
                      {step.label}
                    </span>
                  </div>

                  {index < array.length - 1 && (
                    <div className="mx-2 h-px flex-1 bg-slate-800" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main workspace */}
      <div className="grid min-h-[680px] grid-cols-1 overflow-hidden border border-secure-border bg-secure-panel xl:grid-cols-[230px_minmax(0,1fr)_300px]">
        {/* Conversations */}
        <aside className="border-b border-secure-border xl:border-r xl:border-b-0">
          <div className="border-b border-secure-border px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-secure-muted">
                  CONVERSATIONS
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Repository context
                </p>
              </div>

              <button
                type="button"
                className="border border-secure-border p-1.5 text-slate-400 transition hover:bg-secure-panel-soft hover:text-white"
              >
                <MessageSquare size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-1 p-3">
            <button
              type="button"
              className="w-full border border-violet-500/20 bg-violet-500/10 px-3 py-3 text-left"
            >
              <p className="truncate text-xs font-medium text-white">
                Repository analysis flow
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                2 minutes ago
              </p>
            </button>

            <button
              type="button"
              className="w-full px-3 py-3 text-left transition hover:bg-secure-panel-soft"
            >
              <p className="truncate text-xs text-slate-300">
                Authentication implementation
              </p>
              <p className="mt-1 text-[10px] text-slate-600">
                Yesterday
              </p>
            </button>

            <button
              type="button"
              className="w-full px-3 py-3 text-left transition hover:bg-secure-panel-soft"
            >
              <p className="truncate text-xs text-slate-300">
                Architecture dependencies
              </p>
              <p className="mt-1 text-[10px] text-slate-600">
                Yesterday
              </p>
            </button>
          </div>
        </aside>

        {/* Chat */}
        <section className="flex min-h-[680px] min-w-0 flex-col">
          <div className="flex items-center justify-between border-b border-secure-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center border border-violet-500/20 bg-violet-500/10">
                <Bot size={15} className="text-violet-400" />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  SecureAI Analyst
                </p>
                <p className="text-[10px] text-secure-muted">
                  krushnak39/SecureAI · feature
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              CONTEXT READY
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-violet-500/20 bg-violet-500/10">
                    <Bot size={14} className="text-violet-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] ${
                    message.role === "user"
                      ? "border border-secure-border bg-secure-panel-soft"
                      : ""
                  }`}
                >
                  <div className="px-4 py-3">
                    <div className="mb-2 flex items-center gap-2">
                      {message.role === "user" ? (
                        <>
                          <User size={12} className="text-slate-500" />
                          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                            You
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-violet-400">
                          AI ANALYST
                        </span>
                      )}
                    </div>

                    <p className="text-sm leading-6 text-slate-300">
                      {message.content}
                    </p>

                    {message.files && (
                      <div className="mt-4 space-y-2">
                        <p className="text-[10px] font-semibold tracking-wider text-secure-muted">
                          RELEVANT FILES
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {message.files.map((file) => (
                            <button
                              key={file}
                              type="button"
                              className="flex items-center gap-2 border border-secure-border bg-secure-panel px-2.5 py-1.5 text-[10px] text-slate-400 transition hover:border-slate-600 hover:text-white"
                            >
                              <FileCode2 size={11} />
                              {file}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.code && (
                      <div className="mt-4 overflow-hidden border border-secure-border bg-[#050810]">
                        <div className="flex items-center justify-between border-b border-secure-border px-3 py-2">
                          <span className="text-[10px] text-slate-500">
                            repository.ts
                          </span>
                          <Code2 size={12} className="text-slate-600" />
                        </div>

                        <pre className="overflow-x-auto p-4 text-[11px] leading-5 text-slate-400">
                          <code>{message.code}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-secure-border bg-secure-panel-soft">
                    <User size={14} className="text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Suggestions */}
          <div className="border-t border-secure-border px-5 py-3">
            <div className="mb-2 flex items-center gap-2">
              <Zap size={12} className="text-amber-400" />
              <span className="text-[10px] font-semibold tracking-wider text-secure-muted">
                SUGGESTED QUESTIONS
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  className="whitespace-nowrap border border-secure-border bg-secure-panel-soft px-3 py-2 text-[10px] text-slate-400 transition hover:border-slate-600 hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-secure-border p-4">
            <div className="flex items-end gap-3 border border-secure-border bg-[#050810] p-2 focus-within:border-slate-600">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask anything about this codebase..."
                rows={2}
                className="min-h-[48px] flex-1 resize-none bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-slate-600"
              />

              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center bg-violet-600 text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Send size={15} />
              </button>
            </div>

            <p className="mt-2 text-[10px] text-slate-600">
              Enter to send · Shift + Enter for a new line
            </p>
          </div>
        </section>

        {/* Context */}
        <aside className="border-t border-secure-border xl:border-l xl:border-t-0">
          <div className="border-b border-secure-border px-4 py-4">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-secure-muted">
              CODE CONTEXT
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Retrieved repository sources
            </p>
          </div>

          <div className="p-4">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Filter files..."
                className="w-full border border-secure-border bg-secure-panel-soft py-2 pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-slate-600"
              />
            </div>

            <div className="mt-4 space-y-1">
              {filteredSources.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedSource(file)}
                  className={`w-full border px-3 py-3 text-left transition ${
                    selectedSource.path === file.path
                      ? "border-violet-500/20 bg-violet-500/10"
                      : "border-transparent hover:border-secure-border hover:bg-secure-panel-soft"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <FileCode2
                      size={14}
                      className={
                        selectedSource.path === file.path
                          ? "mt-0.5 text-violet-400"
                          : "mt-0.5 text-slate-500"
                      }
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-300">
                        {file.name}
                      </p>

                      <p className="mt-1 truncate text-[10px] text-slate-600">
                        {file.path}
                      </p>
                    </div>

                    <span className="text-[9px] text-emerald-400">
                      {file.relevance}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mx-4 border-t border-secure-border pt-4">
            <p className="text-[10px] font-semibold tracking-wider text-secure-muted">
              SELECTED SOURCE
            </p>

            <div className="mt-3 border border-secure-border bg-secure-panel-soft p-4">
              <div className="flex items-center gap-2">
                <FileCode2
                  size={15}
                  className="text-violet-400"
                />

                <span className="text-xs font-medium text-white">
                  {selectedSource.name}
                </span>
              </div>

              <p className="mt-2 break-all text-[10px] leading-4 text-slate-500">
                {selectedSource.path}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="border border-secure-border p-2">
                  <p className="text-[9px] text-slate-600">
                    TYPE
                  </p>
                  <p className="mt-1 text-[10px] text-slate-300">
                    {selectedSource.type}
                  </p>
                </div>

                <div className="border border-secure-border p-2">
                  <p className="text-[9px] text-slate-600">
                    RELEVANCE
                  </p>
                  <p className="mt-1 text-[10px] text-emerald-400">
                    {selectedSource.relevance}%
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="mt-3 flex w-full items-center justify-center gap-2 border border-secure-border py-2 text-[10px] text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <Code2 size={12} />
                Open source
              </button>
            </div>
          </div>

          <div className="mx-4 mt-5 border border-cyan-500/10 bg-cyan-500/5 p-4">
            <div className="flex items-center gap-2">
              <BrainCircuit
                size={14}
                className="text-cyan-400"
              />
              <span className="text-[10px] font-semibold tracking-wider text-cyan-400">
                CONTEXT WINDOW
              </span>
            </div>

            <div className="mt-3 h-1 overflow-hidden bg-slate-800">
              <div className="h-full w-[42%] bg-cyan-400" />
            </div>

            <div className="mt-2 flex justify-between text-[9px] text-slate-600">
              <span>6,842 tokens</span>
              <span>42%</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer status */}
      <div className="flex flex-col gap-2 border border-secure-border bg-secure-panel px-5 py-4 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Repository index synchronized
        </div>

        <div className="flex items-center gap-4">
          <span>1,284 chunks</span>
          <span>4,912 files analyzed</span>
          <span>Embedding model ready</span>
        </div>
      </div>
    </div>
  );
}

export default CodebaseChat;