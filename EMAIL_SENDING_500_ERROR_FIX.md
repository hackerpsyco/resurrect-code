# Email Sending 500 Error - Complete Fix

## What You're Seeing

```
✅ PR created successfully
✅ Branch created successfully
✅ Commit created on branch
❌ Failed to send email notification
```

The PR is created, but email sending fails with a **500 error**.

## Root Cause

The edge function is returning **500 (Server Error)** because:

1. **RESEND_API_KEY is not in Supabase Secrets**
2. The function tries to send email but fails
3. Returns 500 instead of handling gracefully

## The Fix (3 Steps)

### Step 1: Get Resend API Key

1. Go to https://resend.com
2. Sign up or log in
3. Click **API Keys** in sidebar
4. Copy your API key (starts with `re_`)

### Step 2: Add to Supabase Secrets

**IMPORTANT: This is the critical step!**

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

1. Wait **2-3 minutes** for Supabase to redeploy
2. Run code analysis again
3. Check your email

## Why This Fixes It

**Before (500 Error)**:
```
Edge Function
├─ Looks for RESEND_API_KEY in Secrets
├─ Not found ❌
├─ Can't send email
└─ Returns 500 error
```

**After (Success)**:
```
Edge Function
├─ Looks for RESEND_API_KEY in Secrets
├─ Found ✅
├─ Sends email via Resend
└─ Returns 200 success
```

## Verification

### Check Secret is Added

1. Go to Supabase Dashboard
2. Click **Edge Functions**
3. Click **Secrets**
4. Look for `RESEND_API_KEY`
5. Status should show **Active** ✅

### Check Edge Function Logs

1. Go to Supabase Dashboard
2. Click **Edge Functions**
3. Click **send-analysis-email**
4. Click **Logs** tab
5. Look for recent entries

**Success Log**:
```
🔍 Checking for RESEND_API_KEY: ✅ Found
📧 Attempting to send via Resend to: user@example.com
📧 Resend response status: 200
✅ Email sent via Resend: email_id_123
```

**Error Log (Missing Secret)**:
```
🔍 Checking for RESEND_API_KEY: ❌ Not found
⚠️ RESEND_API_KEY not configured in Supabase Secrets
```

### Test Email Sending

1. Open ResurrectCI
2. Settings → Analysis Automation
3. Enable Email Notifications
4. Enter your email
5. Click Save Settings
6. Run code analysis
7. Check your email (1-5 minutes)

## Common Issues

### Issue 1: Still Getting 500 Error

**Cause**: Secret not deployed yet

**Solution**:
1. Wait 3-5 minutes
2. Refresh the page
3. Try running analysis again
4. Check edge function logs

### Issue 2: Email Not Received

**Cause**: Email service not working

**Solution**:
1. Check edge function logs for errors
2. Verify API key is correct
3. Check spam folder
4. Try a different email address

### Issue 3: "Email service not configured"

**Cause**: API key not in Supabase Secrets

**Solution**:
1. Go to Supabase Secrets
2. Add RESEND_API_KEY
3. Wait 2-3 minutes
4. Try again

## What Changed

### Edge Function Improvements

1. **Better error handling** - Returns 200 even if email service not configured
2. **Detailed logging** - Shows exactly what's happening
3. **Development mode** - Works without email service for testing

### Client-Side Improvements

1. **Better error messages** - Shows helpful guidance
2. **Response parsing** - Handles all response types
3. **User feedback** - Clear messages about what's happening

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

## Next Steps

1. **Add API key to Supabase Secrets** (if not done)
2. **Wait 2-3 minutes** for deployment
3. **Run code analysis** to test
4. **Check your email** for the report
5. **Click action button** to test workflow

## Support

### Check Logs

1. Supabase Dashboard
2. Edge Functions
3. send-analysis-email
4. Logs tab
5. Look for error messages

### Resources

- **Resend Docs**: https://resend.com/docs
- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Setup Guide**: See SUPABASE_SECRETS_SETUP.md

## Summary

The 500 error happens because the API key is not in Supabase Secrets.

**Fix**: Add RESEND_API_KEY to Supabase Secrets and wait 2-3 minutes.

That's it! Emails will start working immediately after.

---

**Still having issues?** Check the edge function logs in Supabase for detailed error messages.
