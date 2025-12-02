import { Card } from "@/components/ui/card";
import { GitCommit, AlertCircle, CheckCircle, Search, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "error" | "fix" | "search" | "commit" | "deploy";
  message: string;
  time: string;
  project?: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "error",
    message: "Build failed: Module not found 'react-query'",
    time: "2 min ago",
    project: "frontend-app",
  },
  {
    id: "2",
    type: "search",
    message: "Searching StackOverflow for solution...",
    time: "2 min ago",
    project: "frontend-app",
  },
  {
    id: "3",
    type: "fix",
    message: "Applied fix: Added @tanstack/react-query to dependencies",
    time: "1 min ago",
    project: "frontend-app",
  },
  {
    id: "4",
    type: "commit",
    message: "Created branch 'resurrect-fix/react-query'",
    time: "1 min ago",
    project: "frontend-app",
  },
  {
    id: "5",
    type: "deploy",
    message: "Preview deployed successfully",
    time: "30 sec ago",
    project: "frontend-app",
  },
];

const iconMap = {
  error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  fix: { icon: FileCode, color: "text-accent-foreground", bg: "bg-accent/20" },
  search: { icon: Search, color: "text-chart-3", bg: "bg-chart-3/10" },
  commit: { icon: GitCommit, color: "text-primary", bg: "bg-primary/10" },
  deploy: { icon: CheckCircle, color: "text-primary", bg: "bg-primary/10" },
};

export function ActivityFeed() {
  return (
    <Card className="bg-card border-border p-6">
      <h3 className="text-lg font-semibold mb-4">Live Activity Feed</h3>
      <div className="space-y-4">
        {activities.map((activity) => {
          const { icon: Icon, color, bg } = iconMap[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border hover:border-primary/20 transition-colors"
            >
              <div className={cn("p-2 rounded-lg", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity.project}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
