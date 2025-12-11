# Cline AI Debugging Guide

## Issue: Tasks Failing to Complete

If you're seeing "Task failed to complete" messages in Cline, here's how to debug and fix the issue:

## Step 1: Test AI Setup

1. **Open the IDE** and go to the Cline AI panel
2. **Click the 🔍 (magnifying glass) button** in the header
3. **Check the console** for detailed error messages
4. **Look at the toast notification** for the test result

## Step 2: Check AI Configuration

### Verify Configuration Exists
1. Click the **Settings** button in Cline panel
2. Ensure you have:
   - ✅ AI Provider selected (OpenAI, Claude, Gemini, etc.)
   - ✅ Valid API key entered
   - ✅ Model selected

### Common Configuration Issues
- **Missing API Key**: Make sure your API key is valid and has credits
- **Wrong Model**: Some models might not be available for your account
- **Network Issues**: Check if you can access the AI provider's API

## Step 3: Check Browser Console

Open browser DevTools (F12) and look for:

### Expected Success Messages
```
Cline AI service initialized with provider: openai
Creating Cline task: { type: 'test', instruction: '...', context: {...} }
✅ Cline setup test passed: AI service working correctly with openai
```

### Common Error Messages

#### 1. No AI Configuration
```
❌ No AI config found, Cline service not initialized
```
**Fix**: Configure AI provider in settings

#### 2. API Key Issues
```
❌ AI service test failed: Unauthorized
❌ AI service test failed: Invalid API key
```
**Fix**: Check your API key and account credits

#### 3. Network/CORS Issues
```
❌ AI service test failed: Failed to fetch
❌ AI service test failed: Network error
```
**Fix**: Check internet connection and firewall settings

#### 4. Rate Limiting
```
❌ AI service test failed: Too many requests
❌ AI service test failed: Rate limit exceeded
```
**Fix**: Wait a few minutes and try again

## Step 4: Provider-Specific Troubleshooting

### OpenAI
- Verify API key at https://platform.openai.com/api-keys
- Check usage limits and billing
- Ensure model (gpt-3.5-turbo, gpt-4) is available

### Claude (Anthropic)
- Verify API key at https://console.anthropic.com/
- Check model availability (claude-3-haiku, claude-3-sonnet)
- Ensure proper headers are set

### Gemini (Google)
- Verify API key at https://makersuite.google.com/app/apikey
- Check model (gemini-pro) availability
- Ensure proper endpoint configuration

### Lovable AI
- Check Supabase configuration
- Verify edge function is deployed
- Check environment variables

## Step 5: Manual Testing

If the automatic test fails, try this manual test:

1. **Open browser console**
2. **Run this command**:
```javascript
// Test AI service directly
import { testClineSetup } from '/src/services/clineTestService.ts';
testClineSetup().then(result => console.log(result));
```

## Step 6: Fallback Mode

If AI service is unavailable, Cline will provide fallback responses with:
- General debugging tips
- Code templates
- Basic suggestions
- Instructions to reconfigure

## Step 7: Reset Configuration

If all else fails:

1. **Clear AI configuration**:
```javascript
localStorage.removeItem('ai_config');
```

2. **Refresh the page**
3. **Reconfigure AI provider** from scratch

## Common Solutions

### Solution 1: API Key Issues
```javascript
// Check if API key is stored
console.log(JSON.parse(localStorage.getItem('ai_config') || '{}'));
```

### Solution 2: Network Issues
- Try a different AI provider
- Check if corporate firewall blocks AI APIs
- Use VPN if needed

### Solution 3: Model Issues
- Try a different model (e.g., gpt-3.5-turbo instead of gpt-4)
- Check model availability in your region

### Solution 4: Browser Issues
- Clear browser cache
- Disable ad blockers
- Try incognito mode

## Debug Commands

Run these in browser console for detailed debugging:

```javascript
// Check current configuration
console.log('AI Config:', JSON.parse(localStorage.getItem('ai_config') || '{}'));

// Test AI service
import { debugClineIssue } from '/src/services/clineTestService.ts';
debugClineIssue();

// Check Cline service state
import { clineApi } from '/src/services/clineApi.ts';
console.log('Active tasks:', clineApi.getAllTasks());
```

## Getting Help

If issues persist:

1. **Check console logs** and copy error messages
2. **Note your AI provider** and model
3. **Try the test button** and share results
4. **Check network tab** in DevTools for failed requests

The enhanced error handling and fallback responses should help identify and resolve most issues with the Cline AI service.