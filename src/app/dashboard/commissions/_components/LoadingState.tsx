import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({
  label = "Cargando...",
  className = "py-8",
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-muted-foreground ${className}`}
    >
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
