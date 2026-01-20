# Debug: GitHub Token Not Found in Edge Function

## Current Status
- ✅ Diagnostic shows token is saved in database
- ✅ Service role policy is applied
- ❌ Edge function still can't find the token

## What I Did
Added detailed logging to the edge function to help debug:
1. Logs when querying user_credentials table
2. Logs the query result (error and data)
3. Logs the credentials object structure
4. Added SQL fallback queries

## How to Debug

### Step 1: Trigger Analysis and Check Logs
1. Go to DevOps → Automation
2. Click "Analyze Code"
3. Go to Supabase Dashboard → Functions → run-scheduled-analysis
4. Click on the latest execution
5. Look for logs with these patterns:

**Good logs (token found):**
```
📋 Querying user_credentials table for user: [user-id]
📋 Query result - Error: null Data: {...}
📋 Credentials object: { "credentials": { "githubToken": "ghp_..." } }
✅ GitHub token found in user_credentials table
```

**Bad logs (token not found):**
```
📋 Querying user_credentials table for user: [user-id]
📋 Query result - Error: PGRST116 Data: null
⚠️ No credentials record found for user
```

### Step 2: Check What Error Code You Get
Common error codes:
- `PGRST116` - No rows found (table is empty for this user)
- `42P01` - Table doesn't exist
- `42501` - Permission denied (RLS issue)
- `null` - Success but no data

### Step 3: Verify Token is Actually Saved
Run this in Supabase SQL Editor:

```sql
-- Check if user_credentials table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'user_credentials';

-- Check if your user has credentials saved
SELECT user_id, credentials FROM user_credentials LIMIT 10;

-- Check the structure of credentials
SELECT user_id, credentials->'githubToken' as github_token FROM user_credentials LIMIT 10;
```

### Step 4: Check RLS Policies
In Supabase Dashboard:
1. Go to Tables → user_credentials → Policies
2. Verify these policies exist:
   - "Users can only access their own credentials"
   - "Service role can access all credentials" ✅

If "Service role can access all credentials" is missing, run:
```sql
CREATE POLICY "Service role can access all credentials" ON user_credentials
  FOR ALL USING (auth.role() = 'service_role');
```

## Possible Issues & Solutions

### Issue 1: Token Not in Database
**Symptom:** Diagnostic shows "Not Saved"
**Solution:** 
1. Disconnect GitHub
2. Reconnect GitHub
3. Check diagnostic again

### Issue 2: Table Doesn't Exist
**Symptom:** Error code `42P01`
**Solution:**
1. Check if migration was applied
2. Run migration manually if needed

### Issue 3: RLS Permission Denied
**Symptom:** Error code `42501`
**Solution:**
1. Add service role policy (see Step 4 above)
2. Verify policy is enabled

### Issue 4: Query Returns Null
**Symptom:** Query succeeds but data is null
**Solution:**
1. Verify token was actually saved (check database directly)
2. Verify user_id matches between client and edge function
3. Check if credentials object has githubToken field

## What the Edge Function Does Now

```
1. Try analysis_automation_settings table
   ↓
2. Try user_credentials table (with detailed logging)
   ↓
3. Try SQL fallback queries
   ↓
4. Try user metadata
   ↓
5. If all fail, throw error with detailed logs
```

## Next Steps

1. **Trigger analysis** and check the edge function logs
2. **Share the error code** you see in the logs
3. **Run the SQL queries** above to verify data
4. **Check RLS policies** are in place

Once we see the actual error in the logs, we can fix it!

## Quick Test

To verify everything is working:

```bash
# 1. Refresh browser
Ctrl+R

# 2. Go to Settings → GitHub Integration
# 3. Verify token is there

# 4. Go to DevOps → Automation
# 5. Click "Analyze Code"

# 6. Check browser console for:
# - "✅ GitHub token found in user_credentials table"
# OR
# - "❌ Edge function error: GitHub token not found"

# 7. If error, check Supabase function logs for details
```

The detailed logging should help us identify exactly where the token retrieval is failing!
