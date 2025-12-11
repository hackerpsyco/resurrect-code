# Gemini API Rate Limiting Guide

## Overview
The Gemini API free tier has very strict rate limits that can cause "too many requests" errors. This guide explains how our implementation handles these limits and what users can expect.

## Current Rate Limiting Implementation

### 1. Request Throttling
- **Minimum delay**: 2 seconds between requests
- **Rate window**: 60 seconds
- **Max requests per window**: 15 (conservative limit for free tier)
- **Automatic backoff**: Exponential backoff on rate limit errors

### 2. Retry Logic
- **Max retries**: 3 attempts
- **Backoff strategy**: Exponential with jitter
- **Rate limit detection**: Automatic detection of 429 errors
- **Fallback models**: Automatic fallback to gemini-1.5-flash if gemini-2.5-flash fails

### 3. Error Handling
- **Graceful degradation**: Provides helpful error messages instead of crashes
- **User feedback**: Clear explanations of rate limit issues
- **Alternative suggestions**: Recommends waiting periods and usage tips

## API Key Configuration

### Current API Key
```
AIzaSyDRSAYQSZjL-qmIVpuZKShfYxdo8MBliL0
```

### Models Used (in order of preference)
1. `gemini-2.5-flash` (latest free tier model)
2. `gemini-1.5-flash` (fallback free tier model)

## Common Rate Limit Scenarios

### 1. "Too Many Requests" (429 Error)
**Cause**: Exceeded requests per minute limit
**Solution**: Wait 1-2 minutes, then retry
**Prevention**: Use longer delays between requests

### 2. "Quota Exceeded"
**Cause**: Daily/monthly quota reached
**Solution**: Wait for quota reset (usually daily)
**Prevention**: Monitor usage, use shorter prompts

### 3. "Resource Exhausted"
**Cause**: API overloaded or quota issues
**Solution**: Wait 5-10 minutes, try again
**Prevention**: Use off-peak hours when possible

## Best Practices for Users

### 1. Request Frequency
- **Wait between requests**: Allow at least 30 seconds between manual requests
- **Batch operations**: Avoid rapid-fire requests
- **Use wisely**: Free tier is for testing, not production use

### 2. Prompt Optimization
- **Keep prompts short**: Reduces token usage
- **Be specific**: Avoid vague requests that require long responses
- **Single purpose**: One task per request

### 3. Error Recovery
- **Be patient**: Rate limits are temporary
- **Try later**: Wait 5-10 minutes if hitting limits consistently
- **Alternative providers**: Consider OpenAI or Claude for heavy usage

## Technical Implementation Details

### Rate Limiting Class
```typescript
class AIService {
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private rateLimitWindow: number = 60000; // 1 minute
  private maxRequestsPerWindow: number = 15; // Conservative limit
  
  private async enforceRateLimit(): Promise<void> {
    // Implementation handles timing and delays
  }
}
```

### Retry Strategy
```typescript
private async retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  // Exponential backoff with jitter
}
```

## Monitoring and Debugging

### Console Logs
- `⏳ Rate limit reached, waiting Xs...` - Normal rate limiting
- `🔄 Rate limited, retrying in Xs...` - Automatic retry
- `❌ Gemini API error: 429` - API rate limit hit
- `✅ Gemini streaming completed successfully` - Success

### Error Messages
The system provides user-friendly error messages:
- Rate limit explanations
- Suggested wait times
- Alternative actions

## Upgrading from Free Tier

### When to Consider Paid Plans
- Consistent rate limit errors
- Need for higher request volumes
- Production usage requirements
- Real-time applications

### Paid Tier Benefits
- Higher rate limits (60+ requests per minute)
- Larger quotas (daily/monthly)
- Priority access during peak times
- Better SLA guarantees

## Troubleshooting

### If Rate Limits Persist
1. **Check API key**: Ensure it's valid and active
2. **Verify billing**: Some features require billing enabled
3. **Monitor usage**: Check Google Cloud Console for quota usage
4. **Contact support**: For persistent issues with valid keys

### Alternative Solutions
1. **Use different AI provider**: OpenAI, Claude, etc.
2. **Implement request queuing**: For batch operations
3. **Cache responses**: Avoid duplicate requests
4. **Optimize prompts**: Reduce token usage

## Current Status

### Implementation Status
- ✅ Rate limiting implemented
- ✅ Retry logic with backoff
- ✅ Error handling and user feedback
- ✅ Model fallback (2.5-flash → 1.5-flash)
- ✅ Conservative request limits
- ✅ Helpful error messages

### Known Issues
- Free tier limits are very restrictive
- May require 5-10 minute waits between heavy usage
- Some users may need paid plans for regular use

### Recommendations
1. **Test sparingly**: Use the test button only when needed
2. **Be patient**: Allow time between requests
3. **Consider upgrading**: For regular usage, paid plans are recommended
4. **Use alternatives**: Other AI providers may have different limits

This implementation prioritizes reliability and user experience over speed, ensuring that rate limits are handled gracefully rather than causing application crashes.