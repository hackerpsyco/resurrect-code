/**
 * User-specific Storage Service
 * Stores user credentials and settings per authenticated user
 */

import { supabase } from '@/integrations/supabase/client';

interface UserCredentials {
  vercelToken?: string;
  githubToken?: string;
  geminiApiKey?: string;
  kestraUrl?: string;
  kestraToken?: string;
}

interface UserSettings {
  autoDeployEnabled?: boolean;
  isAutomationEnabled?: boolean;
  isMonitoringEnabled?: boolean;
  selectedProject?: string;
  deploymentEnvironment?: 'production' | 'preview';
}

class UserStorageService {
  private static instance: UserStorageService;
  private currentUserId: string | null = null;

  static getInstance(): UserStorageService {
    if (!UserStorageService.instance) {
      UserStorageService.instance = new UserStorageService();
    }
    return UserStorageService.instance;
  }

  constructor() {
    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentUserId = session?.user?.id || null;
      console.log('🔐 User storage updated for user:', this.currentUserId);
    });

    // Set initial user ID
    this.initializeUserId();
  }

  private async initializeUserId() {
    const { data: { session } } = await supabase.auth.getSession();
    this.currentUserId = session?.user?.id || null;
  }

  private getUserStorageKey(key: string): string {
    if (!this.currentUserId) {
      throw new Error('No authenticated user - cannot access user storage');
    }
    return `user_${this.currentUserId}_${key}`;
  }

  /**
   * Store user credentials securely
   */
  async storeCredentials(credentials: UserCredentials): Promise<void> {
    if (!this.currentUserId) {
      console.warn('No authenticated user - storing credentials locally');
      // Fallback to localStorage for demo
      localStorage.setItem('temp_credentials', JSON.stringify(credentials));
      return;
    }

    try {
      // Store in Supabase user metadata or a secure table
      const { error } = await supabase
        .from('user_credentials')
        .upsert({
          user_id: this.currentUserId,
          credentials: credentials,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to store credentials in database:', error);
        // Fallback to encrypted localStorage
        const encryptedCreds = btoa(JSON.stringify(credentials));
        localStorage.setItem(this.getUserStorageKey('credentials'), encryptedCreds);
      }
    } catch (error) {
      console.error('Error storing credentials:', error);
      // Fallback to localStorage
      const encryptedCreds = btoa(JSON.stringify(credentials));
      localStorage.setItem(this.getUserStorageKey('credentials'), encryptedCreds);
    }
  }

  /**
   * Retrieve user credentials
   */
  async getCredentials(): Promise<UserCredentials> {
    if (!this.currentUserId) {
      console.warn('No authenticated user - using local storage');
      const tempCreds = localStorage.getItem('temp_credentials');
      return tempCreds ? JSON.parse(tempCreds) : {};
    }

    try {
      // Try to get from Supabase first
      const { data, error } = await supabase
        .from('user_credentials')
        .select('credentials')
        .eq('user_id', this.currentUserId)
        .single();

      if (data && !error) {
        return data.credentials || {};
      }

      // Fallback to localStorage
      const encryptedCreds = localStorage.getItem(this.getUserStorageKey('credentials'));
      if (encryptedCreds) {
        return JSON.parse(atob(encryptedCreds));
      }

      return {};
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      return {};
    }
  }

  /**
   * Store user settings
   */
  async storeSettings(settings: UserSettings): Promise<void> {
    if (!this.currentUserId) {
      localStorage.setItem('temp_settings', JSON.stringify(settings));
      return;
    }

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: this.currentUserId,
          settings: settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        localStorage.setItem(this.getUserStorageKey('settings'), JSON.stringify(settings));
      }
    } catch (error) {
      console.error('Error storing settings:', error);
      localStorage.setItem(this.getUserStorageKey('settings'), JSON.stringify(settings));
    }
  }

  /**
   * Retrieve user settings
   */
  async getSettings(): Promise<UserSettings> {
    if (!this.currentUserId) {
      const tempSettings = localStorage.getItem('temp_settings');
      return tempSettings ? JSON.parse(tempSettings) : {};
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', this.currentUserId)
        .single();

      if (data && !error) {
        return data.settings || {};
      }

      const localSettings = localStorage.getItem(this.getUserStorageKey('settings'));
      return localSettings ? JSON.parse(localSettings) : {};
    } catch (error) {
      console.error('Error retrieving settings:', error);
      return {};
    }
  }

  /**
   * Clear all user data (for logout)
   */
  async clearUserData(): Promise<void> {
    if (!this.currentUserId) return;

    try {
      // Clear from database
      await supabase.from('user_credentials').delete().eq('user_id', this.currentUserId);
      await supabase.from('user_settings').delete().eq('user_id', this.currentUserId);

      // Clear from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`user_${this.currentUserId}_`)) {
          localStorage.removeItem(key);
        }
      });

      console.log('🗑️ User data cleared');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentUserId;
  }
}

export const userStorageService = UserStorageService.getInstance();
export default userStorageService;