/**
 * Email Reply Service
 * Handles email replies and triggers GitHub auto-push when user confirms
 */

import { toast } from 'sonner';

export interface EmailReplyAction {
  id: string;
  reportId: string;
  userEmail: string;
  action: 'approve' | 'reject' | 'pending';
  timestamp: string;
  prUrl?: string;
  prCreatedAt?: string;
}

class EmailReplyService {
  private static instance: EmailReplyService;
  private replies: Map<string, EmailReplyAction> = new Map();
  private readonly REPLIES_KEY = 'email_reply_actions';
  private readonly WEBHOOK_PATH = '/api/webhooks/email-reply';

  static getInstance(): EmailReplyService {
    if (!EmailReplyService.instance) {
      EmailReplyService.instance = new EmailReplyService();
    }
    return EmailReplyService.instance;
  }

  constructor() {
    this.loadReplies();
  }

  /**
   * Load replies from localStorage
   */
  private loadReplies() {
    try {
      const stored = localStorage.getItem(this.REPLIES_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.replies = new Map(data);
        console.log(`✅ Loaded ${this.replies.size} email reply actions`);
      }
    } catch (error) {
      console.error('Failed to load replies:', error);
    }
  }

  /**
   * Save replies to localStorage
   */
  private saveReplies() {
    try {
      const data = Array.from(this.replies.entries());
      localStorage.setItem(this.REPLIES_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save replies:', error);
    }
  }

  /**
   * Create email reply action (waiting for user response)
   */
  createReplyAction(reportId: string, userEmail: string): EmailReplyAction {
    const action: EmailReplyAction = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      reportId,
      userEmail,
      action: 'pending',
      timestamp: new Date().toISOString()
    };

    this.replies.set(action.id, action);
    this.saveReplies();

    console.log(`📧 Email reply action created: ${action.id}`);
    return action;
  }

  /**
   * Handle email reply - user approved
   */
  async handleApproval(replyId: string, reportId: string): Promise<boolean> {
    try {
      const reply = this.replies.get(replyId);
      if (!reply) {
        console.error('Reply not found:', replyId);
        return false;
      }

      reply.action = 'approve';
      reply.timestamp = new Date().toISOString();
      this.replies.set(replyId, reply);
      this.saveReplies();

      console.log(`✅ Email reply approved: ${replyId}`);
      toast.success('✅ Analysis approved! Creating GitHub PR...');

      // Trigger GitHub auto-push
      await this.triggerGitHubPush(reportId, reply.userEmail);

      return true;
    } catch (error) {
      console.error('Failed to handle approval:', error);
      toast.error('Failed to process approval');
      return false;
    }
  }

  /**
   * Handle email reply - user rejected
   */
  handleRejection(replyId: string): boolean {
    try {
      const reply = this.replies.get(replyId);
      if (!reply) {
        console.error('Reply not found:', replyId);
        return false;
      }

      reply.action = 'reject';
      reply.timestamp = new Date().toISOString();
      this.replies.set(replyId, reply);
      this.saveReplies();

      console.log(`❌ Email reply rejected: ${replyId}`);
      toast.info('Analysis rejected - no PR will be created');

      return true;
    } catch (error) {
      console.error('Failed to handle rejection:', error);
      return false;
    }
  }

  /**
   * Trigger GitHub auto-push after approval
   */
  private async triggerGitHubPush(reportId: string, userEmail: string): Promise<void> {
    try {
      const backendClientUrl = import.meta.env.VITE_BACKEND_URL;
      const backendClientKey = import.meta.env.VITE_BACKEND_KEY;

      if (!backendClientUrl || !backendClientKey) {
        console.warn('⚠️ BackendClient not configured');
        return;
      }

      // Call BackendClient function to trigger GitHub push
      const response = await fetch(`${backendClientUrl}/functions/v1/trigger-github-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${backendClientKey}`
        },
        body: JSON.stringify({
          reportId,
          userEmail,
          action: 'auto-push'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ GitHub push triggered:', data);
        toast.success('🚀 Pull request created automatically!');
      } else {
        console.error('Failed to trigger GitHub push:', response.statusText);
        toast.error('Failed to create pull request');
      }
    } catch (error) {
      console.error('Error triggering GitHub push:', error);
      toast.error('Error creating pull request');
    }
  }

  /**
   * Get reply action by ID
   */
  getReplyAction(replyId: string): EmailReplyAction | undefined {
    return this.replies.get(replyId);
  }

  /**
   * Get all pending replies
   */
  getPendingReplies(): EmailReplyAction[] {
    return Array.from(this.replies.values()).filter(r => r.action === 'pending');
  }

  /**
   * Get replies for specific report
   */
  getReportReplies(reportId: string): EmailReplyAction[] {
    return Array.from(this.replies.values()).filter(r => r.reportId === reportId);
  }

  /**
   * Generate email reply token
   */
  generateReplyToken(replyId: string): string {
    return btoa(`${replyId}:${Date.now()}`);
  }

  /**
   * Verify email reply token
   */
  verifyReplyToken(token: string): string | null {
    try {
      const decoded = atob(token);
      const [replyId] = decoded.split(':');
      return replyId;
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  }

  /**
   * Get webhook path for email replies
   */
  getWebhookPath(): string {
    return this.WEBHOOK_PATH;
  }

  /**
   * Clear old replies (older than 7 days)
   */
  clearOldReplies() {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let cleared = 0;

    for (const [id, reply] of this.replies.entries()) {
      if (new Date(reply.timestamp).getTime() < sevenDaysAgo) {
        this.replies.delete(id);
        cleared++;
      }
    }

    if (cleared > 0) {
      this.saveReplies();
      console.log(`🧹 Cleared ${cleared} old email replies`);
    }
  }
}

export const emailReplyService = EmailReplyService.getInstance();
export default emailReplyService;
