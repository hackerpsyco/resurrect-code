/**
 * Analysis Automation Service
 * Handles automated code analysis, email notifications, and GitHub push
 * Supports both localStorage (client-side) and database (server-side) persistence
 */

import { toast } from 'sonner';
import { emailReplyService } from './emailReplyService';

export interface AnalysisSettings {
  enableEmailNotifications: boolean;
  userEmail: string;
  autoGenerateImprovements: boolean;
  autoPushToGitHub: boolean;
  analysisSchedule: 'manual' | 'daily' | 'weekly' | 'on-push';
  shortReportFormat: boolean;
  scheduledTime?: string;
  selectedRepositories?: string[];
  selectedProjects?: string[];
}

export interface AnalysisReport {
  id: string;
  timestamp: string;
  repository: string;
  totalIssues: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  shortSummary: string;
  fullReport: string;
  prUrl?: string;
  emailSent: boolean;
}

class AnalysisAutomationService {
  private static instance: AnalysisAutomationService;
  private settings: AnalysisSettings = {
    enableEmailNotifications: false,
    userEmail: '',
    autoGenerateImprovements: false,
    autoPushToGitHub: false,
    analysisSchedule: 'manual',
    shortReportFormat: true,
    scheduledTime: '02:00',
    selectedRepositories: [],
    selectedProjects: []
  };
  private reports: AnalysisReport[] = [];
  private readonly SETTINGS_KEY = 'analysis_automation_settings';
  private readonly REPORTS_KEY = 'analysis_reports';
  private useDatabase = false;

  static getInstance(): AnalysisAutomationService {
    if (!AnalysisAutomationService.instance) {
      AnalysisAutomationService.instance = new AnalysisAutomationService();
    }
    return AnalysisAutomationService.instance;
  }

  constructor() {
    this.loadSettings();
    this.loadReports();
  }

