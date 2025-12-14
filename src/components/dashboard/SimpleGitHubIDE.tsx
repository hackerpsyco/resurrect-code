import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfessionalVSCodeInterface } from "./ide/ProfessionalVSCodeInterface";
import { Github, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export function SimpleGitHubIDE() {
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [owner, setOwner] = useState("hackerpsyco");
  const [repo, setRepo] = useState("resurrect-code");

  const openRepository = () => {
    if (!owner.trim() || !repo.trim()) {
      toast.error("Please enter both owner and repository name");
      return;
    }

    const project = {
      id: `simple-${Date.now()}`,
      name: repo.trim(),
      owner: owner.trim(),
      repo: repo.trim(),
      branch: "main",
      status: "deployed" as const,
      errorPreview: undefined,
      latestDeploymentId: undefined
    };

    console.log("🚀 Opening project:", project);
    setCurrentProject(project);
  };

  const quickRepositories = [
    { owner: "hackerpsyco", repo: "resurrect-code", name: "Your Resurrect Code" },
    { owner: "microsoft", repo: "vscode", name: "Microsoft VSCode" },
    { owner: "vercel", repo: "next.js", name: "Next.js Framework" },
    { owner: "facebook", repo: "react", name: "React Library" },
    { owner: "nodejs", repo: "node", name: "Node.js Runtime" }
  ];

  if (currentProject) {
    return (
      <ProfessionalVSCodeInterface
        project={currentProject}
        onClose={() => setCurrentProject(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#238636]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Github className="w-8 h-8 text-[#238636]" />
          </div>
          <h1 className="text-3xl font-bold mb-2">GitHub Code Editor</h1>
          <p className="text-[#7d8590]">
            Open any GitHub repository in a full-featured code editor
          </p>
        </div>

        {/* Manual Repository Input */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Open Repository</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Repository Owner</label>
              <Input
                placeholder="e.g., hackerpsyco"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="bg-[#21262d] border-[#30363d] text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Repository Name</label>
              <Input
                placeholder="e.g., resurrect-code"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="bg-[#21262d] border-[#30363d] text-white"
                onKeyPress={(e) => e.key === 'Enter' && openRepository()}
              />
            </div>
          </div>

          <Button 
            onClick={openRepository}
            className="w-full bg-[#238636] hover:bg-[#2ea043]"
            disabled={!owner.trim() || !repo.trim()}
          >
            <Github className="w-4 h-4 mr-2" />
            Open in Code Editor
          </Button>
        </div>

        {/* Quick Access */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickRepositories.map((repository) => (
              <div
                key={`${repository.owner}/${repository.repo}`}
                className="bg-[#21262d] border border-[#30363d] rounded p-3 hover:border-[#7d8590] cursor-pointer transition-colors"
                onClick={() => {
                  setOwner(repository.owner);
                  setRepo(repository.repo);
                  setTimeout(() => {
                    const project = {
                      id: `quick-${Date.now()}`,
                      name: repository.repo,
                      owner: repository.owner,
                      repo: repository.repo,
                      branch: "main",
                      status: "deployed" as const,
                      errorPreview: undefined,
                      latestDeploymentId: undefined
                    };
                    setCurrentProject(project);
                  }, 100);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">{repository.name}</h3>
                    <p className="text-sm text-[#7d8590]">{repository.owner}/{repository.repo}</p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-[#238636] rotate-180" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-[#7d8590]">
          <p>💡 <strong>Tip:</strong> Public repositories work without authentication. For private repos and higher rate limits, you'll need a GitHub token.</p>
          <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
            <p className="text-yellow-400 text-sm">
              <strong>Getting 403 errors?</strong> Create a GitHub token at{" "}
              <a 
                href="https://github.com/settings/tokens/new?scopes=repo,user&description=ResurrectCI%20IDE" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-yellow-300"
              >
                github.com/settings/tokens
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}