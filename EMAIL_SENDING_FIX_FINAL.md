# Email Sending Error - Final Fix Guide

## The Problem

You're getting "Error sending email notification" even though:
- ✅ Edge function is set up
- ✅ Resend API is configured
- ❌ But emails still don't send

## The Root Cause

**The API key is not in Supabase Secrets!**

The edge function runs on Supabase servers and needs the API key stored in **Supabase Secrets**, not in your local `.env` file.

### Why Local .env Doesn't Work

```
Local .env file
├─ Used by: Client-side code (React)
├─ Variables: VITE_* only
└─ Edge functions: Can't access it ❌

Supabase Secrets
├─ Used by: Edge functions (server-side)
├─ Variables: Any name
└─ Edge functions: Can access it ✅
```

## The Fix (3 Steps)

### Step 1: Get Resend API Key

1. Go to https://resend.com
2. Sign up or log in
3. Click **API Keys** in sidebar
4. Copy your API key (starts with `re_`)

### Step 2: Add to Supabase Secrets

1. Go to https://app.supabase.com
2. Select your ResurrectCI project
3. Click **Edge Functions** in left sidebar
4. Click **Secrets** tab
5. Click **New Secret**
6. Enter:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your API key from Step 1
7. Click **Add Secret**

### Step 3: Wait & Test

1. Wait 2-3 minutes for deployment
2. Open ResurrectCI
3. Settings → Analysis Automation
4. Enable Email Notifications
5. Enter your email
6. Click Save Settings
7. Run code analysis
8. Check your email

## Verification

### Check Secret is Added

```
Supabase Dashboard
├─ Edge Functions
├─ Secrets
└─ RESEND_API_KEY should appear here ✅
```

### Check Edge Function Logs

```
Supabase Dashboard
├─ Edge Functions
├─ send-analysis-email
├─ Logs
└─ Should show: "✅ Email sent via Resend"
```

### Check Email Received

```
Your Email Inbox
├─ From: noreply@resurrectci.com
├─ Subject: 🤖 Code Analysis Report
├─ Content: Analysis summary + action buttons
└─ Should arrive within 1-5 minutes
```

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "No email service configured" | API key not in Secrets | Add RESEND_API_KEY to Supabase Secrets |
| "Resend error: Unauthorized" | Invalid API key | Verify API key is correct in Resend |
| "Resend error: Invalid email" | Wrong email address | Check email in Settings |
| Email not received after 5 min | Edge function not redeployed | Wait 2-3 minutes or manually redeploy |

## Debugging

### Check Edge Function Logs

1. Go to Supabase Dashboard
2. Click **Edge Functions**
3. Click **send-analysis-email**
4. Click **Logs** tab
5. Look for recent entries

### Expected Success Log

```
🔍 Checking for RESEND_API_KEY: ✅ Found
📧 Attempting to send via Resend to: user@example.com
📧 Subject: 🤖 Code Analysis Report: repo-name
📧 API Key present: re_...
📧 Resend response status: 200
✅ Email sent via Resend: email_id_123
```

### Expected Error Log (Missing Secret)

```
🔍 Checking for RESEND_API_KEY: ❌ Not found
⚠️ RESEND_API_KEY not configured in Supabase Secrets
```

## Quick Checklist

- [ ] Resend account created
- [ ] API key copied from Resend
- [ ] Logged into Supabase
- [ ] Correct project selected
- [ ] Navigated to Edge Functions → Secrets
- [ ] Added RESEND_API_KEY secret
- [ ] Secret shows as "Active"
- [ ] Waited 2-3 minutes
- [ ] Email configured in ResurrectCI
- [ ] Test email sent and received

## Still Not Working?

### Try These Steps

1. **Verify API Key**
   - Go to Resend dashboard
   - Check API key is correct
   - Copy it again and update in Supabase

2. **Redeploy Edge Function**
   - Go to Supabase → Edge Functions
   - Click send-analysis-email
   - Click three dots menu
   - Select "Redeploy"
   - Wait 2-3 minutes

3. **Check Email Address**
   - Go to ResurrectCI Settings
   - Verify email address is correct
   - Try a different email address

4. **Check Logs**
   - Go to Supabase → Edge Functions → Logs
   - Look for error messages
   - Share error details for help

## Alternative: Use SendGrid

If Resend doesn't work, try SendGrid:

1. Go to https://sendgrid.com
2. Sign up or log in
3. Go to Settings → API Keys
4. Create new key with Mail Send permission
5. Copy the key
6. Add to Supabase Secrets as `SENDGRID_API_KEY`
7. Wait 2-3 minutes
8. Test email sending

## Key Points to Remember

✅ **DO**:
- Add API key to **Supabase Secrets**
- Wait 2-3 minutes after adding secret
- Check edge function logs for errors
- Verify email address is correct

❌ **DON'T**:
- Add API key to local `.env` file
- Expect emails immediately
- Use invalid email addresses
- Share your API key publicly

## Support Resources

- **Resend Docs**: https://resend.com/docs
- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Edge Function Logs**: Supabase → Edge Functions → Logs

## Summary

The fix is simple:

1. Get API key from Resend
2. Add to Supabase Secrets as RESEND_API_KEY
3. Wait 2-3 minutes
4. Test email sending

That's it! Emails will start working immediately after.

---

**Need help?** Check the edge function logs in Supabase for detailed error messages.
