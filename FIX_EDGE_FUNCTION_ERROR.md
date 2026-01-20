# Quick Fix: Edge Function 500 Error

## The Problem
When you click "Analyze Code", you get: `Error: Edge function error: 500 - Failed to fetch user settings`

## The Solution (3 Steps)

### Step 1: Apply Database Migration
The edge function needs database tables that don't exist yet.

**Go to Supabase Dashboard:**
1. https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy this SQL and paste it:

```sql
-- Create analysis_automation_settings table
CREATE TABLE IF NOT EXISTS analysis_automation_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enable_email_notifications BOOLEAN DEFAULT false,
  user_email VARCHAR(255),
  auto_generate_improvements BOOLEAN DEFAULT false,
  auto_push_to_github BOOLEAN DEFAULT false,
  analysis_schedule VARCHAR(50) DEFAULT 'manual',
  scheduled_time VARCHAR(5) DEFAULT '02:00',
  short_report_format BOOLEAN DEFAULT true,
  selected_repositories JSONB DEFAULT '[]'::jsonb,
  selected_projects JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create analysis_reports table
CREATE TABLE IF NOT EXISTS analysis_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  repository VARCHAR(255) NOT NULL,
  total_issues INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  high_issues INTEGER DEFAULT 1,
  medium_issues INTEGER DEFAULT 0,
  low_issues INTEGER DEFAULT 0,
  short_summary TEXT,
  full_report TEXT,
  pr_url VARCHAR(255),
  pr_number INTEGER,
  branch_name VARCHAR(255),
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  user_approved BOOLEAN,
  user_approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, report_id)
);

-- Enable RLS
ALTER TABLE analysis_automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can access their own settings" ON analysis_automation_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can access all settings" ON analysis_automation_settings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can access their own reports" ON analysis_reports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can access all reports" ON analysis_reports
  FOR ALL USING (auth.role() = 'service_role');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analysis_automation_settings_user_id ON analysis_automation_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_id ON analysis_reports(user_id);
```

6. Click **Run**
7. Wait for success message ✅

### Step 2: Update Service Role Key in Secrets
The edge function needs the service role key to access the database.

**In Supabase Dashboard:**
1. Click **Edge Functions** (left sidebar)
2. Click **Secrets** (top right)
3. Click **New Secret**
4. Name: `SUPABASE_SERVICE_ROLE_KEY`
5. Value: Go to **Settings** → **API** → Copy the "Service Role Key" (the long secret)
6. Paste it in the secret value field
7. Click **Save**
8. **Wait 2-3 minutes** for deployment

### Step 3: Redeploy Edge Functions
The edge functions need to be redeployed with the new code and secrets.

**In Supabase Dashboard:**
1. Click **Edge Functions** (left sidebar)
2. For each function, click the three dots and select **Deploy**:
   - `run-scheduled-analysis`
   - `send-analysis-email`
   - `analysis-settings`
3. Wait for each to show "Deployed" status
4. **Wait 2-3 minutes** for all deployments to complete

### Step 4: Test
1. Clear browser cache (Ctrl+Shift+Delete)
2. Go to DevOps → Automation
3. Click "Analyze Code" button
4. Open browser console (F12)
5. Check for success or detailed error

## If Still Failing:
1. Check browser console (F12) for the exact error
2. Share the error message from the console
3. Verify:
   - Tables exist in Supabase (Table Editor)
   - Service role key is set (Edge Functions → Secrets)
   - Edge functions are deployed (Edge Functions list)

## Success Indicators:
✅ Tables appear in Supabase Table Editor
✅ Service role key is set in secrets
✅ Edge functions show "Deployed" status
✅ Browser console shows analysis logs (not 500 error)
✅ Analysis completes and shows results

