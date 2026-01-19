# Email Sending Troubleshooting Guide

## The Issue: "Error sending email notification"

This error occurs when the email service is not properly configured. Here's how to fix it.

## Root Cause Analysis

### Why Email Sending Fails

The email sending happens in two places:

1. **Client-side** (ResurrectCI UI)
   - Calls the Supabase edge function
   - Sends email settings and report data

2. **Server-side** (Supabase Edge Function)
   - Receives the request
   - Looks for API key in **Supabase Secrets**
   - Sends email via Resend or SendGrid

**The Problem**: The API key is not in Supabase Secrets!

### Why `.env` Doesn't Work

- **Local `.env`** → Only for client-side variables (VITE_*)
- **Supabase Secrets** → For server-side variables (Edge Functions)

The edge function runs on Supabase servers, not your local machine, so it can't access your local `.env` file.

## Solution: Add API Key to Supabase Secrets

### Step-by-Step Fix

#### 1. Get Resend API Key

```
1. Go to https://resend.com
2. Sign up or log in
3. Click "API Keys" in sidebar
4. Copy your API key (starts with "re_")
```

#### 2. Add to Supabase Secrets

```
1. Go to https://app.supabase.com
2. Select your ResurrectCI project
3. Click "Edge Functions" in left sidebar
4. Click "Secrets" tab
5. Click "New Secret"
6. Enter:
   - Name: RESEND_API_KEY
   - Value: Your API key from step 1
7. Click "Add Secret"
```

#### 3. Wait for Deployment

```
- Supabase automatically redeploys edge functions
- Wait 2-3 minutes for the secret to be available
- You can check the status in Edge Functions → Logs
```

#### 4. Test Email Sending

```
1. Open ResurrectCI
2. Settings → Analysis Automation
3. Enable Email Notifications
4. Enter your email
5. Click Save Settings
6. Run code analysis
7. Check your email
```

## Verification Checklist

- [ ] Resend account created (https://resend.com)
- [ ] API key copied from Resend
- [ ] Logged into Supabase (https://app.supabase.com)
- [ ] Correct project selected
- [ ] Navigated to Edge Functions → Secrets
- [ ] Added RESEND_API_KEY secret
- [ ] Secret shows as "Active"
- [ ] Waited 2-3 minutes
- [ ] Email configured in ResurrectCI
- [ ] Test email sent

## Debugging: Check Edge Function Logs

If email still doesn't work, check the logs:

### Access Logs

```
1. Go to Supabase Dashboard
2. Click "Edge Functions"
3. Click "send-analysis-email"
4. Click "Logs" tab
5. Look for recent entries
```

### What to Look For

**Success Log**:
```
📧 Attempting to send via Resend to: user@example.com
📧 Subject: 🤖 Code Analysis Report: repo-name
📧 API Key present: re_...
📧 Resend response status: 200
✅ Email sent via Resend: email_id_123
```

**Error Log - Missing Secret**:
```
🔍 Checking for RESEND_API_KEY: ❌ Not found
⚠️ RESEND_API_KEY not configured in Supabase Secrets
```

**Error Log - Invalid API Key**:
```
📧 Resend response status: 401
❌ Resend error (401): Unauthorized
```

**Error Log - Invalid Email**:
```
📧 Resend response status: 400
❌ Resend error (400): Invalid email address
```

## Common Issues & Solutions

### Issue 1: "No email service configured"

**Cause**: API key not in Supabase Secrets

**Solution**:
1. Go to Supabase Dashboard
2. Edge Functions → Secrets
3. Add RESEND_API_KEY
4. Wait 2-3 minutes
5. Try again

### Issue 2: "Resend error: Unauthorized"

**Cause**: Invalid or expired API key

**Solution**:
1. Go to Resend dashboard
2. Check API key is correct
3. Copy the full key (including "re_" prefix)
4. Update in Supabase Secrets
5. Wait 2-3 minutes
6. Try again

### Issue 3: "Resend error: Invalid email"

**Cause**: Email address is invalid

**Solution**:
1. Check email in Settings → Analysis Automation
2. Verify format: user@example.com
3. Try a different email address
4. Check for typos

### Issue 4: Email received but no action buttons

**Cause**: Email HTML rendering issue

**Solution**:
1. Check email client supports HTML
2. Try Gmail, Outlook, or Apple Mail
3. Check spam folder
4. Try resending

### Issue 5: "Failed to send email" after 5+ minutes

**Cause**: Edge function not redeployed

**Solution**:
1. Go to Supabase Edge Functions
2. Click send-analysis-email
3. Click three dots menu
4. Select "Redeploy"
5. Wait 2-3 minutes
6. Try again

## Advanced Debugging

### Check Secret is Active

```
1. Go to Supabase Dashboard
2. Edge Functions → Secrets
3. Look for RESEND_API_KEY
4. Status should show "Active"
5. If "Inactive", click to activate
```

### Verify API Key Format

Resend API keys should:
- Start with "re_"
- Be 40+ characters long
- Not have spaces or special characters

Example: `re_abc123def456ghi789jkl012mno345pqr678`

### Test with cURL

You can test the edge function directly:

```bash
curl -X POST \
  https://eahpikunzsaacibikwtj.supabase.co/functions/v1/send-analysis-email \
  -H "Authorization: Bearer YOUR_SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email",
    "shortReport": "Test report",
    "fullReport": "Full test report",
    "shortFormat": true
  }'
```

Replace:
- `YOUR_SUPABASE_KEY` with your Supabase publishable key
- `your-email@example.com` with your email

## Still Not Working?

### Collect Debug Information

1. **Edge Function Logs**
   - Go to Supabase → Edge Functions → send-analysis-email → Logs
   - Copy the error message

2. **Email Settings**
   - Go to ResurrectCI Settings → Analysis Automation
   - Verify email address
   - Check if notifications are enabled

3. **Resend Status**
   - Go to https://resend.com
   - Check account status
   - Verify API key is active
   - Check email quota

4. **Supabase Status**
   - Go to https://status.supabase.com
   - Check if services are operational

### Get Help

Share the following information:
1. Error message from edge function logs
2. Email address you're trying to send to
3. Resend API key (first 10 chars only, e.g., "re_abc123de")
4. Screenshot of Supabase Secrets showing RESEND_API_KEY

## Quick Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| Resend API Key | https://resend.com/api-keys | Email sending service |
| Supabase Secrets | Supabase → Edge Functions → Secrets | Store API key securely |
| Edge Function | supabase/functions/send-analysis-email | Sends emails |
| Email Settings | ResurrectCI → Settings → Analysis Automation | Configure email |
| Edge Logs | Supabase → Edge Functions → Logs | Debug issues |

## Summary

**The fix in 3 steps**:

1. Get API key from Resend
2. Add to Supabase Secrets as RESEND_API_KEY
3. Wait 2-3 minutes and test

That's it! Emails should start working immediately after.
