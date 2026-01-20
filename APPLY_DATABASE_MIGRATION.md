# Apply Database Migration

## The Issue

The diagnostic is showing:
```
❌ Error: Failed to fetch settings: column analysis_automation_settings.github_token does not exist
```

This means the database migration hasn't been applied yet. The migration file exists, but the changes haven't been made to your Supabase database.

## Solution: Apply the Migration

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com
2. Log in to your account
3. Select your project

### Step 2: Open SQL Editor
1. Click "SQL Editor" in the left sidebar
2. Click "New Query"

### Step 3: Copy and Paste Migration
1. Open the file: `supabase/migrations/20250120000001_analysis_automation.sql`
2. Copy ALL the SQL code
3. Paste it into the Supabase SQL Editor

### Step 4: Run the Migration
1. Click "Run" button (or Ctrl+Enter)
2. Wait for it to complete
3. You should see: "Success. No rows returned"

### Step 5: Verify
1. Go back to Settings → Analysis Automation
2. Click "Check Status" in GitHub Token Diagnostic
3. Should now show proper status (no more column error)

## Alternative: Use SETUP_DATABASE.sql

If you have access to run SQL files directly:

1. Open `SETUP_DATABASE.sql`
2. Copy all the SQL
3. Paste into Supabase SQL Editor
4. Click "Run"

## What the Migration Does

Creates two tables:
- `analysis_automation_settings` - Stores user automation settings including GitHub token
- `analysis_reports` - Stores analysis results and reports

Adds columns:
- `github_token` - Stores GitHub Personal Access Token
- `github_login` - Stores GitHub username

Sets up:
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic timestamps

## After Migration

Once applied:
1. ✅ Diagnostic will work correctly
2. ✅ Token can be saved to database
3. ✅ Edge functions can access token
4. ✅ Scheduled analysis will work

## Troubleshooting

### "Table already exists" error
- This is OK, the migration uses `CREATE TABLE IF NOT EXISTS`
- Just means the table was already created
- Continue with the next steps

### "Permission denied" error
- Make sure you're logged in as the project owner
- Check that you have admin access to the database

### Still seeing column error after running migration
- Try refreshing the page (Ctrl+R)
- Clear browser cache
- Try the diagnostic check again

## Next Steps

1. Apply the migration (follow steps above)
2. Refresh the page
3. Go to Settings → Analysis Automation
4. Click "Check Status" in GitHub Token Diagnostic
5. Should now work correctly

---

**Status**: Migration needs to be applied
**Time to apply**: ~1 minute
**Next action**: Follow the steps above
