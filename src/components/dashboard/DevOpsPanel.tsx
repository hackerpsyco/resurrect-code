import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Zap,
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
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface DevOpsPanelProps {
  onClose: () => void;
}

export function DevOpsPanel({ onClose }: DevOpsPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

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
              {/* Stats Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-gradient-to-br from-[#238636]/10 to-transparent border-[#238636]/20 hover:border-[#238636]/40 transition-colors">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-[#7d8590] flex items-center gap-2">
                      <Rocket className="w-3 h-3 sm:w-4 sm:h-4 text-[#238636]" />
                      <span className="truncate">Active Deployments</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-[#238636]">0</div>
                    <p className="text-xs text-[#7d8590] mt-1">Currently building</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#238636]/10 to-transparent border-[#238636]/20 hover:border-[#238636]/40 transition-colors">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-[#7d8590] flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-[#238636]" />
                      <span className="truncate">Success Rate</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-[#238636]">100%</div>
                    <p className="text-xs text-[#7d8590] mt-1">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#238636]/10 to-transparent border-[#238636]/20 hover:border-[#238636]/40 transition-colors">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-[#7d8590] flex items-center gap-2">
                      <Workflow className="w-3 h-3 sm:w-4 sm:h-4 text-[#238636]" />
                      <span className="truncate">Automated Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-[#238636]">0</div>
                    <p className="text-xs text-[#7d8590] mt-1">This month</p>
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

              {/* Quick Actions */}
              <Card className="border-[#238636]/20">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#238636]" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Common DevOps tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <Button className="w-full bg-[#238636] hover:bg-[#2ea043] text-white justify-between group text-xs sm:text-sm">
                    <span className="flex items-center gap-2">
                      <Rocket className="w-3 h-3 sm:w-4 sm:h-4" />
                      Deploy to Production
                    </span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button variant="outline" className="w-full border-[#238636]/20 hover:border-[#238636]/40 hover:bg-[#238636]/10 justify-between group text-xs sm:text-sm">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                      View Recent Deployments
                    </span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Deployments Tab */}
            <TabsContent value="deployments" className="space-y-4 sm:space-y-6 animate-slide-up">
              <Card className="border-[#238636]/20">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-[#238636]" />
                    Recent Deployments
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Your latest deployment history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 sm:py-12">
                    <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-[#7d8590] mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-xs sm:text-sm text-[#7d8590]">No deployments yet</p>
                    <p className="text-xs text-[#7d8590] mt-1">Connect your Vercel account to see deployments</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation" className="space-y-4 sm:space-y-6 animate-slide-up">
              <Card className="border-[#238636]/20">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Workflow className="w-4 h-4 sm:w-5 sm:h-5 text-[#238636]" />
                    Automated Workflows
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Manage your automation rules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 sm:py-12">
                    <Workflow className="w-10 h-10 sm:w-12 sm:h-12 text-[#7d8590] mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-xs sm:text-sm text-[#7d8590]">No workflows configured</p>
                    <p className="text-xs text-[#7d8590] mt-1">Set up automation to streamline your DevOps</p>
                  </div>
                </CardContent>
              </Card>
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