  /**
   * Load settings from localStorage (and optionally from database)
   */
  private loadSettings() {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
        console.log('✅ Analysis automation settings loaded from localStorage');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * Load reports from localStorage (and optionally from database)
   */
  private loadReports() {
    try {
      const stored = localStorage.getItem(this.REPORTS_KEY);
      if (stored) {
        this.reports = JSON.parse(stored);
        console.log(`✅ Loaded ${this.reports.length} analysis reports from localStorage`);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  }

  /**
   * Save settings to localStorage and optionally to database
   */
  async saveSettings(newSettings: Partial<AnalysisSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      // Always save to localStorage for offline support
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
      console.log('✅ Analysis automation settings saved to localStorage');

      // Try to save to database if available
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (supabaseUrl && supabaseKey) {
          const token = localStorage.getItem('sb_auth_token');
          if (token) {
            const response = await fetch(`${supabaseUrl}/functions/v1/analysis-settings`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(this.settings)
            });

            if (response.ok) {
              console.log('✅ Settings saved to database');
              this.useDatabase = true;
            } else {
              console.warn('⚠️ Failed to save settings to database:', response.statusText);
            }
          }
        }
      } catch (dbError) {
        console.warn('⚠️ Database save failed (offline mode):', dbError);
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  }

  /**
   * Load settings from database
   */
  async loadSettingsFromDatabase() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Supabase not configured');
        return;
      }

      const token = localStorage.getItem('sb_auth_token');
      if (!token) {
        console.warn('⚠️ No auth token available');
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/analysis-settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          this.settings = data.data;
          localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
          console.log('✅ Settings loaded from database');
          this.useDatabase = true;
        }
      } else {
        console.warn('⚠️ Failed to load settings from database:', response.statusText);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load settings from database:', error);
    }
  }

  /**
   * Load reports from database
   */
  async loadReportsFromDatabase(repository?: string) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Supabase not configured');
        return;
      }

      const token = localStorage.getItem('sb_auth_token');
      if (!token) {
        console.warn('⚠️ No auth token available');
        return;
      }

      let url = `${supabaseUrl}/functions/v1/analysis-reports`;
      if (repository) {
        url += `?repository=${encodeURIComponent(repository)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          this.reports = data.data;
          localStorage.setItem(this.REPORTS_KEY, JSON.stringify(this.reports));
          console.log(`✅ Loaded ${this.reports.length} reports from database`);
          this.useDatabase = true;
        }
      } else {
        console.warn('⚠️ Failed to load reports from database:', response.statusText);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load reports from database:', error);
    }
  }

  /**
   * Get current settings
   */
  getSettings(): AnalysisSettings {
    return { ...this.settings };
  }

  /**
   * Generate short analysis report
   */
  generateShortReport(totalIssues: number, byPriority: any): string {
    return `📊 Code Analysis Summary
    
Total Issues: ${totalIssues}
🔴 Critical: ${byPriority.critical}
🟠 High: ${byPriority.high}
🟡 Medium: ${byPriority.medium}
🔵 Low: ${byPriority.low}

Status: Analysis complete
Generated: ${new Date().toLocaleString()}`;
  }

  /**
   * Generate full analysis report
   */
  generateFullReport(
    repository: string,
    totalIssues: number,
    byPriority: any,
    files: any[]
  ): string {
    return `# 🤖 AI Code Analysis Report

**Repository:** ${repository}
**Generated:** ${new Date().toISOString()}

## Summary
- **Total Issues:** ${totalIssues}
- **Critical:** ${byPriority.critical}
- **High:** ${byPriority.high}
- **Medium:** ${byPriority.medium}
- **Low:** ${byPriority.low}

## Issues by File
${files.map(file => `
### ${file.file}
${file.suggestions.map((s: any) => `- [${s.priority.toUpperCase()}] ${s.issue}`).join('\n')}
`).join('\n')}

---
*Generated by ResurrectCI AI Analysis*`;
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(report: AnalysisReport): Promise<boolean> {
    if (!this.settings.enableEmailNotifications || !this.settings.userEmail) {
      console.log('⚠️ Email notifications disabled or no email configured');
      return false;
    }

    try {
      console.log(`📧 Sending analysis report to ${this.settings.userEmail}...`);

      // Create email reply action (for tracking user response)
      const replyAction = emailReplyService.createReplyAction(report.id, this.settings.userEmail);

      // Use Supabase edge function to send email
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Supabase not configured for email');
        return false;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/send-analysis-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          to: this.settings.userEmail,
          subject: `🤖 Code Analysis Report: ${report.repository}`,
          shortReport: report.shortSummary,
          fullReport: report.fullReport,
          prUrl: report.prUrl,
          shortFormat: this.settings.shortReportFormat,
          replyId: replyAction.id,
          reportId: report.id
        })
      });

      // Parse response
      let responseData: any = {};
      try {
        responseData = await response.json();
      } catch (e) {
        console.error('Failed to parse response:', e);
      }

      if (response.ok) {
        console.log('✅ Email sent successfully:', responseData);
        report.emailSent = true;
        this.saveReport(report);
        
        if (responseData.sent) {
          toast.success(`📧 Analysis report sent to ${this.settings.userEmail}\n⏳ Waiting for your response...`);
        } else if (responseData.message?.includes('development mode')) {
          toast.info(`📧 Email service not configured (development mode)\n📧 Would send to: ${this.settings.userEmail}`);
        } else {
          toast.success(`📧 Analysis report processed\n⏳ Waiting for your response...`);
        }
        return true;
      } else {
        const errorMsg = responseData.error || responseData.message || response.statusText;
        console.error('❌ Failed to send email:', errorMsg);
        console.error('❌ Full response:', responseData);
        
        // Check if it's a configuration issue
        if (errorMsg?.includes('not configured')) {
          toast.error(`⚠️ Email service not configured\n📖 See SUPABASE_SECRETS_SETUP.md for setup instructions`);
        } else {
          toast.error(`Failed to send email: ${errorMsg}`);
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Email sending error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error sending email: ${errorMsg}`);
      return false;
    }
  }

  /**
   * Save analysis report to localStorage and optionally to database
   */
  async saveReport(report: AnalysisReport) {
    this.reports.unshift(report); // Add to beginning
    // Keep only last 50 reports
    if (this.reports.length > 50) {
      this.reports = this.reports.slice(0, 50);
    }
    try {
      // Always save to localStorage for offline support
      localStorage.setItem(this.REPORTS_KEY, JSON.stringify(this.reports));
      console.log('✅ Report saved to localStorage');

      // Try to save to database if available
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (supabaseUrl && supabaseKey) {
          const token = localStorage.getItem('sb_auth_token');
          if (token) {
            const response = await fetch(`${supabaseUrl}/functions/v1/analysis-reports`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                reportId: report.id,
                timestamp: report.timestamp,
                repository: report.repository,
                totalIssues: report.totalIssues,
                byPriority: report.byPriority,
                shortSummary: report.shortSummary,
                fullReport: report.fullReport,
                prUrl: report.prUrl,
                emailSent: report.emailSent
              })
            });

            if (response.ok) {
              console.log('✅ Report saved to database');
            } else {
              console.warn('⚠️ Failed to save report to database:', response.statusText);
            }
          }
        }
      } catch (dbError) {
        console.warn('⚠️ Database save failed (offline mode):', dbError);
      }
    } catch (error) {
      console.error('Failed to save report:', error);
    }
  }

  /**
   * Get all reports
   */
  getReports(): AnalysisReport[] {
    return [...this.reports];
  }

  /**
   * Get reports for specific repository
   */
  getRepositoryReports(repository: string): AnalysisReport[] {
    return this.reports.filter(r => r.repository === repository);
  }

  /**
   * Check if auto-push is enabled
   */
  shouldAutoPush(): boolean {
    return this.settings.autoPushToGitHub;
  }

  /**
   * Check if auto-generate improvements is enabled
   */
  shouldAutoGenerateImprovements(): boolean {
    return this.settings.autoGenerateImprovements;
  }

  /**
   * Check if should send email
   */
  shouldSendEmail(): boolean {
    return this.settings.enableEmailNotifications && !!this.settings.userEmail;
  }

  /**
   * Get analysis schedule
   */
  getAnalysisSchedule(): string {
    return this.settings.analysisSchedule;
  }

  /**
   * Clear all reports
   */
  clearReports() {
    this.reports = [];
    try {
      localStorage.removeItem(this.REPORTS_KEY);
      console.log('✅ Reports cleared');
      toast.success('All reports cleared');
    } catch (error) {
      console.error('Failed to clear reports:', error);
    }
  }

  /**
   * Set selected repositories
   */
  setSelectedRepositories(repos: string[]) {
    this.settings.selectedRepositories = repos;
    this.saveSettings(this.settings);
    console.log(`✅ Selected ${repos.length} repositories`);
  }

  /**
   * Get selected repositories
   */
  getSelectedRepositories(): string[] {
    return this.settings.selectedRepositories || [];
  }

  /**
   * Set selected projects
   */
  setSelectedProjects(projects: string[]) {
    this.settings.selectedProjects = projects;
    this.saveSettings(this.settings);
    console.log(`✅ Selected ${projects.length} projects`);
  }

  /**
   * Get selected projects
   */
  getSelectedProjects(): string[] {
    return this.settings.selectedProjects || [];
  }

  /**
   * Set scheduled time
   */
  setScheduledTime(time: string) {
    this.settings.scheduledTime = time;
    this.saveSettings(this.settings);
    console.log(`✅ Scheduled time set to ${time} UTC`);
  }

  /**
   * Get scheduled time
   */
  getScheduledTime(): string {
    return this.settings.scheduledTime || '02:00';
  }
}

export const analysisAutomationService = AnalysisAutomationService.getInstance();
export default analysisAutomationService;
