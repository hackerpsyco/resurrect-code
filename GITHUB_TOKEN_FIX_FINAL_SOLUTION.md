# GitHub Token Storage - Final Solution

## Problem Summary
GitHub tokens were not being saved to the Supabase database, only to browser localStorage. This caused "GitHub token not found" errors when running scheduled analysis (which runs server-side via edge functions).

## Root Cause
The RLS (Row Level Security) policies had conflicting rules that prevented users from inserting their own settings into the `analysis_automation_settings` table.

## Solution Applied

### 1. Fixed RLS Policies
Created a new migration (`20250120000002_fix_rls_policies.sql`) that:
- Drops old conflicting policies
- Creates explicit separate policies for SELECT, INSERT, UPDATE, DELETE operations
- Maintains service role access for edge functions

### 2. Enhanced GitHubAuth Component
Updated `src/components/auth/GitHubAuth.tsx` with:
- Better error logging and debugging
- Detailed console output showing each step
- Proper error handling for database operations
- Clear success/failure messages

### 3. Improved Diagnostic Tool
Updated `src/components/settings/GitHubTokenDiagnostic.tsx` with:
- Better logging of API responses
- Clearer error messages
- Debugging information in console

## Steps to Apply the Fix

### Step 1: Apply the New Migration
Run the new migration in Supabase:

```sql
-- In Supabase SQL Editor, run:
DROP POLICY IF EXISTS "Users can only access their own automation settings" ON analysis_automation_settings;
DROP POLICY IF EXISTS "Users can only insert their own automation settings" ON analysis_automation_settings;
DROP POLICY IF EXISTS "Users can only update their own automation settings" ON analysis_automation_settings;
DROP POLICY IF EXISTS "Users can only access their own analysis reports" ON analysis_reports;
DROP POLICY IF EXISTS "Users can only insert their own analysis reports" ON analysis_reports;
DROP POLICY IF EXISTS "Users can only update their own analysis reports" ON analysis_reports;

-- Create new explicit policies for analysis_automation_settings
CREATE POLICY "Users can select their own automation settings" ON analysis_automation_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation settings" ON analysis_automation_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation settings" ON analysis_automation_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation settings" ON analysis_automation_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create new explicit policies for analysis_reports
CREATE POLICY "Users can select their own analysis reports" ON analysis_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis reports" ON analysis_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis reports" ON analysis_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis reports" ON analysis_reports
  FOR DELETE USING (auth.uid() = user_id);
```

### Step 2: Refresh Your Browser
Press `Ctrl+R` or `Cmd+R` to reload the application and load the updated code.

### Step 3: Disconnect and Reconnect GitHub
1. Go to **Settings → GitHub Integration**
2. Click **Disconnect**
3. Click **Connect GitHub**
4. Enter your GitHub Personal Access Token
5. Click **Connect GitHub**

### Step 4: Watch the Console
Open your browser console (`F12`) and look for these messages:

**Success:**
```
📤 Saving GitHub token to Supabase database...
👤 Current user ID: [your-user-id]
📝 Settings data to save: {...}
📋 Insert result: {...}
✅ GitHub token saved to Supabase database successfully!
```

**If you see an error:**
```
❌ Failed to save to database: [error message]
Error code: [code]
Error message: [message]
```

### Step 5: Verify Token is Saved
1. Go to **Settings → GitHub Integration**
2. Click **🔍 Check Status** button
3. You should see:
   - ✅ Browser Storage: Found
   - ✅ Supabase Settings Table: Saved

If still showing "Not Saved", check the console for errors and share them.

### Step 6: Test Scheduled Analysis
1. Go to **DevOps → Automation**
2. Configure your repositories
3. Click **Analyze Code** to test
4. Check that analysis runs without "GitHub token not found" error

## What Changed

### Files Modified:
- `src/components/auth/GitHubAuth.tsx` - Enhanced logging and error handling
- `src/components/settings/GitHubTokenDiagnostic.tsx` - Better debugging output
- `supabase/migrations/20250120000001_analysis_automation.sql` - Updated RLS policies
- `supabase/migrations/20250120000002_fix_rls_policies.sql` - New migration to fix policies

### Key Improvements:
1. **Explicit RLS Policies** - Separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
2. **Better Error Logging** - Console shows exactly what's happening at each step
3. **Proper Error Handling** - Catches and logs database errors with full details
4. **Service Role Access** - Edge functions can still access data via service role

## Troubleshooting

### Token Still Not Saving?
1. Check browser console (F12) for error messages
2. Verify you're logged in to the application
3. Check Supabase dashboard → Authentication to confirm your user exists
4. Try clearing browser cache and localStorage

### Edge Function Still Can't Find Token?
1. Verify token is in Supabase using the diagnostic tool
2. Check edge function logs in Supabase dashboard
3. Ensure service role policy is in place

### Still Getting "GitHub token not found"?
1. Verify the migration was applied successfully
2. Check that RLS policies are in place (Supabase → Tables → analysis_automation_settings → Policies)
3. Ensure your user has proper authentication

## Next Steps
Once the token is saved successfully:
1. Configure your repositories in Automation settings
2. Set up email notifications if desired
3. Configure analysis schedule (manual, on-push, daily, weekly)
4. Test by running an analysis

The system should now work end-to-end without token errors.
