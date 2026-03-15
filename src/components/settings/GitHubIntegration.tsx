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
// import { supabase } from '@/integrations/supabase/client'
import { supabase } from '@/lib/mockSupabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://resurrect-code-j5om.vercel.app';

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
      try {
        const token = localStorage.getItem('token');
        if (token) {
          setToken(token);
          await checkConnection(token);
        }
      } catch (error) {
        console.error('Failed to initialize from storage:', error);
      }
    };

    initializeFromStorage();
  }, []);

  const checkConnection = async (tokenToCheck: string) => {
    if (!tokenToCheck.trim()) return;
    
    setIsConnecting(true);
    try {
      const response = await fetch(`${API_URL}/api/user/me`, {
        headers: {
          'Authorization': `Bearer ${tokenToCheck}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        // Backend user schema might use 'username' and 'avatar_url'
        setUser({
          login: userData.username,
          avatar_url: userData.avatar_url
        } as any);
        setIsConnected(true);
        await loadRepositories();
      } else {
        throw new Error(`Backend error: ${response.status}`);
      }
    } catch (error) {
      console.error('Connection verification failed:', error);
      setIsConnected(false);
      setUser(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const loadRepositories = async () => {
    const jwtToken = localStorage.getItem('token') || token;
    if (!jwtToken) return;

    setIsLoadingRepos(true);
    try {
      const response = await fetch(`${API_URL}/api/repos`, {
        headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const repos = await response.json();
        setRepositories(repos);
      } else {
        throw new Error(`Failed to load repositories: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load repositories:', error);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleConnect = () => {
    window.location.href = `${API_URL}/api/auth/github?origin=${encodeURIComponent(window.location.origin)}`;
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

      // Save to localStorage locally for dashboard to read
      localStorage.setItem('github_selected_repos', JSON.stringify(repoArray));
      localStorage.setItem('github_user', JSON.stringify(user));
      
      if (repoArray.length === 0) {
        toast.success("✅ Connected to GitHub. Select repositories as setting triggers later.");
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
            {!isConnected ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="bg-[#238636] hover:bg-[#2ea043] w-full max-w-sm"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4 mr-2" />
                      Connect with GitHub
                    </>
                  )}
                </Button>
                <p className="text-xs text-[#7d8590] text-center">
                  This will redirect you to GitHub to authorize the application and connect your account securely.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-sm text-[#7d8590]">
                  Logged in with GitHub. Select repositories below to monitor them.
                </div>
                {/* Disconnect button handled below */}
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
                  onClick={() => loadRepositories()}
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
                  onClick={() => loadRepositories()}
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
            <strong className="text-white">1. Connect Account:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Click "Connect with GitHub"</li>
              <li>Authorize the application on GitHub</li>
              <li>Your account will be connected securely</li>
            </ul>
          </div>
          <div>
            <strong className="text-white">2. Select Repositories:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Choose which repositories to show in your dashboard</li>
              <li>Click "Save & Apply Settings" to finish</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}