import { cn } from "@/lib/utils";

type StatusType = "crashed" | "resurrected" | "fixing" | "pending";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  crashed: {
    label: "Crashed",
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
  resurrected: {
    label: "Resurrected",
    className: "bg-primary/20 text-primary border-primary/30",
  },
  fixing: {
    label: "Fixing...",
    className: "bg-accent/20 text-accent-foreground border-accent/30 animate-pulse",
  },
  pending: {
    label: "Pending",
    className: "bg-muted/50 text-muted-foreground border-muted",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border",
        config.className,
        className
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          status === "crashed" && "bg-destructive",
          status === "resurrected" && "bg-primary",
          status === "fixing" && "bg-accent-foreground animate-pulse",
          status === "pending" && "bg-muted-foreground"
        )}
      />
      {config.label}
    </span>
  );
}
