import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Globe, ExternalLink, Key, CheckCircle, AlertCircle, Loader2, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { vercelService } from '@/services/vercelService';

interface VercelIntegrationProps {
  onClose?: () => void;
}

export function VercelIntegration({ onClose }: VercelIntegrationProps) {
  const [token, setToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check if already connected
    if (vercelService.isAuthenticated()) {
      setIsConnected(true);
      setToken(vercelService.getToken() || '');
      
      const cachedUser = vercelService.getCachedUser();
      if (cachedUser) {
        setUser(cachedUser);
      }
      
      // Load saved project selections
      const savedProjects = localStorage.getItem('vercel_selected_projects');
      if (savedProjects) {
        setSelectedProjects(new Set(JSON.parse(savedProjects)));
      }
      
      // Load projects
      loadProjects();
    }
  }, []);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const projectList = await vercelService.getProjects({ limit: 50 });
      setProjects(projectList);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleConnect = async () => {
    if (!token.trim()) {
      toast.error('Please enter your Vercel token');
      return;
    }

    setIsLoading(true);
    try {
      const userData = await vercelService.verifyToken(token);
      
      vercelService.setToken(token);
      vercelService.cacheUser(userData);
      
      setIsConnected(true);
      setUser(userData);
      
      await loadProjects();
      
      toast.success(`✅ Connected to Vercel as ${userData.username}!`);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('vercel-settings-updated'));
      
    } catch (error) {
      console.error('Vercel connection failed:', error);
      toast.error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    vercelService.clearToken();
    setIsConnected(false);
    setUser(null);
    setProjects([]);
    setSelectedProjects(new Set());
    setToken('');
    localStorage.removeItem('vercel_selected_projects');
    toast.success('Disconnected from Vercel');
    
    // Notify other components
    window.dispatchEvent(new CustomEvent('vercel-settings-updated'));
  };

  const toggleProject = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const selectAllProjects = () => {
    setSelectedProjects(new Set(projects.map(p => p.id)));
  };

  const clearAllProjects = () => {
    setSelectedProjects(new Set());
  };

  const handleSaveSettings = async () => {
    if (!isConnected) {
      toast.error("Please connect to Vercel first");
      return;
    }

    try {
      const projectArray = Array.from(selectedProjects);
      localStorage.setItem('vercel_selected_projects', JSON.stringify(projectArray));
      
      if (projectArray.length === 0) {
        toast.success("✅ Vercel token saved. Select projects any time to show them in your dashboard.");
      } else {
        toast.success(`✅ Settings saved! ${projectArray.length} projects selected.`);
      }
      
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('vercel-settings-updated'));
      
      if (onClose && projectArray.length > 0) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to save Vercel settings:', error);
      toast.error("Failed to save settings. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Vercel Integration</h2>
          <p className="text-[#7d8590] mt-1">
            Connect your Vercel account for seamless deployments
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
            <Globe className="w-5 h-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">Connected to Vercel</p>
                  {user && (
                    <p className="text-[#7d8590] text-sm">
                      Logged in as {user.username} ({user.email})
                    </p>
                  )}
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-auto">
                  Connected
                </Badge>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-[#7d8590]" />
                <div>
                  <p className="text-white font-medium">Not Connected</p>
                  <p className="text-[#7d8590] text-sm">
                    Enter your Vercel token to connect
                  </p>
                </div>
                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 ml-auto">
                  Disconnected
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Token Configuration */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Key className="w-5 h-5" />
            API Token
          </CardTitle>
          <CardDescription>
            Get your token from{' '}
            <a 
              href="https://vercel.com/account/tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Vercel Dashboard → Settings → Tokens
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Vercel Token</label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter your Vercel token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isConnected}
                className="bg-[#0d1117] border-[#30363d] text-white"
              />
              {isConnected ? (
                <Button 
                  onClick={handleDisconnect}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  Disconnect
                </Button>
              ) : (
                <Button 
                  onClick={handleConnect}
                  disabled={isLoading || !token.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Connect'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Selection */}
      {isConnected && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Project Selection
                <Badge variant="outline" className="text-[#7d8590]">
                  {selectedProjects.size} selected
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadProjects}
                  disabled={isLoadingProjects}
                  className="text-[#7d8590] hover:text-white"
                >
                  {isLoadingProjects ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllProjects}
                  className="text-[#7d8590] hover:text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllProjects}
                  className="text-[#7d8590] hover:text-white"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Select projects to show in your dashboard. Only selected projects will be available for editing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProjects ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#7d8590]" />
                <span className="ml-2 text-[#7d8590]">Loading projects...</span>
              </div>
            ) : projects.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-[#21262d] border border-[#30363d] rounded-lg hover:border-[#7d8590] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={selectedProjects.has(project.id)}
                        onCheckedChange={() => toggleProject(project.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{project.name}</span>
                          {project.framework && (
                            <Badge variant="outline" className="text-[#7d8590]">
                              {project.framework}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-[#7d8590] mt-1">
                          Updated {new Date(project.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://vercel.com/${user?.username}/${project.name}`, '_blank')}
                      className="text-[#7d8590] hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#7d8590]">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No projects found</p>
                <Button
                  variant="ghost"
                  onClick={loadProjects}
                  className="mt-2 text-blue-400 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Projects
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
                    {selectedProjects.size} projects selected • Settings will be applied to your dashboard
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save & Apply Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="text-white">Available Features</CardTitle>
          <CardDescription>
            What you can do with Vercel integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-white">✅ Available Now</h4>
              <ul className="text-sm text-[#7d8590] space-y-1">
                <li>• Connect your Vercel account</li>
                <li>• View your projects and deployments</li>
                <li>• Access deployment URLs</li>
                <li>• Monitor deployment status</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-white">🚧 Coming Soon</h4>
              <ul className="text-sm text-[#7d8590] space-y-1">
                <li>• Deploy directly from IDE</li>
                <li>• Environment variable management</li>
                <li>• Build logs and analytics</li>
                <li>• Automatic deployments</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}