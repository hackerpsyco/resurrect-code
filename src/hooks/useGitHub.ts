import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RepoInfo {
  name: string;
  fullName: string;
  defaultBranch: string;
  description: string;
  private: boolean;
}

interface FileNode {
  path: string;
  type: "blob" | "tree";
  sha: string;
}

interface FileContent {
  path: string;
  content: string;
  sha: string;
}

export function useGitHub() {
  const [isLoading, setIsLoading] = useState(false);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);

  const parseRepoUrl = (url: string): { owner: string; repo: string } | null => {
    const match = url.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    return null;
  };

  const callGitHubAPI = async (body: Record<string, unknown>) => {
    console.log('Calling GitHub API with:', body);
    
    try {
      const { data, error } = await supabase.functions.invoke("github-api", { body });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Supabase Function Error: ${error.message || JSON.stringify(error)}`);
      }
      
      if (!data) {
        throw new Error('No data returned from Supabase function');
      }
      
      console.log('Supabase function response:', data);
      
      if (!data.success) {
        console.error('GitHub API error from edge function:', data.error);
        throw new Error(`Edge Function Error: ${data.error || 'Unknown error from GitHub API'}`);
      }
      
      console.log('GitHub API success via edge function:', data.data);
      return data.data;
    } catch (error) {
      console.error('GitHub API call failed:', error);
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`GitHub API via Supabase failed: ${error.message}`);
      }
      throw new Error('GitHub API via Supabase failed: Unknown error');
    }
  };

  const fetchRepo = useCallback(async (repoUrl: string) => {
    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      toast.error("Invalid GitHub URL");
      return null;
    }

    setIsLoading(true);
    try {
      const data = await callGitHubAPI({
        action: "get_repo",
        owner: parsed.owner,
        repo: parsed.repo,
      });

      const info: RepoInfo = {
        name: data.name,
        fullName: data.full_name,
        defaultBranch: data.default_branch,
        description: data.description || "",
        private: data.private,
      };

      setRepoInfo(info);
      toast.success(`Connected to ${info.fullName}`);
      return { ...info, owner: parsed.owner, repo: parsed.repo };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch repo";
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFileTree = useCallback(async (owner: string, repo: string, branch?: string) => {
    setIsLoading(true);
    try {
      console.log(`Fetching file tree for ${owner}/${repo}, branch: ${branch || 'default'}`);
      
      // First try the Supabase edge function
      try {
        const data = await callGitHubAPI({
          action: "get_tree",
          owner,
          repo,
          branch,
        });

        if (data && data.tree) {
          console.log(`Received ${data.tree.length} items from GitHub via edge function`);

          // Include both files (blob) and folders (tree), excluding node_modules and .git
          const files = data.tree.filter((node: FileNode) => 
            !node.path.includes("node_modules") && 
            !node.path.includes(".git/") &&
            node.path !== ".git" &&
            !node.path.startsWith("node_modules/")
          );
          
          console.log(`Filtered to ${files.length} items`);
          setFileTree(files);
          return files;
        }
      } catch (edgeFunctionError) {
        console.warn('Edge function failed, trying direct GitHub API:', edgeFunctionError);
        
        // Fallback to direct GitHub API call (for public repos)
        try {
          console.log('Attempting direct GitHub API fallback...');
          
          // Get repository info first
          const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
          if (!repoResponse.ok) {
            if (repoResponse.status === 404) {
              throw new Error(`Repository ${owner}/${repo} not found or is private`);
            }
            throw new Error(`Repository API failed: ${repoResponse.status} ${repoResponse.statusText}`);
          }
          const repoData = await repoResponse.json();
          const defaultBranch = repoData.default_branch;
          console.log(`Repository found: ${repoData.full_name}, default branch: ${defaultBranch}`);
          
          // Use the requested branch or fall back to default
          const targetBranch = branch || defaultBranch;
          
          // Get the tree
          const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`;
          console.log(`Fetching tree from: ${treeUrl}`);
          
          const treeResponse = await fetch(treeUrl);
          if (!treeResponse.ok) {
            if (treeResponse.status === 404 && targetBranch !== defaultBranch) {
              // Try with default branch if requested branch doesn't exist
              console.log(`Branch ${targetBranch} not found, trying default branch ${defaultBranch}`);
              const defaultTreeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
              const defaultTreeResponse = await fetch(defaultTreeUrl);
              if (!defaultTreeResponse.ok) {
                throw new Error(`Failed to fetch tree from default branch: ${defaultTreeResponse.status} ${defaultTreeResponse.statusText}`);
              }
              const defaultTreeData = await defaultTreeResponse.json();
              console.log(`Received ${defaultTreeData.tree.length} items from direct GitHub API (default branch)`);
              
              // Filter files
              const files = defaultTreeData.tree.filter((node: FileNode) => 
                !node.path.includes("node_modules") && 
                !node.path.includes(".git/") &&
                node.path !== ".git" &&
                !node.path.startsWith("node_modules/")
              );
              
              console.log(`Filtered to ${files.length} items`);
              setFileTree(files);
              toast.success(`Loaded ${files.length} files from ${owner}/${repo} (direct API, ${defaultBranch} branch)`);
              return files;
            } else {
              throw new Error(`Failed to fetch tree: ${treeResponse.status} ${treeResponse.statusText}`);
            }
          }
          
          const treeData = await treeResponse.json();
          console.log(`Received ${treeData.tree.length} items from direct GitHub API`);
          
          // Filter files and folders
          const files = treeData.tree.filter((node: FileNode) => 
            !node.path.includes("node_modules") && 
            !node.path.includes(".git/") &&
            node.path !== ".git" &&
            !node.path.startsWith("node_modules/")
          );
          
          console.log(`Filtered to ${files.length} items`);
          setFileTree(files);
          toast.success(`Loaded ${files.length} files from ${owner}/${repo} (direct API)`);
          return files;
          
        } catch (directApiError) {
          console.error('Direct API also failed:', directApiError);
          throw directApiError;
        }
      }
      
      throw new Error('No data received from any API method');
      
    } catch (error) {
      console.error('fetchFileTree error:', error);
      const message = error instanceof Error ? error.message : "Failed to fetch files";
      toast.error(`Failed to load repository files: ${message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFile = useCallback(async (
    owner: string,
    repo: string,
    path: string,
    branch?: string
  ): Promise<FileContent | null> => {
    setIsLoading(true);
    try {
      // First try the Supabase edge function
      try {
        const data = await callGitHubAPI({
          action: "get_file",
          owner,
          repo,
          path,
          branch,
        });
        return {
          path: data.path,
          content: data.decodedContent || "",
          sha: data.sha,
        };
      } catch (edgeFunctionError) {
        console.warn('Edge function failed for file fetch, trying direct API:', edgeFunctionError);
        
        // Fallback to direct GitHub API call (for public repos)
        const targetBranch = branch || 'main';
        const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${targetBranch}`;
        
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const fileData = await response.json();
        
        // Decode base64 content
        const content = atob(fileData.content.replace(/\s/g, ''));
        
        return {
          path: fileData.path,
          content: content,
          sha: fileData.sha,
        };
      }
    } catch (error) {
      console.error('fetchFile error:', error);
      const message = error instanceof Error ? error.message : "Failed to fetch file";
      toast.error(`Failed to load file: ${message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBranch = useCallback(async (
    owner: string,
    repo: string,
    baseBranch: string,
    newBranch: string
  ) => {
    setIsLoading(true);
    try {
      await callGitHubAPI({
        action: "create_branch",
        owner,
        repo,
        baseBranch,
        newBranch,
      });
      toast.success(`Branch '${newBranch}' created`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create branch";
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateFile = useCallback(async (
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
    branch?: string
  ) => {
    try {
      await callGitHubAPI({
        action: "update_file",
        owner,
        repo,
        path,
        content,
        message,
        sha,
        branch,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update file";
      toast.error(message);
      return false;
    }
  }, []);

  const createPR = useCallback(async (
    owner: string,
    repo: string,
    title: string,
    body: string,
    baseBranch: string,
    newBranch: string
  ) => {
    setIsLoading(true);
    try {
      const data = await callGitHubAPI({
        action: "create_pr",
        owner,
        repo,
        title,
        body,
        baseBranch,
        newBranch,
      });
      toast.success("Pull request created!");
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create PR";
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    repoInfo,
    fileTree,
    parseRepoUrl,
    fetchRepo,
    fetchFileTree,
    fetchFile,
    createBranch,
    updateFile,
    createPR,
  };
}
