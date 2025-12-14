/**
 * GitHub OAuth Service - URL-based GitHub authentication
 * Handles OAuth flow as an alternative to manual token entry
 */

export interface GitHubOAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export interface GitHubOAuthState {
  state: string;
  codeVerifier: string;
  timestamp: number;
}

class GitHubOAuthService {
  private config: GitHubOAuthConfig = {
    clientId: '', // Will be set from environment or user input
    redirectUri: `${window.location.origin}/auth/github/callback`,
    scopes: ['repo', 'user', 'user:email']
  };

  /**
   * Set OAuth configuration
   */
  setConfig(config: Partial<GitHubOAuthConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get OAuth configuration
   */
  getConfig(): GitHubOAuthConfig {
    return this.config;
  }

  /**
   * Generate a random string for state parameter
   */
  private generateRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  private async generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
    const codeVerifier = this.generateRandomString(128);
    
    // Create code challenge using SHA256
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to base64url
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return { codeVerifier, codeChallenge };
  }

  /**
   * Start OAuth flow - redirect to GitHub
   */
  async startOAuthFlow(clientId?: string): Promise<void> {
    if (clientId) {
      this.config.clientId = clientId;
    }

    if (!this.config.clientId) {
      throw new Error('GitHub Client ID is required for OAuth flow');
    }

    // Generate state and PKCE parameters
    const state = this.generateRandomString();
    const { codeVerifier, codeChallenge } = await this.generatePKCE();

    // Store state and code verifier for later verification
    const oauthState: GitHubOAuthState = {
      state,
      codeVerifier,
      timestamp: Date.now()
    };
    localStorage.setItem('github_oauth_state', JSON.stringify(oauthState));

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      allow_signup: 'true'
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    
    // Redirect to GitHub
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback - exchange code for token
   */
  async handleOAuthCallback(code: string, state: string): Promise<string> {
    // Verify state parameter
    const savedState = localStorage.getItem('github_oauth_state');
    if (!savedState) {
      throw new Error('OAuth state not found. Please restart the authentication process.');
    }

    const oauthState: GitHubOAuthState = JSON.parse(savedState);
    
    // Check if state matches and is not expired (5 minutes)
    if (oauthState.state !== state) {
      throw new Error('Invalid OAuth state. Possible CSRF attack.');
    }

    if (Date.now() - oauthState.timestamp > 5 * 60 * 1000) {
      throw new Error('OAuth state expired. Please restart the authentication process.');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: '', // This would need to be handled by your backend
        code: code,
        redirect_uri: this.config.redirectUri,
        code_verifier: oauthState.codeVerifier
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to exchange code for token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(`OAuth error: ${tokenData.error_description || tokenData.error}`);
    }

    // Clean up stored state
    localStorage.removeItem('github_oauth_state');

    return tokenData.access_token;
  }

  /**
   * Check if we're currently in an OAuth callback
   */
  isOAuthCallback(): { isCallback: boolean; code?: string; state?: string; error?: string } {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    return {
      isCallback: !!(code || error),
      code: code || undefined,
      state: state || undefined,
      error: error || undefined
    };
  }

  /**
   * Get GitHub App installation URL
   */
  getInstallationUrl(clientId: string): string {
    return `https://github.com/apps/${clientId}/installations/new`;
  }

  /**
   * Generate a GitHub App manifest for easy setup
   */
  generateAppManifest(appName: string = 'ResurrectCI Dashboard'): object {
    return {
      name: appName,
      url: window.location.origin,
      hook_attributes: {
        url: `${window.location.origin}/api/github/webhook`
      },
      redirect_url: this.config.redirectUri,
      callback_urls: [this.config.redirectUri],
      public: false,
      default_permissions: {
        contents: 'read',
        metadata: 'read',
        pull_requests: 'read',
        issues: 'read'
      },
      default_events: [
        'push',
        'pull_request',
        'issues'
      ]
    };
  }

  /**
   * Clear OAuth state
   */
  clearOAuthState(): void {
    localStorage.removeItem('github_oauth_state');
  }
}

// Export singleton instance
export const githubOAuthService = new GitHubOAuthService();
export default githubOAuthService;