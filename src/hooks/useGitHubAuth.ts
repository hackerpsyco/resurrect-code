import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
  email?: string;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  default_branch: string;
  language: string;
  stargazers_count: number;
  updated_at: string;
  html_url: string;
  clone_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export function useGitHubAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("github_token");
    const storedUser = localStorage.getItem("github_user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Load repositories when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      loadRepositories();
    }
  }, [isAuthenticated, token]);

  const authenticate = useCallback((newToken: string, userData: GitHubUser) => {
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("github_token", newToken);
    localStorage.setItem("github_user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setRepositories([]);
    localStorage.removeItem("github_token");
    localStorage.removeItem("github_user");
    toast.info("Logged out from GitHub");
  }, []);

  const loadRepositories = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      // Load all repositories (public and private)
      const allRepos: GitHubRepository[] = [];
      let page = 1;
      const perPage = 100;

      while (true) {
        const response = await fetch(
          `https://api.github.com/user/repos?sort=updated&per_page=${perPage}&page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch repositories: ${response.status}`);
        }

        const repos = await response.json();
        if (repos.length === 0) break;

        allRepos.push(...repos);
        page++;

        // Limit to prevent infinite loops
        if (page > 10) break;
      }

      setRepositories(allRepos);
      toast.success(`Loaded ${allRepos.length} repositories`);
    } catch (error) {
      console.error("Error loading repositories:", error);
      toast.error("Failed to load repositories");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const createRepository = useCallback(async (name: string, description?: string, isPrivate = false) => {
    if (!token) {
      toast.error("Not authenticated");
      return null;
    }

    try {
      const response = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          private: isPrivate,
          auto_init: true, // Create with README
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to create repository: ${response.status}`);
      }

      const newRepo = await response.json();
      setRepositories(prev => [newRepo, ...prev]);
      toast.success(`Repository "${name}" created successfully!`);
      return newRepo;
    } catch (error) {
      console.error("Error creating repository:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create repository");
      return null;
    }
  }, [token]);

  const updateFile = useCallback(async (
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
    branch = "main"
  ) => {
    if (!token) {
      toast.error("Not authenticated");
      return false;
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            content: btoa(content), // Base64 encode
            sha,
            branch,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to update file: ${response.status}`);
      }

      toast.success(`File "${path}" updated successfully!`);
      return true;
    } catch (error) {
      console.error("Error updating file:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update file");
      return false;
    }
  }, [token]);

  const getFileContent = useCallback(async (
    owner: string,
    repo: string,
    path: string,
    branch = "main"
  ) => {
    if (!token) {
      toast.error("Not authenticated");
      return null;
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get file: ${response.status}`);
      }

      const fileData = await response.json();
      return {
        content: atob(fileData.content.replace(/\s/g, "")), // Decode base64
        sha: fileData.sha,
        path: fileData.path,
      };
    } catch (error) {
      console.error("Error getting file content:", error);
      toast.error("Failed to load file content");
      return null;
    }
  }, [token]);

  return {
    isAuthenticated,
    user,
    token,
    repositories,
    isLoading,
    authenticate,
    logout,
    loadRepositories,
    createRepository,
    updateFile,
    getFileContent,
  };
}