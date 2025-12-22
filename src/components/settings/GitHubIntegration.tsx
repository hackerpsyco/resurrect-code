import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Github, 
  Key, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Link,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { githubOAuthService } from '@/services/githubOAuthService';
import { userStorageService } from '@/services/userStorageService';

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
  private_repos: number;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  language: string;
  updated_at: string;
  default_branch: string;
}

interface GitHubIntegrationProps {
  onClose?: () => void;
}

export function GitHubIntegration({ onClose }: GitHubIntegrationProps) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [authMethod, setAuthMethod] = useState<'token' | 'oauth'>('token');
  const [clientId, setClientId] = useState('');

  // Load saved settings on mount (per Supabase user)
  useEffect(() => {
    const initializeFromStorage = async () => {
      // Handle possible GitHub OAuth callback in URL
      const oauthCallback = githubOAuthService.isOAuthCallback();
      if (oauthCallback.isCallback) {
        if (oauthCallback.error) {
          // Clean up URL silently
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (oauthCallback.code && oauthCallback.state) {
          await handleOAuthCallback(oauthCallback.code, oauthCallback.state);
        }
        return;
      }

      // Prefer per-user data from Supabase
      try {
        const credentials = await userStorageService.getCredentials();
        const settings = await userStorageService.getSettings();

        if (credentials.githubToken) {
          setToken(credentials.githubToken);
          await checkConnection(credentials.githubToken);
        } else {
          // Fallback to legacy localStorage (single-user) if no DB record yet
          const savedToken = localStorage.getItem('github_token');
          if (savedToken) {
            setToken(savedToken);
            await checkConnection(savedToken);
          }
        }

        if (settings.githubSelectedRepos) {
          setSelectedRepos(new Set(settings.githubSelectedRepos));
        } else {
          const savedRepos = localStorage.getItem('github_selected_repos');
          if (savedRepos) {
            setSelectedRepos(new Set(JSON.parse(savedRepos)));
          }
        }
      } catch (error) {
        console.error('Failed to initialize GitHub integration from storage:', error);
      }
    };

    initializeFromStorage();
  }, []);

  const checkConnection = async (tokenToCheck: string) => {
    if (!tokenToCheck.trim()) return;
    
    setIsConnecting(true);
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${tokenToCheck}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsConnected(true);
        // Silent success
        
        // Auto-load repositories
        await loadRepositories(tokenToCheck);
      } else {
        throw new Error(`GitHub API error: ${response.status}`);
      }
    } catch (error) {
      console.error('GitHub connection failed:', error);
      setIsConnected(false);
      setUser(null);
      // Silent error
    } finally {
      setIsConnecting(false);
    }
  };

  const loadRepositories = async (tokenToUse?: string) => {
    const authToken = tokenToUse || token;
    if (!authToken.trim()) return;

    setIsLoadingRepos(true);
    try {
      // Get user's repositories (both public and private)
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
        headers: {
          'Authorization': `token ${authToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const repos = await response.json();
        setRepositories(repos);
        // Silent success - no popup
      } else {
        throw new Error(`Failed to load repositories: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load repositories:', error);
      // Silent error
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleConnect = async () => {
    if (authMethod === 'token') {
      if (!token.trim()) {
        // Silent error
        return;
      }
      await checkConnection(token);
    } else {
      // OAuth flow
      if (!clientId.trim()) {
        // Silent error
        return;
      }
      
      try {
        // Silent info
        await githubOAuthService.startOAuthFlow(clientId);
      } catch (error) {
        // Silent error
      }
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    setIsConnecting(true);
    try {
      // Silent info
      
      // Note: In a real implementation, you'd need a backend to handle the token exchange
      // For now, we'll show instructions to the user
      // Silent error
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('OAuth callback failed:', error);
      // Silent error
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setToken('');
    setIsConnected(false);
    setUser(null);
    setRepositories([]);
    setSelectedRepos(new Set());
    
    // Clear saved data (legacy localStorage)
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_selected_repos');
    localStorage.removeItem('github_user');
    
    // Silent success
  };

  const handleSaveSettings = async () => {
    if (!isConnected) {
      toast.error("Please connect to GitHub first");
      return;
    }

    try {
      const repoArray = Array.from(selectedRepos);

      // Save to database via userStorageService
      await userStorageService.storeGitHubToken(token, repoArray);
      
      // Also save user info
      localStorage.setItem('github_user', JSON.stringify(user));
      
      if (repoArray.length === 0) {
        toast.success("✅ GitHub token saved. Select repositories any time to show them in your dashboard.");
      } else {
        toast.success(`✅ Settings saved! ${repoArray.length} repositories selected.`);
      }
      
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('github-settings-updated'));
      
      if (onClose && repoArray.length > 0) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to save GitHub settings:', error);
      toast.error("Failed to save settings. Please try again.");
    }
  };

  const toggleRepository = (repoId: number) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const selectAllRepositories = () => {
    setSelectedRepos(new Set(repositories.map(repo => repo.id)));
  };

  const clearAllRepositories = () => {
    setSelectedRepos(new Set());
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">GitHub Integration</h2>
          <p className="text-[#7d8590] mt-1">
            Connect your GitHub account to access your repositories in the dashboard
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose} className="text-[#7d8590]">
            ✕
          </Button>
        )}
      </div>

      {/* Connection Status */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Github className="w-5 h-5" />
            Connection Status
            {isConnected ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <XCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </CardTitle>
          {user && (
            <CardDescription className="flex items-center gap-3 mt-2">
              <img 
                src={user.avatar_url} 
                alt={user.login}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <div className="text-white font-medium">{user.name || user.login}</div>
                <div className="text-[#7d8590] text-sm">
                  @{user.login} • {user.public_repos} public repos • {user.private_repos} private repos
                </div>
              </div>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Method Selection */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white mb-3 block">
                Authentication Method
              </label>
              <div className="flex gap-2">
                <Button
                  variant={authMethod === 'token' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAuthMethod('token')}
                  className={authMethod === 'token' ? 'bg-[#238636] hover:bg-[#2ea043]' : 'border-[#30363d] text-[#7d8590] hover:text-white'}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Personal Token
                </Button>
                <Button
                  variant={authMethod === 'oauth' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAuthMethod('oauth')}
                  className={authMethod === 'oauth' ? 'bg-[#238636] hover:bg-[#2ea043]' : 'border-[#30363d] text-[#7d8590] hover:text-white'}
                >
                  <Link className="w-4 h-4 mr-2" />
                  OAuth App
                </Button>
              </div>
            </div>

            {authMethod === 'token' ? (
              /* Token Input */
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  GitHub Personal Access Token
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showToken ? "text" : "password"}
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="bg-[#21262d] border-[#30363d] text-white pr-10"
                      disabled={isConnecting}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-[#7d8590]"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting || !token.trim()}
                    className="bg-[#238636] hover:bg-[#2ea043]"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>
                <div className="text-xs text-[#7d8590]">
                  <p className="mb-1">
                    Create a token at{' '}
                    <a 
                      href="https://github.com/settings/tokens/new?scopes=repo,user&description=ResurrectCI%20Dashboard" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#58a6ff] hover:underline inline-flex items-center gap-1"
                    >
                      github.com/settings/tokens
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                  <p>Required scopes: <code className="bg-[#21262d] px-1 rounded">repo</code>, <code className="bg-[#21262d] px-1 rounded">user</code></p>
                </div>
              </div>
            ) : (
              /* OAuth Input */
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  GitHub App Client ID
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Iv1.xxxxxxxxxxxxxxxx"
                    className="bg-[#21262d] border-[#30363d] text-white"
                    disabled={isConnecting}
                  />
                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting || !clientId.trim()}
                    className="bg-[#238636] hover:bg-[#2ea043]"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link className="w-4 h-4 mr-2" />
                        Connect via OAuth
                      </>
                    )}
                  </Button>
                </div>
                <div className="text-xs text-[#7d8590]">
                  <p className="mb-1">
                    Create a GitHub App at{' '}
                    <a 
                      href="https://github.com/settings/apps/new" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#58a6ff] hover:underline inline-flex items-center gap-1"
                    >
                      github.com/settings/apps/new
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                  <p>Callback URL: <code className="bg-[#21262d] px-1 rounded">{window.location.origin}/auth/github/callback</code></p>
                </div>
              </div>
            )}
          </div>

          {/* Disconnect Button */}
          {isConnected && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repository Selection */}
      {isConnected && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5" />
                Repository Selection
                <Badge variant="outline" className="text-[#7d8590]">
                  {selectedRepos.size} selected
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadRepositories}
                  disabled={isLoadingRepos}
                  className="text-[#7d8590] hover:text-white"
                >
                  {isLoadingRepos ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllRepositories}
                  className="text-[#7d8590] hover:text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllRepositories}
                  className="text-[#7d8590] hover:text-white"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Select repositories to show in your dashboard. Only selected repositories will be available for editing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRepos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#7d8590]" />
                <span className="ml-2 text-[#7d8590]">Loading repositories...</span>
              </div>
            ) : repositories.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between p-3 bg-[#21262d] border border-[#30363d] rounded-lg hover:border-[#7d8590] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={selectedRepos.has(repo.id)}
                        onCheckedChange={() => toggleRepository(repo.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{repo.name}</span>
                          {repo.private && (
                            <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
                              Private
                            </Badge>
                          )}
                          {repo.language && (
                            <Badge variant="outline" className="text-[#7d8590]">
                              {repo.language}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-[#7d8590] mt-1">
                          {repo.description || 'No description'}
                        </div>
                        <div className="text-xs text-[#7d8590] mt-1">
                          Updated {new Date(repo.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://github.com/${repo.full_name}`, '_blank')}
                      className="text-[#7d8590] hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#7d8590]">
                <Github className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No repositories found</p>
                <Button
                  variant="ghost"
                  onClick={loadRepositories}
                  className="mt-2 text-[#58a6ff] hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Repositories
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Settings */}
      {isConnected && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <h4 className="font-medium text-white">Ready to Save</h4>
                  <p className="text-sm text-[#7d8590]">
                    {selectedRepos.size} repositories selected • Settings will be applied to your dashboard
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-[#30363d] text-[#7d8590] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  disabled={!isConnected}
                  className="bg-[#238636] hover:bg-[#2ea043]"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save & Apply Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[#7d8590]">
          <div>
            <strong className="text-white">1. Create GitHub Token:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
              <li>Click "Generate new token (classic)"</li>
              <li>Select scopes: <code className="bg-[#21262d] px-1 rounded">repo</code> and <code className="bg-[#21262d] px-1 rounded">user</code></li>
              <li>Copy the generated token</li>
            </ul>
          </div>
          <div>
            <strong className="text-white">2. Connect Account:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Paste your token in the field above</li>
              <li>Click "Connect" to verify the token</li>
              <li>Your repositories will load automatically</li>
            </ul>
          </div>
          <div>
            <strong className="text-white">3. Select Repositories:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Choose which repositories to show in your dashboard</li>
              <li>Only selected repositories will be available for editing</li>
              <li>Click "Save Settings" to apply changes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}