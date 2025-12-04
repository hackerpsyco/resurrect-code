import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal, Copy, Download, CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useVercel } from "@/hooks/useVercel";

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "error" | "success" | "warning";
}

interface BuildLogViewerProps {
  projectName: string;
  status: "crashed" | "resurrected" | "fixing" | "pending";
  deploymentId?: string;
  onErrorsDetected?: (errors: string[]) => void;
}

const crashedLogs: LogEntry[] = [
  { time: "14:32:01", message: "Cloning github.com/user/frontend-app (Branch: main)", type: "info" },
  { time: "14:32:03", message: "Cloned successfully in 2.1s", type: "success" },
  { time: "14:32:04", message: "Running: npm install", type: "info" },
  { time: "14:32:18", message: "Installed 847 packages in 14.2s", type: "success" },
  { time: "14:32:19", message: "Running: npm run build", type: "info" },
  { time: "14:32:22", message: "vite v5.0.12 building for production...", type: "info" },
  { time: "14:32:24", message: "transforming...", type: "info" },
  { time: "14:32:26", message: "ERROR: ./src/components/Button.tsx", type: "error" },
  { time: "14:32:26", message: "Module not found: Can't resolve './styles.css'", type: "error" },
  { time: "14:32:26", message: "  Import trace for requested module:", type: "error" },
  { time: "14:32:26", message: "  ./src/components/Button.tsx", type: "error" },
  { time: "14:32:26", message: "  ./src/App.tsx", type: "error" },
  { time: "14:32:27", message: "Build failed with exit code 1", type: "error" },
];

const fixingLogs: LogEntry[] = [
  ...crashedLogs,
  { time: "14:32:28", message: "─────────────────────────────────────────", type: "info" },
  { time: "14:32:28", message: "🤖 ResurrectCI Agent activated", type: "info" },
  { time: "14:32:29", message: "Analyzing build error...", type: "info" },
  { time: "14:32:31", message: "Error type: Missing module import", type: "warning" },
  { time: "14:32:32", message: "Searching StackOverflow for solutions...", type: "info" },
  { time: "14:32:35", message: "Found 3 potential fixes", type: "success" },
  { time: "14:32:36", message: "Applying fix #1: Create missing styles.css", type: "info" },
];

const resurrectedLogs: LogEntry[] = [
  ...fixingLogs,
  { time: "14:32:38", message: "Created: src/components/styles.css", type: "success" },
  { time: "14:32:39", message: "Running verification build...", type: "info" },
  { time: "14:32:45", message: "vite v5.0.12 building for production...", type: "info" },
  { time: "14:32:52", message: "✓ 234 modules transformed", type: "success" },
  { time: "14:32:53", message: "✓ Build completed in 6.8s", type: "success" },
  { time: "14:32:54", message: "Creating branch: resurrect-fix", type: "info" },
  { time: "14:32:55", message: "Committing changes...", type: "info" },
  { time: "14:32:56", message: "Opening Pull Request...", type: "info" },
  { time: "14:32:58", message: "✓ PR #42 created successfully", type: "success" },
  { time: "14:32:58", message: "─────────────────────────────────────────", type: "info" },
  { time: "14:32:58", message: "🎉 Build resurrected! Review PR to merge fix.", type: "success" },
];

export function BuildLogViewer({ projectName, status, deploymentId, onErrorsDetected }: BuildLogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const { fetchBuildLogs, extractErrors, isLoading } = useVercel();

  const parseVercelEvents = (events: any[]): LogEntry[] => {
    return events.map((event) => {
      const time = new Date(event.created).toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const message = event.payload?.text || event.payload?.info?.name || event.type;
      let type: LogEntry["type"] = "info";
      
      if (event.type === "error" || message?.toLowerCase().includes("error")) {
        type = "error";
      } else if (event.type === "done" || message?.includes("✓") || message?.toLowerCase().includes("success")) {
        type = "success";
      } else if (message?.toLowerCase().includes("warning")) {
        type = "warning";
      }
      
      return { time, message, type };
    });
  };

  const loadVercelLogs = async () => {
    if (!deploymentId) return;
    
    const events = await fetchBuildLogs(deploymentId);
    if (events.length > 0) {
      const parsedLogs = parseVercelEvents(events);
      setLogs(parsedLogs);
      
      const errors = extractErrors(events);
      if (errors.length > 0 && onErrorsDetected) {
        onErrorsDetected(errors);
      }
    }
  };

  useEffect(() => {
    if (deploymentId) {
      loadVercelLogs();
      return;
    }

    if (status === "crashed") {
      setLogs(crashedLogs);
    } else if (status === "fixing") {
      let index = crashedLogs.length;
      setLogs(crashedLogs);
      
      const interval = setInterval(() => {
        if (index < fixingLogs.length) {
          setLogs(fixingLogs.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 500);

      return () => clearInterval(interval);
    } else if (status === "resurrected") {
      setLogs(resurrectedLogs);
    } else {
      setLogs([
        { time: "–", message: "No build logs available", type: "info" },
      ]);
    }
  }, [status, deploymentId]);

  const handleCopy = () => {
    const logText = logs.map((l) => `[${l.time}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(logText);
    setCopied(true);
    toast.success("Logs copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-card border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Build Logs</span>
          <span className="text-xs text-muted-foreground">— {projectName}</span>
        </div>
        <div className="flex items-center gap-2">
          {deploymentId && (
            <Button variant="ghost" size="sm" onClick={loadVercelLogs} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? (
              <CheckCircle className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="p-4 font-mono text-sm h-[300px] overflow-y-auto bg-background/50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {logs.map((log, i) => (
              <div
                key={i}
                className={`flex gap-3 py-0.5 ${
                  log.type === "error"
                    ? "text-destructive"
                    : log.type === "success"
                    ? "text-primary"
                    : log.type === "warning"
                    ? "text-chart-4"
                    : "text-muted-foreground"
                }`}
              >
                <span className="text-muted-foreground/50 select-none shrink-0">
                  {log.time}
                </span>
                <span className="break-all">{log.message}</span>
              </div>
            ))}
            {status === "fixing" && !deploymentId && logs.length < fixingLogs.length && (
              <div className="flex items-center gap-2 py-1 text-muted-foreground">
                <div className="w-2 h-4 bg-primary animate-pulse" />
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
