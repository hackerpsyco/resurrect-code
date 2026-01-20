# Fix: Edge Function Can't Access GitHub Token

## Problem
The edge function was throwing: `GitHub token not found - please sync your GitHub token in settings`

Even though the diagnostic showed the token was saved correctly.

## Root Cause
The `user_credentials` table had RLS (Row Level Security) policies that only allowed users to access their own data, but didn't explicitly allow the service role (used by edge functions) to access the data.

## Solution
Add explicit RLS policies to allow the service role to access the credentials table.

## Steps to Apply

### Step 1: Apply the Migration
Run this SQL in Supabase SQL Editor:

```sql
-- Allow service role to access user_credentials table (for edge functions)
CREATE POLICY "Service role can access all credentials" ON user_credentials
  FOR ALL USING (auth.role() = 'service_role');

-- Allow service role to access user_settings table (for edge functions)
CREATE POLICY "Service role can access all settings" ON user_settings
  FOR ALL USING (auth.role() = 'service_role');
```

### Step 2: Verify Policies Are in Place
In Supabase dashboard:
1. Go to Tables → user_credentials → Policies
2. You should see:
   - "Users can only access their own credentials"
   - "Service role can access all credentials" ✅ (NEW)

### Step 3: Test Scheduled Analysis Again
1. Go to DevOps → Automation
2. Click "Analyze Code"
3. Should now work without token errors

## What This Does

**Before:**
```
Edge function tries to read user_credentials table
    ↓
RLS policy checks: Is this the service role?
    ↓
No explicit policy for service role
    ↓
Access denied ❌
```

**After:**
```
Edge function tries to read user_credentials table
    ↓
RLS policy checks: Is this the service role?
    ↓
Yes! Service role policy allows it
    ↓
Access granted ✅
```

## Why This Works

- Service role is used by edge functions to bypass user-level RLS
- We need to explicitly allow service role in the policy
- This is secure because service role is only used by backend code
- Users still can only access their own credentials

## Files Changed
- `supabase/migrations/20250120000003_allow_service_role_credentials.sql` - New migration

## Next Steps
Once the migration is applied:
1. Test scheduled analysis
2. Should retrieve token from user_credentials table
3. Should create pull requests successfully
4. Should send email notifications

The system should now work end-to-end!
