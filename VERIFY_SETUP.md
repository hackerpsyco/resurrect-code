# Verify Your Setup is Working

Follow these steps to verify each component is working correctly.

## Checklist

### ✅ Step 1: Verify Database Tables Exist
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Table Editor** (left sidebar)
4. You should see these tables:
   - `analysis_automation_settings`
   - `analysis_reports`

**If tables don't exist:**
- Run the SQL migration from `FIX_EDGE_FUNCTION_ERROR.md` Step 1

### ✅ Step 2: Verify Service Role Key is Set
1. Go to Supabase Dashboard
2. Click **Edge Functions** (left sidebar)
3. Click **Secrets** (top right)
4. You should see `SUPABASE_SERVICE_ROLE_KEY` listed

**If secret is missing:**
- Follow `FIX_EDGE_FUNCTION_ERROR.md` Step 2

### ✅ Step 3: Verify Edge Functions are Deployed
1. Go to Supabase Dashboard
2. Click **Edge Functions** (left sidebar)
3. You should see these functions with "Deployed" status:
   - `run-scheduled-analysis`
   - `send-analysis-email`
   - `analysis-settings`

**If functions show "Not deployed":**
- Click the three dots on each function and select **Deploy**
- Wait 2-3 minutes for deployment to complete

### ✅ Step 4: Verify GitHub Connection
1. Go to your app
2. Click **Settings** (top right)
3. Click **GitHub Integration**
4. You should see your GitHub account connected

**If GitHub is not connected:**
- Click **Connect GitHub**
- Authorize the app
- Wait for redirect back to settings

### ✅ Step 5: Verify Automation Settings
1. Go to **DevOps** (left sidebar)
2. Click **Automation** tab
3. You should see the automation settings panel
4. Configure:
   - Enable Email Notifications: ON
   - Your Email: your-email@example.com
   - Select at least 1 repository
   - Schedule: Manual (for testing)
5. Click **Save Settings**

**Expected result:**
- Toast message: "✅ Analysis automation settings saved"
- Settings appear in the Recent Analysis Reports section

### ✅ Step 6: Test Manual Analysis
1. Go to **DevOps** → **Automation**
2. Click **Analyze Code** button
3. Open browser console (F12)
4. Watch the console for logs

**Expected console output:**
```
🚀 Triggering manual analysis for: owner/repo
📤 Calling edge function at: https://...
✅ Auth token found, calling edge function...
✅ Analysis completed: 1 repositories analyzed
```

**If you see error:**
```
❌ Edge function error: 500
❌ Error message: Failed to fetch user settings
```

Then follow `FIX_EDGE_FUNCTION_ERROR.md` again.

### ✅ Step 7: Verify Email Sending
After successful analysis:
1. Check your email inbox
2. You should receive an email with:
   - Subject: "🤖 Code Analysis Report: owner/repo"
   - Analysis summary with issue counts
   - Link to view PR on GitHub

**If email doesn't arrive:**
- Check spam folder
- Verify email address in settings
- Check Supabase logs for email errors

### ✅ Step 8: Verify Scheduled Analysis
1. Go to **DevOps** → **Automation**
2. Change Schedule to: **Daily**
3. Set time to 2 minutes in the future (e.g., if it's 2:30 PM, set to 2:32 PM)
4. Click **Save Settings**
5. Wait for the scheduled time
6. Check browser console for logs

**Expected result:**
- At the scheduled time, analysis runs automatically
- Console shows analysis logs
- Email is sent

## Troubleshooting

### Problem: "Failed to fetch user settings" (500 error)
**Solution:**
1. Verify tables exist (Step 1)
2. Verify service role key is set (Step 2)
3. Verify edge functions are deployed (Step 3)
4. Clear browser cache (Ctrl+Shift+Delete)
5. Try again

### Problem: "GitHub token not found"
**Solution:**
1. Go to Settings → GitHub Integration
2. Click "Connect GitHub"
3. Authorize the app
4. Try analysis again

### Problem: Email not received
**Solution:**
1. Check spam folder
2. Verify email address in settings
3. Check Supabase logs:
   - Go to Supabase Dashboard
   - Click **Logs** (left sidebar)
   - Look for `send-analysis-email` function logs
4. Verify Resend API key is set in secrets

### Problem: Analysis doesn't run at scheduled time
**Solution:**
1. Verify scheduler is running:
   - Open browser console
   - You should see logs every 60 seconds
2. Verify schedule is set correctly:
   - Go to DevOps → Automation
   - Check Schedule Type is not "Manual"
   - Check Scheduled Time is correct
3. Keep browser tab open (scheduler runs in browser)

## Success Indicators

You'll know everything is working when:
- ✅ Tables exist in Supabase
- ✅ Service role key is set
- ✅ Edge functions are deployed
- ✅ GitHub is connected
- ✅ Automation settings are saved
- ✅ Manual analysis completes successfully
- ✅ Email is received
- ✅ Scheduled analysis runs at the right time

## Next Steps

Once everything is verified:
1. Configure your preferred schedule (daily/weekly)
2. Set the scheduled time
3. Enable email notifications
4. Select repositories to analyze
5. Save settings
6. System will run analysis automatically at scheduled time

