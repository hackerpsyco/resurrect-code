# Debug: Why Token is Not Saving to Database

## The Problem
- ✅ Token is in browser localStorage
- ❌ Token is NOT in Supabase database
- Even after reconnecting, it's not saving

## Root Cause Analysis

The edge function call is likely failing. Here's why:

1. **Auth token not found** - The code can't find the Supabase auth token
2. **Edge function not deployed** - The `analysis-settings` function might not be active
3. **RLS policy blocking** - Database permissions might be blocking the insert
4. **Network error** - The fetch call is failing silently

## How to Debug

### Step 1: Check Browser Console
1. Press F12
2. Go to Console tab
3. Reconnect GitHub
4. Look for these messages:

**Good signs:**
- "✅ GitHub token saved to user metadata"
- "✅ GitHub token saved to settings table"

**Bad signs:**
- "⚠️ Failed to save to settings table"
- Network errors
- "Failed to fetch"

### Step 2: Check Edge Function Status
1. Go to Supabase Dashboard
2. Click "Edge Functions"
3. Look for `analysis-settings`
4. Should show "Active" (green)
5. If not active, click it and check for errors

### Step 3: Check Database Permissions
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Run this query:

```sql
SELECT * FROM analysis_automation_settings LIMIT 1;
```

If you get an error, the table might have permission issues.

## Direct Solution: Use Supabase Client

Instead of using the edge function, we can save directly using the Supabase client. This is more reliable.

Let me know what errors you see in the browser console, and I'll fix it.

---

**Next action**: 
1. Open browser console (F12)
2. Reconnect GitHub
3. Share any error messages you see
