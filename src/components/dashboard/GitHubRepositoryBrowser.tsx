import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Star, Eye, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  default_branch: string;
  language: string;
  stargazers_count: number;
  watchers_count: number;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubRepositoryBrowserProps {
  onRepositorySelect: (repo: { owner: string; repo: string; name: string; branch: string }) => void;
  onClose: () => void;
}

export function GitHubRepositoryBrowser({ onRepositorySelect, onClose }: GitHubRepositoryBrowserProps) {
  const [username, setUsername] = useState("hackerpsyco");
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customOwner, setCustomOwner] = useState("");
  const [customRepo, setCustomRepo] = useState("");

  const searchRepositories = async () => {
    if (!username.trim()) {
      toast.error("Please enter a GitHub username");
      return;
    }

    setIsLoading(true);
    try {
      // Get GitHub token from localStorage if available
      const githubToken = localStorage.getItem("github_token");
      
      const headers: Record<string, string> = {
        "Accept": "application/vnd.github.v3+json",
      };
      
      // Add authentication if token is available
      if (githubToken) {
        headers["Authorization"] = `Bearer ${githubToken}`;
      }
      
      const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=20`, {
        headers
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error(`User "${username}" not found on GitHub`);
        } else if (response.status === 403) {
          toast.error(`Rate limit exceeded. Please add a GitHub token for higher limits.`);
        } else {
          toast.error(`Failed to fetch repositories: ${response.status}`);
        }
        return;
      }

      const repos = await response.json();
      setRepositories(repos);
      toast.success(`Found ${repos.length} repositories for ${username}`);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      toast.error("Failed to fetch repositories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepositorySelect = (repo: Repository) => {
    onRepositorySelect({
      owner: repo.owner.login,
      repo: repo.name,
      name: repo.name,
      branch: repo.default_branch
    });
    toast.success(`Selected ${repo.full_name}`);
    onClose();
  };

  const handleCustomRepository = () => {
    if (!customOwner.trim() || !customRepo.trim()) {
      toast.error("Please enter both owner and repository name");
      return;
    }

    onRepositorySelect({
      owner: customOwner.trim(),
      repo: customRepo.trim(),
      name: customRepo.trim(),
      branch: "main"
    });
    toast.success(`Selected ${customOwner}/${customRepo}`);
    onClose();
  };

  const quickRepositories = [
    { owner: "hackerpsyco", repo: "resurrect-code", name: "Your Resurrect Code" },
    { owner: "microsoft", repo: "vscode", name: "Microsoft VSCode" },
    { owner: "vercel", repo: "next.js", name: "Next.js" },
    { owner: "facebook", repo: "react", name: "React" },
    { owner: "nodejs", repo: "node", name: "Node.js" }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] border border-[#464647] rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">🔍 Browse GitHub Repositories</h2>
          <Button variant="ghost" onClick={onClose} className="text-[#cccccc]">
            ✕
          </Button>
        </div>

        {/* Quick Access */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-white">⚡ Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickRepositories.map((repo) => (
              <div
                key={`${repo.owner}/${repo.repo}`}
                className="bg-[#252526] border border-[#464647] rounded p-3 hover:border-[#7d8590] cursor-pointer transition-colors"
                onClick={() => handleRepositorySelect({
                  id: 0,
                  name: repo.repo,
                  full_name: `${repo.owner}/${repo.repo}`,
                  description: repo.name,
                  private: false,
                  default_branch: "main",
                  language: "TypeScript",
                  stargazers_count: 0,
                  watchers_count: 0,
                  html_url: `https://github.com/${repo.owner}/${repo.repo}`,
                  owner: { login: repo.owner, avatar_url: "" }
                })}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{repo.name}</h4>
                    <p className="text-sm text-[#7d8590]">{repo.owner}/{repo.repo}</p>
                  </div>
                  <Plus className="w-5 h-5 text-[#238636]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Repository */}
        <div className="mb-6 p-4 bg-[#252526] border border-[#464647] rounded">
          <h3 className="text-lg font-semibold mb-3 text-white">🎯 Add Custom Repository</h3>
          <div className="flex gap-3 mb-3">
            <Input
              placeholder="Owner (e.g., hackerpsyco)"
              value={customOwner}
              onChange={(e) => setCustomOwner(e.target.value)}
              className="bg-[#3c3c3c] border-[#464647] text-[#cccccc]"
            />
            <Input
              placeholder="Repository (e.g., my-project)"
              value={customRepo}
              onChange={(e) => setCustomRepo(e.target.value)}
              className="bg-[#3c3c3c] border-[#464647] text-[#cccccc]"
            />
            <Button onClick={handleCustomRepository} className="bg-[#238636] hover:bg-[#2ea043]">
              Add Repository
            </Button>
          </div>
          <p className="text-sm text-[#7d8590]">
            Enter any GitHub repository owner and name to add it to your projects
          </p>
        </div>

        {/* Repository Search */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-white">🔍 Browse User Repositories</h3>
          <div className="flex gap-3 mb-4">
            <Input
              placeholder="GitHub username (e.g., hackerpsyco)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#3c3c3c] border-[#464647] text-[#cccccc]"
              onKeyPress={(e) => e.key === 'Enter' && searchRepositories()}
            />
            <Button 
              onClick={searchRepositories} 
              disabled={isLoading}
              className="bg-[#0e639c] hover:bg-[#1177bb]"
            >
              {isLoading ? "Searching..." : "Search Repositories"}
            </Button>
          </div>
        </div>

        {/* Repository List */}
        {repositories.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-white">
              📚 Repositories for {username} ({repositories.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className="bg-[#252526] border border-[#464647] rounded p-4 hover:border-[#7d8590] cursor-pointer transition-colors"
                  onClick={() => handleRepositorySelect(repo)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        {repo.name}
                        {repo.private && <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Private</Badge>}
                      </h4>
                      <p className="text-sm text-[#7d8590] mt-1 line-clamp-2">
                        {repo.description || "No description"}
                      </p>
                    </div>
                    <Plus className="w-5 h-5 text-[#238636] flex-shrink-0" />
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-[#7d8590]">
                    {repo.language && (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-[#238636] rounded-full"></div>
                        <span>{repo.language}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      <span>{repo.stargazers_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      <span>{repo.default_branch}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-[#7d8590]">
          <p>💡 <strong>Tip:</strong> Public repositories work best. Private repositories may require authentication.</p>
        </div>
      </div>
    </div>
  );
}