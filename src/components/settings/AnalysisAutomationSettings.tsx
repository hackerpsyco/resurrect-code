import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Mail, GitBranch, Clock, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { analysisAutomationService, AnalysisSettings } from '@/services/analysisAutomationService';
import { useVercel } from '@/hooks/useVercel';
import { GitHubTokenDiagnostic } from './GitHubTokenDiagnostic';

interface AnalysisAutomationSettingsProps {
  onClose?: () => void;
}

export function AnalysisAutomationSettings({ onClose }: AnalysisAutomationSettingsProps) {
  const [settings, setSettings] = useState<AnalysisSettings>(analysisAutomationService.getSettings());
  const [scheduledTime, setScheduledTime] = useState(analysisAutomationService.getScheduledTime());
  const [selectedRepos, setSelectedRepos] = useState<string[]>(analysisAutomationService.getSelectedRepositories());
  const [selectedProjects, setSelectedProjects] = useState<string[]>(analysisAutomationService.getSelectedProjects());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [reports, setReports] = useState(analysisAutomationService.getReports());
  const { projects: vercelProjects, fetchProjects } = useVercel();
  
  // Gemini AI configuration state
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    const config = localStorage.getItem('ai_config');
    if (config) {
      const parsed = JSON.parse(config);
      return parsed.provider === 'gemini' ? parsed.apiKey : '';
    }
    return '';
  });
  const [geminiEnabled, setGeminiEnabled] = useState(() => {
    const config = localStorage.getItem('ai_config');
    return config ? JSON.parse(config).provider === 'gemini' : false;
  });
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');

  // Load GitHub repos, Vercel projects, and database settings on mount
  useEffect(() => {
    loadGitHubRepos();
    fetchProjects();
    // Load settings from database
    analysisAutomationService.loadSettingsFromDatabase();
    analysisAutomationService.loadReportsFromDatabase();
    
    // Reload state after loading from database
    setTimeout(() => {
      setSettings(analysisAutomationService.getSettings());
      setScheduledTime(analysisAutomationService.getScheduledTime());
      setSelectedRepos(analysisAutomationService.getSelectedRepositories());
      setSelectedProjects(analysisAutomationService.getSelectedProjects());
      setReports(analysisAutomationService.getReports());
    }, 500);
  }, [fetchProjects]);

  const loadGitHubRepos = async () => {
    setIsLoadingRepos(true);
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        console.warn('GitHub token not found');
        return;
      }

      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const repos = await response.json();
        setGithubRepos(repos);
        console.log(`✅ Loaded ${repos.length} GitHub repositories`);
      }
    } catch (err) {
      console.error('Failed to load GitHub repos:', err);
      toast.error('Failed to load GitHub repositories');
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleSettingChange = (key: keyof AnalysisSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await analysisAutomationService.saveSettings(settings);
      analysisAutomationService.setScheduledTime(scheduledTime);
      analysisAutomationService.setSelectedRepositories(selectedRepos);
      analysisAutomationService.setSelectedProjects(selectedProjects);
      
      // Save Gemini AI configuration if enabled
      if (geminiEnabled && geminiApiKey) {
        // Clear old cache first
        localStorage.removeItem('ai_config');
        // Save with Gemini 1.5 Flash (free tier)
        localStorage.setItem('ai_config', JSON.stringify({
          provider: 'gemini',
          apiKey: geminiApiKey,
          model: 'gemini-1.5-flash'
        }));
        // Force page reload to clear any cached models
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
      
      // Restart scheduler with new settings
      const { schedulerService } = await import('@/services/schedulerService');
      schedulerService.restart();
      
      toast.success('✅ Analysis automation settings saved');
      
      // Reload state to show updated values
      setTimeout(() => {
        setSettings(analysisAutomationService.getSettings());
        setScheduledTime(analysisAutomationService.getScheduledTime());
        setSelectedRepos(analysisAutomationService.getSelectedRepositories());
        setSelectedProjects(analysisAutomationService.getSelectedProjects());
      }, 500);
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

  // Convert 24-hour time to 12-hour format with AM/PM
  const formatTimeWithAMPM = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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

      {/* GitHub Token Diagnostic */}
      <GitHubTokenDiagnostic />

      {/* Gemini AI Configuration */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5" />
            Gemini AI Configuration
          </CardTitle>
          <CardDescription>
            Configure Gemini 1.5 Flash (free tier) for code analysis and AI chat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Gemini API Key</label>
            <Input
              type="password"
              placeholder="Enter your Gemini API key"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="bg-[#0d1117] border-[#30363d] text-white"
            />
            <p className="text-xs text-[#7d8590]">
              Get your free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Google AI Studio</a>
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
            <div>
              <p className="text-sm font-medium text-white">Enable Gemini AI</p>
              <p className="text-xs text-[#7d8590] mt-1">Use Gemini 1.5 Flash for code analysis and AI chat</p>
            </div>
            <Switch
              checked={geminiEnabled}
              onCheckedChange={setGeminiEnabled}
            />
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-400">
              ℹ️ <strong>Gemini 1.5 Flash:</strong> Fast, free AI model perfect for code analysis, debugging, and project-wide improvements. No billing required.
            </p>
          </div>
          
          {geminiEnabled && geminiApiKey && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('ai_config');
                setGeminiApiKey('');
                setGeminiEnabled(false);
                toast.success('Gemini configuration cleared');
              }}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 w-full"
            >
              Clear Gemini Configuration
            </Button>
          )}
        </CardContent>
      </Card>

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
                placeholder="piyushmodi812@gmail.com"
                value={settings.userEmail}
                onChange={(e) => handleSettingChange('userEmail', e.target.value)}
                className="bg-[#0d1117] border-[#30363d] text-white"
              />
              <p className="text-xs text-[#7d8590]">
                Enter the email address where you want to receive analysis reports
              </p>
              <p className="text-xs text-green-400 mt-2">
                ✅ <strong>Verified:</strong> Use <strong>piyushmodi812@gmail.com</strong> (your verified Resend email)
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

      {/* Repository & Project Selection */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <GitBranch className="w-5 h-5" />
            Select Repositories & Projects
          </CardTitle>
          <CardDescription>
            Choose which repositories and projects to analyze
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GitHub Repositories */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">GitHub Repositories</label>
            <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-[#0d1117] rounded-lg border border-[#30363d]">
              {isLoadingRepos ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-[#7d8590]" />
                  <span className="text-xs text-[#7d8590] ml-2">Loading repositories...</span>
                </div>
              ) : githubRepos.length > 0 ? (
                githubRepos.map((repo) => (
                  <label key={repo.id} className="flex items-center gap-2 p-2 hover:bg-[#161b22] rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRepos.includes(repo.full_name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRepos([...selectedRepos, repo.full_name]);
                        } else {
                          setSelectedRepos(selectedRepos.filter(r => r !== repo.full_name));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-xs text-gray-300">{repo.name}</span>
                    {repo.private && <Badge className="text-xs bg-red-500/20 text-red-400">Private</Badge>}
                  </label>
                ))
              ) : (
                <p className="text-xs text-[#7d8590] py-4">No repositories found. Connect your GitHub account first.</p>
              )}
            </div>
            <p className="text-xs text-[#7d8590]">
              {selectedRepos.length} repository/repositories selected
            </p>
          </div>

          {/* Vercel Projects */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Vercel Projects</label>
            <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-[#0d1117] rounded-lg border border-[#30363d]">
              {vercelProjects && vercelProjects.length > 0 ? (
                vercelProjects.map((project: any) => (
                  <label key={project.id} className="flex items-center gap-2 p-2 hover:bg-[#161b22] rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(project.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProjects([...selectedProjects, project.id]);
                        } else {
                          setSelectedProjects(selectedProjects.filter(p => p !== project.id));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-xs text-gray-300">{project.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-xs text-[#7d8590] py-4">No projects found. Connect your Vercel account first.</p>
              )}
            </div>
            <p className="text-xs text-[#7d8590]">
              {selectedProjects.length} project/projects selected
            </p>
          </div>
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
              <div className="flex gap-2 items-center">
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="bg-[#0d1117] border-[#30363d] text-white flex-1"
                />
                <div className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white text-sm font-medium">
                  {formatTimeWithAMPM(scheduledTime)}
                </div>
              </div>
              <p className="text-xs text-[#7d8590]">
                {settings.analysisSchedule === 'daily' && `⏰ Analysis will run daily at ${formatTimeWithAMPM(scheduledTime)} UTC`}
                {settings.analysisSchedule === 'weekly' && `⏰ Analysis will run every Monday at ${formatTimeWithAMPM(scheduledTime)} UTC`}
              </p>
            </div>
          )}

          <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
            <p className="text-xs text-[#7d8590]">
              {settings.analysisSchedule === 'manual' && '🔘 Analysis runs only when you click "Analyze Code" in DevOps'}
              {settings.analysisSchedule === 'on-push' && '📤 Analysis runs automatically when you push to GitHub'}
              {settings.analysisSchedule === 'daily' && `📅 Analysis runs daily at ${formatTimeWithAMPM(scheduledTime)} UTC`}
              {settings.analysisSchedule === 'weekly' && `📅 Analysis runs every Monday at ${formatTimeWithAMPM(scheduledTime)} UTC`}
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
