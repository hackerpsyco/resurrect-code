# Debug: Email Not Sending After Analysis

## Current Status
- ✅ Email notifications are enabled
- ✅ Resend secret is set
- ✅ Analysis completes and creates PRs
- ❌ Emails are not being sent

## What I Added
Enhanced logging to track the email sending process at every step:

1. **In run-scheduled-analysis function:**
   - Logs when email sending is triggered
   - Logs user email address
   - Logs if email notifications are enabled
   - Logs any errors from the email function

2. **In sendEmailNotification function:**
   - Logs when function is called
   - Logs email recipient
   - Logs email body length
   - Logs Supabase URL and service role key status
   - Logs email function response status
   - Logs full response data or error

## How to Debug

### Step 1: Trigger Analysis
1. Go to **DevOps → Automation**
2. Click **"Analyze Code"** to trigger manual analysis
3. Wait for it to complete

### Step 2: Check Edge Function Logs
1. Go to **Supabase Dashboard**
2. Go to **Functions → run-scheduled-analysis**
3. Click on the **latest execution**
4. Look for these logs in order:

**Expected log sequence:**

```
✅ Analysis completed: 1 repositories analyzed
📧 Email notifications enabled, sending report...
📧 User email: your-email@example.com
📧 Total issues: X
📧 sendEmailNotification called
📧 Email recipient: your-email@example.com
📧 Results count: 1
📧 PR results count: 1
📧 Email body length: XXXX
📧 Calling send-analysis-email function...
📧 Supabase URL: https://eahpikunzsaacibikwtj.supabase.co
📧 Service role key present: ✅
📧 Email function response status: 200
✅ Email function response: {...}
```

### Step 3: Check send-analysis-email Logs
If the response status is not 200:

1. Go to **Supabase Dashboard**
2. Go to **Functions → send-analysis-email**
3. Click on the **latest execution**
4. Look for these logs:

**Expected logs:**

```
🔍 Checking for RESEND_API_KEY: ✅ Found
📧 Recipient: your-email@example.com
📧 Sending analysis report email...
📧 Attempting to send via Resend to: your-email@example.com
📧 Subject: 📊 Code Analysis Complete - X issues found
📧 API Key present: re_xxxxx...
📧 Resend response status: 200
✅ Email sent via Resend: email_xxxxx
```

## Common Issues & Solutions

### Issue 1: Email Notifications Disabled
**Log:** `⚠️ Email notifications disabled or no email address set`

**Solution:**
1. Go to DevOps → Automation
2. Enable "Email Notifications" toggle
3. Enter your email address
4. Save settings

### Issue 2: No Email Address Set
**Log:** `📧 user_email: null` or `📧 user_email: undefined`

**Solution:**
1. Go to DevOps → Automation
2. Enter your email address in the settings
3. Save settings

### Issue 3: Resend API Key Not Found
**Log:** `🔍 Checking for RESEND_API_KEY: ❌ Not found`

**Solution:**
1. Go to Supabase Dashboard
2. Go to Settings → Secrets
3. Add `RESEND_API_KEY` with your Resend API key
4. Restart the edge function or wait for it to reload

### Issue 4: Resend API Error
**Log:** `❌ Resend error (400): Invalid email address`

**Solution:**
1. Check the email address in your settings
2. Make sure it's a valid email format
3. Try with a different email address

### Issue 5: Email Function Returns Error
**Log:** `📧 Email function response status: 500`

**Solution:**
1. Check the send-analysis-email function logs
2. Look for the specific error message
3. Common errors:
   - Invalid email address
   - Resend API key invalid
   - Email service not configured

## Step-by-Step Debugging

### Debug Step 1: Verify Settings
```
Check:
- Email notifications toggle: ON ✅
- Email address: filled in ✅
- Email address format: valid@email.com ✅
```

### Debug Step 2: Verify Resend Configuration
```
In Supabase Dashboard → Settings → Secrets:
- RESEND_API_KEY: present ✅
- Value starts with: re_ ✅
```

### Debug Step 3: Check Logs
```
1. Trigger analysis
2. Check run-scheduled-analysis logs
3. Look for: "📧 Email notifications enabled"
4. If not there, email sending wasn't triggered
```

### Debug Step 4: Check Email Function
```
1. If logs show email function was called
2. Check send-analysis-email logs
3. Look for: "✅ Email sent via Resend"
4. If not there, email sending failed
```

### Debug Step 5: Check Email Inbox
```
1. Check your email inbox
2. Check spam/junk folder
3. Check if email address is correct
4. Try with a different email address
```

## What Each Log Means

| Log | Meaning |
|-----|---------|
| `📧 Email notifications enabled` | Email sending is triggered |
| `📧 User email: xxx@xxx.com` | Email address is set |
| `📧 Calling send-analysis-email function...` | About to call email function |
| `📧 Email function response status: 200` | Email function succeeded |
| `✅ Email sent via Resend` | Email was sent successfully |
| `❌ Resend error` | Resend API returned an error |
| `⚠️ Email notifications disabled` | Email sending was skipped |

## Next Steps

1. **Trigger analysis** and check the logs
2. **Share the logs** you see (especially the email-related ones)
3. **Check Resend dashboard** to see if email was sent
4. **Verify email address** is correct

Once we see the actual logs, we can identify exactly where the email sending is failing!

## Quick Test

To verify everything is working:

```bash
# 1. Go to DevOps → Automation
# 2. Verify settings:
#    - Email notifications: ON
#    - Email address: your-email@example.com
# 3. Click "Analyze Code"
# 4. Check Supabase function logs
# 5. Look for: "✅ Email sent via Resend"
# 6. Check your email inbox
```

The detailed logging should help us identify exactly where the email sending is failing!
