# Check Edge Function Logs for Email Sending

## The Issue
You see client-side logs showing analysis completed, but NO email logs. This is because:

1. **Client-side logs** (what you see in browser console):
   - Analysis triggered
   - Analysis completed
   - Report saved

2. **Edge function logs** (what you need to check):
   - Email notifications enabled/disabled
   - Email sending triggered
   - Email function called
   - Email sent or error

## How to Check Edge Function Logs

### Step 1: Go to Supabase Dashboard
1. Open https://app.supabase.com
2. Select your project
3. Go to **Functions** (left sidebar)

### Step 2: Select the Function
1. Click on **run-scheduled-analysis**
2. You should see a list of executions

### Step 3: Find the Latest Execution
1. Look for the most recent execution (top of the list)
2. Click on it to open the details

### Step 4: Check the Logs
Look for these logs in order:

**Expected logs if email is being sent:**
```
✅ Analysis completed successfully
📧 Email notifications enabled, sending report...
📧 User email: your-email@example.com
📧 Total issues: X
📧 sendEmailNotification called
📧 Email recipient: your-email@example.com
📧 Calling send-analysis-email function...
📧 Email function response status: 200
✅ Email function response: {...}
```

**If you see this instead:**
```
✅ Analysis completed successfully
⚠️ Email notifications disabled or no email address set
📧 enable_email_notifications: false
📧 user_email: null
```

Then email notifications are disabled!

## What to Look For

### Good Signs ✅
- `📧 Email notifications enabled, sending report...`
- `📧 Calling send-analysis-email function...`
- `📧 Email function response status: 200`
- `✅ Email function response:`

### Bad Signs ❌
- `⚠️ Email notifications disabled or no email address set`
- `❌ Error sending email:`
- `📧 Email function response status: 500`
- `❌ Email function error response:`

## If Email Notifications Are Disabled

**This means:**
1. Email notifications toggle is OFF in your settings
2. OR email address is not set

**Solution:**
1. Go to DevOps → Automation
2. Turn ON "Enable Email Notifications"
3. Enter your email address
4. Save settings
5. Trigger analysis again

## If Email Function Failed

**Check the send-analysis-email logs:**
1. Go to Functions (left sidebar)
2. Click on **send-analysis-email**
3. Click on the latest execution
4. Look for error messages

**Common errors:**
- `🔍 Checking for RESEND_API_KEY: ❌ Not found` → Add Resend API key to Secrets
- `❌ Resend error (400): Invalid email address` → Check email format
- `❌ Resend error (401): Unauthorized` → Check Resend API key is correct

## Step-by-Step

1. **Trigger analysis** (DevOps → Automation → Analyze Code)
2. **Wait for it to complete**
3. **Go to Supabase Dashboard**
4. **Functions → run-scheduled-analysis**
5. **Click latest execution**
6. **Look for email logs**
7. **If no email logs, check if notifications are enabled**
8. **If email logs show error, check send-analysis-email logs**

## Screenshot Guide

```
Supabase Dashboard
  ↓
Functions (left sidebar)
  ↓
run-scheduled-analysis
  ↓
Latest execution (top of list)
  ↓
Logs section (scroll down)
  ↓
Look for: "📧 Email notifications enabled"
```

## What to Share

When you check the logs, share:
1. **Are there any email logs?** (Yes/No)
2. **If yes, what do they say?** (Copy the logs)
3. **If no, do you see:** `⚠️ Email notifications disabled or no email address set`?

This will help us identify exactly what's happening!
