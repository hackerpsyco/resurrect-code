import { useState } from "react";
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
import { Github, Webhook, FolderGit, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGitHub } from "@/hooks/useGitHub";

interface ConnectProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectConnected: (project: {
    name: string;
    repo: string;
    branch: string;
    owner: string;
  }) => void;
}

export function ConnectProjectDialog({
  open,
  onOpenChange,
  onProjectConnected,
}: ConnectProjectDialogProps) {
  const [step, setStep] = useState<"repo" | "webhook" | "complete">("repo");
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [connectedRepo, setConnectedRepo] = useState<{
    name: string;
    owner: string;
    defaultBranch: string;
  } | null>(null);
  
  const { fetchRepo, isLoading } = useGitHub();
  
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-handler`;

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
      setStep("webhook");
    }
  };

  const handleSetupWebhook = async () => {
    // User confirms they've added the webhook
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
      });
    }
    onOpenChange(false);
    setStep("repo");
    setRepoUrl("");
    setBranch("main");
    setConnectedRepo(null);
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
            Link your GitHub repository and configure webhooks for automatic error detection.
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
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
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
                  Go to your Vercel project settings
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">2</span>
                  Navigate to Git → Deploy Hooks
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">3</span>
                  Add the webhook URL above
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">4</span>
                  Enable "Deployment Failed" events
                </li>
              </ol>
            </div>

            <Button
              onClick={handleSetupWebhook}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "I've Added the Webhook"
              )}
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
