import { AIProvider } from "@/components/dashboard/ide/AIProviderSelector";
export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIStreamResponse {
  content: string;
  done: boolean;
}

export class AIService {
  private provider: AIProvider;
  private apiKey: string;
  private model: string;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private rateLimitWindow: number = 60000; // 1 minute window
  private maxRequestsPerWindow: number = 15; // Conservative limit for free tier

  constructor(provider: AIProvider, apiKey: string, model: string) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.model = model;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now - this.lastRequestTime > this.rateLimitWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
    
    // Check if we're hitting rate limits
    if (this.requestCount >= this.maxRequestsPerWindow) {
      const waitTime = this.rateLimitWindow - (now - this.lastRequestTime);
      console.log(`⏳ Rate limit reached, waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }
    
    // Add delay between requests to be gentle on the API
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = 2000; // 2 seconds between requests
    
    if (timeSinceLastRequest < minDelay) {
      const delay = minDelay - timeSinceLastRequest;
      console.log(`⏳ Adding ${delay}ms delay between requests...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.requestCount++;
    this.lastRequestTime = Date.now();
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Check if it's a rate limit error
        const isRateLimit = error instanceof Error && (
          error.message.includes('429') ||
          error.message.includes('quota') ||
          error.message.includes('limit') ||
          error.message.includes('Rate Limited')
        );
        
        if (isRateLimit) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          console.log(`🔄 Rate limited, retrying in ${Math.ceil(delay / 1000)}s (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // For non-rate-limit errors, shorter delay
          const delay = 500 * (attempt + 1);
          console.log(`🔄 Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  async *streamChat(messages: AIMessage[]): AsyncGenerator<AIStreamResponse> {
    switch (this.provider) {

      case "gemini":
        yield* this.streamGemini(messages);
        break;
      case "openai":
        yield* this.streamOpenAI(messages);
        break;
      case "claude":
        yield* this.streamClaude(messages);
        break;
      case "lovable":
        yield* this.streamLovable(messages);
        break;
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }



  private async *streamGemini(messages: AIMessage[]): AsyncGenerator<AIStreamResponse> {
    console.log('🔍 Starting Gemini API call with model:', this.model);
    
    // Enforce rate limiting before making request
    await this.enforceRateLimit();
    
    try {
      // Make the API call directly here for simplicity
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

      // Convert messages to Gemini format
      const contents = [];
      let systemInstruction = '';

      for (const message of messages) {
        if (message.role === 'system') {
          systemInstruction = message.content;
        } else {
          contents.push({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }]
          });
        }
      }

      const requestBody: any = {
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topK: 40,
          topP: 0.95,
        },
      };

      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      console.log('📤 Gemini request:', { url: url.replace(this.apiKey, 'API_KEY_HIDDEN'), body: requestBody });

      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Gemini response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Gemini API error response:", errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Gemini response received');

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error('❌ No text content in Gemini response:', data);
        throw new Error("No content in Gemini response");
      }

      console.log('✅ Gemini response success, length:', text.length);
      console.log('📝 Response preview:', text.substring(0, 100) + '...');

      // Yield the response
      yield { content: text, done: false };
      yield { content: "", done: true };

    } catch (error) {
      console.error('❌ Gemini API call failed:', error);
      
      // Provide a fallback response
      const fallbackMessage = `I apologize, but I'm currently unable to process your request due to an API issue. 

Error: ${error instanceof Error ? error.message : 'Unknown error'}

For the request "${messages[messages.length - 1]?.content}", here's a basic example:

\`\`\`javascript
function add(a, b) {
    return a + b;
}

// Usage
const result = add(5, 3);
console.log(result); // 8
\`\`\`

Please try again in a few moments.`;

      yield { content: fallbackMessage, done: false };
      yield { content: "", done: true };
    }
  }

