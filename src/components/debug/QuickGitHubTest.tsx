import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGitHub } from "@/hooks/useGitHub";
import { toast } from "sonner";

interface QuickGitHubTestProps {
  owner: string;
  repo: string;
  onClose?: () => void;
}

export function QuickGitHubTest({ owner, repo, onClose }: QuickGitHubTestProps) {
  const [testResults, setTestResults] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { fetchRepo, fetchFileTree, fetchFile } = useGitHub();

  const addResult = (message: string, type: "info" | "success" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    setTestResults(prev => `${prev}[${timestamp}] ${prefix} ${message}\n`);
  };

  const runQuickTest = async () => {
    setIsLoading(true);
    setTestResults("");
    
    addResult(`Starting GitHub API test for ${owner}/${repo}...`);
    
    try {
      // Test 1: Repository access
      addResult("Testing repository access...");
      const repoResult = await fetchRepo(`https://github.com/${owner}/${repo}`);
      
      if (repoResult) {
        addResult(`Repository found: ${repoResult.fullName} (${repoResult.private ? 'private' : 'public'})`, "success");
        
        // Test 2: File tree
        addResult("Testing file tree loading...");
        const files = await fetchFileTree(owner, repo);
        
        if (files && files.length > 0) {
          addResult(`File tree loaded: ${files.length} files`, "success");
          addResult(`Sample files: ${files.slice(0, 3).map(f => f.path).join(', ')}...`);
          
          // Test 3: File content (try README.md)
          const readmeFile = files.find(f => f.path.toLowerCase().includes('readme'));
          if (readmeFile) {
            addResult(`Testing file content loading (${readmeFile.path})...`);
            const fileContent = await fetchFile(owner, repo, readmeFile.path);
            
            if (fileContent) {
              addResult(`File content loaded: ${fileContent.content.length} characters`, "success");
            } else {
              addResult("File content loading failed", "error");
            }
          }
          
          toast.success("GitHub integration test completed successfully!");
        } else {
          addResult("No files returned from file tree API", "error");
        }
      } else {
        addResult("Repository access failed", "error");
      }
    } catch (error) {
      addResult(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
      toast.error("GitHub integration test failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] border border-[#464647] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">GitHub Integration Test</h2>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="text-[#cccccc]">
              ✕
            </Button>
          )}
        </div>
        
        <div className="mb-4">
          <p className="text-[#cccccc] mb-2">
            Testing GitHub API integration for: <span className="font-mono text-[#4ec9b0]">{owner}/{repo}</span>
          </p>
          
          <Button 
            onClick={runQuickTest} 
            disabled={isLoading}
            className="bg-[#0e639c] hover:bg-[#1177bb]"
          >
            {isLoading ? "Running Test..." : "Run Quick Test"}
          </Button>
        </div>
        
        <div className="bg-[#0d1117] border border-[#30363d] rounded p-4 font-mono text-sm max-h-64 overflow-y-auto">
          <div className="text-[#cccccc] whitespace-pre-wrap">
            {testResults || "Click 'Run Quick Test' to start testing GitHub integration..."}
          </div>
        </div>
        
        <div className="mt-4 text-sm text-[#7d8590]">
          <p>This test will:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Check repository access via Supabase edge function</li>
            <li>Test file tree loading with fallback to direct GitHub API</li>
            <li>Verify file content loading</li>
            <li>Show detailed logs for debugging</li>
          </ul>
        </div>
      </div>
    </div>
  );
}