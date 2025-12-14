/**
 * Vercel Service - Real Vercel API integration
 * Handles authentication, project fetching, and deployment management
 */

export interface VercelUser {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string;
  createdAt: number;
}

export interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  createdAt: number;
  updatedAt: number;
  framework: string;
  devCommand?: string;
  buildCommand?: string;
  outputDirectory?: string;
  publicSource?: boolean;
  link?: {
    type: 'github';
    repo: string;
    repoId: number;
    org?: string;
    gitCredentialId?: string;
    sourceless?: boolean;
    createdAt?: number;
    updatedAt?: number;
  };
  latestDeployments?: VercelDeployment[];
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  source: 'git' | 'cli' | 'import';
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  type: 'LAMBDAS';
  creator: {
    uid: string;
    email: string;
    username: string;
  };
  inspectorUrl?: string;
  meta?: {
    githubCommitAuthorName?: string;
    githubCommitMessage?: string;
    githubCommitOrg?: string;
    githubCommitRef?: string;
    githubCommitRepo?: string;
    githubCommitSha?: string;
  };
}

export interface VercelTeam {
  id: string;
  slug: string;
  name: string;
  createdAt: number;
  avatar?: string;
}

class VercelService {
  private baseUrl = 'https://api.vercel.com';
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('vercel_token');
  }

  /**
   * Set the Vercel token for API requests
   */
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('vercel_token', token);
  }

  /**
   * Get the current Vercel token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Clear the Vercel token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('vercel_token');
    localStorage.removeItem('vercel_user');
    localStorage.removeItem('vercel_teams');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Make authenticated request to Vercel API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      throw new Error('Vercel token not set. Please authenticate first.');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Vercel API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
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
  async getUser(): Promise<VercelUser> {
    const response = await this.makeRequest<{ user: VercelUser }>('/v2/user');
    return response.user;
  }

  /**
   * Verify token and get user info
   */
  async verifyToken(token: string): Promise<VercelUser> {
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
   * Get user's teams
   */
  async getTeams(): Promise<VercelTeam[]> {
    const response = await this.makeRequest<{ teams: VercelTeam[] }>('/v2/teams');
    return response.teams;
  }

  /**
   * Get user's projects
   */
  async getProjects(options: {
    teamId?: string;
    limit?: number;
    since?: number;
    until?: number;
  } = {}): Promise<VercelProject[]> {
    const params = new URLSearchParams();
    
    if (options.teamId) params.append('teamId', options.teamId);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.since) params.append('since', options.since.toString());
    if (options.until) params.append('until', options.until.toString());

    const endpoint = `/v9/projects${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.makeRequest<{ projects: VercelProject[] }>(endpoint);
    return response.projects;
  }

  /**
   * Get a specific project
   */
  async getProject(projectId: string, teamId?: string): Promise<VercelProject> {
    const params = teamId ? `?teamId=${teamId}` : '';
    return this.makeRequest<VercelProject>(`/v9/projects/${projectId}${params}`);
  }

  /**
   * Get project deployments
   */
  async getDeployments(options: {
    projectId?: string;
    teamId?: string;
    limit?: number;
    since?: number;
    until?: number;
    state?: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  } = {}): Promise<VercelDeployment[]> {
    const params = new URLSearchParams();
    
    if (options.projectId) params.append('projectId', options.projectId);
    if (options.teamId) params.append('teamId', options.teamId);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.since) params.append('since', options.since.toString());
    if (options.until) params.append('until', options.until.toString());
    if (options.state) params.append('state', options.state);

    const endpoint = `/v6/deployments${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.makeRequest<{ deployments: VercelDeployment[] }>(endpoint);
    return response.deployments;
  }

  /**
   * Get deployment details
   */
  async getDeployment(deploymentId: string, teamId?: string): Promise<VercelDeployment> {
    const params = teamId ? `?teamId=${teamId}` : '';
    return this.makeRequest<VercelDeployment>(`/v13/deployments/${deploymentId}${params}`);
  }

  /**
   * Create a new deployment
   */
  async createDeployment(options: {
    name: string;
    files: Array<{ file: string; data: string }>;
    projectSettings?: {
      framework?: string;
      buildCommand?: string;
      outputDirectory?: string;
      installCommand?: string;
      devCommand?: string;
    };
    target?: 'production' | 'staging';
    teamId?: string;
  }): Promise<VercelDeployment> {
    const body = {
      name: options.name,
      files: options.files,
      projectSettings: options.projectSettings,
      target: options.target || 'production',
    };

    const params = options.teamId ? `?teamId=${options.teamId}` : '';
    return this.makeRequest<VercelDeployment>(`/v13/deployments${params}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Delete a deployment
   */
  async deleteDeployment(deploymentId: string, teamId?: string): Promise<void> {
    const params = teamId ? `?teamId=${teamId}` : '';
    await this.makeRequest<void>(`/v13/deployments/${deploymentId}${params}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get project domains
   */
  async getDomains(options: {
    teamId?: string;
    limit?: number;
    since?: number;
    until?: number;
  } = {}): Promise<Array<{
    name: string;
    apexName: string;
    projectId?: string;
    redirect?: string;
    redirectStatusCode?: number;
    gitBranch?: string;
    createdAt: number;
    updatedAt: number;
    verified: boolean;
  }>> {
    const params = new URLSearchParams();
    
    if (options.teamId) params.append('teamId', options.teamId);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.since) params.append('since', options.since.toString());
    if (options.until) params.append('until', options.until.toString());

    const endpoint = `/v5/domains${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.makeRequest<{ domains: any[] }>(endpoint);
    return response.domains;
  }

  /**
   * Get cached user data
   */
  getCachedUser(): VercelUser | null {
    const saved = localStorage.getItem('vercel_user');
    return saved ? JSON.parse(saved) : null;
  }

  /**
   * Cache user data
   */
  cacheUser(user: VercelUser) {
    localStorage.setItem('vercel_user', JSON.stringify(user));
  }

  /**
   * Get cached teams data
   */
  getCachedTeams(): VercelTeam[] {
    const saved = localStorage.getItem('vercel_teams');
    return saved ? JSON.parse(saved) : [];
  }

  /**
   * Cache teams data
   */
  cacheTeams(teams: VercelTeam[]) {
    localStorage.setItem('vercel_teams', JSON.stringify(teams));
  }
}

// Export singleton instance
export const vercelService = new VercelService();
export default vercelService;