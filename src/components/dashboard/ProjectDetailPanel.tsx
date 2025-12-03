import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProjectFileTree } from "./ProjectFileTree";
import { BuildLogViewer } from "./BuildLogViewer";
import {
  GitBranch,
  GitCommit,
  Clock,
  ExternalLink,
  Zap,
  X,
  Github,
  Webhook,
  Settings,
} from "lucide-react";

interface ProjectDetailPanelProps {
  project: {
    id: string;
    name: string;
    branch: string;
    status: "crashed" | "resurrected" | "fixing" | "pending";
    lastCommit: string;
    timeAgo: string;
    errorPreview?: string;
  };
  onClose: () => void;
  onAutoFix: () => void;
}

export function ProjectDetailPanel({
  project,
  onClose,
  onAutoFix,
}: ProjectDetailPanelProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-card border-l border-border shadow-xl animate-slide-in-right overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <StatusBadge status={project.status} />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-background border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <GitBranch className="w-4 h-4" />
                <span className="text-xs">Branch</span>
              </div>
              <p className="font-mono text-sm">{project.branch}</p>
            </Card>
            <Card className="p-4 bg-background border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <GitCommit className="w-4 h-4" />
                <span className="text-xs">Commit</span>
              </div>
              <p className="font-mono text-sm truncate">a3f2b1c</p>
            </Card>
            <Card className="p-4 bg-background border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Last Deploy</span>
              </div>
              <p className="text-sm">{project.timeAgo}</p>
            </Card>
            <Card className="p-4 bg-background border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Webhook className="w-4 h-4" />
                <span className="text-xs">Webhook</span>
              </div>
              <p className="text-sm text-primary">Connected</p>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {project.status === "crashed" && (
              <Button
                onClick={onAutoFix}
                className="bg-primary hover:bg-primary/90 shadow-[var(--glow-primary)]"
              >
                <Zap className="w-4 h-4 mr-2" />
                Auto-Fix with AI
              </Button>
            )}
            {project.status === "resurrected" && (
              <Button className="bg-primary hover:bg-primary/90">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Pull Request
              </Button>
            )}
            <Button variant="outline">
              <Github className="w-4 h-4 mr-2" />
              Open in GitHub
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>

          {/* Error Preview */}
          {project.status === "crashed" && project.errorPreview && (
            <Card className="p-4 bg-destructive/10 border-destructive/20">
              <h3 className="text-sm font-medium text-destructive mb-2">
                Build Error Detected
              </h3>
              <pre className="text-xs font-mono text-destructive/80 whitespace-pre-wrap">
                {project.errorPreview}
              </pre>
            </Card>
          )}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* File Tree */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Project Structure</h3>
              <ProjectFileTree
                projectName={project.name}
                onFileClick={(file) => console.log("Clicked:", file)}
              />
            </div>

            {/* Build Logs */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Build Output</h3>
              <BuildLogViewer projectName={project.name} status={project.status} />
            </div>
          </div>

          {/* Kestra Workflow Info */}
          <Card className="p-4 bg-background border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="font-medium">Kestra AI Agent</h3>
                <p className="text-xs text-muted-foreground">
                  Autonomous error analysis and fixing workflow
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded bg-card border border-border">
                <p className="text-2xl font-bold text-primary">12</p>
                <p className="text-xs text-muted-foreground">Fixes Applied</p>
              </div>
              <div className="p-3 rounded bg-card border border-border">
                <p className="text-2xl font-bold text-chart-4">3</p>
                <p className="text-xs text-muted-foreground">Avg. Attempts</p>
              </div>
              <div className="p-3 rounded bg-card border border-border">
                <p className="text-2xl font-bold text-chart-3">98%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
