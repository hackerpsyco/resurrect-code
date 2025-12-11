import { AIService } from './aiService';

// Rate limiting state
let lastTestTime = 0;
let testCount = 0;
const TEST_RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_TESTS_PER_WINDOW = 3; // Very conservative for testing

async function enforceTestRateLimit(): Promise<void> {
  const now = Date.now();
  
  // Reset counter if window has passed
  if (now - lastTestTime > TEST_RATE_LIMIT_WINDOW) {
    testCount = 0;
    lastTestTime = now;
  }
  
  // Check if we're hitting rate limits
  if (testCount >= MAX_TESTS_PER_WINDOW) {
    const waitTime = TEST_RATE_LIMIT_WINDOW - (now - lastTestTime);
    console.log(`⏳ Test rate limit reached, waiting ${Math.ceil(waitTime / 1000)}s...`);
    throw new Error(`Test rate limit reached. Please wait ${Math.ceil(waitTime / 1000)} seconds before testing again.`);
  }
  
  testCount++;
  lastTestTime = now;
}

export async function testGeminiAPI(apiKey: string): Promise<{ success: boolean; message: string; response?: string }> {
  try {
    // Enforce rate limiting for tests
    await enforceTestRateLimit();
    
    console.log('🔍 Testing Gemini API with provided key...');
    console.log('🔑 API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
    
    // Add a small delay to be gentle on the API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // First, test the API directly with a simple request (using latest free tier model)
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const testBody = {
      contents: [{
        parts: [{ text: 'Say "GEMINI_WORKING" if you can respond.' }]
      }],
      generationConfig: {
        temperature: 0.1, // Lower temperature for consistent testing
        maxOutputTokens: 50, // Minimal tokens for testing
        topK: 1,
        topP: 0.1
      }
    };

    console.log('📤 Direct API test request:', { 
      url: testUrl.replace(apiKey, 'API_KEY_HIDDEN'), 
      body: testBody 
    });

    const directResponse = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBody)
    });

    console.log('📥 Direct API response status:', directResponse.status, directResponse.statusText);

    if (!directResponse.ok) {
      const errorText = await directResponse.text();
      console.error('❌ Direct API error:', errorText);
      
      let errorMessage = `HTTP ${directResponse.status}: ${directResponse.statusText}`;
      
      if (directResponse.status === 400) {
        errorMessage = 'Bad Request - Check API key format or request structure';
      } else if (directResponse.status === 403) {
        errorMessage = 'Forbidden - API key may be invalid or lacks permissions';
      } else if (directResponse.status === 404) {
        errorMessage = 'Not Found - Check the model name (should be "gemini-2.5-flash" for latest free tier)';
      } else if (directResponse.status === 429) {
        errorMessage = 'Rate Limited - Too many requests. The free tier has very low limits. Please wait several minutes before trying again.';
      }
      
      return {
        success: false,
        message: `Direct API test failed: ${errorMessage}`
      };
    }

    const directData = await directResponse.json();
    console.log('📦 Direct API response received');

    const directText = directData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!directText) {
      return {
        success: false,
        message: 'Direct API test failed: No text content in response'
      };
    }

    console.log('✅ Direct API test successful:', directText);

    // For now, skip the AI service test to avoid additional API calls
    // The direct test is sufficient to verify the API key works
    console.log('✅ Skipping AI service test to conserve API quota');

    return {
      success: true,
      message: `Gemini API working correctly! Direct test successful. Response: "${directText.trim()}"`,
      response: directText.trim()
    };

  } catch (error) {
    console.error('❌ Gemini API test failed:', error);
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Provide specific error guidance
      if (errorMessage.includes('API key') || errorMessage.includes('403')) {
        errorMessage = 'Invalid API key. Please verify your Gemini API key is correct and active.';
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('429')) {
        errorMessage = 'API quota exceeded. The free tier has very strict limits. Please wait at least 5-10 minutes between requests.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'API request timed out. Please try again.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (errorMessage.includes('404')) {
        errorMessage = 'Model not found. Make sure you\'re using "gemini-2.5-flash" for latest free tier.';
      } else if (errorMessage.includes('rate limit')) {
        // This is our internal rate limiting
        return {
          success: false,
          message: errorMessage
        };
      }
    }

    return {
      success: false,
      message: `Gemini API test failed: ${errorMessage}`
    };
  }
}

export async function setupGeminiForCline(apiKey: string): Promise<void> {
  console.log('🚀 Setting up Gemini API for Cline...');
  
  // Test the API first
  const testResult = await testGeminiAPI(apiKey);
  
  if (testResult.success) {
    // Save configuration to localStorage
    const config = {
      provider: 'gemini',
      apiKey: apiKey,
      model: 'gemini-2.5-flash'
    };
    
    localStorage.setItem('ai_config', JSON.stringify(config));
    console.log('✅ Gemini configuration saved successfully!');
    console.log('📝 Test response preview:', testResult.response);
    
    // Don't auto-reload, let user decide
    console.log('✅ Gemini API configured successfully! You can now use Cline with Gemini.');
    
  } else {
    console.error('❌ Gemini setup failed:', testResult.message);
    throw new Error(testResult.message);
  }
}