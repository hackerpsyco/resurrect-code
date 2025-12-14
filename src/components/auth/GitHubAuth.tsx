import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Github, Key, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface GitHubAuthProps {
  onAuthSuccess: (token: string, user: any) => void;
  onClose?: () => void;
}

export function GitHubAuth({ onAuthSuccess, onClose }: GitHubAuthProps) {
  const [token, setToken] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<"input" | "verify" | "success">("input");

  // Check if user already has a token stored
  useEffect(() => {
    const storedToken = localStorage.getItem("github_token");
    const storedUser = localStorage.getItem("github_user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setStep("success");
    }
  }, []);

  const verifyToken = async () => {
    if (!token.trim()) {
      toast.error("Please enter a GitHub token");
      return;
    }

    setIsVerifying(true);
    try {
      // Verify token by getting user info
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid GitHub token. Please check your token and try again.");
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const userData = await response.json();
      
      // Store token and user data
      localStorage.setItem("github_token", token);
      localStorage.setItem("github_user", JSON.stringify(userData));
      
      setUser(userData);
      setStep("success");
      
      toast.success(`Successfully connected as ${userData.login}!`);
      onAuthSuccess(token, userData);
      
    } catch (error) {
      console.error("GitHub auth error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to verify GitHub token");
    } finally {
      setIsVerifying(false);
    }
  };

  const disconnect = () => {
    localStorage.removeItem("github_token");
    localStorage.removeItem("github_user");
    setToken("");
    setUser(null);
    setStep("input");
    toast.info("Disconnected from GitHub");
  };

  const createToken = () => {
    window.open("https://github.com/settings/tokens/new?scopes=repo,user&description=ResurrectCI%20IDE", "_blank");
  };

  if (step === "success" && user) {
    return (
      <div className="p-6 bg-[#1e1e1e] border border-[#464647] rounded-lg max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">GitHub Connected!</h2>
          <p className="text-[#7d8590]">Successfully connected to your GitHub account</p>
        </div>

        <div className="bg-[#252526] border border-[#464647] rounded p-4 mb-6">
          <div className="flex items-center gap-3">
            <img 
              src={user.avatar_url} 
              alt={user.login}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-white">{user.name || user.login}</h3>
              <p className="text-sm text-[#7d8590]">@{user.login}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-green-500/20 text-green-400 text-xs">Connected</Badge>
                <span className="text-xs text-[#7d8590]">{user.public_repos} public repos</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={() => onClose?.()}
            className="flex-1 bg-[#238636] hover:bg-[#2ea043]"
          >
            Continue to Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={disconnect}
            className="border-[#464647] text-[#cccccc] hover:bg-[#464647]"
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#1e1e1e] border border-[#464647] rounded-lg max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#238636]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Github className="w-8 h-8 text-[#238636]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Connect GitHub</h2>
        <p className="text-[#7d8590]">Connect your GitHub account to access your repositories</p>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            GitHub Personal Access Token
          </label>
          <Input
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="bg-[#3c3c3c] border-[#464647] text-[#cccccc]"
            onKeyPress={(e) => e.key === 'Enter' && verifyToken()}
          />
        </div>

        <div className="bg-[#252526] border border-[#464647] rounded p-3">
          <div className="flex items-start gap-2 mb-2">
            <Key className="w-4 h-4 text-[#238636] mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white">Need a token?</h4>
              <p className="text-xs text-[#7d8590] mb-2">
                Create a Personal Access Token with 'repo' and 'user' permissions
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={createToken}
                className="text-xs border-[#464647] text-[#cccccc] hover:bg-[#464647]"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Create Token
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-400">Required Permissions</h4>
              <ul className="text-xs text-yellow-300 mt-1 space-y-1">
                <li>• <strong>repo</strong> - Access repositories</li>
                <li>• <strong>user</strong> - Read user profile</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={verifyToken}
          disabled={isVerifying || !token.trim()}
          className="flex-1 bg-[#238636] hover:bg-[#2ea043]"
        >
          {isVerifying ? "Verifying..." : "Connect GitHub"}
        </Button>
        {onClose && (
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-[#464647] text-[#cccccc] hover:bg-[#464647]"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}