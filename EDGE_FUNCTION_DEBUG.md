# Edge Function Debugging Guide

## Error: "Failed to fetch user settings" (500)

This error occurs when the edge function cannot access the `analysis_automation_settings` table. Here's how to fix it:

### Root Causes:
1. **Migration not applied** - The database table doesn't exist
2. **RLS policies blocking access** - Row Level Security preventing service role access
3. **Missing service role key** - Edge function can't authenticate with Supabase

### Solution Steps:

#### Step 1: Apply Database Migrations
The migration file `supabase/migrations/20250120000001_analysis_automation.sql` creates the required tables.

**Option A: Using Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire content from `supabase/migrations/20250120000001_analysis_automation.sql`
6. Paste it into the SQL editor
7. Click "Run"
8. Wait for success message

**Option B: Using Supabase CLI**
```bash
supabase db push
```

#### Step 2: Verify Tables Exist
1. Go to Supabase Dashboard
2. Click "Table Editor" in the left sidebar
3. You should see:
   - `analysis_automation_settings`
   - `analysis_reports`

If tables don't appear, the migration didn't run successfully.

#### Step 3: Check RLS Policies
1. Go to Supabase Dashboard
2. Click "Authentication" → "Policies"
3. For each table, verify these policies exist:
   - "Users can only access their own automation settings"
   - "Service role can access all automation settings"
   - "Users can only access their own analysis reports"
   - "Service role can access all analysis reports"

If service role policies are missing, the edge function can't access the data.

#### Step 4: Verify Service Role Key
1. Go to Supabase Dashboard
2. Click "Settings" → "API"
3. Copy the "Service Role Key" (the long secret key)
4. In your Supabase project settings, go to "Edge Functions" → "Secrets"
5. Add/update `SUPABASE_SERVICE_ROLE_KEY` with the key from step 3
6. Wait 2-3 minutes for deployment

#### Step 5: Redeploy Edge Functions
After applying migrations and updating secrets:

```bash
supabase functions deploy run-scheduled-analysis
supabase functions deploy send-analysis-email
supabase functions deploy analysis-settings
```

Or use Supabase Dashboard:
1. Click "Edge Functions"
2. For each function, click the three dots and select "Deploy"

#### Step 6: Test the Edge Function
1. Open browser console (F12)
2. Go to DevOps → Automation
3. Click "Analyze Code" button
4. Check console for detailed error logs

### Expected Console Output (Success):
```
🚀 Starting scheduled analysis for user [user-id]
📦 Repositories: owner/repo
📋 Request body: {...}
✅ Settings loaded (or using defaults)
✅ GitHub token retrieved
📊 Analyzing repository: owner/repo
✅ Analysis complete: X issues found
✅ PR created: https://github.com/...
✅ Report saved to database
✅ Email notification sent
✅ Scheduled analysis completed successfully
```

### Expected Console Output (Error):
```
❌ Error in run-scheduled-analysis: [error message]
❌ Error message: [specific error]
❌ Error stack: [stack trace]
❌ Full error object: {...}
```

### Common Errors and Fixes:

**Error: "relation \"analysis_automation_settings\" does not exist"**
- **Cause**: Migration not applied
- **Fix**: Run the migration SQL in Supabase Dashboard

**Error: "new row violates row-level security policy"**
- **Cause**: RLS policies don't allow service role access
- **Fix**: Add service role policies to the migration and re-run

**Error: "GitHub token not found"**
- **Cause**: User hasn't connected GitHub account
- **Fix**: User must go to Settings → GitHub and connect their account

**Error: "Failed to fetch user"**
- **Cause**: User ID is invalid or user doesn't exist
- **Fix**: Verify user is logged in and session is valid

### Debugging Checklist:
- [ ] Migration applied (tables exist in Supabase)
- [ ] RLS policies include service role bypass
- [ ] Service role key is set in Edge Functions secrets
- [ ] Edge functions are deployed
- [ ] User is logged in
- [ ] User has connected GitHub account
- [ ] Browser cache is cleared
- [ ] Console shows detailed error logs

### Next Steps:
1. Apply the migration
2. Update service role key in secrets
3. Redeploy edge functions
4. Clear browser cache
5. Test again and check console logs
6. Share the console error output if still failing