  private async *executeGeminiStreamRequest(messages: AIMessage[]): AsyncGenerator<AIStreamResponse> {
    // Gemini doesn't have true streaming like OpenAI, so let's use the regular endpoint and simulate streaming
    console.log('🔄 Using Gemini non-streaming API (simulating streaming)...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    // Convert messages to Gemini format
    const contents = [];
    let systemInstruction = '';

    for (const message of messages) {
      if (message.role === 'system') {
        systemInstruction = message.content;
      } else {
        contents.push({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }]
        });
      }
    }

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096, // Reduced for free tier
        topK: 40,
        topP: 0.95,
      },
    };

    // Add system instruction if present
    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    console.log('📤 Gemini request:', { url: url.replace(this.apiKey, 'API_KEY_HIDDEN'), body: requestBody });

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Gemini response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini API error response:", errorText);
      
      // Parse error for specific handling
      if (response.status === 429) {
        throw new Error(`Rate Limited: ${errorText}`);
      } else if (response.status === 403) {
        throw new Error(`API Key Invalid: ${errorText}`);
      } else if (response.status === 400) {
        throw new Error(`Bad Request: ${errorText}`);
      } else {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
    }

    // Get the full response and simulate streaming
    const data = await response.json();
    console.log('📦 Gemini response received');

    // Extract the text content
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('❌ No text content in Gemini response:', data);
      throw new Error("No content in Gemini response");
    }

    console.log('✅ Gemini response success, length:', text.length);
    console.log('📝 Full response:', text.substring(0, 200) + '...');

    // Return a simple async generator that yields the full response
    return (async function* () {
      // Yield the full response at once (we can add chunking later if needed)
      yield { content: text, done: false };
      yield { content: "", done: true };
    })();
  }

  private async *fallbackGeminiNonStreaming(messages: AIMessage[]): AsyncGenerator<AIStreamResponse> {
    console.log('🔄 Using Gemini non-streaming fallback...');
    
    // Enforce rate limiting for fallback too
    await this.enforceRateLimit();
    
    try {
      const result = await this.retryWithBackoff(async () => {
        return this.executeGeminiNonStreamRequest(messages);
      });
      
      // Simulate streaming by yielding the full response
      yield { content: result, done: false };
      yield { content: "", done: true };
      
    } catch (error) {
      console.error('❌ Gemini non-streaming fallback failed:', error);
      
      // Try with gemini-1.5-flash as final fallback
      if (this.model !== 'gemini-1.5-flash') {
        console.log('🔄 Trying with gemini-1.5-flash as final fallback...');
        const originalModel = this.model;
        this.model = 'gemini-1.5-flash';
        
        try {
          const result = await this.retryWithBackoff(async () => {
            return this.executeGeminiNonStreamRequest(messages);
          });
          
          yield { content: result, done: false };
          yield { content: "", done: true };
          return;
        } catch (fallbackError) {
          console.error('❌ Final fallback failed:', fallbackError);
          this.model = originalModel; // Restore original model
        }
      }
      
      // If all else fails, provide a helpful error message
      const errorMessage = this.getGeminiErrorMessage(error);
      yield { content: errorMessage, done: false };
      yield { content: "", done: true };
    }
  }

  private async executeGeminiNonStreamRequest(messages: AIMessage[]): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    // Convert messages to Gemini format
    const contents = [];
    let systemInstruction = '';

    for (const message of messages) {
      if (message.role === 'system') {
        systemInstruction = message.content;
      } else {
        contents.push({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }]
        });
      }
    }

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096, // Reduced for free tier
        topK: 40,
        topP: 0.95,
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    console.log('📤 Gemini non-streaming request:', { 
      url: url.replace(this.apiKey, 'API_KEY_HIDDEN'), 
      body: requestBody 
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Gemini non-streaming response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini non-streaming API error:", errorText);
      
      // Parse error for specific handling
      if (response.status === 429) {
        throw new Error(`Rate Limited: ${errorText}`);
      } else if (response.status === 403) {
        throw new Error(`API Key Invalid: ${errorText}`);
      } else if (response.status === 400) {
        throw new Error(`Bad Request: ${errorText}`);
      } else {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('📦 Gemini non-streaming response received');

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      console.log('✅ Gemini non-streaming success, response length:', text.length);
      return text;
    } else {
      console.error('❌ No text content in Gemini response:', data);
      throw new Error("No content in Gemini response");
    }
  }

  private getGeminiErrorMessage(error: any): string {
    const errorStr = error?.message || String(error);
    
    if (errorStr.includes('Rate Limited') || errorStr.includes('429')) {
      return `⚠️ **Rate Limit Exceeded**

The Gemini API is currently rate limited. This is common with free tier usage.

**What you can try:**
1. Wait a few minutes and try again
2. Use shorter, simpler prompts
3. Consider upgrading to a paid Gemini API plan for higher limits

**Current Status:** Free tier limits reached. Please try again later.`;
    }
    
    if (errorStr.includes('API Key Invalid') || errorStr.includes('403')) {
      return `⚠️ **API Key Issue**

There's an issue with the Gemini API key configuration.

**What to check:**
1. Verify the API key is correct
2. Ensure the API key has Gemini API access enabled
3. Check if billing is required for your usage level

**Current Error:** ${errorStr}`;
    }
    
    if (errorStr.includes('quota') || errorStr.includes('limit')) {
      return `⚠️ **Quota Exceeded**

Your Gemini API quota has been exceeded.

**Solutions:**
1. Wait for quota reset (usually daily)
2. Check your Google Cloud Console for quota limits
3. Consider upgrading your plan

**Current Error:** ${errorStr}`;
    }
    
    return `⚠️ **Gemini API Error**

An error occurred while communicating with the Gemini API.

**Error Details:** ${errorStr}

**Suggestions:**
1. Check your internet connection
2. Verify API key is valid
3. Try again in a few moments
4. Consider using a different AI provider temporarily`;
  }

  private async *streamOpenAI(messages: AIMessage[]): AsyncGenerator<AIStreamResponse> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("No response body");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim() && line.startsWith("data: "));

      for (const line of lines) {
        const data = line.replace("data: ", "");
        if (data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            yield { content, done: false };
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    yield { content: "", done: true };
  }

  private async *streamClaude(messages: AIMessage[]): AsyncGenerator<AIStreamResponse> {
    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: systemMessage?.content,
        messages: userMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("No response body");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim() && line.startsWith("data: "));

      for (const line of lines) {
        const data = line.replace("data: ", "");

        try {
          const json = JSON.parse(data);
          if (json.type === "content_block_delta") {
            const content = json.delta?.text;
            if (content) {
              yield { content, done: false };
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    yield { content: "", done: true };
  }

  private async *streamLovable(messages: AIMessage[]): AsyncGenerator<AIStreamResponse> {
    // Use Supabase edge function for Lovable AI Gateway
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat-stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages,
          model: this.model,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Lovable AI error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("No response body");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.content) {
            yield { content: json.content, done: false };
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    yield { content: "", done: true };
  }
}

export function getAIConfig(): { provider: AIProvider; apiKey: string; model: string } | null {
  const stored = localStorage.getItem("ai_config");
  if (!stored) return null;
  return JSON.parse(stored);
}
