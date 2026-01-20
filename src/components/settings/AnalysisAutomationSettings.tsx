import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Mail, GitBranch, Zap, Clock, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { analysisAutomationService, AnalysisSettings } from '@/services/analysisAutomationService';

interface AnalysisAutomationSettingsProps {
  onClose?: () => void;
}

export function AnalysisAutomationSettings({ onClose }: AnalysisAutomationSettingsProps) {
  const [settings, setSettings] = useState<AnalysisSettings>(analysisAutomationService.getSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [reports, setReports] = useState(analysisAutomationService.getReports());

  const handleSettingChange = (key: keyof AnalysisSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      analysisAutomationService.saveSettings(settings);
      toast.success('✅ Analysis automation settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearReports = () => {
    if (confirm('Are you sure you want to delete all analysis reports?')) {
      analysisAutomationService.clearReports();
      setReports([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analysis Automation</h2>
          <p className="text-[#7d8590] mt-1">
            Configure automated code analysis, email notifications, and GitHub integration
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose} className="text-[#7d8590]">
            ✕
          </Button>
        )}
      </div>

      {/* Email Notifications */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Receive analysis reports via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-400">
              📧 <strong>Note:</strong> Emails are sent to your Resend account email (piyushtamoli9@gmail.com). 
              To send to other addresses, verify a domain at <a href="https://resend.com/domains" target="_blank" className="underline">resend.com/domains</a>
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
            <div>
              <p className="text-sm font-medium text-white">Enable Email Notifications</p>
              <p className="text-xs text-[#7d8590] mt-1">Send analysis reports to your email</p>
            </div>
            <Switch
              checked={settings.enableEmailNotifications}
              onCheckedChange={(checked) => handleSettingChange('enableEmailNotifications', checked)}
            />
          </div>

          {settings.enableEmailNotifications && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Your Email Address</label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={settings.userEmail}
                onChange={(e) => handleSettingChange('userEmail', e.target.value)}
                className="bg-[#0d1117] border-[#30363d] text-white"
              />
              <p className="text-xs text-[#7d8590]">
                This is used for tracking purposes. Reports are sent to piyushtamoli9@gmail.com
              </p>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
            <div>
              <p className="text-sm font-medium text-white">Short Report Format</p>
              <p className="text-xs text-[#7d8590] mt-1">Send concise summary instead of full report</p>
            </div>
            <Switch
              checked={settings.shortReportFormat}
              onCheckedChange={(checked) => handleSettingChange('shortReportFormat', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Automatic Improvements */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5" />
            Automatic Improvements
          </CardTitle>
          <CardDescription>
            Automatically generate and apply code improvements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
            <div>
              <p className="text-sm font-medium text-white">Auto-Generate Improvements</p>
              <p className="text-xs text-[#7d8590] mt-1">Automatically generate improved code suggestions</p>
            </div>
            <Switch
              checked={settings.autoGenerateImprovements}
              onCheckedChange={(checked) => handleSettingChange('autoGenerateImprovements', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
            <div>
              <p className="text-sm font-medium text-white">Auto-Push to GitHub</p>
              <p className="text-xs text-[#7d8590] mt-1">Automatically create PRs with improvements</p>
            </div>
            <Switch
              checked={settings.autoPushToGitHub}
              onCheckedChange={(checked) => handleSettingChange('autoPushToGitHub', checked)}
            />
          </div>

          {settings.autoPushToGitHub && (
            <div className="p-3 bg-[#238636]/10 border border-[#238636]/30 rounded-lg">
              <p className="text-xs text-[#238636]">
                ✅ When enabled, improved code will be automatically pushed to GitHub as pull requests
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Schedule */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            Analysis Schedule
          </CardTitle>
          <CardDescription>
            When to run automated analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Schedule Type</label>
            <Select value={settings.analysisSchedule} onValueChange={(value: any) => handleSettingChange('analysisSchedule', value)}>
              <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-[#30363d]">
                <SelectItem value="manual">🔘 Manual (On Demand)</SelectItem>
                <SelectItem value="on-push">📤 On Git Push</SelectItem>
                <SelectItem value="daily">📅 Daily</SelectItem>
                <SelectItem value="weekly">📅 Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(settings.analysisSchedule === 'daily' || settings.analysisSchedule === 'weekly') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Scheduled Time (UTC)</label>
              <Input
                type="time"
                defaultValue="02:00"
                className="bg-[#0d1117] border-[#30363d] text-white"
              />
              <p className="text-xs text-[#7d8590]">
                {settings.analysisSchedule === 'daily' && '⏰ Analysis will run daily at this time'}
                {settings.analysisSchedule === 'weekly' && '⏰ Analysis will run every Monday at this time'}
              </p>
            </div>
          )}

          <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
            <p className="text-xs text-[#7d8590]">
              {settings.analysisSchedule === 'manual' && '🔘 Analysis runs only when you click "Analyze Code" in DevOps'}
              {settings.analysisSchedule === 'on-push' && '📤 Analysis runs automatically when you push to GitHub'}
              {settings.analysisSchedule === 'daily' && '📅 Analysis runs daily at 2:00 AM UTC'}
              {settings.analysisSchedule === 'weekly' && '📅 Analysis runs every Monday at 2:00 AM UTC'}
            </p>
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-400">
              ⚠️ <strong>Note:</strong> Automated scheduling requires Kestra workflow setup. 
              Currently, manual analysis in DevOps panel is available.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Eye className="w-5 h-5" />
                Recent Analysis Reports
              </CardTitle>
              <CardDescription>
                Last {reports.length} analysis reports
              </CardDescription>
            </div>
            {reports.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearReports}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {reports.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {reports.map((report) => (
                <div key={report.id} className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{report.repository}</p>
                      <p className="text-xs text-[#7d8590] mt-1">
                        {new Date(report.timestamp).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-red-500/20 text-red-400 text-xs">
                          {report.byPriority.critical} Critical
                        </Badge>
                        <Badge className="bg-orange-500/20 text-orange-400 text-xs">
                          {report.byPriority.high} High
                        </Badge>
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                          {report.totalIssues} Total
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.emailSent && (
                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                          📧 Sent
                        </Badge>
                      )}
                      {report.prUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(report.prUrl, '_blank')}
                          className="text-blue-400 hover:text-blue-300 text-xs"
                        >
                          View PR →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#7d8590]">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No analysis reports yet</p>
              <p className="text-xs mt-1">Run your first analysis to see reports here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          className="border-[#30363d] text-[#7d8590] hover:text-white"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? '💾 Saving...' : '💾 Save Settings'}
        </Button>
      </div>
    </div>
  );
}
