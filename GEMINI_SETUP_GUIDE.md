# Gemini API Setup Guide for Cline (Free Tier)

## Quick Setup (Browser Console Method)

### Step 1: Open Browser Console
1. Press `F12` to open DevTools
2. Go to the **Console** tab

### Step 2: Run Setup Command
Copy and paste this command in the console:

```javascript
// Quick Gemini Free Tier setup
const setupGemini = async () => {
  const apiKey = 'AIzaSyDTxpPj-2Z5OG-aoMqB_fx2KoVNSHfBe2I';
  
  console.log('🚀 Setting up Gemini 2.5 Flash (Free Tier) for Cline...');
  
  // Save configuration with latest free tier model
  const config = {
    provider: 'gemini',
    apiKey: apiKey,
    model: 'gemini-2.5-flash'  // Latest free tier model
  };
  
  localStorage.setItem('ai_config', JSON.stringify(config));
  console.log('✅ Gemini 2.5 Flash configuration saved!');
  
  // Test the API with latest free tier model
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Say "GEMINI_2.5_FLASH_WORKING" if you can respond.' }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
      console.log('✅ Gemini 2.5 Flash API test successful!');
      console.log('📝 Response:', text);
      alert('✅ Gemini 2.5 Flash (Free Tier) configured successfully! Please refresh the page.');
    } else {
      const errorText = await response.text();
      console.error('❌ Gemini API test failed:', response.status, response.statusText, errorText);
      alert('❌ Gemini API test failed. Check console for details.');
    }
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    alert('❌ Gemini API error. Check console for details.');
  }
};

setupGemini();
```

### Step 3: Refresh Page
After seeing the success message, **refresh the page** to activate the Gemini API.

## Manual Setup (UI Method)

### Step 1: Open Cline Settings
1. Go to the **Dashboard**
2. Open any project to access the **IDE**
3. Click the **Cline AI** tab
4. Click the **Settings** button (⚙️)

### Step 2: Configure Gemini
1. **Provider**: Select "Google Gemini"
2. **API Key**: Enter `AIzaSyDTxpPj-2Z5OG-aoMqB_fx2KoVNSHfBe2I`
3. **Model**: Select "gemini-2.5-flash (Free Tier - Latest)"
4. Click **Save Configuration**

### Step 3: Test Setup
1. Click the **🔍 (test)** button in Cline header
2. Check the console for test results
3. Look for "✅ Cline setup test passed" message

## Testing Cline with Gemini

### Test 1: Quick Actions
1. Open a demo file (demo.py, demo.ts)
2. Click **"Explain Code"** quick action
3. Watch for streaming response

### Test 2: Custom Request
1. Type in the input field: "Create a simple React component"
2. Press Enter or click Send
3. Watch for AI-generated code

### Test 3: Error Fixing
1. Open demo.py
2. Click **"Fix Errors"** (if any errors exist)
3. See AI suggestions for fixes

## Expected Console Output

### Success Messages:
```
🚀 Setting up Gemini API for Cline...
✅ Gemini configuration saved!
✅ Gemini API test successful!
Cline AI service initialized with provider: gemini
Creating Cline task: { type: 'explain_code', ... }
✅ Task completed successfully
```

### Error Messages:
```
❌ Gemini API test failed: 400 Bad Request
❌ Invalid API key
❌ API quota exceeded
❌ Network error
```

## Troubleshooting

### Issue 1: API Key Invalid
- **Error**: "Invalid API key"
- **Solution**: Verify the API key is correct and active

### Issue 2: Quota Exceeded
- **Error**: "API quota exceeded"
- **Solution**: Check your Google Cloud Console for API limits

### Issue 3: Network Issues
- **Error**: "Network error" or "Failed to fetch"
- **Solution**: Check internet connection and firewall settings

### Issue 4: CORS Issues
- **Error**: "CORS policy" errors
- **Solution**: This is normal for direct API calls from browser

## Verification Steps

### 1. Check Configuration
```javascript
// Run in console to verify config
console.log('Current AI Config:', JSON.parse(localStorage.getItem('ai_config') || '{}'));
```

### 2. Test API Directly
```javascript
// Direct API test
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyDTxpPj-2Z5OG-aoMqB_fx2KoVNSHfBe2I', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Hello, are you working?' }] }]
  })
}).then(r => r.json()).then(console.log);
```

### 3. Check Cline Status
```javascript
// Check Cline service status
import { clineApi } from '/src/services/clineApi.ts';
console.log('Cline tasks:', clineApi.getAllTasks());
```

## Features to Test

Once Gemini is configured, test these Cline features:

1. **Code Explanation** - Understand complex code
2. **Code Generation** - Create new functions/components
3. **Error Fixing** - Debug and fix issues
4. **Code Refactoring** - Improve code quality
5. **Test Generation** - Create unit tests
6. **Documentation** - Generate code docs

## Success Indicators

✅ **Configuration saved** - Settings persist after refresh  
✅ **API test passes** - 🔍 button shows success  
✅ **Streaming works** - Real-time responses in Cline  
✅ **Code generation** - AI creates actual code  
✅ **Task completion** - No "failed to complete" errors  

Your Gemini API key should now work with Cline for all AI-powered coding assistance!