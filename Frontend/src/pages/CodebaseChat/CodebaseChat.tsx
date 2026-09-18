import { Bot, FileCode2, MessageSquareCode, Send } from "lucide-react";

function CodebaseChat() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col border border-slate-800 bg-[#080d15]">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <MessageSquareCode size={17} className="text-violet-400" />

          <div>
            <p className="text-sm font-medium text-white">
              Codebase Chat
            </p>

            <p className="text-[10px] text-slate-600">
              RAG · repository context enabled
            </p>
          </div>
        </div>

        <span className="font-mono text-[9px] text-emerald-400">
          CONTEXT READY
        </span>
      </div>

      <div className="flex-1 space-y-6 p-6">
        <div className="max-w-2xl">
          <div className="flex gap-3">
            <Bot size={17} className="mt-1 text-cyan-400" />

            <div>
              <p className="text-sm text-slate-200">
                Ask me anything about this repository.
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                I can explain files, trace dependencies, summarize modules,
                and answer questions using repository context.
              </p>
            </div>
          </div>
        </div>

        <div className="flex max-w-2xl items-center gap-2 border border-slate-800 bg-[#0a0f18] px-4 py-3">
          <FileCode2 size={14} className="text-slate-600" />

          <span className="font-mono text-xs text-slate-600">
            src/services/...
          </span>
        </div>
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 border border-slate-800 bg-[#0a0f18] px-4 py-3">
          <input
            type="text"
            placeholder="Ask about your codebase..."
            className="flex-1 bg-transparent text-sm text-slate-300 outline-none placeholder:text-slate-700"
          />

          <button
            type="button"
            className="text-violet-400 transition hover:text-violet-300"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CodebaseChat;