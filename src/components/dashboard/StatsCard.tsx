import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  variant?: "default" | "success" | "destructive" | "accent";
}

const variantStyles = {
  default: {
    icon: "text-muted-foreground",
    bg: "bg-muted/50",
  },
  success: {
    icon: "text-primary",
    bg: "bg-primary/10",
  },
  destructive: {
    icon: "text-destructive",
    bg: "bg-destructive/10",
  },
  accent: {
    icon: "text-accent-foreground",
    bg: "bg-accent/30",
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  variant = "default",
}: StatsCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p
              className={cn(
                "text-sm mt-1",
                trendUp ? "text-primary" : "text-destructive"
              )}
            >
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", styles.bg)}>
          <Icon className={cn("w-6 h-6", styles.icon)} />
        </div>
      </div>
    </Card>
  );
}
