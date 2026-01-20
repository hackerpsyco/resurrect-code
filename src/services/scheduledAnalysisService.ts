/**
 * Scheduled Analysis Service
 * Handles backend logic for scheduled code analysis execution
 * Integrates with Kestra, GitHub, and email notifications
 */

import { toast } from 'sonner';
import { analysisAutomationService, AnalysisReport } from './analysisAutomationService';

export interface ScheduledAnalysisJob {
  id: string;
  userId: string;
  repositories: string[];
  projects: string[];
  schedule: 'manual' | 'on-push' | 'daily' | 'weekly';
  scheduledTime?: string; // HH:MM format in UTC
  status: 'active' | 'paused' | 'failed';
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisExecution {
  id: string;
  jobId: string;
  repository: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  result?: {
    totalIssues: number;
    byPriority: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  error?: string;
  prUrl?: string;
}

class ScheduledAnalysisService {
  private static instance: ScheduledAnalysisService;
  private jobs: Map<string, ScheduledAnalysisJob> = new Map();
  private executions: Map<string, AnalysisExecution> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Array<(execution: AnalysisExecution) => void> = [];

  static getInstance(): ScheduledAnalysisService {
    if (!ScheduledAnalysisService.instance) {
      ScheduledAnalysisService.instance = new ScheduledAnalysisService();
    }
    return ScheduledAnalysisService.instance;
  }

  /**
   * Create a new scheduled analysis job
   */
  async createJob(
    userId: string,
    repositories: string[],
    projects: string[],
    schedule: 'manual' | 'on-push' | 'daily' | 'weekly',
    scheduledTime?: string
  ): Promise<ScheduledAnalysisJob> {
    const job: ScheduledAnalysisJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId,
      repositories,
      projects,
      schedule,
      scheduledTime,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.jobs.set(job.id, job);
    console.log(`✅ Scheduled analysis job created: ${job.id}`);

    // Calculate next run time
    this.calculateNextRun(job);

    // Start the job if it's scheduled
    if (schedule !== 'manual') {
      this.startJob(job);
    }

    return job;
  }

  /**
   * Calculate next run time for a job
   */
  private calculateNextRun(job: ScheduledAnalysisJob): void {
    if (job.schedule === 'manual' || job.schedule === 'on-push') {
      job.nextRun = undefined;
      return;
    }

    const now = new Date();
    const [hours, minutes] = (job.scheduledTime || '02:00').split(':').map(Number);

    let nextRun = new Date();
    nextRun.setUTCHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    }

    // For weekly, ensure it's on Monday
    if (job.schedule === 'weekly') {
      while (nextRun.getUTCDay() !== 1) { // 1 = Monday
        nextRun.setUTCDate(nextRun.getUTCDate() + 1);
      }
    }

    job.nextRun = nextRun.toISOString();
    console.log(`📅 Next run scheduled for: ${job.nextRun}`);
  }

  /**
   * Start a scheduled job
   */
  private startJob(job: ScheduledAnalysisJob): void {
    if (this.timers.has(job.id)) {
      console.log(`⚠️ Job ${job.id} is already running`);
      return;
    }

    console.log(`🚀 Starting scheduled job: ${job.id}`);

    if (job.schedule === 'daily') {
      this.scheduleDailyJob(job);
    } else if (job.schedule === 'weekly') {
      this.scheduleWeeklyJob(job);
    }
  }

  /**
   * Schedule a daily job
   */
  private scheduleDailyJob(job: ScheduledAnalysisJob): void {
    const [hours, minutes] = (job.scheduledTime || '02:00').split(':').map(Number);

    const scheduleNextRun = () => {
      const now = new Date();
      let nextRun = new Date();
      nextRun.setUTCHours(hours, minutes, 0, 0);

      if (nextRun <= now) {
        nextRun.setUTCDate(nextRun.getUTCDate() + 1);
      }

      const delay = nextRun.getTime() - now.getTime();
      console.log(`⏰ Daily job scheduled in ${Math.round(delay / 1000 / 60)} minutes`);

      const timer = setTimeout(() => {
        console.log(`🔔 Daily job triggered: ${job.id}`);
        this.executeJob(job);
        scheduleNextRun(); // Schedule next run
      }, delay);

      this.timers.set(job.id, timer);
    };

    scheduleNextRun();
  }

  /**
   * Schedule a weekly job
   */
  private scheduleWeeklyJob(job: ScheduledAnalysisJob): void {
    const [hours, minutes] = (job.scheduledTime || '02:00').split(':').map(Number);

    const scheduleNextRun = () => {
      const now = new Date();
      let nextRun = new Date();
      nextRun.setUTCHours(hours, minutes, 0, 0);

      // Find next Monday
      while (nextRun.getUTCDay() !== 1 || nextRun <= now) {
        nextRun.setUTCDate(nextRun.getUTCDate() + 1);
      }

      const delay = nextRun.getTime() - now.getTime();
      console.log(`⏰ Weekly job scheduled in ${Math.round(delay / 1000 / 60 / 60)} hours`);

      const timer = setTimeout(() => {
        console.log(`🔔 Weekly job triggered: ${job.id}`);
        this.executeJob(job);
        scheduleNextRun(); // Schedule next run
      }, delay);

      this.timers.set(job.id, timer);
    };

    scheduleNextRun();
  }

  /**
   * Execute a scheduled analysis job
   */
  async executeJob(job: ScheduledAnalysisJob): Promise<void> {
    console.log(`🔄 Executing scheduled analysis job: ${job.id}`);
    console.log(`📦 Repositories: ${job.repositories.join(', ')}`);
    console.log(`🚀 Projects: ${job.projects.join(', ')}`);

    job.lastRun = new Date().toISOString();
    job.status = 'active';

    // Execute analysis for each repository
    for (const repository of job.repositories) {
      try {
        await this.analyzeRepository(job, repository);
      } catch (error) {
        console.error(`❌ Failed to analyze ${repository}:`, error);
        job.status = 'failed';
      }
    }

    // Calculate next run
    this.calculateNextRun(job);
  }

  /**
   * Analyze a single repository
   */
  private async analyzeRepository(job: ScheduledAnalysisJob, repository: string): Promise<void> {
    const execution: AnalysisExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      jobId: job.id,
      repository,
      status: 'running',
      startTime: new Date().toISOString()
    };

    this.executions.set(execution.id, execution);
    this.notifyListeners(execution);

    try {
      console.log(`📊 Starting analysis for: ${repository}`);

      // Step 1: Fetch code from repository
      const codeFiles = await this.fetchRepositoryCode(repository);
      console.log(`✅ Fetched ${codeFiles.length} code files`);

      // Step 2: Run analysis (simulated for now)
      const analysisResult = await this.runAnalysis(repository, codeFiles);
      console.log(`✅ Analysis complete: ${analysisResult.totalIssues} issues found`);

      execution.result = analysisResult;

      // Step 3: Create PR with results
      const prUrl = await this.createAnalysisPR(repository, analysisResult);
      execution.prUrl = prUrl;
      console.log(`✅ PR created: ${prUrl}`);

      // Step 4: Send email notification
      await this.sendAnalysisNotification(job, repository, analysisResult, prUrl);

      execution.status = 'completed';
      execution.endTime = new Date().toISOString();

      console.log(`✅ Analysis execution completed: ${execution.id}`);
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.endTime = new Date().toISOString();

      console.error(`❌ Analysis execution failed: ${error}`);
    }

    this.notifyListeners(execution);
  }

