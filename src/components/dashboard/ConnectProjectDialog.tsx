import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Github, Webhook, FolderGit, CheckCircle, Loader2, Triangle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useGitHub } from "@/hooks/useGitHub";
import { useVercel } from "@/hooks/useVercel";

interface ConnectProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectConnected: (project: {
    name: string;
    repo: string;
    branch: string;
    owner: string;
    vercelProjectId?: string;
  }) => void;
}

export function ConnectProjectDialog({
  open,
  onOpenChange,
  onProjectConnected,
}: ConnectProjectDialogProps) {
  const [step, setStep] = useState<"repo" | "vercel" | "webhook" | "complete">("repo");
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [connectedRepo, setConnectedRepo] = useState<{
    name: string;
    owner: string;
    defaultBranch: string;
  } | null>(null);
  const [selectedVercelProject, setSelectedVercelProject] = useState<string | null>(null);
  
  const { fetchRepo, isLoading: isGitHubLoading } = useGitHub();
  const { fetchProjects, projects, isLoading: isVercelLoading } = useVercel();
  
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-handler`;

  useEffect(() => {
    if (step === "vercel" && projects.length === 0) {
      fetchProjects();
    }
  }, [step]);

  const handleConnectRepo = async () => {
    if (!repoUrl) {
      toast.error("Please enter a repository URL");
      return;
    }

    const result = await fetchRepo(repoUrl);
    if (result) {
      setConnectedRepo({
        name: result.name,
        owner: result.owner,
        defaultBranch: result.defaultBranch,
      });
      setBranch(result.defaultBranch);
      setStep("vercel");
    }
  };

  const handleSelectVercelProject = (projectId: string) => {
    setSelectedVercelProject(projectId);
  };

  const handleContinueToWebhook = () => {
    setStep("webhook");
  };

  const handleSkipVercel = () => {
    setStep("webhook");
  };

  const handleSetupWebhook = async () => {
    setStep("complete");
    toast.success("Webhook configured!");
  };

  const handleComplete = () => {
    if (connectedRepo) {
      onProjectConnected({
        name: connectedRepo.name,
        repo: repoUrl,
        branch,
        owner: connectedRepo.owner,
        vercelProjectId: selectedVercelProject || undefined,
      });
    }
    onOpenChange(false);
    setStep("repo");
    setRepoUrl("");
    setBranch("main");
    setConnectedRepo(null);
    setSelectedVercelProject(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderGit className="w-5 h-5 text-primary" />
            Connect Project
          </DialogTitle>
          <DialogDescription>
            Link your GitHub repository and Vercel project for automatic error detection.
          </DialogDescription>
        </DialogHeader>

        {step === "repo" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="repo-url">GitHub Repository URL</Label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="repo-url"
                  placeholder="https://github.com/username/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="pl-10 bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Default Branch</Label>
              <Input
                id="branch"
                placeholder="main"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <Card className="p-4 bg-background border-border">
              <h4 className="text-sm font-medium mb-2">What ResurrectCI will access:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Read repository files and structure</li>
                <li>• Create branches for fixes (resurrect-fix)</li>
                <li>• Open pull requests with solutions</li>
              </ul>
            </Card>

            <Button
              onClick={handleConnectRepo}
              disabled={isGitHubLoading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isGitHubLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Github className="w-4 h-4 mr-2" />
                  Connect Repository
                </>
              )}
            </Button>
          </div>
        )}

        {step === "vercel" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Triangle className="w-5 h-5 text-foreground" />
              <h4 className="text-sm font-medium">Connect Vercel Project</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Select a Vercel project to fetch deployment logs and detect errors automatically.
            </p>

            {isVercelLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : projects.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelectVercelProject(project.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      selectedVercelProject === project.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Triangle className="w-4 h-4" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.framework}</p>
                      </div>
                    </div>
                    {selectedVercelProject === project.id && (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <Card className="p-4 bg-background border-border text-center">
                <p className="text-sm text-muted-foreground">
                  No Vercel projects found. Make sure your Vercel token has access.
                </p>
              </Card>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSkipVercel}
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                onClick={handleContinueToWebhook}
                disabled={!selectedVercelProject && projects.length > 0}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === "webhook" && (
          <div className="space-y-4 py-4">
            <Card className="p-4 bg-background border-border">
              <div className="flex items-start gap-3">
                <Webhook className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1">Webhook URL</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Add this URL to your Vercel project webhooks:
                  </p>
                  <code className="block p-2 bg-card rounded text-xs font-mono break-all border border-border">
                    {webhookUrl}
                  </code>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Setup Instructions:</h4>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">1</span>
                  Go to vercel.com → Your Project → Settings
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">2</span>
                  Click "Webhooks" in the sidebar
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">3</span>
                  Click "Create Webhook" and paste the URL above
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">4</span>
                  Select events: "deployment.error" and "deployment.ready"
                </li>
              </ol>
            </div>

            <Button
              onClick={handleSetupWebhook}
              className="w-full bg-primary hover:bg-primary/90"
            >
              I've Added the Webhook
            </Button>
          </div>
        )}

        {step === "complete" && (
          <div className="space-y-4 py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Project Connected!</h3>
            <p className="text-sm text-muted-foreground">
              ResurrectCI will now monitor your deployments and automatically fix build errors.
            </p>
            <Button
              onClick={handleComplete}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
