import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  GitBranch, 
  GitCommit,
  ExternalLink,
  RotateCw,
  Loader2
} from "lucide-react";

interface LogLine {
  time: string;
  message: string;
  type: "info" | "error" | "success" | "warning";
}

const deploymentLogs: LogLine[] = [
  { time: "12:01:23", message: "Cloning repository...", type: "info" },
  { time: "12:01:24", message: "Cloned successfully", type: "success" },
  { time: "12:01:25", message: "Installing dependencies...", type: "info" },
  { time: "12:01:32", message: "npm install completed", type: "success" },
  { time: "12:01:33", message: "Building project...", type: "info" },
  { time: "12:01:45", message: "ERROR in ./src/components/Button.tsx", type: "error" },
  { time: "12:01:45", message: "Module not found: Can't resolve './styles.css'", type: "error" },
  { time: "12:01:45", message: "Build failed with 1 error", type: "error" },
];

const fixLogs: LogLine[] = [
  { time: "12:01:46", message: "🤖 ResurrectCI Agent activated", type: "info" },
  { time: "12:01:47", message: "Analyzing error logs...", type: "info" },
  { time: "12:01:49", message: "Searching for solution on StackOverflow...", type: "info" },
  { time: "12:01:52", message: "Found: Missing CSS import in Button.tsx", type: "warning" },
  { time: "12:01:53", message: "Creating styles.css with required styles", type: "info" },
  { time: "12:01:54", message: "Patching Button.tsx...", type: "info" },
  { time: "12:01:55", message: "Running verification build...", type: "info" },
  { time: "12:02:01", message: "Build successful!", type: "success" },
  { time: "12:02:02", message: "Creating PR on branch: resurrect-fix", type: "success" },
  { time: "12:02:03", message: "✓ Deployment ready", type: "success" },
];

export function DeploymentDemo() {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [phase, setPhase] = useState<"deploying" | "error" | "fixing" | "success">("deploying");
  const [currentLogIndex, setCurrentLogIndex] = useState(0);

  useEffect(() => {
    const allLogs = [...deploymentLogs, ...fixLogs];
    
    if (currentLogIndex < allLogs.length) {
      const timer = setTimeout(() => {
        const newLog = allLogs[currentLogIndex];
        setLogs(prev => [...prev, newLog]);
        setCurrentLogIndex(prev => prev + 1);

        // Update phase based on log content
        if (newLog.type === "error" && newLog.message.includes("Build failed")) {
          setPhase("error");
        } else if (newLog.message.includes("ResurrectCI Agent")) {
          setPhase("fixing");
        } else if (newLog.message.includes("Deployment ready")) {
          setPhase("success");
        }
      }, currentLogIndex < deploymentLogs.length ? 400 : 600);

      return () => clearTimeout(timer);
    } else {
      // Reset after completion
      const resetTimer = setTimeout(() => {
        setLogs([]);
        setCurrentLogIndex(0);
        setPhase("deploying");
      }, 4000);
      return () => clearTimeout(resetTimer);
    }
  }, [currentLogIndex]);

  const getStatusColor = () => {
    switch (phase) {
      case "error": return "text-destructive";
      case "success": return "text-primary";
      case "fixing": return "text-chart-4";
      default: return "text-chart-3";
    }
  };

  const getStatusIcon = () => {
    switch (phase) {
      case "error": return <XCircle className="w-4 h-4" />;
      case "success": return <CheckCircle className="w-4 h-4" />;
      case "fixing": return <RotateCw className="w-4 h-4 animate-spin" />;
      default: return <Loader2 className="w-4 h-4 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (phase) {
      case "error": return "Build Failed";
      case "success": return "Ready";
      case "fixing": return "Auto-Fixing...";
      default: return "Building";
    }
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Vercel-Style <span className="text-primary">Deployment</span> Recovery
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Watch how ResurrectCI intercepts failed builds and fixes them automatically
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-card border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-mono text-foreground">main</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GitCommit className="w-4 h-4" />
                  <span className="text-sm font-mono">a3f2b1c</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="text-sm font-medium">{getStatusText()}</span>
              </div>
            </div>

            {/* Deployment Info Bar */}
            <div className="flex items-center gap-4 px-4 py-2 bg-secondary/30 border-b border-border text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {phase === "success" ? "42s" : "Building..."}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Production</span>
              </div>
              {phase === "success" && (
                <a href="#" className="flex items-center gap-1 text-primary hover:underline ml-auto">
                  <span>Visit</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Log Output */}
            <div className="p-4 font-mono text-sm h-[320px] overflow-y-auto bg-background/50">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`flex gap-3 py-1 animate-fade-in ${
                    log.type === "error" 
                      ? "text-destructive" 
                      : log.type === "success" 
                      ? "text-primary" 
                      : log.type === "warning"
                      ? "text-chart-4"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="text-muted-foreground/50 select-none">
                    {log.time}
                  </span>
                  <span>{log.message}</span>
                </div>
              ))}
              {currentLogIndex < deploymentLogs.length + fixLogs.length && (
                <div className="flex items-center gap-2 py-1 text-muted-foreground">
                  <div className="w-2 h-4 bg-primary animate-pulse" />
                </div>
              )}
            </div>

            {/* Footer */}
            {phase === "success" && (
              <div className="px-4 py-3 bg-primary/10 border-t border-primary/20 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Deployment recovered successfully
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PR created on branch <span className="text-primary font-mono">resurrect-fix</span>
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
