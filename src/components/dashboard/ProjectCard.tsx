import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GitBranch, Clock, Zap, ExternalLink } from "lucide-react";

interface ProjectCardProps {
  name: string;
  branch: string;
  status: "crashed" | "resurrected" | "fixing" | "pending";
  lastCommit: string;
  timeAgo: string;
  errorPreview?: string;
  onAutoFix?: () => void;
}

export function ProjectCard({
  name,
  branch,
  status,
  lastCommit,
  timeAgo,
  errorPreview,
  onAutoFix,
}: ProjectCardProps) {
  return (
    <Card className="bg-card border-border p-6 hover:border-primary/30 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <GitBranch className="w-4 h-4" />
            <span>{branch}</span>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      
      {/* Last commit info */}
      <div className="mb-4 p-3 rounded-lg bg-background border border-border">
        <p className="text-sm font-mono text-muted-foreground truncate">{lastCommit}</p>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{timeAgo}</span>
        </div>
      </div>
      
      {/* Error preview for crashed builds */}
      {status === "crashed" && errorPreview && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-xs font-mono text-destructive line-clamp-2">{errorPreview}</p>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        {status === "crashed" && (
          <Button
            onClick={onAutoFix}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[var(--glow-primary)]"
          >
            <Zap className="w-4 h-4 mr-2" />
            Auto-Fix
          </Button>
        )}
        {status === "resurrected" && (
          <Button
            variant="outline"
            className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Fix PR
          </Button>
        )}
        {status === "fixing" && (
          <Button disabled className="flex-1 bg-accent/20 text-accent-foreground">
            <div className="w-4 h-4 mr-2 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
            Agent Working...
          </Button>
        )}
        {status === "pending" && (
          <Button variant="outline" className="flex-1">
            View Details
          </Button>
        )}
      </div>
    </Card>
  );
}
