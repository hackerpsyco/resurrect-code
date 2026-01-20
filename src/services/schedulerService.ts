/**
 * Scheduler Service
 * Manages scheduled analysis execution
 * Monitors time and triggers analysis at scheduled intervals
 */

import { scheduledAnalysisService } from './scheduledAnalysisService';
import { analysisAutomationService } from './analysisAutomationService';

class SchedulerService {
  private static instance: SchedulerService;
  private activeState = false;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private lastRunTime: string | null = null;

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
    if (this.activeState) {
      console.log('⚠️ Scheduler already active');
      return;
    }

    console.log('🚀 Starting scheduler service...');
    this.activeState = true;

    // Check every minute if it's time to run analysis
    this.checkInterval = setInterval(() => {
      this.checkScheduledTime();
    }, 60000); // Check every minute

    // Also check immediately
    this.checkScheduledTime();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.activeState) {
      console.log('⚠️ Scheduler already inactive');
      return;
    }

    console.log('⏹️ Stopping scheduler service...');
    this.activeState = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  /**
   * Restart the scheduler
   */
  restart(): void {
    console.log('🔄 Restarting scheduler...');
    this.stop();
    this.start();
  }

  /**
   * Check if scheduler is active
   */
  isActive(): boolean {
    return this.activeState;
  }

  /**
   * Check if it's time to run scheduled analysis
   */
  private checkScheduledTime(): void {
    const settings = analysisAutomationService.getSettings();
    const schedule = settings.analysisSchedule;

    if (schedule === 'manual' || schedule === 'on-push') {
      return; // No automatic scheduling
    }

    const scheduledTime = settings.scheduledTime || '02:00';
    const [hours, minutes] = scheduledTime.split(':').map(Number);

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

    // Prevent running the same analysis twice in the same minute
    if (this.lastRunTime === currentTimeStr) {
      return;
    }

    // Check if current time matches scheduled time (within 1 minute window)
    if (currentHours === hours && currentMinutes === minutes) {
      this.lastRunTime = currentTimeStr;
      
      // Check if this is daily or weekly
      if (schedule === 'daily') {
        this.triggerAnalysis('daily');
      } else if (schedule === 'weekly') {
        // Only trigger on Monday (day 1)
        if (now.getDay() === 1) {
          this.triggerAnalysis('weekly');
        }
      }
    }
  }

  /**
   * Trigger analysis
   */
  private async triggerAnalysis(type: 'daily' | 'weekly'): Promise<void> {
    console.log(`🔔 ${type.toUpperCase()} scheduled analysis triggered`);

    const settings = analysisAutomationService.getSettings();
    const repos = settings.selectedRepositories || [];

    if (repos.length === 0) {
      console.warn('⚠️ No repositories selected for analysis');
      return;
    }

    try {
      await scheduledAnalysisService.triggerManualAnalysis(repos);
    } catch (error) {
      console.error(`❌ Error triggering ${type} analysis:`, error);
    }
  }
}

export const schedulerService = SchedulerService.getInstance();
export default schedulerService;
