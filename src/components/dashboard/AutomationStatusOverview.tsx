import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GitBranch,
  Mail,
  Zap,
  TrendingUp,
  Calendar,
  Play,
  Pause
} from 'lucide-react';
import { analysisAutomationService } from '@/services/analysisAutomationService';
import { schedulerService } from '@/services/schedulerService';
import { scheduledAnalysisService } from '@/services/scheduledAnalysisService';

export function AutomationStatusOverview() {
  const [settings, setSettings] = useState(analysisAutomationService.getSettings());
  const [reports, setReports] = useState(analysisAutomationService.getReports());
  const [schedulerActive, setSchedulerActive] = useState(schedulerService.isActive());
  const [nextRunTime, setNextRunTime] = useState<string | null>(null);

  useEffect(() => {
    // Update settings
    setSettings(analysisAutomationService.getSettings());
    setReports(analysisAutomationService.getReports());
    setSchedulerActive(schedulerService.isActive());

    // Calculate next run time
    calculateNextRun();

    // Listen for execution updates
    const listener = (execution: any) => {
      if (execution.status === 'completed') {
        setReports(analysisAutomationService.getReports());
      }
    };

    scheduledAnalysisService.addListener(listener);

    return () => {
      scheduledAnalysisService.removeListener(listener);
    };
  }, []);

  const calculateNextRun = () => {
    const schedule = settings.analysisSchedule;
    const time = settings.scheduledTime || '02:00';

    if (schedule === 'manual' || schedule === 'on-push') {
      setNextRunTime(null);
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    if (nextRun <= new Date()) {
      if (schedule === 'daily') {
        nextRun.setDate(nextRun.getDate() + 1);
      } else if (schedule === 'weekly') {
        const dayOfWeek = nextRun.getDay();
        const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7;
        nextRun.setDate(nextRun.getDate() + daysUntilMonday);
      }
    }

    setNextRunTime(nextRun.toLocaleString());
  };

  const formatScheduleType = (schedule: string): string => {
    switch (schedule) {
      case 'manual':
        return '🔘 Manual (On Demand)';
      case 'on-push':
        return '📤 On Git Push';
      case 'daily':
        return '📅 Daily';
      case 'weekly':
        return '📅 Weekly';
      default:
        return schedule;
    }
  };

  const formatTimeWithAMPM = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getScheduleStatus = (): { color: string; icon: React.ReactNode; text: string } => {
    if (!schedulerActive) {
      return {
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: <Pause className="w-4 h-4" />,
        text: 'Inactive'
      };
    }

    if (settings.analysisSchedule === 'manual' || settings.analysisSchedule === 'on-push') {
      return {
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: <Play className="w-4 h-4" />,
        text: 'Ready'
      };
    }

    return {
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      icon: <CheckCircle2 className="w-4 h-4" />,
      text: 'Active'
    };
  };

  const recentReport = reports.length > 0 ? reports[0] : null;
  const status = getScheduleStatus();

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="w-5 h-5 text-yellow-400" />
                Automation Status
              </CardTitle>
              <CardDescription>Scheduled analysis automation</CardDescription>
            </div>
            <Badge className={`${status.color} border flex items-center gap-1`}>
              {status.icon}
              {status.text}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Schedule Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
              <p className="text-xs text-[#7d8590] mb-1">Schedule Type</p>
              <p className="text-sm font-medium text-white">{formatScheduleType(settings.analysisSchedule)}</p>
            </div>

            <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
              <p className="text-xs text-[#7d8590] mb-1">Scheduled Time</p>
              <p className="text-sm font-medium text-white">
                {settings.analysisSchedule === 'manual' || settings.analysisSchedule === 'on-push'
                  ? 'N/A'
                  : formatTimeWithAMPM(settings.scheduledTime || '02:00')}
              </p>
            </div>

            <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
              <p className="text-xs text-[#7d8590] mb-1">Repositories</p>
              <p className="text-sm font-medium text-white">{settings.selectedRepositories?.length || 0} selected</p>
            </div>

            <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
              <p className="text-xs text-[#7d8590] mb-1">Projects</p>
              <p className="text-sm font-medium text-white">{settings.selectedProjects?.length || 0} selected</p>
            </div>
          </div>

          {/* Next Run Time */}
          {nextRunTime && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-xs text-blue-400">Next Run</p>
                  <p className="text-sm font-medium text-blue-300">{nextRunTime}</p>
                </div>
              </div>
            </div>
          )}

          {/* Email Status */}
          <div className="flex items-center gap-2 p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
            <Mail className="w-4 h-4 text-[#7d8590]" />
            <div className="flex-1">
              <p className="text-xs text-[#7d8590]">Email Notifications</p>
              <p className="text-sm font-medium text-white">
                {settings.enableEmailNotifications ? '✅ Enabled' : '⚠️ Disabled'}
              </p>
            </div>
            {settings.enableEmailNotifications && (
              <Badge className="bg-green-500/20 text-green-400 text-xs">{settings.userEmail}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Process Flow */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <TrendingUp className="w-5 h-5" />
            Automation Process Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-400">1</span>
                </div>
                <div className="w-0.5 h-8 bg-[#30363d] my-1"></div>
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-white">Scheduler Monitors Time</p>
                <p className="text-xs text-[#7d8590]">Waits for scheduled time to arrive</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-400">2</span>
                </div>
                <div className="w-0.5 h-8 bg-[#30363d] my-1"></div>
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-white">Trigger Analysis</p>
                <p className="text-xs text-[#7d8590]">Scheduled time reached, analysis starts</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-yellow-400">3</span>
                </div>
                <div className="w-0.5 h-8 bg-[#30363d] my-1"></div>
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-white">Fetch Code & Analyze</p>
                <p className="text-xs text-[#7d8590]">Fetch repos from GitHub, run analysis</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-400">4</span>
                </div>
                <div className="w-0.5 h-8 bg-[#30363d] my-1"></div>
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-white">Create PR</p>
                <p className="text-xs text-[#7d8590]">Create pull request with analysis results</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-red-400">5</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Send Email</p>
                <p className="text-xs text-[#7d8590]">Send notification with PR link and results</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Report */}
      {recentReport && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Latest Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-[#0d1117] rounded border border-[#30363d]">
                <p className="text-xs text-[#7d8590]">Repository</p>
                <p className="text-sm font-medium text-white truncate">{recentReport.repository}</p>
              </div>
              <div className="p-2 bg-[#0d1117] rounded border border-[#30363d]">
                <p className="text-xs text-[#7d8590]">Time</p>
                <p className="text-sm font-medium text-white">{new Date(recentReport.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                <p className="text-xs text-red-400">Critical</p>
                <p className="text-lg font-bold text-red-400">{recentReport.byPriority.critical}</p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded border border-orange-500/20">
                <p className="text-xs text-orange-400">High</p>
                <p className="text-lg font-bold text-orange-400">{recentReport.byPriority.high}</p>
              </div>
              <div className="p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                <p className="text-xs text-yellow-400">Medium</p>
                <p className="text-lg font-bold text-yellow-400">{recentReport.byPriority.medium}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                <p className="text-xs text-blue-400">Low</p>
                <p className="text-lg font-bold text-blue-400">{recentReport.byPriority.low}</p>
              </div>
            </div>

            {recentReport.prUrl && (
              <Button
                variant="outline"
                className="w-full border-[#238636]/20 hover:border-[#238636]/40 text-[#238636] text-xs"
                onClick={() => window.open(recentReport.prUrl, '_blank')}
              >
                <GitBranch className="w-3 h-3 mr-2" />
                View PR
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Info */}
      <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
        <p className="text-xs text-[#7d8590]">
          {schedulerActive
            ? '✅ Scheduler is active and monitoring for scheduled analysis'
            : '⚠️ Scheduler is inactive. Refresh page to activate.'}
        </p>
      </div>
    </div>
  );
}
