/**
 * User-specific Storage Service
 * Stores user credentials and settings per authenticated user in Supabase database
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
  githubSelectedRepos?: number[];
  vercelSelectedProjects?: string[];
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
      const newUserId = session?.user?.id || null;
      
      if (this.currentUserId !== newUserId) {
        console.log('🔐 User storage updated:', { 
          oldUser: this.currentUserId?.substring(0, 8), 
          newUser: newUserId?.substring(0, 8) 
        });
        
        // Clear localStorage when user changes OR logs out
        if (this.currentUserId && this.currentUserId !== newUserId) {
          this.clearLocalStorage();
        }
        
        this.currentUserId = newUserId;
      }
    });

    // Set initial user ID
    this.initializeUserId();
  }

  private async initializeUserId() {
    const { data: { session } } = await supabase.auth.getSession();
    this.currentUserId = session?.user?.id || null;
  }

  private clearLocalStorage() {
    console.log('🧹 Clearing localStorage for user switch');
    const keysToRemove = [
      'github_token', 'github_user', 'github_selected_repos',
      'vercel_token', 'vercel_user', 'vercel_teams', 'vercel_selected_projects',
      'gemini_api_key', 'is_new_user', 'last_user_email'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Store user credentials securely in Supabase
   */
  async storeCredentials(credentials: UserCredentials): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('No authenticated user - cannot store credentials');
    }

    try {
      console.log('💾 Storing credentials for user:', this.currentUserId.substring(0, 8));
      
      const { error } = await supabase
        .from('user_credentials')
        .upsert(
          {
            user_id: this.currentUserId,
            credentials: credentials,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Failed to store credentials in database:', error);
        throw error;
      }
      
      console.log('✅ Credentials stored successfully');
    } catch (error) {
      console.error('Error storing credentials:', error);
      throw error;
    }
  }

  /**
   * Retrieve user credentials from Supabase
   */
  async getCredentials(): Promise<UserCredentials> {
    if (!this.currentUserId) {
      console.warn('No authenticated user - returning empty credentials');
      return {};
    }

    try {
      const { data, error } = await supabase
        .from('user_credentials')
        .select('credentials')
        .eq('user_id', this.currentUserId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error retrieving credentials:', error);
        return {};
      }

      const credentials = data?.credentials || {};
      console.log('📖 Retrieved credentials for user:', this.currentUserId.substring(0, 8));
      return credentials;
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      return {};
    }
  }

  /**
   * Store user settings in Supabase
   */
  async storeSettings(settings: UserSettings): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('No authenticated user - cannot store settings');
    }

    try {
      console.log('💾 Storing settings for user:', this.currentUserId.substring(0, 8));
      
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: this.currentUserId,
            settings: settings,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Failed to store settings in database:', error);
        throw error;
      }
      
      console.log('✅ Settings stored successfully');
    } catch (error) {
      console.error('Error storing settings:', error);
      throw error;
    }
  }

  /**
   * Retrieve user settings from Supabase
   */
  async getSettings(): Promise<UserSettings> {
    if (!this.currentUserId) {
      console.warn('No authenticated user - returning default settings');
      return {};
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', this.currentUserId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error retrieving settings:', error);
        return {};
      }

      const settings = data?.settings || {};
      console.log('📖 Retrieved settings for user:', this.currentUserId.substring(0, 8));
      return settings;
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
      console.log('🗑️ Clearing all data for user:', this.currentUserId.substring(0, 8));
      
      // Clear from database
      await Promise.all([
        supabase.from('user_credentials').delete().eq('user_id', this.currentUserId),
        supabase.from('user_settings').delete().eq('user_id', this.currentUserId)
      ]);

      // Clear from localStorage
      this.clearLocalStorage();

      console.log('✅ User data cleared successfully');
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

  /**
   * Store GitHub token for current user
   */
  async storeGitHubToken(token: string, selectedRepos: number[] = []): Promise<void> {
    const credentials = await this.getCredentials();
    const settings = await this.getSettings();
    
    await Promise.all([
      this.storeCredentials({ ...credentials, githubToken: token }),
      this.storeSettings({ ...settings, githubSelectedRepos: selectedRepos })
    ]);
    
    // Also store in localStorage for immediate access
    localStorage.setItem('github_token', token);
    localStorage.setItem('github_selected_repos', JSON.stringify(selectedRepos));
  }

  /**
   * Store Vercel token for current user
   */
  async storeVercelToken(token: string, selectedProjects: string[] = []): Promise<void> {
    const credentials = await this.getCredentials();
    const settings = await this.getSettings();
    
    await Promise.all([
      this.storeCredentials({ ...credentials, vercelToken: token }),
      this.storeSettings({ ...settings, vercelSelectedProjects: selectedProjects })
    ]);
    
    // Also store in localStorage for immediate access
    localStorage.setItem('vercel_token', token);
    localStorage.setItem('vercel_selected_projects', JSON.stringify(selectedProjects));
  }

  /**
   * Store Gemini API key for current user
   */
  async storeGeminiApiKey(apiKey: string): Promise<void> {
    const credentials = await this.getCredentials();
    await this.storeCredentials({ ...credentials, geminiApiKey: apiKey });
    
    // Also store in localStorage for immediate access
    localStorage.setItem('gemini_api_key', apiKey);
  }

  /**
   * Load user data into localStorage on login
   */
  async loadUserDataToLocalStorage(): Promise<void> {
    if (!this.currentUserId) return;

    try {
      console.log('📥 Loading user data to localStorage...');
      
      const [credentials, settings] = await Promise.all([
        this.getCredentials(),
        this.getSettings()
      ]);

      // Load credentials to localStorage
      if (credentials.githubToken) {
        localStorage.setItem('github_token', credentials.githubToken);
      }
      if (credentials.vercelToken) {
        localStorage.setItem('vercel_token', credentials.vercelToken);
      }
      if (credentials.geminiApiKey) {
        localStorage.setItem('gemini_api_key', credentials.geminiApiKey);
      }

      // Load settings to localStorage
      if (settings.githubSelectedRepos) {
        localStorage.setItem('github_selected_repos', JSON.stringify(settings.githubSelectedRepos));
      }
      if (settings.vercelSelectedProjects) {
        localStorage.setItem('vercel_selected_projects', JSON.stringify(settings.vercelSelectedProjects));
      }

      console.log('✅ User data loaded to localStorage');
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }
}

export const userStorageService = UserStorageService.getInstance();
export default userStorageService;