import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  GitBranch,
  Rocket,
  Activity,
  Monitor,
  Workflow,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useVercel } from '@/hooks/useVercel';
import { AutomationTab } from './AutomationTab';
import { AutomationStatusOverview } from './AutomationStatusOverview';

interface DevOpsPanelProps {
  onClose: () => void;
}

export function DevOpsPanel({ onClose }: DevOpsPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { isLoading, projects, deployments, buildLogs, isInitialized, fetchProjects, fetchDeployments, fetchBuildLogs } = useVercel();

  // Debug: Log token status
  useEffect(() => {
    const token = localStorage.getItem('vercel_token');
    console.log('🔍 DevOps Panel Debug:');
    console.log('  Token exists:', !!token);
    console.log('  Token value:', token ? `${token.substring(0, 10)}...` : 'NONE');
    console.log('  Projects:', projects.length);
    console.log('  Deployments:', deployments.length);
    console.log('  isInitialized:', isInitialized);
  }, [projects, deployments, isInitialized]);

  // Fetch projects on mount (only if initialized)
  useEffect(() => {
    if (isInitialized) {
      console.log('✅ Hook initialized, fetching projects...');
      fetchProjects();
    } else {
      console.log('⏳ Waiting for hook initialization...');
    }
  }, [isInitialized, fetchProjects]);

  // Listen for Vercel settings updates
  useEffect(() => {
    const handleVercelUpdate = () => {
      console.log('🔄 Vercel settings updated, refreshing projects...');
      fetchProjects();
    };

    window.addEventListener('vercel-settings-updated', handleVercelUpdate);
    return () => window.removeEventListener('vercel-settings-updated', handleVercelUpdate);
  }, [fetchProjects]);

  // Fetch deployments when project is selected
  useEffect(() => {
    if (selectedProject) {
      fetchDeployments(selectedProject);
    }
  }, [selectedProject, fetchDeployments]);

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'READY':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ERROR':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'BUILDING':
      case 'INITIALIZING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'READY':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'ERROR':
        return <AlertCircle className="w-4 h-4" />;
      case 'BUILDING':
      case 'INITIALIZING':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1117] flex flex-col animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="h-14 bg-gradient-to-r from-[#0d1117] to-[#161b22] border-b border-[#238636]/20 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-[#238636] to-[#2ea043] rounded-lg flex items-center justify-center shadow-lg shadow-[#238636]/20 flex-shrink-0">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-white truncate">DevOps Center</h1>
            <p className="text-xs text-[#7d8590] hidden sm:block">Manage deployments & automation</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-[#7d8590] hover:text-[#238636] hover:bg-[#238636]/10 h-8 w-8 p-0 flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Project Filter Bar */}
      <div className="h-auto bg-[#161b22] border-b border-[#238636]/20 px-4 sm:px-6 py-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-xs sm:text-sm font-medium text-[#7d8590]">Select Project:</label>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value || null)}
              className="flex-1 sm:flex-none px-3 py-2 bg-[#0d1117] border border-[#238636]/20 rounded-lg text-xs sm:text-sm text-white hover:border-[#238636]/40 focus:border-[#238636] focus:outline-none transition-colors"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.framework})
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchProjects()}
              disabled={isLoading}
              className="border-[#238636]/20 hover:border-[#238636]/40 text-xs flex-shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          {/* Tab Navigation - Horizontal Scroll on Mobile */}
          <div className="border-b border-[#238636]/20 bg-[#161b22] px-4 sm:px-6 pt-2 sm:pt-4 flex-shrink-0 overflow-x-auto">
            <TabsList className="grid grid-cols-5 gap-1 sm:gap-2 bg-transparent border-b border-[#238636]/20 w-full justify-start min-w-max">
              <TabsTrigger 
                value="overview"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#238636] data-[state=active]:text-[#238636] text-[#7d8590] hover:text-[#238636] transition-colors rounded-none border-b-2 border-transparent text-xs sm:text-sm whitespace-nowrap"
              >
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="deployments"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#238636] data-[state=active]:text-[#238636] text-[#7d8590] hover:text-[#238636] transition-colors rounded-none border-b-2 border-transparent text-xs sm:text-sm whitespace-nowrap"
              >
                <Rocket className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Deployments</span>
              </TabsTrigger>
              <TabsTrigger 
                value="automation"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#238636] data-[state=active]:text-[#238636] text-[#7d8590] hover:text-[#238636] transition-colors rounded-none border-b-2 border-transparent text-xs sm:text-sm whitespace-nowrap"
              >
                <Workflow className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Automation</span>
              </TabsTrigger>
              <TabsTrigger 
                value="monitoring"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#238636] data-[state=active]:text-[#238636] text-[#7d8590] hover:text-[#238636] transition-colors rounded-none border-b-2 border-transparent text-xs sm:text-sm whitespace-nowrap"
              >
                <Monitor className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Monitoring</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#238636] data-[state=active]:text-[#238636] text-[#7d8590] hover:text-[#238636] transition-colors rounded-none border-b-2 border-transparent text-xs sm:text-sm whitespace-nowrap"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6 animate-slide-up">
              {/* Vercel Not Connected Warning */}
              {!localStorage.getItem('vercel_token') && (
                <Card className="border-yellow-500/30 bg-yellow-500/10">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-yellow-400">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      Vercel Not Connected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-yellow-300 mb-3">
                      Connect your Vercel account to see projects and deployments.
                    </p>
                    <Button 
                      className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs sm:text-sm"
                      onClick={() => {
                        // This would need to be passed from parent or use context
                        window.location.href = '#settings-vercel';
                      }}
                    >
                      Connect Vercel
                    </Button>
                  </CardContent>
                </Card>
              )}
              {/* Project Analysis Card */}
              {selectedProject && projects.find(p => p.id === selectedProject) && (
                <Card className="border-[#238636]/20 bg-gradient-to-br from-[#238636]/10 to-transparent">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <GitBranch className="w-4 h-4 sm:w-5 sm:h-5 text-[#238636]" />
                      Project Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const project = projects.find(p => p.id === selectedProject);
                      if (!project) return null;
                      
                      const projectDeployments = deployments;
                      const readyCount = projectDeployments.filter(d => d.state === 'READY').length;
                      const errorCount = projectDeployments.filter(d => d.state === 'ERROR').length;
                      const buildingCount = projectDeployments.filter(d => d.state === 'BUILDING' || d.state === 'INITIALIZING').length;
                      const successRate = projectDeployments.length > 0 
                        ? Math.round((readyCount / projectDeployments.length) * 100)
                        : 0;

                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 bg-[#0d1117] rounded-lg border border-[#238636]/20">
                              <p className="text-xs text-[#7d8590] mb-1">Project Name</p>
                              <p className="text-sm font-medium text-white truncate">{project.name}</p>
                            </div>
                            <div className="p-3 bg-[#0d1117] rounded-lg border border-[#238636]/20">
                              <p className="text-xs text-[#7d8590] mb-1">Framework</p>
                              <p className="text-sm font-medium text-white">{project.framework}</p>
                            </div>
                            <div className="p-3 bg-[#0d1117] rounded-lg border border-[#238636]/20">
                              <p className="text-xs text-[#7d8590] mb-1">Total Deployments</p>
                              <p className="text-sm font-medium text-[#238636]">{projectDeployments.length}</p>
                            </div>
                            <div className="p-3 bg-[#0d1117] rounded-lg border border-[#238636]/20">
                              <p className="text-xs text-[#7d8590] mb-1">Success Rate</p>
                              <p className="text-sm font-medium text-[#238636]">{successRate}%</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                              <p className="text-xs text-green-400 mb-1">Ready</p>
                              <p className="text-lg font-bold text-green-400">{readyCount}</p>
                            </div>
                            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                              <p className="text-xs text-red-400 mb-1">Errors</p>
                              <p className="text-lg font-bold text-red-400">{errorCount}</p>
                            </div>
                            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                              <p className="text-xs text-yellow-400 mb-1">Building</p>
                              <p className="text-lg font-bold text-yellow-400">{buildingCount}</p>
                            </div>
                          </div>

                          {projectDeployments.length > 0 && (
                            <div className="p-3 bg-[#0d1117] rounded-lg border border-[#238636]/20">
                              <p className="text-xs text-[#7d8590] mb-2">Latest Deployment</p>
                              {(() => {
                                const latest = projectDeployments[0];
                                return (
                                  <div>
                                    <p className="text-sm font-medium text-white">{latest.name}</p>
                                    <p className="text-xs text-[#7d8590] mt-1">{latest.url}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge className={`${getStatusColor(latest.state)} border text-xs`}>
                                        <span className="flex items-center gap-1">
                                          {getStatusIcon(latest.state)}
                                          {latest.state}
                                        </span>
                                      </Badge>
                                      <span className="text-xs text-[#7d8590]">
                                        {new Date(latest.created).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Stats Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-gradient-to-br from-[#238636]/10 to-transparent border-[#238636]/20 hover:border-[#238636]/40 transition-colors">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-[#7d8590] flex items-center gap-2">
                      <Rocket className="w-3 h-3 sm:w-4 sm:h-4 text-[#238636]" />
                      <span className="truncate">Total Projects</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-[#238636]">{projects.length}</div>
                    <p className="text-xs text-[#7d8590] mt-1">Connected to Vercel</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#238636]/10 to-transparent border-[#238636]/20 hover:border-[#238636]/40 transition-colors">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-[#7d8590] flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-[#238636]" />
                      <span className="truncate">Total Deployments</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-[#238636]">{deployments.length}</div>
                    <p className="text-xs text-[#7d8590] mt-1">All time</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#238636]/10 to-transparent border-[#238636]/20 hover:border-[#238636]/40 transition-colors">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-[#7d8590] flex items-center gap-2">
                      <Workflow className="w-3 h-3 sm:w-4 sm:h-4 text-[#238636]" />
                      <span className="truncate">Ready Deployments</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-[#238636]">{deployments.filter(d => d.state === 'READY').length}</div>
                    <p className="text-xs text-[#7d8590] mt-1">Live & active</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#238636]/10 to-transparent border-[#238636]/20 hover:border-[#238636]/40 transition-colors">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-[#7d8590] flex items-center gap-2">
                      <Monitor className="w-3 h-3 sm:w-4 sm:h-4 text-[#238636]" />
                      <span className="truncate">System Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#238636] animate-pulse"></div>
                      <span className="text-xs sm:text-sm font-medium text-[#238636]">Operational</span>
                    </div>
                    <p className="text-xs text-[#7d8590] mt-1">All systems online</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Deployments Tab */}
            <TabsContent value="deployments" className="space-y-4 sm:space-y-6 animate-slide-up">
              {/* Projects List */}
              <Card className="border-[#238636]/20">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                        <GitBranch className="w-4 h-4 sm:w-5 sm:h-5 text-[#238636]" />
                        Your Projects
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Select a project to view deployments</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchProjects()}
                      disabled={isLoading}
                      className="border-[#238636]/20 hover:border-[#238636]/40 text-xs"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading && projects.length === 0 ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-[#238636] mx-auto animate-spin mb-2" />
                      <p className="text-xs sm:text-sm text-[#7d8590]">Loading projects...</p>
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-10 h-10 text-[#7d8590] mx-auto mb-3 opacity-50" />
                      <p className="text-xs sm:text-sm text-[#7d8590]">No projects found</p>
                      <p className="text-xs text-[#7d8590] mt-1">Connect your Vercel account in settings</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => setSelectedProject(project.id)}
                          className={`w-full p-3 rounded-lg border transition-all text-left ${
                            selectedProject === project.id
                              ? 'bg-[#238636]/20 border-[#238636] text-white'
                              : 'bg-[#161b22] border-[#238636]/20 hover:border-[#238636]/40 text-[#7d8590] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-xs sm:text-sm">{project.name}</p>
                              <p className="text-xs text-[#7d8590] mt-1">{project.framework}</p>
                            </div>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Deployments List */}
              {selectedProject && (
                <Card className="border-[#238636]/20">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-[#238636]" />
                      Recent Deployments
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Latest deployments for selected project</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 text-[#238636] mx-auto animate-spin mb-2" />
                        <p className="text-xs sm:text-sm text-[#7d8590]">Loading deployments...</p>
                      </div>
                    ) : deployments.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="w-10 h-10 text-[#7d8590] mx-auto mb-3 opacity-50" />
                        <p className="text-xs sm:text-sm text-[#7d8590]">No deployments found</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {deployments.map((deployment) => (
                          <div
                            key={deployment.uid}
                            className="flex items-center justify-between gap-3 p-2 sm:p-3 bg-[#161b22] rounded-lg border border-[#238636]/20 hover:border-[#238636]/40 transition-all"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="font-medium text-xs sm:text-sm text-white truncate">{deployment.name}</p>
                              <Badge className={`${getStatusColor(deployment.state)} border text-xs flex-shrink-0`}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(deployment.state)}
                                  {deployment.state}
                                </span>
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchBuildLogs(deployment.uid)}
                              className="border-[#238636]/20 hover:border-[#238636]/40 text-xs flex-shrink-0"
                            >
                              Logs
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Build Logs */}
              {buildLogs.length > 0 && (
                <Card className="border-[#238636]/20">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[#238636]" />
                      Live Build Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-[#0d1117] rounded-lg p-3 sm:p-4 font-mono text-xs max-h-96 overflow-y-auto border border-[#238636]/20">
                      {buildLogs.map((log, idx) => {
                        const timestamp = log.created 
                          ? new Date(log.created).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              second: '2-digit',
                              hour12: false 
                            })
                          : 'N/A';
                        
                        return (
                          <div key={idx} className="text-[#7d8590] mb-1">
                            <span className="text-[#238636]">[{timestamp}]</span> {log.payload?.text || 'Event'}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation" className="space-y-4 sm:space-y-6 animate-slide-up">
              <AutomationStatusOverview />
              <AutomationTab selectedProject={selectedProject || undefined} />
            </TabsContent>

            {/* Monitoring Tab */}
            <TabsContent value="monitoring" className="space-y-4 sm:space-y-6 animate-slide-up">
              <Card className="border-[#238636]/20">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-[#238636]" />
                    System Monitoring
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Real-time system metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-4">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-[#161b22] rounded-lg border border-[#238636]/20">
                      <span className="text-xs sm:text-sm text-[#7d8590]">CPU Usage</span>
                      <Badge className="bg-[#238636]/20 text-[#238636] text-xs">45%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-[#161b22] rounded-lg border border-[#238636]/20">
                      <span className="text-xs sm:text-sm text-[#7d8590]">Memory Usage</span>
                      <Badge className="bg-[#238636]/20 text-[#238636] text-xs">62%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-[#161b22] rounded-lg border border-[#238636]/20">
                      <span className="text-xs sm:text-sm text-[#7d8590]">Uptime</span>
                      <Badge className="bg-[#238636]/20 text-[#238636] text-xs">99.9%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 sm:space-y-6 animate-slide-up">
              <Card className="border-[#238636]/20">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[#238636]" />
                    DevOps Settings
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Configure your DevOps preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-[#161b22] rounded-lg border border-[#238636]/20">
                    <h4 className="font-medium text-white text-sm mb-2">Vercel Integration</h4>
                    <p className="text-xs sm:text-sm text-[#7d8590] mb-3">Connect your Vercel account for deployment management</p>
                    <Button className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs sm:text-sm w-full">
                      Connect Vercel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
