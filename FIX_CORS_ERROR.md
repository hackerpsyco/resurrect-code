# Fix CORS Error in Scheduled Analysis

## Error Message
```
Access to fetch at 'https://eahpikunzsaacibikwtj.supabase.co/functions/v1/run-scheduled-analysis' 
from origin 'https://www.innoalaxy.in' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
It does not have HTTP ok status
```

## What is CORS?

CORS (Cross-Origin Resource Sharing) is a security feature that prevents websites from making requests to other domains without permission.

When your browser makes a request to a different domain, it first sends an **OPTIONS preflight request** to check if the server allows it.

## Root Cause

The edge function's OPTIONS response was not returning:
1. ✅ Correct CORS headers
2. ❌ HTTP status 200 (was missing or returning error)

## Solution Applied

I've updated all edge functions to properly handle CORS:

### 1. **run-scheduled-analysis** ✅
```typescript
if (req.method === "OPTIONS") {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
```

### 2. **send-analysis-email** ✅
```typescript
if (req.method === "OPTIONS") {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
```

### 3. **analysis-settings** ✅
```typescript
if (req.method === "OPTIONS") {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
```

## What You Need to Do

### Step 1: Redeploy Edge Functions

The edge functions need to be redeployed with the CORS fixes:

**Option A: Using Supabase CLI**
```bash
supabase functions deploy run-scheduled-analysis
supabase functions deploy send-analysis-email
supabase functions deploy analysis-settings
```

**Option B: Using Supabase Dashboard**
1. Go to Supabase Dashboard
2. Click "Edge Functions"
3. For each function:
   - Click the function name
   - Click "Deploy" or "Redeploy"
   - Wait for deployment to complete

### Step 2: Clear Browser Cache

After redeployment, clear your browser cache:
1. Press F12 (DevTools)
2. Right-click the refresh button
3. Select "Empty cache and hard refresh"

### Step 3: Test Again

Try the analysis again:
1. Go to DevOps → Automation
2. Click "Analyze Code" button
3. Check if it works now

## CORS Headers Explained

```typescript
const corsHeaders = {
  // Allow requests from any origin
  "Access-Control-Allow-Origin": "*",
  
  // Allow these HTTP methods
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  
  // Allow these headers in the request
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  
  // Cache preflight response for 24 hours
  "Access-Control-Max-Age": "86400",
};
```

## Preflight Request Flow

```
1. Browser sends OPTIONS request
   ↓
2. Server responds with CORS headers and status 200
   ↓
3. Browser checks if origin is allowed
   ↓
4. If allowed, browser sends actual POST request
   ↓
5. Server processes the request
```

## Verification

After redeployment, you should see in browser console:

**Before (Error):**
```
❌ CORS policy: Response to preflight request doesn't pass access control check
```

**After (Success):**
```
📤 Calling edge function at: https://eahpikunzsaacibikwtj.supabase.co/functions/v1/run-scheduled-analysis
📤 Repositories: owner/repo
📤 User ID: [userId]
✅ Analysis completed: X repositories analyzed
```

## Troubleshooting

### Still Getting CORS Error?

1. **Check deployment status:**
   - Go to Supabase Dashboard
   - Click "Edge Functions"
   - Check if functions show "Deployed" status

2. **Wait for deployment:**
   - Edge functions can take 2-3 minutes to deploy
   - Wait and try again

3. **Clear all caches:**
   - Clear browser cache (Ctrl+Shift+Delete)
   - Clear browser cookies
   - Close and reopen browser

4. **Check function logs:**
   - Go to Supabase Dashboard
   - Click "Edge Functions"
   - Click function name
   - Click "Logs" tab
   - Look for recent invocations

### Different CORS Error?

If you see a different CORS error:

1. **"No 'Access-Control-Allow-Origin' header"**
   - Edge function not returning CORS headers
   - Redeploy the function

2. **"Method not allowed"**
   - OPTIONS method not handled
   - Check if OPTIONS handler exists

3. **"Credentials mode is 'include'"**
   - Browser is sending credentials
   - Check Authorization header

## Files Updated

- ✅ `supabase/functions/run-scheduled-analysis/index.ts`
- ✅ `supabase/functions/send-analysis-email/index.ts`
- ✅ `supabase/functions/analysis-settings/index.ts`

## Next Steps

1. **Redeploy edge functions** (using CLI or Dashboard)
2. **Wait 2-3 minutes** for deployment
3. **Clear browser cache** (Ctrl+Shift+Delete)
4. **Test analysis again** (DevOps → Automation → Analyze Code)
5. **Check browser console** for success logs

## Testing Checklist

- [ ] Edge functions redeployed
- [ ] Deployment completed (check status)
- [ ] Browser cache cleared
- [ ] Browser restarted
- [ ] Analysis triggered
- [ ] No CORS errors in console
- [ ] Analysis completes successfully

## Common Issues

| Issue | Solution |
|-------|----------|
| Still getting CORS error | Wait 2-3 minutes, redeploy again |
| Functions show "Deploying" | Wait for deployment to complete |
| Browser still shows error | Clear cache and restart browser |
| Different error now | Check edge function logs |

## Support

If CORS error persists after these steps:

1. Check edge function logs for specific errors
2. Verify CORS headers are in the function code
3. Try accessing edge function directly with curl
4. Contact Supabase support

## Reference

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Supabase: Edge Functions CORS](https://supabase.com/docs/guides/functions/cors)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
