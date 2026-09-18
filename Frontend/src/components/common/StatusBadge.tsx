type Status =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "healthy"
  | "info";

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

const statusStyles: Record<Status, string> = {
  critical:
    "border-red-500/20 bg-red-500/10 text-red-400",

  high:
    "border-orange-500/20 bg-orange-500/10 text-orange-400",

  medium:
    "border-amber-500/20 bg-amber-500/10 text-amber-400",

  low:
    "border-blue-500/20 bg-blue-500/10 text-blue-400",

  healthy:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

  info:
    "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
};

function StatusBadge({
  status,
  label,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {label ?? status}
    </span>
  );
}

export default StatusBadge;