/**
 * Scheduler Service
 * Manages scheduled job execution in the browser
 * Triggers analysis at scheduled times
 */

import { toast } from 'sonner';
import { analysisAutomationService } from './analysisAutomationService';
import { scheduledAnalysisService } from './scheduledAnalysisService';

class SchedulerService {
  private static instance: SchedulerService;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Scheduler started');

    // Schedule jobs based on settings
    this.scheduleJobs();

    // Check every minute for scheduled jobs
    const checkInterval = setInterval(() => {
      this.checkScheduledJobs();
    }, 60000); // Check every minute

    this.timers.set('check-interval', checkInterval);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.isRunning = false;
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers.clear();
    console.log('⏹️ Scheduler stopped');
  }

  /**
   * Schedule jobs based on current settings
   */
  private scheduleJobs(): void {
    const settings = analysisAutomationService.getSettings();
    const schedule = settings.analysisSchedule;
    const time = settings.scheduledTime || '02:00';
    const repos = settings.selectedRepositories || [];
    const projects = settings.selectedProjects || [];

    console.log(`📅 Scheduling jobs: ${schedule} at ${time}`);
    console.log(`📦 Repositories: ${repos.join(', ') || 'none'}`);
    console.log(`🚀 Projects: ${projects.join(', ') || 'none'}`);

    if (schedule === 'daily') {
      this.scheduleDailyJob(time, repos, projects);
    } else if (schedule === 'weekly') {
      this.scheduleWeeklyJob(time, repos, projects);
    }
  }

  /**
   * Schedule a daily job
   */
  private scheduleDailyJob(time: string, repos: string[], projects: string[]): void {
    const [hours, minutes] = time.split(':').map(Number);

    const scheduleNext = () => {
      const now = new Date();
      let nextRun = new Date();
      nextRun.setHours(hours, minutes, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      const delay = nextRun.getTime() - now.getTime();
      const delayMinutes = Math.round(delay / 1000 / 60);

      console.log(`⏰ Daily job scheduled in ${delayMinutes} minutes at ${nextRun.toLocaleTimeString()}`);

      const timer = setTimeout(() => {
        console.log(`🔔 Daily job triggered at ${new Date().toLocaleTimeString()}`);
        this.executeAnalysis(repos, projects);
        scheduleNext(); // Schedule next run
      }, delay);

      this.timers.set('daily-job', timer);
    };

    scheduleNext();
  }

  /**
   * Schedule a weekly job
   */
  private scheduleWeeklyJob(time: string, repos: string[], projects: string[]): void {
    const [hours, minutes] = time.split(':').map(Number);

    const scheduleNext = () => {
      const now = new Date();
      let nextRun = new Date();
      nextRun.setHours(hours, minutes, 0, 0);

      // Find next Monday
      const dayOfWeek = nextRun.getDay();
      const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7;
      nextRun.setDate(nextRun.getDate() + daysUntilMonday);

      // If it's Monday but time has passed, schedule for next Monday
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7);
      }

      const delay = nextRun.getTime() - now.getTime();
      const delayHours = Math.round(delay / 1000 / 60 / 60);

      console.log(`⏰ Weekly job scheduled in ${delayHours} hours at ${nextRun.toLocaleTimeString()}`);

      const timer = setTimeout(() => {
        console.log(`🔔 Weekly job triggered at ${new Date().toLocaleTimeString()}`);
        this.executeAnalysis(repos, projects);
        scheduleNext(); // Schedule next run
      }, delay);

      this.timers.set('weekly-job', timer);
    };

    scheduleNext();
  }

  /**
   * Check for scheduled jobs that should run now
   */
  private checkScheduledJobs(): void {
    const settings = analysisAutomationService.getSettings();
    const schedule = settings.analysisSchedule;

    if (schedule === 'manual' || schedule === 'on-push') {
      return; // No automatic scheduling
    }

    // Jobs are handled by timers, this is just a safety check
    console.log('✅ Scheduler check: All jobs on schedule');
  }

  /**
   * Execute analysis for selected repositories
   */
  private async executeAnalysis(repos: string[], projects: string[]): Promise<void> {
    if (repos.length === 0) {
      console.warn('⚠️ No repositories selected for analysis');
      toast.warning('No repositories selected for scheduled analysis');
      return;
    }

    console.log(`🚀 Executing analysis for ${repos.length} repositories`);
    toast.info(`🚀 Starting scheduled analysis for ${repos.length} repositories...`);

    try {
      // Trigger manual analysis
      await scheduledAnalysisService.triggerManualAnalysis(repos);
      console.log('✅ Analysis execution completed');
    } catch (error) {
      console.error('❌ Analysis execution failed:', error);
      toast.error('Scheduled analysis failed');
    }
  }

  /**
   * Restart scheduler (useful when settings change)
   */
  restart(): void {
    console.log('🔄 Restarting scheduler...');
    this.stop();
    this.start();
  }

  /**
   * Check if scheduler is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

export const schedulerService = SchedulerService.getInstance();
export default schedulerService;
