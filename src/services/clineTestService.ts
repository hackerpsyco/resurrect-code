import { getAIConfig, AIService } from './aiService';

export async function testClineSetup(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    // Check if AI config exists
    const config = getAIConfig();
    if (!config) {
      return {
        success: false,
        message: 'No AI configuration found. Please configure an AI provider first.',
      };
    }

    console.log('AI Config found:', { provider: config.provider, model: config.model });

    // Test AI service initialization
    let aiService: AIService;
    try {
      aiService = new AIService(config.provider, config.apiKey, config.model);
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize AI service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { config: { provider: config.provider, model: config.model } }
      };
    }

    // Test a simple AI call
    try {
      const testMessages = [
        { role: 'system' as const, content: 'You are a helpful assistant. Respond with exactly "TEST_SUCCESS" and nothing else.' },
        { role: 'user' as const, content: 'Test message' }
      ];

      let response = '';
      let hasResponse = false;

      // Use a timeout to prevent hanging
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI service timeout after 10 seconds')), 10000)
      );

      const streamPromise = (async () => {
        for await (const chunk of aiService.streamChat(testMessages)) {
          if (!chunk.done && chunk.content) {
            response += chunk.content;
            hasResponse = true;
          }
          if (chunk.done) {
            break;
          }
        }
      })();

      await Promise.race([streamPromise, timeout]);

      if (!hasResponse) {
        return {
          success: false,
          message: 'AI service did not respond to test message',
          details: { config: { provider: config.provider, model: config.model } }
        };
      }

      return {
        success: true,
        message: `AI service working correctly with ${config.provider}`,
        details: { 
          provider: config.provider, 
          model: config.model, 
          testResponse: response.substring(0, 100) + (response.length > 100 ? '...' : '')
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `AI service test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { 
          config: { provider: config.provider, model: config.model },
          error: error instanceof Error ? error.stack : String(error)
        }
      };
    }

  } catch (error) {
    return {
      success: false,
      message: `Setup test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : String(error) }
    };
  }
}

export async function debugClineIssue(): Promise<void> {
  console.log('🔍 Debugging Cline setup...');
  
  const result = await testClineSetup();
  
  if (result.success) {
    console.log('✅ Cline setup test passed:', result.message);
    console.log('Details:', result.details);
  } else {
    console.error('❌ Cline setup test failed:', result.message);
    console.error('Details:', result.details);
  }
}