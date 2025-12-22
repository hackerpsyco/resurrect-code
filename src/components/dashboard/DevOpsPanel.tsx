import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings,
  Zap,
  GitBranch,
  Rocket,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  RefreshCw,
  ExternalLink,
  Key,
  Server,
  Database,
  Globe,
  Code,
  Terminal,
  Eye,
  Download,
  Upload,
  Workflow,
  Shield,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import { vercelService } from '@/services/vercelService';
import { deploymentMonitor, RealDeployment } from '@/services/deploymentMonitor';
import { automatedActionService, AutomatedAction } from '@/services/automatedActionService';
import { kestraService } from '@/services/kestraService';
import { coderabbitService } from '@/services/coderabbitService';
import { userStorageService } from '@/services/userStorageService';

interface DeploymentStatus {
  id: string;
  name: string;
  status: 'building' | 'ready' | 'error' | 'queued' | 'canceled';
  url?: string;
  createdAt: string;
  duration?: string;
  environment: 'production' | 'preview' | 'development';
  branch: string;
  commit: string;
}

interface VercelProject {
  id: string;
  name: string;
  framework: string;
  gitRepository: {
    type: 'github';
    repo: string;
  };
  targets: {
    production: {
      domain: string;
    };
  };
}

interface DevOpsPanelProps {
  onClose: () => void;
}

