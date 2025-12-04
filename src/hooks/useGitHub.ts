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
    const { data, error } = await supabase.functions.invoke("github-api", { body });
    if (error) throw new Error(error.message);
    if (!data.success) throw new Error(data.error);
    return data.data;
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
      const data = await callGitHubAPI({
        action: "get_tree",
        owner,
        repo,
        branch,
      });

      const files = data.tree.filter((node: FileNode) => 
        node.type === "blob" && !node.path.includes("node_modules")
      );
      setFileTree(files);
      return files;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch files";
      toast.error(message);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch file";
      toast.error(message);
      return null;
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
