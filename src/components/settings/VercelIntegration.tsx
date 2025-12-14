import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Globe, ExternalLink, Key, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { vercelService } from '@/services/vercelService';

interface VercelIntegrationProps {
  onClose?: () => void;
}

export function VercelIntegration({ onClose }: VercelIntegrationProps) {
  const [token, setToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    // Check if already connected
    if (vercelService.isAuthenticated()) {
      setIsConnected(true);
      setToken(vercelService.getToken() || '');
      
      const cachedUser = vercelService.getCachedUser();
      if (cachedUser) {
        setUser(cachedUser);
      }
      
      // Load projects
      loadProjects();
    }
  }, []);

  const loadProjects = async () => {
    try {
      const projectList = await vercelService.getProjects({ limit: 10 });
      setProjects(projectList);
    } catch (error) {
      console.error('Failed to load projects:', error);
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
    setToken('');
    toast.success('Disconnected from Vercel');
    
    // Notify other components
    window.dispatchEvent(new CustomEvent('vercel-settings-updated'));
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

      {/* Projects Overview */}
      {isConnected && projects.length > 0 && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader>
            <CardTitle className="text-white">Your Projects</CardTitle>
            <CardDescription>
              {projects.length} project{projects.length !== 1 ? 's' : ''} found in your Vercel account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {projects.slice(0, 5).map((project) => (
                <div 
                  key={project.id}
                  className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-white">{project.name}</h4>
                    <p className="text-sm text-[#7d8590]">
                      {project.framework || 'Web App'} • Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
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
              {projects.length > 5 && (
                <p className="text-sm text-[#7d8590] text-center py-2">
                  And {projects.length - 5} more projects...
                </p>
              )}
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