import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProjectFileTree } from "./ProjectFileTree";
import { BuildLogViewer } from "./BuildLogViewer";
import { AgentWorkflowPanel } from "./AgentWorkflowPanel";
import { useAIAgent } from "@/hooks/useAIAgent";
import { useVercel } from "@/hooks/useVercel";
import { toast } from "sonner";
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
  RefreshCw,
  Loader2,
  Triangle,
  Code2,
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
    owner?: string;
    repo?: string;
    vercelProjectId?: string;
    latestDeploymentId?: string;
  };
  onClose: () => void;
  onAutoFix: () => void;
  onDeploymentFound?: (deploymentId: string) => void;
  onOpenIDE?: () => void;
}

export function ProjectDetailPanel({
  project,
  onClose,
  onAutoFix,
  onDeploymentFound,
  onOpenIDE,
}: ProjectDetailPanelProps) {
  const { runAgent, isRunning, steps, currentStep } = useAIAgent();
  const { fetchDeployments, isLoading: isVercelLoading } = useVercel();
  const [latestDeploymentId, setLatestDeploymentId] = useState<string | null>(
    project.latestDeploymentId || null
  );
  const [deploymentStatus, setDeploymentStatus] = useState<string | null>(null);

  const handleFetchLogs = async () => {
    if (!project.vercelProjectId) {
      toast.error("No Vercel project connected", {
        description: "Connect a Vercel project to fetch deployment logs.",
      });
      return;
    }

    toast.info("Fetching Vercel deployments...");
    const deployments = await fetchDeployments(project.vercelProjectId);
    
    if (deployments.length > 0) {
      const latest = deployments[0];
      setLatestDeploymentId(latest.uid);
      setDeploymentStatus(latest.state);
      onDeploymentFound?.(latest.uid);
      
      toast.success(`Found ${deployments.length} deployments`, {
        description: `Latest: ${latest.state} (${latest.uid.slice(0, 8)}...)`,
      });
    } else {
      toast.warning("No deployments found for this project");
    }
  };

  const handleRunAgent = async () => {
    onAutoFix();
    
    await runAgent({
      deploymentId: latestDeploymentId || project.id,
      projectName: project.name,
      branch: project.branch,
      commitMessage: project.lastCommit,
      errorMessage: project.errorPreview || "Build failed",
      errorLogs: project.errorPreview ? [project.errorPreview] : [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-y-0 right-0 w-full max-w-5xl bg-card border-l border-border shadow-xl animate-slide-in-right overflow-y-auto">
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
                <Triangle className="w-4 h-4" />
                <span className="text-xs">Vercel</span>
              </div>
              <p className="text-sm">
                {project.vercelProjectId ? (
                  <span className="text-primary">Connected</span>
                ) : (
                  <span className="text-muted-foreground">Not connected</span>
                )}
              </p>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={onOpenIDE}
              className="bg-gradient-to-r from-primary to-chart-4 hover:opacity-90 shadow-[var(--glow-primary)]"
            >
              <Code2 className="w-4 h-4 mr-2" />
              Open IDE
            </Button>
            {project.vercelProjectId && (
              <Button
                variant="outline"
                onClick={handleFetchLogs}
                disabled={isVercelLoading}
              >
                {isVercelLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Fetch Vercel Logs
              </Button>
            )}
            {project.status === "crashed" && (
              <Button
                onClick={handleRunAgent}
                disabled={isRunning}
                className="bg-primary hover:bg-primary/90"
              >
                <Zap className="w-4 h-4 mr-2" />
                {isRunning ? "Agent Running..." : "Auto-Fix with AI"}
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
          </div>

          {/* Deployment Status */}
          {latestDeploymentId && (
            <Card className="p-4 bg-background border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Triangle className="w-5 h-5 text-foreground" />
                  <div>
                    <p className="text-sm font-medium">Latest Deployment</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {latestDeploymentId}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  deploymentStatus === "READY" 
                    ? "bg-primary/20 text-primary" 
                    : deploymentStatus === "ERROR"
                    ? "bg-destructive/20 text-destructive"
                    : "bg-chart-4/20 text-chart-4"
                }`}>
                  {deploymentStatus || "UNKNOWN"}
                </span>
              </div>
            </Card>
          )}

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

          {/* Main Content Grid - 3 columns on large screens */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* File Tree */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Project Structure</h3>
              <ProjectFileTree
                projectName={project.name}
                owner={project.owner}
                repo={project.repo || project.name}
                branch={project.branch}
                onFileClick={(file) => console.log("Clicked:", file)}
              />
            </div>

            {/* Build Logs */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Build Output</h3>
              <BuildLogViewer 
                projectName={project.name} 
                status={project.status}
                deploymentId={latestDeploymentId || project.latestDeploymentId}
              />
            </div>

            {/* Agent Workflow */}
            <div>
              <h3 className="text-lg font-semibold mb-3">AI Agent Workflow</h3>
              <AgentWorkflowPanel
                steps={steps}
                isRunning={isRunning}
                currentStep={currentStep}
                onTrigger={project.status === "crashed" ? handleRunAgent : undefined}
                projectName={project.name}
              />
            </div>
          </div>

          {/* Kestra Workflow Info */}
          <Card className="p-4 bg-background border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Kestra Workflow: resurrect-agent</h3>
                <p className="text-xs text-muted-foreground">
                  Autonomous error analysis, solution search, and fix generation
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="p-3 rounded bg-card border border-border text-center">
                <p className="text-2xl font-bold text-primary">12</p>
                <p className="text-xs text-muted-foreground">Total Fixes</p>
              </div>
              <div className="p-3 rounded bg-card border border-border text-center">
                <p className="text-2xl font-bold text-chart-4">2.3</p>
                <p className="text-xs text-muted-foreground">Avg. Attempts</p>
              </div>
              <div className="p-3 rounded bg-card border border-border text-center">
                <p className="text-2xl font-bold text-chart-3">98%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
              <div className="p-3 rounded bg-card border border-border text-center">
                <p className="text-2xl font-bold text-accent">45s</p>
                <p className="text-xs text-muted-foreground">Avg. Time</p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded bg-secondary/30 border border-border">
              <p className="text-xs text-muted-foreground mb-2">Webhook Endpoint:</p>
              <code className="text-xs font-mono text-foreground break-all">
                {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-handler`}
              </code>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
