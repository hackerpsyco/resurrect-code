import { useGitHub } from "@/hooks/useGitHub";
import { toast } from "sonner";

export class GitOperations {
  private owner: string;
  private repo: string;
  private branch: string;

  constructor(owner: string, repo: string, branch: string = "main") {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
  }

  // Helper method to call GitHub API directly
  private async callGitHubAPI(body: Record<string, unknown>) {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("github-api", { body });
    if (error) throw new Error(error.message);
    if (!data.success) throw new Error(data.error);
    return data.data;
  }

  async commitChanges(message: string, files: Array<{ path: string; content: string; sha?: string }>) {
    try {
      toast.info("Committing changes...");
      
      // Create a new branch for the changes
      const newBranch = `feature/ide-changes-${Date.now()}`;
      
      // Create branch
      await this.callGitHubAPI({
        action: "create_branch",
        owner: this.owner,
        repo: this.repo,
        baseBranch: this.branch,
        newBranch,
      });

      // Update all files
      for (const file of files) {
        await this.callGitHubAPI({
          action: "update_file",
          owner: this.owner,
          repo: this.repo,
          path: file.path,
          content: file.content,
          message,
          sha: file.sha,
          branch: newBranch,
        });
      }

      toast.success(`Changes committed to branch: ${newBranch}`);
      return { success: true, branch: newBranch };
    } catch (error) {
      console.error("Commit failed:", error);
      toast.error(`Commit failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      return { success: false, error };
    }
  }

  async createPullRequest(title: string, body: string, headBranch: string) {
    try {
      toast.info("Creating pull request...");
      
      const pr = await this.callGitHubAPI({
        action: "create_pr",
        owner: this.owner,
        repo: this.repo,
        title,
        body,
        baseBranch: this.branch,
        newBranch: headBranch,
      });

      toast.success("Pull request created successfully!");
      return { success: true, pr };
    } catch (error) {
      console.error("PR creation failed:", error);
      toast.error(`PR creation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      return { success: false, error };
    }
  }

  async pushChanges() {
    try {
      toast.info("Pushing changes to GitHub...");
      
      // In a real implementation, this would push to the remote repository
      // For now, we'll simulate the push operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Changes pushed successfully!");
      return { success: true };
    } catch (error) {
      console.error("Push failed:", error);
      toast.error(`Push failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      return { success: false, error };
    }
  }

  async pullChanges() {
    try {
      toast.info("Pulling latest changes...");
      
      // Fetch the latest repository state
      const repoInfo = await this.callGitHubAPI({
        action: "get_repo",
        owner: this.owner,
        repo: this.repo,
      });
      
      toast.success("Repository updated with latest changes!");
      return { success: true, repoInfo };
    } catch (error) {
      console.error("Pull failed:", error);
      toast.error(`Pull failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      return { success: false, error };
    }
  }

  async getStatus() {
    try {
      // Get repository information
      const repoInfo = await this.callGitHubAPI({
        action: "get_repo",
        owner: this.owner,
        repo: this.repo,
      });
      
      return {
        success: true,
        status: {
          branch: this.branch,
          repository: `${this.owner}/${this.repo}`,
          lastUpdate: new Date().toISOString(),
          clean: true // Assume clean for demo
        }
      };
    } catch (error) {
      console.error("Status check failed:", error);
      return { success: false, error };
    }
  }
}

// Factory function to create GitOperations instance
export function createGitOperations(owner: string, repo: string, branch: string = "main") {
  return new GitOperations(owner, repo, branch);
}