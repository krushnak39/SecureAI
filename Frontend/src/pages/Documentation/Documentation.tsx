import { BookOpen, FileText, Sparkles } from "lucide-react";

function Documentation() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <BookOpen size={13} />
          <span>INTELLIGENCE / DOCUMENTATION</span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold text-white">
          AI Documentation
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Generate and maintain documentation from repository context.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          "README",
          "API Documentation",
          "Architecture Guide",
          "Database Schema",
        ].map((item) => (
          <div
            key={item}
            className="group border border-slate-800 bg-[#0a0f18] p-5 transition hover:border-slate-700"
          >
            <div className="flex items-center gap-3">
              <FileText
                size={17}
                className="text-slate-600 group-hover:text-violet-400"
              />

              <span className="text-sm text-slate-200">{item}</span>

              <Sparkles
                size={13}
                className="ml-auto text-violet-400"
              />
            </div>

            <p className="mt-3 text-xs text-slate-600">
              AI-generated from repository intelligence.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Documentation;