export function DevOpsPanel({ onClose }: DevOpsPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [vercelToken, setVercelToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [deployments, setDeployments] = useState<RealDeployment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoDeployEnabled, setAutoDeployEnabled] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [deploymentEnvironment, setDeploymentEnvironment] = useState<'production' | 'preview'>('preview');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [automatedActions, setAutomatedActions] = useState<AutomatedAction[]>([]);
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(true);
  const [kestraConnected, setKestraConnected] = useState(false);
  const [coderabbitConnected, setCoderabbitConnected] = useState(false);

  // Initialize deployment monitoring and load data
  useEffect(() => {
    const initializeMonitoring = async () => {
      // Load user-specific credentials and settings
      try {
        const credentials = await userStorageService.getCredentials();
        const settings = await userStorageService.getSettings();
        
        console.log('🔐 Loading user-specific data...');
        
        // Load Vercel token for this user
        if (credentials.vercelToken && !vercelService.isAuthenticated()) {
          console.log('🔑 Loading user Vercel token...');
          try {
            const user = await vercelService.verifyToken(credentials.vercelToken);
            vercelService.setToken(credentials.vercelToken);
            vercelService.cacheUser(user);
            
            setIsConnected(true);
            setVercelToken(credentials.vercelToken);
            
            console.log('✅ Connected to Vercel as:', user.username);
            toast.success(`🚀 Connected to Vercel as ${user.username}!`);
          } catch (error) {
            console.warn('Stored Vercel token invalid:', error);
            // Clear invalid token
            await userStorageService.storeCredentials({ ...credentials, vercelToken: undefined });
          }
        }
        
        // Load other credentials
        if (credentials.geminiApiKey) {
          setGeminiApiKey(credentials.geminiApiKey);
          deploymentMonitor.setGeminiApiKey(credentials.geminiApiKey);
        }
        
        // Load user settings
        if (settings.autoDeployEnabled !== undefined) {
          setAutoDeployEnabled(settings.autoDeployEnabled);
        }
        if (settings.isAutomationEnabled !== undefined) {
          setIsAutomationEnabled(settings.isAutomationEnabled);
          automatedActionService.setEnabled(settings.isAutomationEnabled);
        }
        if (settings.selectedProject) {
          setSelectedProject(settings.selectedProject);
        }
        if (settings.deploymentEnvironment) {
          setDeploymentEnvironment(settings.deploymentEnvironment);
        }
        
      } catch (error) {
        console.error('Failed to load user data:', error);
        
        // 🔒 SECURITY: Do NOT auto-connect with environment token for new users
        // Each user must provide their own Vercel token
        console.log('🔐 New user detected - no auto-connection for security');
        toast.info('🔐 Please connect your own Vercel account for security');
      }
      
      // Check if already connected to Vercel
      if (vercelService.isAuthenticated()) {
        setIsConnected(true);
        setVercelToken(vercelService.getToken() || '');
        
        // Load REAL projects
        try {
          console.log('📡 Loading REAL Vercel projects...');
          const projects = await vercelService.getProjects({ limit: 50 });
          console.log('✅ Loaded real projects:', projects.map(p => p.name));
          
          setProjects(projects.map(p => ({
            id: p.id,
            name: p.name,
            framework: p.framework || 'web',
            gitRepository: p.link ? {
              type: 'github' as const,
              repo: p.link.repo
            } : undefined,
            targets: {
              production: {
                domain: `${p.name}.vercel.app`
              }
            }
          })));
          
          toast.success(`📦 Loaded ${projects.length} real Vercel projects!`);
        } catch (error) {
          console.error('❌ Failed to load REAL Vercel projects:', error);
          toast.error('Failed to load real projects - check Vercel token');
        }
      }

      // Load deployments from monitor
      setDeployments(deploymentMonitor.getDeployments());
      setIsMonitoring(deploymentMonitor.isMonitoringActive());

      // Set up real-time deployment updates
      const handleDeploymentUpdate = (deployment: RealDeployment) => {
        setDeployments(prev => {
          const index = prev.findIndex(d => d.id === deployment.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = deployment;
            return updated;
          } else {
            return [deployment, ...prev];
          }
        });
      };

      // Set up automated action updates
      const handleActionUpdate = (action: AutomatedAction) => {
        setAutomatedActions(prev => {
          const index = prev.findIndex(a => a.id === action.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = action;
            return updated;
          } else {
            return [action, ...prev];
          }
        });
      };

      deploymentMonitor.addListener(handleDeploymentUpdate);
      automatedActionService.addListener(handleActionUpdate);

      // Load initial automated actions
      setAutomatedActions(automatedActionService.getActions());
      setIsAutomationEnabled(automatedActionService.isAutomationEnabled());

      // Check service connections
      const checkConnections = async () => {
        try {
          const kestraStatus = await kestraService.checkConnection();
          setKestraConnected(kestraStatus);
          
          const coderabbitStatus = coderabbitService.isConfigured();
          setCoderabbitConnected(coderabbitStatus);
          
          console.log('Service connections:', { kestra: kestraStatus, coderabbit: coderabbitStatus });
        } catch (error) {
          console.error('Failed to check service connections:', error);
        }
      };

      checkConnections();

      return () => {
        deploymentMonitor.removeListener(handleDeploymentUpdate);
        automatedActionService.removeListener(handleActionUpdate);
      };
    };

    initializeMonitoring();
  }, []);

  const connectVercel = async () => {
    if (!vercelToken.trim()) {
      toast.error('Please enter your Vercel token');
      return;
    }

    setIsLoading(true);
    try {
      // Use the existing vercelService
      const user = await vercelService.verifyToken(vercelToken);
      
      // Token is valid, set it and get projects
      vercelService.setToken(vercelToken);
      vercelService.cacheUser(user);
      
      const projects = await vercelService.getProjects({ limit: 50 });
      
      setIsConnected(true);
      setProjects(projects.map(p => ({
        id: p.id,
        name: p.name,
        framework: p.framework || 'web',
        gitRepository: p.link ? {
          type: 'github' as const,
          repo: p.link.repo
        } : undefined,
        targets: {
          production: {
            domain: `${p.name}.vercel.app`
          }
        }
      })));
      
      // 🔐 Save Vercel token for this user
      const currentCredentials = await userStorageService.getCredentials();
      await userStorageService.storeCredentials({
        ...currentCredentials,
        vercelToken: vercelToken
      });
      
      console.log('💾 Vercel token saved for user');
      toast.success(`✅ Connected to Vercel as ${user.username}! Token saved securely.`);
      
      // Trigger settings update event
      window.dispatchEvent(new CustomEvent('vercel-settings-updated'));
      
    } catch (error) {
      console.warn('Real Vercel API failed:', error);
      toast.error('❌ Invalid Vercel token or connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerDeployment = async () => {
    if (!selectedProject) {
      toast.error('Please select a project to deploy');
      return;
    }

    setIsLoading(true);
    try {
      // Use the real deployment monitor
      const deployment = await deploymentMonitor.triggerDeployment(selectedProject, {
        environment: deploymentEnvironment,
        branch: 'main',
        commit: 'manual deployment via DevOps panel'
      });
      
      // Start monitoring if not already active
      if (!deploymentMonitor.isMonitoringActive()) {
        deploymentMonitor.startMonitoring();
        setIsMonitoring(true);
      }
      
      toast.success(`🚀 Real deployment started: ${deployment.name}`);
      
    } catch (error) {
      console.error('Deployment failed:', error);
      toast.error(`Failed to trigger deployment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      deploymentMonitor.stopMonitoring();
      setIsMonitoring(false);
      toast.info('Deployment monitoring stopped');
    } else {
      deploymentMonitor.startMonitoring();
      setIsMonitoring(true);
      toast.success('🤖 Deployment monitoring started with Gemini AI');
    }
  };

  const configureGemini = async () => {
    if (!geminiApiKey.trim()) {
      toast.error('Please enter your Gemini API key');
      return;
    }

    try {
      deploymentMonitor.setGeminiApiKey(geminiApiKey);
      
      // 🔐 Save Gemini API key for this user
      const currentCredentials = await userStorageService.getCredentials();
      await userStorageService.storeCredentials({
        ...currentCredentials,
        geminiApiKey: geminiApiKey
      });
      
      console.log('💾 Gemini API key saved for user');
      toast.success('🤖 Gemini AI configured and saved securely!');
    } catch (error) {
      console.error('Failed to save Gemini API key:', error);
      toast.error('❌ Failed to save API key');
    }
  };

  const getStatusIcon = (status: DeploymentStatus['status']) => {
    switch (status) {
      case 'ready': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'building': return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'queued': return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: DeploymentStatus['status']) => {
    switch (status) {
      case 'ready': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ready</Badge>;
      case 'building': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Building</Badge>;
      case 'error': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
      case 'queued': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Queued</Badge>;
    }
  };

  const getEnvironmentBadge = (env: DeploymentStatus['environment']) => {
    switch (env) {
      case 'production': return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Production</Badge>;
      case 'preview': return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Preview</Badge>;
      case 'development': return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Development</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1e1e] flex flex-col">
      {/* Header */}
      <div className="h-14 bg-[#323233] border-b border-[#464647] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#28ca42]"></div>
          </div>
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-400" />
            <span className="text-lg font-semibold text-white">DevOps Automation Center</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {userStorageService.isAuthenticated() && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-[#2d2d30] rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-xs text-gray-300">
                  User: {userStorageService.getCurrentUserId()?.substring(0, 8)}...
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await userStorageService.clearUserData();
                  // Reset all states
                  setVercelToken('');
                  setIsConnected(false);
                  setProjects([]);
                  setGeminiApiKey('');
                  setSelectedProject('');
                  setAutoDeployEnabled(true);
                  setIsAutomationEnabled(true);
                  toast.info('🔐 User data cleared');
                }}
                className="text-gray-400 hover:text-white text-xs"
              >
                Clear Data
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-[#2d2d30] border border-[#464647]">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="deployments" className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              Deployments
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Active Deployments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {deployments.filter(d => d.status === 'building').length}
                  </div>
                  <p className="text-xs text-gray-500">Currently building</p>
                </CardContent>
              </Card>

              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    {deployments.length > 0 ? 
                      Math.round((deployments.filter(d => d.status === 'ready').length / deployments.length) * 100) : 0
                    }%
                  </div>
                  <p className="text-xs text-gray-500">Current session</p>
                </CardContent>
              </Card>

              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">AI Monitoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isMonitoring ? 'text-green-400' : 'text-gray-400'}`}>
                    {isMonitoring ? 'ON' : 'OFF'}
                  </div>
                  <p className="text-xs text-gray-500">
                    {deploymentMonitor.isGeminiConfigured() ? 'Gemini AI Ready' : 'Configure Gemini AI'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Automated Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-400">
                    {automatedActions.filter(a => a.status === 'completed').length}
                  </div>
                  <p className="text-xs text-gray-500">
                    {automatedActions.filter(a => a.type === 'create_pr').length} PRs created
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Connection Status */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  Platform Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">▲</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Vercel</h4>
                      <p className="text-sm text-gray-400">
                        {isConnected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <Badge className={isConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                      <GitBranch className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">GitHub</h4>
                      <p className="text-sm text-gray-400">Repository integration</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">Connected</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Workflow className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Kestra</h4>
                      <p className="text-sm text-gray-400">Workflow orchestration</p>
                    </div>
                  </div>
                  <Badge className={kestraConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                    {kestraConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Code className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">CodeRabbit</h4>
                      <p className="text-sm text-gray-400">AI code analysis</p>
                    </div>
                  </div>
                  <Badge className={coderabbitConnected ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                    {coderabbitConnected ? 'Configured' : 'GitHub App'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deployments Tab */}
          <TabsContent value="deployments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Real Vercel Deployments</h2>
              <div className="flex items-center gap-2">
                <Select value={selectedProject} onValueChange={async (projectId) => {
                  setSelectedProject(projectId);
                  // Find the project name for the selected ID
                  const project = projects.find(p => p.id === projectId);
                  if (project) {
                    console.log(`✅ Selected project: ${project.name} (ID: ${projectId})`);
                    toast.info(`Selected project: ${project.name}`);
                    
                    // Save selected project for this user
                    const currentSettings = await userStorageService.getSettings();
                    await userStorageService.storeSettings({
                      ...currentSettings,
                      selectedProject: projectId
                    });
                  }
                }}>
                  <SelectTrigger className="w-48 bg-[#2d2d30] border-[#464647]">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={deploymentEnvironment} onValueChange={async (value: 'production' | 'preview') => {
                  setDeploymentEnvironment(value);
                  // Save deployment environment for this user
                  const currentSettings = await userStorageService.getSettings();
                  await userStorageService.storeSettings({
                    ...currentSettings,
                    deploymentEnvironment: value
                  });
                }}>
                  <SelectTrigger className="w-32 bg-[#2d2d30] border-[#464647]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preview">Preview</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button 
                    onClick={async () => {
                      if (!selectedProject) {
                        toast.error('Please select a project first');
                        return;
                      }
                      
                      // Test real Vercel API connection
                      try {
                        const project = await vercelService.getProject(selectedProject);
                        console.log('✅ Real project loaded:', project);
                        toast.success(`✅ Real project: ${project.name}`);
                        
                        // Now trigger real deployment
                        triggerDeployment();
                      } catch (error) {
                        console.error('❌ Failed to load real project:', error);
                        toast.error(`Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }}
                    disabled={isLoading || !isConnected || !selectedProject}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                    {isLoading ? 'Deploying...' : 'Deploy Real'}
                  </Button>

                  <Button 
                    onClick={async () => {
                      if (!selectedProject) {
                        toast.error('Please select a project first');
                        return;
                      }
                      
                      // Trigger a deployment that will fail to test automated actions
                      setIsLoading(true);
                      try {
                        // Get the selected project details
                        const selectedProjectData = projects.find(p => p.id === selectedProject);
                        if (!selectedProjectData) {
                          throw new Error('Selected project not found');
                        }
                        
                        console.log(`🚀 Triggering deployment for project: ${selectedProjectData.name} (${selectedProject})`);
                        
                        const deployment = await deploymentMonitor.triggerDeployment(selectedProject, {
                          environment: deploymentEnvironment,
                          branch: 'main',
                          commit: `test automated error fixing for ${selectedProjectData.name}`
                        });
                        
                        // Force an error after 5 seconds to test automation
                        setTimeout(() => {
                          deployment.status = 'error';
                          const testError = {
                            id: `err_test_${Date.now()}`,
                            deploymentId: deployment.id,
                            error: 'Module not found: Error: Can\'t resolve \'./components/TestComponent\' in \'/src\'',
                            logs: deployment.logs.filter(l => l.level === 'error'),
                            timestamp: new Date().toISOString(),
                            status: 'detected' as const
                          };
                          
                          deployment.errors.push(testError);
                          deploymentMonitor['notifyListeners'](deployment);
                          
                          // Trigger automated actions
                          automatedActionService.handleDeploymentFailure(deployment, testError);
                          
                          toast.info('🧪 Test error triggered - watch automated actions!');
                        }, 5000);
                        
                        toast.success('🧪 Test deployment started - will fail in 5 seconds to demo automation');
                        
                      } catch (error) {
                        console.error('Test deployment failed:', error);
                        toast.error('Failed to start test deployment');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading || !isConnected || !selectedProject || !isAutomationEnabled}
                    variant="outline"
                    className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Test Automation
                  </Button>
                </div>
              </div>
            </div>

            {!isConnected && (
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <div>
                      <h4 className="font-medium text-white">Connect Vercel Account</h4>
                      <p className="text-sm text-gray-400">
                        Go to Settings tab to connect your Vercel account for real deployments
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {deployments.map(deployment => (
                <Card key={deployment.id} className="bg-[#161b22] border-[#30363d]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(deployment.status)}
                        <div>
                          <h4 className="font-medium text-white">{deployment.name}</h4>
                          <p className="text-sm text-gray-400">
                            {deployment.branch} • {deployment.commit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getEnvironmentBadge(deployment.environment)}
                        {getStatusBadge(deployment.status)}
                        {deployment.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(deployment.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(deployment.createdAt).toLocaleString()}</span>
                      {deployment.duration && <span>Duration: {deployment.duration}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Real-time Deployment Logs</h2>
              <div className="flex items-center gap-2">
                <Select value={selectedDeployment || ''} onValueChange={setSelectedDeployment}>
                  <SelectTrigger className="w-64 bg-[#2d2d30] border-[#464647]">
                    <SelectValue placeholder="Select deployment" />
                  </SelectTrigger>
                  <SelectContent>
                    {deployments.map(deployment => (
                      <SelectItem key={deployment.id} value={deployment.id}>
                        {deployment.name} - {deployment.environment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedDeployment) {
                      setDeployments(prev => [...prev]); // Trigger refresh
                    }
                  }}
                  className="border-[#464647]"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {selectedDeployment ? (
              <div className="space-y-4">
                {/* Deployment Info */}
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardContent className="p-4">
                    {(() => {
                      const deployment = deployments.find(d => d.id === selectedDeployment);
                      if (!deployment) return null;
                      
                      return (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(deployment.status)}
                            <div>
                              <h4 className="font-medium text-white">{deployment.name}</h4>
                              <p className="text-sm text-gray-400">
                                {deployment.branch} • {deployment.commit}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getEnvironmentBadge(deployment.environment)}
                            {getStatusBadge(deployment.status)}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Build Details */}
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="w-5 h-5 text-blue-400" />
                      Build Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const deployment = deployments.find(d => d.id === selectedDeployment);
                      if (!deployment) return null;
                      
                      return (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium text-white mb-2">Deployment Info</h4>
                            <div className="space-y-1 text-gray-300">
                              <div>Status: <span className={
                                deployment.status === 'ready' ? 'text-green-400' :
                                deployment.status === 'error' ? 'text-red-400' :
                                deployment.status === 'building' ? 'text-blue-400' :
                                'text-yellow-400'
                              }>{deployment.status.toUpperCase()}</span></div>
                              <div>Environment: <span className="text-purple-400">{deployment.environment}</span></div>
                              <div>Duration: <span className="text-gray-400">{deployment.duration || 'In progress...'}</span></div>
                              {deployment.size && <div>Size: <span className="text-gray-400">{deployment.size}</span></div>}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-white mb-2">GitHub Info</h4>
                            <div className="space-y-1 text-gray-300">
                              <div>Branch: <span className="text-green-400">{deployment.branch}</span></div>
                              <div>Commit: <span className="text-gray-400 font-mono text-xs">{deployment.commit}</span></div>
                              <div>Started: <span className="text-gray-400">{new Date(deployment.createdAt).toLocaleString()}</span></div>
                              {deployment.url && (
                                <div>
                                  URL: <a 
                                    href={`https://${deployment.url}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline"
                                  >
                                    {deployment.url}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Real-time Logs */}
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-green-400" />
                      Real Build Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-[#0d1117] rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
                      {(() => {
                        const logs = deploymentMonitor.getDeploymentLogs(selectedDeployment);
                        if (logs.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <Terminal className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                              <p className="text-gray-500">Fetching real build logs from Vercel...</p>
                              <p className="text-xs text-gray-600 mt-1">This may take a few moments</p>
                            </div>
                          );
                        }
                        
                        return logs.map(log => (
                          <div key={log.id} className="mb-1 flex gap-2">
                            <span className="text-gray-500 text-xs min-w-[60px]">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className={`text-xs px-1 rounded min-w-[50px] text-center ${
                              log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                              log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400' :
                              log.source === 'ai' ? 'bg-purple-500/20 text-purple-400' :
                              log.source === 'git' ? 'bg-green-500/20 text-green-400' :
                              log.source === 'npm' ? 'bg-orange-500/20 text-orange-400' :
                              log.source === 'deploy' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {log.source}
                            </span>
                            <span className={`flex-1 ${
                              log.level === 'error' ? 'text-red-400' :
                              log.level === 'warn' ? 'text-yellow-400' :
                              log.source === 'git' ? 'text-green-300' :
                              'text-gray-300'
                            }`}>
                              {log.message}
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Error Analysis */}
                {(() => {
                  const errors = deploymentMonitor.getDeploymentErrors(selectedDeployment);
                  if (errors.length === 0) return null;
                  
                  return (
                    <Card className="bg-[#161b22] border-[#30363d]">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-purple-400" />
                          Gemini AI Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {errors.map(error => (
                          <div key={error.id} className="border border-[#30363d] rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-red-400">Error Detected</h4>
                              <Badge className={
                                error.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                                error.status === 'fixing' ? 'bg-blue-500/20 text-blue-400' :
                                error.status === 'analyzing' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }>
                                {error.status}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-300 mb-3">{error.error}</p>
                            
                            {error.aiAnalysis && (
                              <div className="bg-[#0d1117] rounded-lg p-3">
                                <h5 className="text-sm font-medium text-purple-400 mb-2">🤖 AI Analysis:</h5>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                  {error.aiAnalysis.substring(0, 500)}
                                  {error.aiAnalysis.length > 500 && '...'}
                                </p>
                              </div>
                            )}
                            
                            {error.suggestedFix && (
                              <div className="bg-[#0d1117] rounded-lg p-3 mt-3">
                                <h5 className="text-sm font-medium text-green-400 mb-2">💡 Suggested Fix:</h5>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                  {error.suggestedFix.substring(0, 300)}
                                  {error.suggestedFix.length > 300 && '...'}
                                </p>
                                
                                {error.fixApplied && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <span className="text-sm text-green-400">Fix applied automatically</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-12">
                <Terminal className="w-12 h-12 text-[#7d8590] mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Deployment</h3>
                <p className="text-[#7d8590]">Choose a deployment to view real-time logs and AI analysis</p>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {userStorageService.isAuthenticated() && (
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-400" />
                    <div>
                      <h4 className="font-medium text-white">User-Specific Storage</h4>
                      <p className="text-sm text-gray-400">
                        Your credentials and settings are stored securely and only visible to you.
                        Other users cannot see your Vercel projects or API keys.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-400" />
                  Vercel Integration
                </CardTitle>
                <CardDescription>
                  Connect your Vercel account to enable automated deployments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Vercel Token</label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Enter your Vercel token"
                      value={vercelToken}
                      onChange={(e) => setVercelToken(e.target.value)}
                      className="bg-[#2d2d30] border-[#464647] text-white"
                    />
                    <Button 
                      onClick={connectVercel}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Connect'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Get your token from <a href="https://vercel.com/account/tokens" target="_blank" className="text-blue-400 hover:underline">Vercel Dashboard</a>
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Auto Deploy</label>
                    <p className="text-xs text-gray-500">Automatically deploy on git push</p>
                  </div>
                  <Switch 
                    checked={autoDeployEnabled}
                    onCheckedChange={async (enabled) => {
                      setAutoDeployEnabled(enabled);
                      // Save setting for this user
                      const currentSettings = await userStorageService.getSettings();
                      await userStorageService.storeSettings({
                        ...currentSettings,
                        autoDeployEnabled: enabled
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  Gemini AI Integration
                </CardTitle>
                <CardDescription>
                  Configure Gemini AI for automatic error detection and fixing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Gemini API Key</label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Enter your Gemini API key"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      className="bg-[#2d2d30] border-[#464647] text-white"
                    />
                    <Button 
                      onClick={configureGemini}
                      disabled={!geminiApiKey.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Configure
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-blue-400 hover:underline">Google AI Studio</a>
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">AI Monitoring</label>
                    <p className="text-xs text-gray-500">Monitor deployments and auto-fix errors</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={isMonitoring ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                      {isMonitoring ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleMonitoring}
                      className={isMonitoring ? "border-red-500/30 text-red-400" : "border-green-500/30 text-green-400"}
                    >
                      {isMonitoring ? 'Stop' : 'Start'}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Automated Actions</label>
                    <p className="text-xs text-gray-500">Automatically create PRs and fix build errors</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={isAutomationEnabled ? "bg-purple-500/20 text-purple-400" : "bg-gray-500/20 text-gray-400"}>
                      {isAutomationEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Switch 
                      checked={isAutomationEnabled}
                      onCheckedChange={async (enabled) => {
                        setIsAutomationEnabled(enabled);
                        automatedActionService.setEnabled(enabled);
                        // Save setting for this user
                        const currentSettings = await userStorageService.getSettings();
                        await userStorageService.storeSettings({
                          ...currentSettings,
                          isAutomationEnabled: enabled
                        });
                      }}
                    />
                  </div>
                </div>

                {deploymentMonitor.isGeminiConfigured() && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400 font-medium">Gemini AI Ready</span>
                    </div>
                    <p className="text-xs text-green-300 mt-1">
                      Automatic error detection and fixing is enabled
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-purple-400" />
                  Kestra Integration
                </CardTitle>
                <CardDescription>
                  Configure Kestra workflow orchestration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Kestra URL</label>
                  <Input
                    placeholder="http://localhost:8080"
                    defaultValue="http://localhost:8080"
                    className="bg-[#2d2d30] border-[#464647] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">API Token (Optional)</label>
                  <Input
                    type="password"
                    placeholder="Enter Kestra API token"
                    className="bg-[#2d2d30] border-[#464647] text-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Connection Status</label>
                    <p className="text-xs text-gray-500">
                      {kestraConnected 
                        ? 'Connected to Kestra - Webhook ready for automation' 
                        : 'Kestra not running - Start with: docker run -p 8080:8080 kestra/kestra:latest server local'
                      }
                    </p>
                  </div>
                  <Badge className={kestraConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                    {kestraConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>

                {!kestraConnected && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-yellow-400 font-medium">Kestra Setup Required</span>
                    </div>
                    <div className="space-y-2 text-xs text-yellow-300">
                      <p>1. Start Kestra server:</p>
                      <code className="bg-[#0d1117] p-2 rounded block text-green-400">
                        docker run -p 8080:8080 kestra/kestra:latest server local
                      </code>
                      <p>2. Deploy workflow to Kestra UI at <a href="http://localhost:8080" target="_blank" className="text-blue-400 hover:underline">http://localhost:8080</a></p>
                      <p>3. Upload: <code className="text-orange-400">kestra/workflows/resurrect-agent.yml</code></p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const connected = await kestraService.checkConnection();
                      setKestraConnected(connected);
                      if (connected) {
                        toast.success('✅ Kestra connected successfully!');
                      } else {
                        toast.error('❌ Kestra connection failed - check if server is running');
                      }
                    } catch (error) {
                      toast.error('❌ Connection test failed');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  variant="outline" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Test Connection
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-orange-400" />
                  CodeRabbit Integration
                </CardTitle>
                <CardDescription>
                  Configure CodeRabbit AI code analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-white">GitHub App Installation</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    CodeRabbit is configured via .coderabbit.yaml and GitHub App installation.
                    No additional API keys required.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">API Key (Optional)</label>
                  <Input
                    type="password"
                    placeholder="Enter CodeRabbit API key for advanced features"
                    className="bg-[#2d2d30] border-[#464647] text-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Integration Status</label>
                    <p className="text-xs text-gray-500">
                      {coderabbitConnected ? 'API configured' : 'Using GitHub App integration'}
                    </p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">
                    Active
                  </Badge>
                </div>

                <Button 
                  onClick={() => {
                    window.open('https://github.com/apps/coderabbitai', '_blank');
                  }}
                  variant="outline" 
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Install GitHub App
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Security & Environment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Environment Variables</label>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Environment Variables
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Build Settings</label>
                  <Button variant="outline" className="w-full justify-start">
                    <Code className="w-4 h-4 mr-2" />
                    Configure Build Commands
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            {/* Automated Action Controls */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  ResurrectCI Automated Actions
                </CardTitle>
                <CardDescription>
                  Autonomous error fixing with Kestra workflows, CodeRabbit analysis, and GitHub PR automation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isAutomationEnabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <div>
                      <h4 className="font-medium text-white">Automated Error Fixing</h4>
                      <p className="text-sm text-gray-400">
                        {isAutomationEnabled 
                          ? 'System will automatically create PRs and fix build errors' 
                          : 'Automated actions are disabled - errors will only be monitored'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={isAutomationEnabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {isAutomationEnabled ? 'ACTIVE' : 'DISABLED'}
                    </Badge>
                    <Switch 
                      checked={isAutomationEnabled}
                      onCheckedChange={(enabled) => {
                        setIsAutomationEnabled(enabled);
                        automatedActionService.setEnabled(enabled);
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
                    <div className="flex items-center gap-2 mb-2">
                      <Workflow className="w-4 h-4 text-blue-400" />
                      <h5 className="font-medium text-white text-sm">Kestra Workflows</h5>
                    </div>
                    <p className="text-xs text-gray-400">
                      ResurrectCI workflow orchestrates error analysis and fix generation
                    </p>
                  </div>

                  <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
                    <div className="flex items-center gap-2 mb-2">
                      <Code className="w-4 h-4 text-green-400" />
                      <h5 className="font-medium text-white text-sm">CodeRabbit Analysis</h5>
                    </div>
                    <p className="text-xs text-gray-400">
                      Automated code quality analysis and best practice recommendations
                    </p>
                  </div>

                  <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="w-4 h-4 text-purple-400" />
                      <h5 className="font-medium text-white text-sm">GitHub Integration</h5>
                    </div>
                    <p className="text-xs text-gray-400">
                      Automatic PR creation, testing, and merge when fixes are ready
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Automated Actions */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Recent Automated Actions
                </CardTitle>
                <CardDescription>
                  Real-time log of autonomous error fixing actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {automatedActions.length === 0 ? (
                    <div className="text-center py-8">
                      <Workflow className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-500">No automated actions yet</p>
                      <p className="text-xs text-gray-600 mt-1">Actions will appear here when build errors are detected</p>
                    </div>
                  ) : (
                    automatedActions.slice(0, 10).map(action => (
                      <div key={action.id} className="flex items-center gap-3 p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
                        <div className={`w-2 h-2 rounded-full ${
                          action.status === 'completed' ? 'bg-green-400' :
                          action.status === 'in_progress' ? 'bg-blue-400 animate-pulse' :
                          action.status === 'failed' ? 'bg-red-400' :
                          'bg-yellow-400'
                        }`}></div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-1 rounded ${
                              action.type === 'create_pr' ? 'bg-purple-500/20 text-purple-400' :
                              action.type === 'trigger_workflow' ? 'bg-blue-500/20 text-blue-400' :
                              action.type === 'analyze_code' ? 'bg-green-500/20 text-green-400' :
                              action.type === 'fix_issue' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {action.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(action.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-white">{action.description}</p>
                          {action.result && (
                            <p className="text-xs text-gray-400 mt-1">{action.result}</p>
                          )}
                        </div>

                        <Badge className={
                          action.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          action.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          action.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }>
                          {action.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CI/CD Workflows */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-purple-400" />
                  CI/CD Workflows
                </CardTitle>
                <CardDescription>
                  Automated deployment pipelines and workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">ResurrectCI Workflow</h4>
                    <Badge className="bg-purple-500/20 text-purple-400">Kestra</Badge>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    Autonomous error analysis → Fix generation → PR creation → Auto-merge
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Zap className="w-3 h-3" />
                    <span>Error Detection</span>
                    <span>→</span>
                    <span>AI Analysis</span>
                    <span>→</span>
                    <span>Auto Fix</span>
                    <span>→</span>
                    <span>PR & Deploy</span>
                  </div>
                </div>

                <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Production Deploy</h4>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    Automatically deploy to production on main branch push
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <GitBranch className="w-3 h-3" />
                    <span>main branch</span>
                    <span>•</span>
                    <span>Build + Test + Deploy</span>
                  </div>
                </div>

                <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Preview Deploy</h4>
                    <Badge className="bg-blue-500/20 text-blue-400">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    Create preview deployments for pull requests
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <GitBranch className="w-3 h-3" />
                    <span>feature branches</span>
                    <span>•</span>
                    <span>Build + Preview</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader>
                  <CardTitle className="text-sm">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Build Time</span>
                      <span className="text-sm text-white">2m 18s avg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Success Rate</span>
                      <span className="text-sm text-green-400">94.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Deployments Today</span>
                      <span className="text-sm text-white">12</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader>
                  <CardTitle className="text-sm">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Vercel Status</span>
                      <Badge className="bg-green-500/20 text-green-400">Operational</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">GitHub API</span>
                      <Badge className="bg-green-500/20 text-green-400">Operational</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Build Queue</span>
                      <Badge className="bg-blue-500/20 text-blue-400">2 pending</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}