# Verification Checklist

## Pre-Reconnection Checklist

- [ ] You are logged into the app
- [ ] You can see Settings panel
- [ ] You can see GitHub Integration section
- [ ] You have your GitHub Personal Access Token ready

## Reconnection Steps

### Step 1: Disconnect
- [ ] Go to Settings → GitHub Integration
- [ ] Click "Disconnect" button
- [ ] See confirmation message
- [ ] GitHub section shows "Connect GitHub" button

### Step 2: Reconnect
- [ ] Click "Connect GitHub" button
- [ ] Enter your GitHub Personal Access Token
- [ ] Click "Connect GitHub" button
- [ ] See success message: "Successfully connected as [username]!"
- [ ] See GitHub profile info displayed

### Step 3: Verify Token is Saved
- [ ] Go to Settings → Analysis Automation
- [ ] Scroll to "GitHub Token Diagnostic" section
- [ ] Click "🔍 Check Status" button
- [ ] Wait for check to complete

### Expected Results
- [ ] Browser Storage: ✅ Found
- [ ] Supabase Settings Table: ✅ Saved
- [ ] No error messages shown
- [ ] Green checkmarks visible

## If Diagnostic Shows Issues

### If "Not authenticated" error:
- [ ] Make sure you're logged in
- [ ] Try refreshing the page (Ctrl+R)
- [ ] Check browser console (F12) for errors
- [ ] Try logging out and back in

### If "Browser Storage: ⚠️ Missing":
- [ ] This is OK - means token not in localStorage yet
- [ ] Reconnect GitHub again
- [ ] Check status again

### If "Supabase Settings Table: ❌ Not Saved":
- [ ] This is expected before reconnecting
- [ ] Follow reconnection steps above
- [ ] Check status again after reconnecting

## Testing Manual Analysis

### Step 1: Go to DevOps
- [ ] Click "DevOps" in left sidebar
- [ ] Click "Automation" tab

### Step 2: Run Analysis
- [ ] Click "Analyze Code" button
- [ ] Wait for analysis to complete

### Expected Results
- [ ] No "GitHub token not found" error
- [ ] Analysis completes successfully
- [ ] See results with issue counts
- [ ] See PR link if created

### If Analysis Fails
- [ ] Check browser console (F12) for errors
- [ ] Verify diagnostic shows ✅ for both locations
- [ ] Try refreshing page and running again
- [ ] Check that repositories are selected in settings

## Testing Scheduled Analysis

### Step 1: Configure Schedule
- [ ] Go to Settings → Analysis Automation
- [ ] Set "Schedule Type" to "Daily" or "Weekly"
- [ ] Set "Scheduled Time" to a time soon (e.g., 2 minutes from now)
- [ ] Select repositories to analyze
- [ ] Click "Save Settings"

### Step 2: Wait for Scheduled Time
- [ ] Wait for the scheduled time to arrive
- [ ] Check browser console for analysis logs
- [ ] Look for "🔔 Daily job triggered" message

### Expected Results
- [ ] Analysis runs automatically at scheduled time
- [ ] No "GitHub token not found" error
- [ ] Results appear in "Recent Analysis Reports"
- [ ] Email sent (if enabled)

### If Scheduled Analysis Doesn't Run
- [ ] Make sure scheduler is running (check console)
- [ ] Verify diagnostic shows ✅ for both locations
- [ ] Check that repositories are selected
- [ ] Try manual analysis first to verify token works

## Final Verification

- [ ] Diagnostic shows ✅ for both locations
- [ ] Manual analysis runs without errors
- [ ] Scheduled analysis triggers at scheduled time
- [ ] Email notifications sent (if enabled)
- [ ] PR created with analysis results

## Success Criteria

✅ All items checked
✅ No error messages
✅ Analysis runs successfully
✅ Token is in database

---

**Status**: Ready to verify
**Time to complete**: ~5-10 minutes
**Next action**: Follow the steps above
