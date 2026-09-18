interface MetricCardProps {
  label: string;
  value: number;
  change?: string;
  progress?: number;
}

function MetricCard({
  label,
  value,
  change,
  progress = value,
}: MetricCardProps) {
  return (
    <div className="group rounded-xl border border-secure-border bg-secure-panel p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600">
      <p className="text-xs font-medium text-secure-muted">
        {label}
      </p>

      <div className="mt-4 flex items-end justify-between">
        <span className="text-3xl font-semibold tracking-tight text-white">
          {value}
        </span>

        {change && (
          <span className="text-xs text-slate-500">
            {change}
          </span>
        )}
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default MetricCard;