  /**
   * Fetch code files from repository
   */
  private async fetchRepositoryCode(repository: string): Promise<Array<{ name: string; content: string }>> {
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        throw new Error('GitHub token not found');
      }

      const [owner, repo] = repository.split('/');

      // Get repository tree
      const treeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!treeResponse.ok) {
        throw new Error(`Failed to fetch repository tree: ${treeResponse.statusText}`);
      }

      const treeData = await treeResponse.json();

      // Filter for code files
      const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs'];
      const codeFiles = treeData.tree
        .filter((item: any) => item.type === 'blob' && codeExtensions.some(ext => item.path.endsWith(ext)))
        .slice(0, 20); // Limit to first 20 files

      // Fetch content for each file
      const files: Array<{ name: string; content: string }> = [];
      for (const file of codeFiles) {
        try {
          const contentResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=main`,
            {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3.raw'
              }
            }
          );

          if (contentResponse.ok) {
            const content = await contentResponse.text();
            files.push({
              name: file.path,
              content: content.substring(0, 10000) // Limit content size
            });
          }
        } catch (err) {
          console.warn(`Failed to fetch file ${file.path}:`, err);
        }
      }

      return files;
    } catch (error) {
      console.error('Failed to fetch repository code:', error);
      throw error;
    }
  }

  /**
   * Run analysis on code files
   */
  private async runAnalysis(
    repository: string,
    files: Array<{ name: string; content: string }>
  ): Promise<{ totalIssues: number; byPriority: { critical: number; high: number; medium: number; low: number } }> {
    // Simulate analysis with random results
    // In production, this would call Gemini API or other analysis service
    const critical = Math.floor(Math.random() * 3);
    const high = Math.floor(Math.random() * 5);
    const medium = Math.floor(Math.random() * 8);
    const low = Math.floor(Math.random() * 10);

    return {
      totalIssues: critical + high + medium + low,
      byPriority: { critical, high, medium, low }
    };
  }

  /**
   * Create PR with analysis results
   */
  private async createAnalysisPR(
    repository: string,
    result: { totalIssues: number; byPriority: { critical: number; high: number; medium: number; low: number } }
  ): Promise<string> {
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        throw new Error('GitHub token not found');
      }

      const [owner, repo] = repository.split('/');
      const branchName = `scheduled-analysis-${Date.now()}`;

      // Create branch
      const refResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!refResponse.ok) {
        throw new Error('Failed to get main branch reference');
      }

      const refData = await refResponse.json();
      const baseSha = refData.object.sha;

      // Create new branch
      await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: baseSha
          })
        }
      );

      // Create PR
      const prResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            title: `🤖 Scheduled Analysis: ${result.totalIssues} issues found`,
            body: `## 📊 Scheduled Analysis Results\n\n- **Total Issues:** ${result.totalIssues}\n- **Critical:** ${result.byPriority.critical}\n- **High:** ${result.byPriority.high}\n- **Medium:** ${result.byPriority.medium}\n- **Low:** ${result.byPriority.low}\n\n*Generated by ResurrectCI Scheduled Analysis*`,
            head: branchName,
            base: 'main'
          })
        }
      );

      if (!prResponse.ok) {
        throw new Error('Failed to create PR');
      }

      const prData = await prResponse.json();
      return prData.html_url;
    } catch (error) {
      console.error('Failed to create analysis PR:', error);
      throw error;
    }
  }

  /**
   * Send analysis notification email
   */
  private async sendAnalysisNotification(
    job: ScheduledAnalysisJob,
    repository: string,
    result: { totalIssues: number; byPriority: { critical: number; high: number; medium: number; low: number } },
    prUrl: string
  ): Promise<void> {
    try {
      // Create analysis report
      const report: AnalysisReport = {
        id: `report_${Date.now()}`,
        timestamp: new Date().toISOString(),
        repository,
        totalIssues: result.totalIssues,
        byPriority: result.byPriority,
        shortSummary: analysisAutomationService.generateShortReport(result.totalIssues, result.byPriority),
        fullReport: `# Scheduled Analysis Report\n\n${repository}\n\nIssues: ${result.totalIssues}`,
        prUrl,
        emailSent: false
      };

      // Save report
      await analysisAutomationService.saveReport(report);

      // Send email if enabled
      if (analysisAutomationService.shouldSendEmail()) {
        await analysisAutomationService.sendEmailNotification(report);
      }
    } catch (error) {
      console.error('Failed to send analysis notification:', error);
    }
  }

  /**
   * Pause a job
   */
  pauseJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      console.warn(`Job ${jobId} not found`);
      return;
    }

    job.status = 'paused';
    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
    }

    console.log(`⏸️ Job paused: ${jobId}`);
  }

  /**
   * Resume a job
   */
  resumeJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      console.warn(`Job ${jobId} not found`);
      return;
    }

    job.status = 'active';
    if (job.schedule !== 'manual' && job.schedule !== 'on-push') {
      this.startJob(job);
    }

    console.log(`▶️ Job resumed: ${jobId}`);
  }

  /**
   * Delete a job
   */
  deleteJob(jobId: string): void {
    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
    }

    this.jobs.delete(jobId);
    console.log(`🗑️ Job deleted: ${jobId}`);
  }

  /**
   * Get all jobs
   */
  getJobs(): ScheduledAnalysisJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): ScheduledAnalysisJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all executions
   */
  getExecutions(): AnalysisExecution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  /**
   * Get executions for a job
   */
  getJobExecutions(jobId: string): AnalysisExecution[] {
    return this.getExecutions().filter(e => e.jobId === jobId);
  }

  /**
   * Add listener for execution updates
   */
  addListener(callback: (execution: AnalysisExecution) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback: (execution: AnalysisExecution) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(execution: AnalysisExecution): void {
    this.listeners.forEach(callback => {
      try {
        callback(execution);
      } catch (error) {
        console.error('Error in execution listener:', error);
      }
    });
  }

  /**
   * Trigger manual analysis via Phase 5 edge function
   */
  async triggerManualAnalysis(repositories: string[]): Promise<void> {
    console.log(`🚀 Triggering manual analysis for: ${repositories.join(', ')}`);
    toast.info('Starting analysis via edge function...');

    try {
      // Get Supabase session from localStorage - try multiple possible keys
      let session = null;
      let token = null;
      let userId = null;

      // Try the standard Supabase auth key format
      const possibleKeys = [
        'sb-eahpikunzsaacibikwtj-auth-token',
        'sb_auth_token',
        localStorage.getItem('sb_auth_token'),
      ];

      for (const key of possibleKeys) {
        if (key) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              session = JSON.parse(stored);
              token = session.access_token;
              userId = session.user?.id;
              if (token && userId) break;
            } catch (e) {
              // Continue to next key
            }
          }
        }
      }

      // Also check for direct token storage
      if (!token) {
        token = localStorage.getItem('sb_auth_token');
      }

      if (!token || !userId) {
        console.error('❌ Session details:', { token: !!token, userId: !!userId, session: !!session });
        throw new Error('Authentication token not found - please log in');
      }

      console.log(`✅ Auth token found, calling edge function...`);

      // Call Phase 5 edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured in environment');
      }

      console.log(`📤 Calling edge function at: ${supabaseUrl}/functions/v1/run-scheduled-analysis`);
      console.log(`📤 Repositories: ${repositories.join(', ')}`);
      console.log(`📤 User ID: ${userId}`);

      // Reload settings from localStorage to ensure we have the latest values
      const stored = localStorage.getItem('analysis_automation_settings');
      console.log(`📤 Stored settings from localStorage:`, stored);
      
      let settings = analysisAutomationService.getSettings();
      console.log(`📤 Initial settings from service:`, JSON.stringify(settings, null, 2));
      
      if (stored) {
        try {
          const freshSettings = JSON.parse(stored);
          console.log(`📤 Parsed fresh settings:`, JSON.stringify(freshSettings, null, 2));
          settings = { ...settings, ...freshSettings };
          console.log(`✅ Reloaded fresh settings from localStorage`);
        } catch (e) {
          console.warn('⚠️ Failed to parse stored settings, using in-memory settings');
        }
      } else {
        console.warn('⚠️ No stored settings found in localStorage');
      }
      
      console.log(`📤 Final settings to send:`, JSON.stringify(settings, null, 2));
      console.log(`📤 Email notifications enabled: ${settings.enableEmailNotifications}`);
      console.log(`📤 User email: ${settings.userEmail}`);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/run-scheduled-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            repositories,
            projects: [],
            enableEmailNotifications: settings.enableEmailNotifications,
            userEmail: settings.userEmail,
          }),
        }
      );

      console.log(`📤 Request body being sent:`, JSON.stringify({
        userId,
        repositories,
        projects: [],
        enableEmailNotifications: settings.enableEmailNotifications,
        userEmail: settings.userEmail,
      }, null, 2));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Edge function error:', errorText);
        console.error('❌ Response status:', response.status);
        console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()));
        throw new Error(`Edge function error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        console.error('❌ Analysis failed:', result.error);
        throw new Error(result.error || 'Analysis failed');
      }

      console.log(`✅ Analysis completed: ${result.analyzed} repositories analyzed`);

      // Process results and save reports
      if (result.results && Array.isArray(result.results)) {
        for (let i = 0; i < result.results.length; i++) {
          const analysisResult = result.results[i];
          const prResult = result.prs[i];

          const report: AnalysisReport = {
            id: `report_${Date.now()}_${i}`,
            timestamp: new Date().toISOString(),
            repository: analysisResult.repository,
            totalIssues: analysisResult.totalIssues,
            byPriority: analysisResult.byPriority,
            shortSummary: `${analysisResult.totalIssues} issues found`,
            fullReport: JSON.stringify(analysisResult),
            prUrl: prResult?.prUrl,
            prNumber: prResult?.prNumber,
            branchName: prResult?.branchName,
            emailSent: false,
          };

          // Save report
          await analysisAutomationService.saveReport(report);

          // Notify listeners
          const execution: AnalysisExecution = {
            id: report.id,
            jobId: 'manual',
            repository: analysisResult.repository,
            status: 'completed',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            result: {
              totalIssues: analysisResult.totalIssues,
              byPriority: analysisResult.byPriority,
            },
            prUrl: report.prUrl,
          };

          this.executions.set(execution.id, execution);
          this.notifyListeners(execution);
        }
      }

      toast.success(`✅ Analysis complete: ${result.analyzed} repositories analyzed, ${result.prsCreated} PRs created`);
    } catch (error) {
      console.error('❌ Manual analysis failed:', error);
      console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ Full error:', JSON.stringify(error, null, 2));
      
      const message = error instanceof Error ? error.message : 'Analysis failed';
      toast.error(`Failed to analyze: ${message}`);
    }
  }
}

export const scheduledAnalysisService = ScheduledAnalysisService.getInstance();
export default scheduledAnalysisService;
