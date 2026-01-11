/**
 * Gemini Key Service
 * Manages secure storage and validation of Gemini API keys
 */

export interface GeminiKeyConfig {
  apiKey: string;
  model: string;
  lastUpdated: Date;
}

class GeminiKeyService {
  private readonly STORAGE_KEY = 'gemini_config';
  private readonly MASK_LENGTH = 4;

  /**
   * Set and validate Gemini API key
   */
  async setApiKey(key: string, model: string = 'gemini-1.5-flash'): Promise<boolean> {
    try {
      // Validate key format (should start with 'AIza' for Google API keys)
      if (!key || key.length < 20) {
        console.error('❌ Invalid API key format');
        return false;
      }

      // Validate key by making a test request
      const isValid = await this.validateApiKey(key, model);
      if (!isValid) {
        console.error('❌ API key validation failed');
        return false;
      }

      // Store encrypted key
      const config: GeminiKeyConfig = {
        apiKey: this.encryptKey(key),
        model,
        lastUpdated: new Date(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
      console.log('✅ Gemini API key saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error setting API key:', error);
      return false;
    }
  }

  /**
   * Get decrypted API key
   */
  getApiKey(): string | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const config: GeminiKeyConfig = JSON.parse(stored);
      return this.decryptKey(config.apiKey);
    } catch (error) {
      console.error('❌ Error retrieving API key:', error);
      return null;
    }
  }

  /**
   * Get masked API key for display (show only last 4 characters)
   */
  getMaskedApiKey(): string | null {
    try {
      const key = this.getApiKey();
      if (!key) return null;

      const visible = key.slice(-this.MASK_LENGTH);
      const masked = '*'.repeat(Math.max(0, key.length - this.MASK_LENGTH));
      return `${masked}${visible}`;
    } catch (error) {
      console.error('❌ Error masking API key:', error);
      return null;
    }
  }

  /**
   * Get configured model
   */
  getModel(): string {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return 'gemini-1.5-flash';

      const config: GeminiKeyConfig = JSON.parse(stored);
      return config.model || 'gemini-1.5-flash';
    } catch (error) {
      console.error('❌ Error retrieving model:', error);
      return 'gemini-1.5-flash';
    }
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(key: string, model: string = 'gemini-1.5-flash'): Promise<boolean> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'test' }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100,
          },
        }),
      });

      if (response.status === 403) {
        console.error('❌ Invalid API key (403 Forbidden)');
        return false;
      }

      if (response.status === 429) {
        console.warn('⚠️ Rate limited during validation, but key appears valid');
        return true;
      }

      if (!response.ok) {
        console.error(`❌ API validation failed: ${response.status}`);
        return false;
      }

      console.log('✅ API key validated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error validating API key:', error);
      return false;
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return this.getApiKey() !== null;
  }

  /**
   * Clear API key from storage
   */
  clearApiKey(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ Gemini API key cleared');
    } catch (error) {
      console.error('❌ Error clearing API key:', error);
    }
  }

  /**
   * Simple encryption (base64 encoding - for basic obfuscation)
   * For production, use a proper encryption library
   */
  private encryptKey(key: string): string {
    try {
      return btoa(key);
    } catch (error) {
      console.error('❌ Error encrypting key:', error);
      return key;
    }
  }

  /**
   * Simple decryption (base64 decoding)
   */
  private decryptKey(encrypted: string): string {
    try {
      return atob(encrypted);
    } catch (error) {
      console.error('❌ Error decrypting key:', error);
      return encrypted;
    }
  }

  /**
   * Get configuration object
   */
  getConfig(): GeminiKeyConfig | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const config: GeminiKeyConfig = JSON.parse(stored);
      return {
        ...config,
        apiKey: this.decryptKey(config.apiKey),
      };
    } catch (error) {
      console.error('❌ Error retrieving config:', error);
      return null;
    }
  }
}

// Export singleton instance
export const geminiKeyService = new GeminiKeyService();
