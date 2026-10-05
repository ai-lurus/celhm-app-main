import { Inbox } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  className = "py-8",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-center text-muted-foreground ${className}`}
    >
      <Inbox className="w-6 h-6 opacity-60" />
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-xs">{description}</p>}
    </div>
  );
}
