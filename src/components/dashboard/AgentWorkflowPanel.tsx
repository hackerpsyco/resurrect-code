import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Circle,
  Loader2,
  XCircle,
  Zap,
  Search,
  FileCode,
  GitPullRequest,
  ExternalLink,
} from "lucide-react";

interface AgentStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "error";
  result?: unknown;
  timestamp?: string;
}

interface AgentWorkflowPanelProps {
  steps: AgentStep[];
  isRunning: boolean;
  currentStep: string | null;
  onTrigger?: () => void;
  projectName?: string;
}

const stepIcons: Record<string, typeof Zap> = {
  analyze: Search,
  search: FileCode,
  generate: Zap,
  pr: GitPullRequest,
};

export function AgentWorkflowPanel({
  steps,
  isRunning,
  currentStep,
  onTrigger,
  projectName,
}: AgentWorkflowPanelProps) {
  const getStatusIcon = (status: AgentStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-chart-4 animate-spin" />;
      case "error":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const hasCompletedFix = steps.find(
    (s) => s.id === "pr" && s.status === "completed"
  );

  return (
    <Card className="bg-card border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-background flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium">Kestra AI Agent</span>
          {projectName && (
            <span className="text-xs text-muted-foreground">— {projectName}</span>
          )}
        </div>
        {isRunning && (
          <span className="text-xs px-2 py-1 rounded-full bg-chart-4/20 text-chart-4">
            Running
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {steps.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              AI Agent ready to analyze and fix errors
            </p>
            {onTrigger && (
              <Button
                onClick={onTrigger}
                disabled={isRunning}
                className="bg-primary hover:bg-primary/90"
              >
                <Zap className="w-4 h-4 mr-2" />
                Run Agent
              </Button>
            )}
          </div>
        ) : (
          <>
            {steps.map((step, index) => {
              const Icon = stepIcons[step.id] || Zap;
              const isActive = step.id === currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-chart-4/10 border border-chart-4/20"
                      : step.status === "completed"
                      ? "bg-primary/5 border border-primary/10"
                      : step.status === "error"
                      ? "bg-destructive/10 border border-destructive/20"
                      : "bg-background border border-border"
                  }`}
                >
                  <div className="mt-0.5">{getStatusIcon(step.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{step.name}</span>
                    </div>
                    {step.status === "completed" && step.result && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {typeof step.result === "object" && step.result !== null
                          ? (step.result as { rootCause?: string; prUrl?: string })
                              .rootCause ||
                            (step.result as { prUrl?: string }).prUrl ||
                            "Completed"
                          : String(step.result)}
                      </p>
                    )}
                    {step.timestamp && (
                      <p className="text-xs text-muted-foreground/50 mt-1">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute left-[26px] top-[48px] w-0.5 h-6 ${
                        step.status === "completed"
                          ? "bg-primary/30"
                          : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}

            {hasCompletedFix && (
              <div className="pt-3 border-t border-border">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Pull Request
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Kestra workflow info */}
      <div className="px-4 py-3 border-t border-border bg-background/50">
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <a
            href="https://kestra.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Kestra
          </a>{" "}
          workflow orchestration
        </p>
      </div>
    </Card>
  );
}
