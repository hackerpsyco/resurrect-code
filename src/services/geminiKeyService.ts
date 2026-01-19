/**
 * Gemini Key Service - Secure API key management
 * Handles encryption, storage, and retrieval of Gemini API keys
 */

class GeminiKeyService {
  private key: string | null = null;
  private model: string = 'gemini-2.0-flash'; // Default free tier model (updated 2024)
  private readonly STORAGE_KEY = 'gemini_api_key';
  private readonly MODEL_KEY = 'gemini_model';
  private readonly ENCRYPTION_PREFIX = 'enc_';

  constructor() {
    // Load key and model from localStorage on initialization
    this.loadKey();
    this.loadModel();
  }

  /**
   * Load key from localStorage
   */
  private loadKey() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && stored.startsWith(this.ENCRYPTION_PREFIX)) {
        // Decrypt the key (simple base64 encoding for now)
        const encrypted = stored.substring(this.ENCRYPTION_PREFIX.length);
        this.key = atob(encrypted);
      }
    } catch (error) {
      console.error('Failed to load Gemini key:', error);
      this.key = null;
    }
  }

  /**
   * Load model from localStorage
   */
  private loadModel() {
    try {
      const stored = localStorage.getItem(this.MODEL_KEY);
      if (stored) {
        this.model = stored;
      }
    } catch (error) {
      console.error('Failed to load Gemini model:', error);
      this.model = 'gemini-2.0-flash';
    }
  }

  /**
   * Set the Gemini API key
   */
  setKey(apiKey: string) {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('API key cannot be empty');
    }

    // Encrypt the key (simple base64 encoding for now)
    const encrypted = btoa(apiKey);
    const stored = this.ENCRYPTION_PREFIX + encrypted;
    
    localStorage.setItem(this.STORAGE_KEY, stored);
    this.key = apiKey;
    
    console.log('✅ Gemini API key saved');
  }

  /**
   * Get the Gemini API key
   */
  getKey(): string | null {
    return this.key;
  }

  /**
   * Get the Gemini API key (alias for compatibility)
   */
  getApiKey(): string | null {
    return this.key;
  }

  /**
   * Set the Gemini model
   */
  setModel(model: string) {
    if (!model || !model.trim()) {
      throw new Error('Model cannot be empty');
    }
    
    localStorage.setItem(this.MODEL_KEY, model);
    this.model = model;
    
    console.log('✅ Gemini model set to:', model);
  }

  /**
   * Get the Gemini model
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Clear the Gemini API key
   */
  clearKey() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.key = null;
    console.log('✅ Gemini API key cleared');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.key;
  }

  /**
   * Get masked key for display (show only last 4 characters)
   */
  getMaskedKey(): string {
    if (!this.key) return '';
    const length = this.key.length;
    return '*'.repeat(Math.max(0, length - 4)) + this.key.slice(-4);
  }
}

// Export singleton instance
export const geminiKeyService = new GeminiKeyService();
export default geminiKeyService;
