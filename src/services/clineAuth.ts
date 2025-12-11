export interface ClineAuthConfig {
  apiKey: string;
  provider: 'anthropic' | 'openai' | 'azure' | 'local';
  baseUrl?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ClineUser {
  id: string;
  email: string;
  name: string;
  provider: string;
  isAuthenticated: boolean;
  subscription?: {
    plan: 'free' | 'pro' | 'enterprise';
    tokensUsed: number;
    tokensLimit: number;
    resetDate: string;
  };
}

class ClineAuthService {
  private config: ClineAuthConfig | null = null;
  private user: ClineUser | null = null;
  private isInitialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedConfig = localStorage.getItem('cline-auth-config');
      const savedUser = localStorage.getItem('cline-user');
      
      if (savedConfig) {
        this.config = JSON.parse(savedConfig);
      }
      
      if (savedUser) {
        this.user = JSON.parse(savedUser);
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to load Cline auth from storage:', error);
      this.isInitialized = true;
    }
  }

  private saveToStorage() {
    try {
      if (this.config) {
        localStorage.setItem('cline-auth-config', JSON.stringify(this.config));
      }
      if (this.user) {
        localStorage.setItem('cline-user', JSON.stringify(this.user));
      }
    } catch (error) {
      console.error('Failed to save Cline auth to storage:', error);
    }
  }

  async authenticate(provider: 'anthropic' | 'openai' | 'azure' | 'local', apiKey: string, options?: {
    baseUrl?: string;
    model?: string;
  }): Promise<{ success: boolean; message: string; user?: ClineUser }> {
    try {
      // Validate API key format
      if (!apiKey || apiKey.length < 10) {
        return { success: false, message: 'Invalid API key format' };
      }

      // Set default models based on provider
      const defaultModels = {
        anthropic: 'claude-3-5-sonnet-20241022',
        openai: 'gpt-4-turbo-preview',
        azure: 'gpt-4',
        local: 'llama-3.1-70b'
      };

      const config: ClineAuthConfig = {
        apiKey,
        provider,
        baseUrl: options?.baseUrl || this.getDefaultBaseUrl(provider),
        model: options?.model || defaultModels[provider],
        maxTokens: 4096,
        temperature: 0.7
      };

      // Test the API connection
      const testResult = await this.testApiConnection(config);
      if (!testResult.success) {
        return { success: false, message: testResult.message };
      }

      // Create user object
      const user: ClineUser = {
        id: `cline_${Date.now()}`,
        email: 'user@example.com', // In real app, get from OAuth
        name: 'Cline User',
        provider,
        isAuthenticated: true,
        subscription: {
          plan: 'pro', // Default to pro for demo
          tokensUsed: 0,
          tokensLimit: 100000,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      this.config = config;
      this.user = user;
      this.saveToStorage();

      return { 
        success: true, 
        message: `Successfully authenticated with ${provider}`, 
        user 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  private getDefaultBaseUrl(provider: string): string {
    const urls = {
      anthropic: 'https://api.anthropic.com',
      openai: 'https://api.openai.com/v1',
      azure: 'https://your-resource.openai.azure.com',
      local: 'http://localhost:11434'
    };
    return urls[provider as keyof typeof urls] || '';
  }

  private async testApiConnection(config: ClineAuthConfig): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate API test - in real app, make actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate different responses based on provider
      if (config.provider === 'anthropic' && !config.apiKey.startsWith('sk-ant-')) {
        return { success: false, message: 'Invalid Anthropic API key format' };
      }
      
      if (config.provider === 'openai' && !config.apiKey.startsWith('sk-')) {
        return { success: false, message: 'Invalid OpenAI API key format' };
      }

      return { success: true, message: 'API connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: 'Failed to connect to API. Please check your credentials and network connection.' 
      };
    }
  }

  async signOut(): Promise<void> {
    this.config = null;
    this.user = null;
    localStorage.removeItem('cline-auth-config');
    localStorage.removeItem('cline-user');
  }

  getConfig(): ClineAuthConfig | null {
    return this.config;
  }

  getUser(): ClineUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.user?.isAuthenticated || false;
  }

  async updateConfig(updates: Partial<ClineAuthConfig>): Promise<void> {
    if (this.config) {
      this.config = { ...this.config, ...updates };
      this.saveToStorage();
    }
  }

  async getUsageStats(): Promise<{
    tokensUsed: number;
    tokensLimit: number;
    resetDate: string;
    percentUsed: number;
  }> {
    const subscription = this.user?.subscription;
    if (!subscription) {
      return {
        tokensUsed: 0,
        tokensLimit: 0,
        resetDate: new Date().toISOString(),
        percentUsed: 0
      };
    }

    return {
      tokensUsed: subscription.tokensUsed,
      tokensLimit: subscription.tokensLimit,
      resetDate: subscription.resetDate,
      percentUsed: (subscription.tokensUsed / subscription.tokensLimit) * 100
    };
  }

  async incrementTokenUsage(tokens: number): Promise<void> {
    if (this.user?.subscription) {
      this.user.subscription.tokensUsed += tokens;
      this.saveToStorage();
    }
  }

  getAvailableProviders(): Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    requiresApiKey: boolean;
  }> {
    return [
      {
        id: 'anthropic',
        name: 'Anthropic Claude',
        description: 'Claude 3.5 Sonnet - Best for coding tasks',
        icon: '🧠',
        requiresApiKey: true
      },
      {
        id: 'openai',
        name: 'OpenAI GPT-4',
        description: 'GPT-4 Turbo - Versatile AI assistant',
        icon: '🤖',
        requiresApiKey: true
      },
      {
        id: 'azure',
        name: 'Azure OpenAI',
        description: 'Enterprise-grade OpenAI models',
        icon: '☁️',
        requiresApiKey: true
      },
      {
        id: 'local',
        name: 'Local Model',
        description: 'Run models locally with Ollama',
        icon: '💻',
        requiresApiKey: false
      }
    ];
  }
}

export const clineAuth = new ClineAuthService();