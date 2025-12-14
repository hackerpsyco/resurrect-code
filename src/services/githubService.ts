/**
 * GitHub Service - Real GitHub API integration
 * Handles authentication, repository fetching, and user data
 */

export interface GitHubUser {
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  public_repos: number;
  private_repos: number;
  total_private_repos: number;
  owned_private_repos: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  clone_url: string;
  ssh_url: string;
  language: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

class GitHubService {
  private baseUrl = 'https://api.github.com';
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('github_token');
  }

  /**
   * Set the GitHub token for API requests
   */
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('github_token', token);
  }

  /**
   * Get the current GitHub token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Clear the GitHub token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
    localStorage.removeItem('github_selected_repos');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Make authenticated request to GitHub API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      throw new Error('GitHub token not set. Please authenticate first.');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ResurrectCI-Dashboard/1.0',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Use default error message
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Get authenticated user information
   */
  async getUser(): Promise<GitHubUser> {
    return this.makeRequest<GitHubUser>('/user');
  }

  /**
   * Verify token and get user info
   */
  async verifyToken(token: string): Promise<GitHubUser> {
    const tempToken = this.token;
    this.token = token;
    
    try {
      const user = await this.getUser();
      return user;
    } catch (error) {
      this.token = tempToken; // Restore previous token on error
      throw error;
    }
  }

  /**
   * Get user's repositories
   */
  async getRepositories(options: {
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubRepository[]> {
    const params = new URLSearchParams();
    
    if (options.type) params.append('type', options.type);
    if (options.sort) params.append('sort', options.sort);
    if (options.direction) params.append('direction', options.direction);
    if (options.per_page) params.append('per_page', options.per_page.toString());
    if (options.page) params.append('page', options.page.toString());

    const endpoint = `/user/repos${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<GitHubRepository[]>(endpoint);
  }

  /**
   * Get a specific repository
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.makeRequest<GitHubRepository>(`/repos/${owner}/${repo}`);
  }

  /**
   * Get repository file tree
   */
  async getRepositoryTree(owner: string, repo: string, branch: string = 'main', recursive: boolean = true): Promise<GitHubTreeItem[]> {
    const params = recursive ? '?recursive=1' : '';
    const response = await this.makeRequest<{ tree: GitHubTreeItem[] }>(`/repos/${owner}/${repo}/git/trees/${branch}${params}`);
    return response.tree;
  }

  /**
   * Get file content from repository
   */
  async getFileContent(owner: string, repo: string, path: string, branch: string = 'main'): Promise<GitHubFile> {
    const response = await this.makeRequest<GitHubFile>(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
    
    // Decode base64 content if present
    if (response.content && response.encoding === 'base64') {
      response.content = atob(response.content.replace(/\n/g, ''));
    }
    
    return response;
  }

  /**
   * Get multiple files from repository
   */
  async getMultipleFiles(owner: string, repo: string, paths: string[], branch: string = 'main'): Promise<GitHubFile[]> {
    const files = await Promise.allSettled(
      paths.map(path => this.getFileContent(owner, repo, path, branch))
    );

    return files
      .filter((result): result is PromiseFulfilledResult<GitHubFile> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  /**
   * Search repositories
   */
  async searchRepositories(query: string, options: {
    sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
    order?: 'desc' | 'asc';
    per_page?: number;
    page?: number;
  } = {}): Promise<{ items: GitHubRepository[]; total_count: number }> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (options.sort) params.append('sort', options.sort);
    if (options.order) params.append('order', options.order);
    if (options.per_page) params.append('per_page', options.per_page.toString());
    if (options.page) params.append('page', options.page.toString());

    return this.makeRequest<{ items: GitHubRepository[]; total_count: number }>(`/search/repositories?${params.toString()}`);
  }

  /**
   * Get repository branches
   */
  async getBranches(owner: string, repo: string): Promise<Array<{ name: string; commit: { sha: string } }>> {
    return this.makeRequest<Array<{ name: string; commit: { sha: string } }>>(`/repos/${owner}/${repo}/branches`);
  }

  /**
   * Get repository commits
   */
  async getCommits(owner: string, repo: string, options: {
    sha?: string;
    path?: string;
    author?: string;
    since?: string;
    until?: string;
    per_page?: number;
    page?: number;
  } = {}): Promise<Array<any>> {
    const params = new URLSearchParams();
    
    if (options.sha) params.append('sha', options.sha);
    if (options.path) params.append('path', options.path);
    if (options.author) params.append('author', options.author);
    if (options.since) params.append('since', options.since);
    if (options.until) params.append('until', options.until);
    if (options.per_page) params.append('per_page', options.per_page.toString());
    if (options.page) params.append('page', options.page.toString());

    const endpoint = `/repos/${owner}/${repo}/commits${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<Array<any>>(endpoint);
  }

  /**
   * Get rate limit information
   */
  async getRateLimit(): Promise<{
    rate: {
      limit: number;
      remaining: number;
      reset: number;
      used: number;
    };
  }> {
    return this.makeRequest<{
      rate: {
        limit: number;
        remaining: number;
        reset: number;
        used: number;
      };
    }>('/rate_limit');
  }

  /**
   * Get selected repositories from localStorage
   */
  getSelectedRepositories(): number[] {
    const saved = localStorage.getItem('github_selected_repos');
    return saved ? JSON.parse(saved) : [];
  }

  /**
   * Save selected repositories to localStorage
   */
  saveSelectedRepositories(repoIds: number[]) {
    localStorage.setItem('github_selected_repos', JSON.stringify(repoIds));
  }

  /**
   * Get cached user data
   */
  getCachedUser(): GitHubUser | null {
    const saved = localStorage.getItem('github_user');
    return saved ? JSON.parse(saved) : null;
  }

  /**
   * Cache user data
   */
  cacheUser(user: GitHubUser) {
    localStorage.setItem('github_user', JSON.stringify(user));
  }
}

// Export singleton instance
export const githubService = new GitHubService();
export default githubService;