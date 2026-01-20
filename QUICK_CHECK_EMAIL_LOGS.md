# Quick: Check Why Email Isn't Sending

## The Problem
Analysis works but emails don't send. Browser console shows no email logs.

## Why?
Email sending happens in the **edge function**, not the browser. You need to check **Supabase function logs**.

## Do This Now

1. **Go to Supabase Dashboard**
   - https://app.supabase.com

2. **Click Functions** (left sidebar)

3. **Click run-scheduled-analysis**

4. **Click the latest execution** (top of list)

5. **Scroll down to Logs section**

6. **Look for these logs:**

   **If you see:**
   ```
   📧 Email notifications enabled, sending report...
   📧 Calling send-analysis-email function...
   📧 Email function response status: 200
   ```
   → Email is being sent! Check your inbox/spam folder

   **If you see:**
   ```
   ⚠️ Email notifications disabled or no email address set
   📧 enable_email_notifications: false
   📧 user_email: null
   ```
   → Email notifications are OFF! Enable them in settings

   **If you see:**
   ```
   ❌ Error sending email:
   ```
   → Email function failed! Check send-analysis-email logs

## If Email Notifications Are Disabled

1. Go to **DevOps → Automation**
2. Turn **ON** "Enable Email Notifications"
3. Enter your **email address**
4. Click **Save Settings**
5. Trigger analysis again

## If Email Function Failed

1. Go to **Functions → send-analysis-email**
2. Click **latest execution**
3. Look for error message
4. Common fixes:
   - Add `RESEND_API_KEY` to Supabase Secrets
   - Check email address format
   - Verify Resend API key is correct

## That's It!

Check the edge function logs and let me know what you see!
