import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Github, 
  Plus, 
  Search, 
  Star, 
  GitBranch, 
  Clock, 
  Lock, 
  Globe,
  Code,
  RefreshCw,
  ExternalLink,
  Settings
} from "lucide-react";
import { useGitHubAuth } from "@/hooks/useGitHubAuth";
import { GitHubAuth } from "@/components/auth/GitHubAuth";
import { toast } from "sonner";

interface GitHubDashboardProps {
  onRepositorySelect: (repo: {
    id: string;
    name: string;
    owner: string;
    repo: string;
    branch: string;
    language: string;
    framework: string;
    status: "deployed" | "building" | "failed" | "offline";
  }) => void;
}

export function GitHubDashboard({ onRepositorySelect }: GitHubDashboardProps) {
  const {
    isAuthenticated,
    user,
    repositories,
    isLoading,
    authenticate,
    logout,
    loadRepositories,
    createRepository
  } = useGitHubAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDescription, setNewRepoDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Filter repositories based on search
  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRepository = async () => {
    if (!newRepoName.trim()) {
      toast.error("Repository name is required");
      return;
    }

    setIsCreating(true);
    const repo = await createRepository(newRepoName.trim(), newRepoDescription.trim());
    if (repo) {
      setNewRepoName("");
      setNewRepoDescription("");
      setShowCreateRepo(false);
    }
    setIsCreating(false);
  };

  const handleRepositoryClick = (repo: any) => {
    const detectFramework = (name: string, language: string) => {
      const nameLower = name.toLowerCase();
      if (nameLower.includes("next")) return "Next.js";
      if (nameLower.includes("react")) return "React";
      if (nameLower.includes("vue")) return "Vue.js";
      if (nameLower.includes("angular")) return "Angular";
      if (language === "TypeScript") return "TypeScript";
      if (language === "JavaScript") return "JavaScript";
      if (language === "Python") return "Python";
      return "Web App";
    };

    onRepositorySelect({
      id: `github-${repo.id}`,
      name: repo.name,
      owner: repo.owner.login,
      repo: repo.name,
      branch: repo.default_branch,
      language: repo.language || "JS",
      framework: detectFramework(repo.name, repo.language),
      status: "deployed"
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <GitHubAuth onAuthSuccess={authenticate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <div className="border-b border-[#30363d] bg-[#161b22] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Github className="w-8 h-8 text-[#238636]" />
              <div>
                <h1 className="text-xl font-bold">GitHub Repositories</h1>
                <p className="text-sm text-[#7d8590]">
                  Connected as {user?.login} • {repositories.length} repositories
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadRepositories}
              disabled={isLoading}
              className="border-[#30363d] text-white hover:bg-[#21262d]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateRepo(true)}
              className="bg-[#238636] hover:bg-[#2ea043]"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Repository
            </Button>
            <Button
              variant="outline"
              onClick={logout}
              className="border-[#30363d] text-white hover:bg-[#21262d]"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#7d8590]" />
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#21262d] border-[#30363d] text-white"
              />
            </div>
            <div className="text-sm text-[#7d8590]">
              {filteredRepositories.length} of {repositories.length} repositories
            </div>
          </div>
        </div>

        {/* Create Repository Modal */}
        {showCreateRepo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Create New Repository</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Repository Name</label>
                  <Input
                    placeholder="my-awesome-project"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    className="bg-[#21262d] border-[#30363d] text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description (optional)</label>
                  <Input
                    placeholder="A brief description of your project"
                    value={newRepoDescription}
                    onChange={(e) => setNewRepoDescription(e.target.value)}
                    className="bg-[#21262d] border-[#30363d] text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCreateRepository}
                  disabled={isCreating || !newRepoName.trim()}
                  className="flex-1 bg-[#238636] hover:bg-[#2ea043]"
                >
                  {isCreating ? "Creating..." : "Create Repository"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateRepo(false)}
                  className="border-[#30363d] text-white hover:bg-[#21262d]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Repository Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-[#21262d] rounded mb-2"></div>
                <div className="h-3 bg-[#21262d] rounded w-2/3 mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-[#21262d] rounded w-16"></div>
                  <div className="h-6 bg-[#21262d] rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRepositories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRepositories.map((repo) => (
              <div
                key={repo.id}
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#7d8590] cursor-pointer transition-colors group"
                onClick={() => handleRepositoryClick(repo)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white group-hover:text-[#238636] transition-colors">
                        {repo.name}
                      </h3>
                      {repo.private ? (
                        <Lock className="w-4 h-4 text-[#7d8590]" />
                      ) : (
                        <Globe className="w-4 h-4 text-[#7d8590]" />
                      )}
                    </div>
                    <p className="text-sm text-[#7d8590] line-clamp-2 mb-3">
                      {repo.description || "No description provided"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(repo.html_url, "_blank");
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm text-[#7d8590]">
                  <div className="flex items-center gap-4">
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
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(repo.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#30363d]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-[#7d8590]">
                      <GitBranch className="w-3 h-3" />
                      <span>{repo.default_branch}</span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#238636] hover:bg-[#2ea043] text-xs h-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRepositoryClick(repo);
                      }}
                    >
                      <Code className="w-3 h-3 mr-1" />
                      Open IDE
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Github className="w-16 h-16 text-[#7d8590] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No repositories found" : "No repositories yet"}
            </h3>
            <p className="text-[#7d8590] mb-6">
              {searchQuery 
                ? `No repositories match "${searchQuery}"`
                : "Create your first repository to get started"
              }
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowCreateRepo(true)}
                className="bg-[#238636] hover:bg-[#2ea043]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Repository
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}