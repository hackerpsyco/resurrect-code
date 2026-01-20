# Fix "Failed to fetch" Error in Scheduled Analysis

## Error Message
```
Starting analysis via edge function...
Failed to analyze: Failed to fetch
```

## Root Causes

### 1. **Supabase URL Not Configured** ❌
- Environment variable `VITE_SUPABASE_URL` is missing or empty
- Edge function URL cannot be constructed

### 2. **CORS Issues** ❌
- Edge function doesn't allow requests from your domain
- Browser blocks the request

### 3. **Network Issues** ❌
- Internet connection lost
- Firewall blocking the request
- VPN issues

### 4. **Invalid Auth Token** ❌
- Token expired
- Token format incorrect
- Token not found in localStorage

### 5. **Edge Function Not Deployed** ❌
- Edge function doesn't exist
- Edge function is disabled
- Supabase project not configured

## Step-by-Step Debugging

### Step 1: Check Environment Variables

**What to do:**
1. Open `.env` file in your project
2. Verify `VITE_SUPABASE_URL` is set:
   ```
   VITE_SUPABASE_URL=https://eahpikunzsaacibikwtj.supabase.co
   ```

**If missing:**
- Add the URL from your Supabase project dashboard
- Restart the development server

### Step 2: Check Browser Console

**What to do:**
1. Open DevTools (F12)
2. Go to Console tab
3. Try to trigger analysis
4. Look for detailed error logs:
   ```
   📤 Calling edge function at: https://eahpikunzsaacibikwtj.supabase.co/functions/v1/run-scheduled-analysis
   📤 Repositories: owner/repo
   📤 User ID: [userId]
   ❌ Edge function error: [error details]
   ❌ Response status: [status code]
   ```

**Common status codes:**
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (no permission)
- `404` - Not found (edge function doesn't exist)
- `500` - Server error (edge function crashed)
- `0` - Network error (CORS or connection issue)

### Step 3: Verify Auth Token

**In Browser Console:**
```javascript
// Check if auth token exists
const token = localStorage.getItem('sb_auth_token');
console.log('Token exists:', !!token);
console.log('Token:', token ? token.substring(0, 50) + '...' : 'NONE');

// Check if it's valid JSON
if (token) {
  try {
    const parsed = JSON.parse(token);
    console.log('Token is valid JSON');
    console.log('Has access_token:', !!parsed.access_token);
    console.log('Has user.id:', !!parsed.user?.id);
  } catch (e) {
    console.log('Token is NOT valid JSON');
  }
}
```

**If token is missing:**
1. Log out and log back in
2. Check GitHub integration is connected
3. Verify Supabase auth is working

### Step 4: Check Edge Function Exists

**What to do:**
1. Go to Supabase Dashboard
2. Click "Edge Functions" in left sidebar
3. Look for `run-scheduled-analysis` function
4. Click on it
5. Check if it's enabled (green toggle)

**If missing:**
- Edge function needs to be deployed
- Check Supabase project is correct

### Step 5: Check CORS Configuration

**What to do:**
1. Go to Supabase Dashboard
2. Click "Edge Functions"
3. Click "run-scheduled-analysis"
4. Check the function code
5. Look for CORS headers:
   ```typescript
   const corsHeaders = {
     "Access-Control-Allow-Origin": "*",
     "Access-Control-Allow-Methods": "POST, OPTIONS",
     "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
   };
   ```

**If CORS headers are missing:**
- Add them to the edge function
- Redeploy the function

### Step 6: Test Edge Function Directly

**Using curl:**
```bash
curl -X POST \
  https://eahpikunzsaacibikwtj.supabase.co/functions/v1/run-scheduled-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "YOUR_USER_ID",
    "repositories": ["owner/repo"],
    "projects": []
  }'
```

**Using Postman:**
1. Create new POST request
2. URL: `https://eahpikunzsaacibikwtj.supabase.co/functions/v1/run-scheduled-analysis`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_TOKEN`
4. Body:
   ```json
   {
     "userId": "YOUR_USER_ID",
     "repositories": ["owner/repo"],
     "projects": []
   }
   ```
5. Send request
6. Check response

### Step 7: Check Edge Function Logs

**What to do:**
1. Go to Supabase Dashboard
2. Click "Edge Functions"
3. Click "run-scheduled-analysis"
4. Click "Logs" tab
5. Look for recent invocations
6. Check for error messages

**Expected logs:**
```
🚀 Starting scheduled analysis for user [userId]
📦 Repositories: owner/repo
✅ Settings loaded
✅ GitHub token retrieved
📊 Analyzing repository: owner/repo
✅ Analysis complete: X issues found
```

**If you see errors:**
- Check the error message
- Look for missing settings or tokens
- Check database connection

## Common Fixes

### Fix 1: Restart Development Server
```bash
# Stop the server (Ctrl+C)
# Then restart it
npm run dev
```

### Fix 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty cache and hard refresh"

### Fix 3: Log Out and Log Back In
1. Click your profile
2. Click "Log Out"
3. Log back in with GitHub
4. Try analysis again

### Fix 4: Check Network Connection
```javascript
// In browser console
fetch('https://www.google.com')
  .then(() => console.log('Network OK'))
  .catch(() => console.log('Network ERROR'))
```

### Fix 5: Disable VPN/Proxy
- Try disabling VPN
- Try disabling proxy
- Try different network

## Detailed Error Messages

### "Supabase URL not configured in environment"
**Cause:** `VITE_SUPABASE_URL` is not set
**Fix:** Add to `.env` file and restart server

### "Authentication token not found - please log in"
**Cause:** Not logged in or session expired
**Fix:** Log out and log back in

### "Edge function error: 404 Not Found"
**Cause:** Edge function doesn't exist
**Fix:** Deploy edge function to Supabase

### "Edge function error: 401 Unauthorized"
**Cause:** Invalid or expired token
**Fix:** Log out and log back in

### "Edge function error: 500 Internal Server Error"
**Cause:** Edge function crashed
**Fix:** Check edge function logs for details

### "Failed to fetch"
**Cause:** Network error or CORS issue
**Fix:** Check network connection, CORS headers, and firewall

## Testing Checklist

- [ ] `VITE_SUPABASE_URL` is set in `.env`
- [ ] Auth token exists in localStorage
- [ ] Auth token is valid JSON
- [ ] Auth token has `access_token` field
- [ ] Auth token has `user.id` field
- [ ] Edge function exists in Supabase
- [ ] Edge function is enabled
- [ ] Edge function has CORS headers
- [ ] Network connection is working
- [ ] VPN/Proxy is disabled
- [ ] Browser cache is cleared
- [ ] Development server is restarted

## Console Commands for Debugging

```javascript
// Check Supabase URL
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

// Check auth token
console.log('Auth token:', localStorage.getItem('sb_auth_token'))

// Check settings
import { analysisAutomationService } from '@/services/analysisAutomationService'
console.log('Settings:', analysisAutomationService.getSettings())

// Check scheduler
import { schedulerService } from '@/services/schedulerService'
console.log('Scheduler active:', schedulerService.isActive())

// Manually trigger analysis
import { scheduledAnalysisService } from '@/services/scheduledAnalysisService'
scheduledAnalysisService.triggerManualAnalysis(['owner/repo'])
```

## Next Steps

1. **Check environment variables** (Step 1)
2. **Check browser console** (Step 2)
3. **Verify auth token** (Step 3)
4. **Check edge function exists** (Step 4)
5. **Test edge function directly** (Step 6)
6. **Check edge function logs** (Step 7)

If error persists after these steps, check the edge function logs for specific error messages.
