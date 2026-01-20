# Automation Email Sending - Complete Debugging Guide

## Problem Summary
When you select a project, set email, and set time in automation settings, emails are not being sent at the scheduled time.

## Root Causes Identified

### 1. **Settings Not Saved to Database** ❌
- Settings are saved to **localStorage** on the client
- But the edge function looks for settings in the **database**
- If settings aren't in the database, the edge function can't find them and won't send emails

### 2. **Scheduler Not Triggering Analysis** ❌
- The scheduler monitors time but needs to be restarted when settings change
- This is now fixed - scheduler restarts when you save settings

### 3. **Email Service Not Configured** ❌
- The edge function needs `RESEND_API_KEY` or `SENDGRID_API_KEY` in Supabase secrets
- These are not configured in your Supabase project

## Complete Email Flow

```
1. User saves automation settings
   ↓
2. Settings saved to localStorage ✅
   ↓
3. Settings saved to database via edge function ⚠️ (needs debugging)
   ↓
4. Scheduler restarts and monitors time ✅
   ↓
5. At scheduled time, scheduler triggers analysis
   ↓
6. Edge function fetches settings from database ⚠️ (fails if not saved)
   ↓
7. Edge function analyzes code and creates PR ✅
   ↓
8. Edge function sends email via Resend/SendGrid ❌ (API key not configured)
   ↓
9. User receives email ❌
```

## Step-by-Step Debugging

### Step 1: Verify Settings Are Saved to Database

**What to check:**
1. Open browser DevTools → Console
2. Go to Settings → Analysis Automation
3. Configure:
   - Email: your-email@example.com
   - Schedule: Daily
   - Time: 02:00 AM
   - Select a repository
4. Click "Save Settings"
5. Look for console logs:
   ```
   ✅ Analysis automation settings saved to localStorage
   📤 Attempting to save settings to database...
   📤 Database save response status: 200
   ✅ Settings saved to database
   ```

**If you see errors:**
- `⚠️ No auth token available` → You're not logged in
- `⚠️ Failed to save settings to database: 401` → Auth token is invalid
- `⚠️ Failed to save settings to database: 500` → Database error

### Step 2: Verify Scheduler Is Active

**What to check:**
1. Go to DevOps → Automation tab
2. Look for "Automation Status" card
3. Should show:
   - Status: "Active" (green) or "Ready" (blue)
   - Schedule Type: "📅 Daily"
   - Scheduled Time: "2:00 AM"
   - Next Run: Shows the next scheduled time

**If scheduler is inactive:**
- Refresh the page
- Check browser console for errors

### Step 3: Test Manual Analysis (Bypass Scheduler)

**What to do:**
1. Go to DevOps → Automation tab
2. Look for "Analyze Code" button (if available)
3. Click to trigger analysis immediately
4. Check console for:
   ```
   🚀 Triggering manual analysis for: owner/repo
   ✅ Auth token found, calling edge function...
   ✅ Analysis completed: X repositories analyzed
   ```

**If manual analysis works:**
- Email sending is working
- Scheduler might not be triggering at the right time

**If manual analysis fails:**
- Check GitHub token is configured
- Check repositories are selected

### Step 4: Configure Email Service

**Required:**
1. Get Resend API key from https://resend.com
2. Go to Supabase Dashboard
3. Click "Edge Functions" → "Secrets"
4. Add secret: `RESEND_API_KEY` = your-api-key
5. Wait 2-3 minutes for deployment

**Or use SendGrid:**
1. Get SendGrid API key from https://sendgrid.com
2. Add secret: `SENDGRID_API_KEY` = your-api-key

### Step 5: Check Edge Function Logs

**To view logs:**
1. Go to Supabase Dashboard
2. Click "Edge Functions"
3. Click "run-scheduled-analysis"
4. Click "Logs" tab
5. Look for recent invocations

**Expected logs:**
```
🚀 Starting scheduled analysis for user [userId]
📦 Repositories: owner/repo
✅ Settings loaded
✅ GitHub token retrieved
📊 Analyzing repository: owner/repo
✅ Analysis complete: X issues found
✅ PR created: https://github.com/...
✅ Report saved to database
✅ Email notification sent
✅ Scheduled analysis completed successfully
```

## Common Issues & Solutions

### Issue: "Email service not configured (development mode)"
**Cause:** No email API key configured
**Solution:** Add `RESEND_API_KEY` or `SENDGRID_API_KEY` to Supabase secrets

### Issue: "Authentication token not found"
**Cause:** Not logged in or session expired
**Solution:** Log out and log back in

### Issue: "User settings not found"
**Cause:** Settings not saved to database
**Solution:** 
1. Save settings again
2. Check browser console for database save errors
3. Verify auth token is valid

### Issue: "GitHub token not found in user metadata"
**Cause:** GitHub token not stored in user profile
**Solution:** 
1. Go to Settings → GitHub Integration
2. Reconnect GitHub account
3. Make sure token is saved

### Issue: Scheduler shows "Inactive"
**Cause:** Scheduler service not started
**Solution:** Refresh the page

## Testing Checklist

- [ ] Settings saved to localStorage (check console)
- [ ] Settings saved to database (check console)
- [ ] Scheduler is active (check DevOps panel)
- [ ] Email service configured (check Supabase secrets)
- [ ] GitHub token configured (check Settings)
- [ ] Repositories selected (check Settings)
- [ ] Email address entered (check Settings)
- [ ] Manual analysis works (test in DevOps)
- [ ] Edge function logs show success (check Supabase)
- [ ] Email received (check inbox)

## Console Commands for Debugging

```javascript
// Check if settings are in localStorage
JSON.parse(localStorage.getItem('analysis_automation_settings'))

// Check if auth token exists
localStorage.getItem('sb_auth_token')

// Check scheduler status
import { schedulerService } from '@/services/schedulerService'
schedulerService.isActive()

// Check automation settings
import { analysisAutomationService } from '@/services/analysisAutomationService'
analysisAutomationService.getSettings()

// Manually trigger analysis
import { scheduledAnalysisService } from '@/services/scheduledAnalysisService'
scheduledAnalysisService.triggerManualAnalysis(['owner/repo'])
```

## Next Steps

1. **Verify settings are saved to database** (Step 1)
2. **Configure email service** (Step 4)
3. **Test manual analysis** (Step 3)
4. **Check edge function logs** (Step 5)
5. **Wait for scheduled time** or test with manual trigger

If emails still don't send after these steps, check the edge function logs for specific error messages.
