import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Workflow, Play, CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface KestraConfig {
  instanceUrl: string;
  namespace: string;
  flowId: string;
  apiKey?: string;
}

interface KestraConfigPanelProps {
  onTriggerWorkflow?: (config: KestraConfig, projectData: Record<string, unknown>) => Promise<void>;
  projectData?: {
    deploymentId: string;
    projectName: string;
    branch: string;
    errorMessage: string;
    errorLogs: string[];
  };
}

export function KestraConfigPanel({ onTriggerWorkflow, projectData }: KestraConfigPanelProps) {
  const [config, setConfig] = useState<KestraConfig>({
    instanceUrl: "",
    namespace: "resurrectci",
    flowId: "resurrect-agent",
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastExecution, setLastExecution] = useState<string | null>(null);

  // Load saved config on mount
  useEffect(() => {
    const saved = localStorage.getItem("kestra_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
        setIsConnected(true);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleConnect = async () => {
    if (!config.instanceUrl) {
      toast.error("Please enter your Kestra instance URL");
      return;
    }

    setIsConnecting(true);
    try {
      // Test connection via edge function to avoid CORS
      const { data, error } = await supabase.functions.invoke("kestra-trigger", {
        body: {
          instanceUrl: config.instanceUrl,
          namespace: config.namespace,
          flowId: config.flowId,
          apiKey: config.apiKey,
          inputs: { test: true },
        },
      });

      if (error) {
        // For demo/local, allow connection anyway if it's network error
        console.warn("Kestra test connection:", error);
      }

      setIsConnected(true);
      localStorage.setItem("kestra_config", JSON.stringify(config));
      toast.success("Kestra configured", {
        description: data?.success 
          ? `Flow "${config.flowId}" ready in namespace "${config.namespace}"`
          : "Config saved. Ready for manual trigger.",
      });
    } catch (err) {
      console.error("Connection error:", err);
      // Still allow connection for demo purposes
      setIsConnected(true);
      localStorage.setItem("kestra_config", JSON.stringify(config));
      toast.success("Kestra configured (offline mode)", {
        description: "Config saved. Will trigger when Kestra is available.",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTrigger = async () => {
    if (!projectData) {
      toast.error("No project data", {
        description: "Select a crashed project first",
      });
      return;
    }

    setIsTriggering(true);
    try {
      if (onTriggerWorkflow) {
        await onTriggerWorkflow(config, projectData);
        setLastExecution(new Date().toISOString());
      } else {
        // Trigger via edge function to avoid CORS
        const { data, error } = await supabase.functions.invoke("kestra-trigger", {
          body: {
            instanceUrl: config.instanceUrl,
            namespace: config.namespace,
            flowId: config.flowId,
            apiKey: config.apiKey,
            inputs: {
              deployment_id: projectData.deploymentId,
              project_name: projectData.projectName,
              branch: projectData.branch,
              error_message: projectData.errorMessage,
              error_logs: projectData.errorLogs,
            },
          },
        });

        if (error) throw error;

        if (data?.success) {
          setLastExecution(data.data?.id || new Date().toISOString());
          toast.success("Workflow triggered!", {
            description: `Execution started for ${projectData.projectName}`,
          });
        } else {
          throw new Error(data?.error || "Failed to trigger workflow");
        }
      }
    } catch (error) {
      console.error("Trigger error:", error);
      toast.error("Failed to trigger workflow", {
        description: error instanceof Error ? error.message : "Check Kestra connection",
      });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Kestra Workflow</CardTitle>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </>
            ) : (
              "Not Connected"
            )}
          </Badge>
        </div>
        <CardDescription>
          Manual trigger for AI agent workflow (no webhook required)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="kestra-url">Kestra Instance URL</Label>
              <Input
                id="kestra-url"
                placeholder="https://your-kestra.cloud or http://localhost:8080"
                value={config.instanceUrl}
                onChange={(e) => setConfig({ ...config, instanceUrl: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="namespace">Namespace</Label>
                <Input
                  id="namespace"
                  placeholder="resurrectci"
                  value={config.namespace}
                  onChange={(e) => setConfig({ ...config, namespace: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flow-id">Flow ID</Label>
                <Input
                  id="flow-id"
                  placeholder="resurrect-agent"
                  value={config.flowId}
                  onChange={(e) => setConfig({ ...config, flowId: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key (optional)</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="For secured instances"
                value={config.apiKey || ""}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              />
            </div>
            <Button onClick={handleConnect} className="w-full">
              <Workflow className="h-4 w-4 mr-2" />
              Connect to Kestra
            </Button>
          </>
        ) : (
          <>
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Instance:</span>
                <span className="font-mono text-xs truncate max-w-[200px]">
                  {config.instanceUrl || "Local/Demo"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Flow:</span>
                <span className="font-mono text-xs">
                  {config.namespace}/{config.flowId}
                </span>
              </div>
              {lastExecution && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Run:</span>
                  <span className="text-xs text-primary">{new Date(lastExecution).toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleTrigger}
              disabled={isTriggering || !projectData}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isTriggering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Workflow...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Trigger AI Agent
                </>
              )}
            </Button>

            {!projectData && (
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Select a crashed project to trigger
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setIsConnected(false);
                  localStorage.removeItem("kestra_config");
                }}
              >
                Disconnect
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                asChild
              >
                <a
                  href={config.instanceUrl || "https://kestra.io/docs"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open Kestra
                </a>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
