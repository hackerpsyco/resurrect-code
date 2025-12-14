import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGitHub } from "@/hooks/useGitHub";
import { toast } from "sonner";

export function GitHubDebugPanel() {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const [owner, setOwner] = useState(urlParams.get('owner') || "hackerpsyco");
  const [repo, setRepo] = useState(urlParams.get('repo') || "resurrect-code");
  const [testResults, setTestResults] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const { fetchRepo, fetchFileTree, fetchFile } = useGitHub();

  const addResult = (message: string, type: "info" | "success" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    setTestResults(prev => `${prev}[${timestamp}] ${prefix} ${message}\n`);
  };

  const testDirectGitHubAPI = async () => {
    setIsLoading(true);
    addResult("Testing direct GitHub API access...");
    addResult(`Repository URL: https://api.github.com/repos/${owner}/${repo}`);
    
    try {
      // Test repository access
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      addResult(`Repository API response: ${repoResponse.status} ${repoResponse.statusText}`);
      
      if (!repoResponse.ok) {
        if (repoResponse.status === 404) {
          addResult("Repository not found. This could mean:", "error");
          addResult("  • Repository doesn't exist", "error");
          addResult("  • Repository is private and requires authentication", "error");
          addResult("  • Owner/repo name is incorrect", "error");
        } else if (repoResponse.status === 403) {
          addResult("Access forbidden. This could mean:", "error");
          addResult("  • Rate limit exceeded", "error");
          addResult("  • Repository requires authentication", "error");
        }
        throw new Error(`Repository API failed: ${repoResponse.status} ${repoResponse.statusText}`);
      }
      
      const repoData = await repoResponse.json();
      addResult(`Repository found: ${repoData.full_name} (${repoData.private ? 'private' : 'public'})`, "success");
      addResult(`Default branch: ${repoData.default_branch}`);
      addResult(`Stars: ${repoData.stargazers_count}, Forks: ${repoData.forks_count}`);
      
      // Test file tree
      const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${repoData.default_branch}?recursive=1`;
      addResult(`Fetching tree from: ${treeUrl}`);
      const treeResponse = await fetch(treeUrl);
      
      if (!treeResponse.ok) {
        addResult(`Tree API failed: ${treeResponse.status} ${treeResponse.statusText}`, "error");
        throw new Error(`Tree API failed: ${treeResponse.status} ${treeResponse.statusText}`);
      }
      
      const treeData = await treeResponse.json();
      addResult(`File tree loaded: ${treeData.tree.length} total items`, "success");
      
      // Filter files
      const files = treeData.tree.filter((node: any) => 
        !node.path.includes('node_modules') && 
        !node.path.includes('.git/') &&
        node.type === 'blob'
      );
      
      addResult(`Filtered files: ${files.length} files (excluding node_modules, .git)`, "success");
      if (files.length > 0) {
        addResult(`Sample files: ${files.slice(0, 5).map((f: any) => f.path).join(', ')}...`);
      }
      
    } catch (error) {
      addResult(`Direct API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const testSupabaseEdgeFunction = async () => {
    setIsLoading(true);
    addResult("Testing Supabase edge function...");
    
    try {
      // Test repository fetch via edge function
      const repoResult = await fetchRepo(`https://github.com/${owner}/${repo}`);
      if (repoResult) {
        addResult(`Edge function repo test: SUCCESS - ${repoResult.fullName}`, "success");
        
        // Test file tree via edge function
        const files = await fetchFileTree(owner, repo);
        if (files && files.length > 0) {
          addResult(`Edge function file tree: SUCCESS - ${files.length} files loaded`, "success");
        } else {
          addResult("Edge function file tree: No files returned", "error");
        }
      } else {
        addResult("Edge function repo test: FAILED - No repository data returned", "error");
      }
    } catch (error) {
      addResult(`Edge function test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const testFileContent = async () => {
    setIsLoading(true);
    addResult("Testing file content loading...");
    
    try {
      // Try to load README.md
      const file = await fetchFile(owner, repo, "README.md");
      if (file) {
        addResult(`File content test: SUCCESS - README.md loaded (${file.content.length} chars)`, "success");
        addResult(`File SHA: ${file.sha}`);
      } else {
        addResult("File content test: FAILED - No file content returned", "error");
      }
    } catch (error) {
      addResult(`File content test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults("");
  };

  return (
    <div className="p-6 bg-[#1e1e1e] text-[#cccccc] min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-white">🔧 GitHub Integration Debug Panel</h1>
      
      <div className="mb-6 p-4 bg-[#252526] border border-[#464647] rounded">
        <h2 className="text-lg font-semibold mb-4">Repository Settings</h2>
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm mb-1">Owner:</label>
            <Input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="bg-[#3c3c3c] border-[#464647] text-[#cccccc]"
              placeholder="e.g., hackerpsyco"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Repository:</label>
            <Input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="bg-[#3c3c3c] border-[#464647] text-[#cccccc]"
              placeholder="e.g., resurrect-code"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm mb-2">Quick Test Repositories:</label>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOwner("hackerpsyco");
                setRepo("resurrect-code");
              }}
              className="text-xs bg-green-900/20 border-green-600/30 text-green-400"
            >
              ✅ Your Resurrect Code (Working!)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOwner("microsoft");
                setRepo("vscode");
              }}
              className="text-xs"
            >
              Microsoft VSCode
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOwner("vercel");
                setRepo("next.js");
              }}
              className="text-xs"
            >
              Vercel Next.js
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOwner("nodejs");
                setRepo("node");
              }}
              className="text-xs"
            >
              Node.js
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 bg-[#252526] border border-[#464647] rounded">
        <h2 className="text-lg font-semibold mb-4">Tests</h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={testDirectGitHubAPI}
            disabled={isLoading}
            className="bg-[#0e639c] hover:bg-[#1177bb]"
          >
            Test Direct GitHub API
          </Button>
          <Button
            onClick={testSupabaseEdgeFunction}
            disabled={isLoading}
            className="bg-[#0e639c] hover:bg-[#1177bb]"
          >
            Test Supabase Edge Function
          </Button>
          <Button
            onClick={testFileContent}
            disabled={isLoading}
            className="bg-[#0e639c] hover:bg-[#1177bb]"
          >
            Test File Content
          </Button>
          <Button
            onClick={clearResults}
            variant="outline"
            className="border-[#464647] text-[#cccccc] hover:bg-[#464647]"
          >
            Clear Results
          </Button>
        </div>
      </div>

      <div className="p-4 bg-[#252526] border border-[#464647] rounded">
        <h2 className="text-lg font-semibold mb-4">Test Results</h2>
        <div className="bg-[#1e1e1e] p-4 rounded border border-[#464647] font-mono text-sm max-h-96 overflow-y-auto">
          {testResults || "No tests run yet. Click a test button above to start."}
        </div>
      </div>

      <div className="mt-6 p-4 bg-[#2d2d30] border border-[#464647] rounded">
        <h3 className="text-md font-semibold mb-2">💡 Troubleshooting Tips</h3>
        <ul className="text-sm text-[#cccccc] space-y-1">
          <li>• If direct GitHub API works but Supabase fails, check if GITHUB_TOKEN is set in Supabase environment</li>
          <li>• For private repositories, you need a valid GitHub token with appropriate permissions</li>
          <li>• Public repositories should work with direct API even without authentication</li>
          <li>• Check browser console for detailed error messages</li>
          <li>• Verify the repository exists and is accessible</li>
        </ul>
      </div>
    </div>
  );
}