import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section
      className={`rounded-2xl border border-secure-border bg-secure-panel ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between border-b border-secure-border px-6 py-5">
          <div>
            {title && (
              <h2 className="font-medium text-white">
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="mt-1 text-xs text-secure-muted">
                {subtitle}
              </p>
            )}
          </div>

          {action}
        </div>
      )}

      <div className="p-6">
        {children}
      </div>
    </section>
  );
}

export default SectionCard;