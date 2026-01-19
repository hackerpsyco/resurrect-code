# Fix Email 500 Error - Action Plan

## Current Status

✅ PR creation works perfectly
✅ GitHub integration works
❌ Email sending fails with 500 error

## Root Cause

**The Resend API key is not configured in Supabase Secrets**

The edge function can't find the API key, so it returns 500 error.

## Solution (5 Minutes)

### Step 1: Get Resend API Key (2 minutes)

```bash
1. Open: https://resend.com
2. Sign up or log in
3. Click "API Keys" in top right menu
4. Copy your API key (starts with "re_")
```

### Step 2: Add to Supabase Secrets (2 minutes)

```bash
1. Open: https://app.supabase.com
2. Select your ResurrectCI project
3. Click "Edge Functions" in left sidebar
4. Click "Secrets" tab
5. Click "New Secret"
6. Enter:
   - Name: RESEND_API_KEY
   - Value: (paste your API key from Step 1)
7. Click "Add Secret"
```

### Step 3: Wait for Deployment (1 minute)

```bash
Wait 2-3 minutes for Supabase to redeploy
```

### Step 4: Test (1 minute)

```bash
1. Open ResurrectCI
2. Settings → Analysis Automation
3. Enable Email Notifications
4. Enter your email
5. Save Settings
6. Run code analysis
7. Check your email (1-5 minutes)
```

## Verification Checklist

- [ ] Resend account created
- [ ] API key copied
- [ ] Logged into Supabase
- [ ] Navigated to Edge Functions → Secrets
- [ ] Added RESEND_API_KEY secret
- [ ] Secret shows "Active" status
- [ ] Waited 2-3 minutes
- [ ] Email configured in ResurrectCI
- [ ] Test email received

## What Changes

### Before (500 Error)
```
Edge Function
├─ Looks for RESEND_API_KEY
├─ Not found ❌
├─ Can't send email
└─ Returns 500 error
```

### After (Success)
```
Edge Function
├─ Looks for RESEND_API_KEY
├─ Found ✅
├─ Sends email via Resend
└─ Returns 200 success
```

## Code Changes Made

### 1. Edge Function Improvements
- Better error handling
- Detailed logging
- Development mode support
- Returns 200 even if email service not configured

### 2. Client-Side Improvements
- Better error messages
- Response parsing
- Helpful guidance for users
- Clear feedback about configuration

## Expected Results

After adding the API key:

✅ Email sends successfully
✅ You receive analysis report
✅ Email contains action buttons
✅ Clicking "Yes" creates PR
✅ Clicking "No" skips PR

## Troubleshooting

### Still Getting 500 Error?

1. **Check secret is added**
   - Supabase → Edge Functions → Secrets
   - Look for RESEND_API_KEY
   - Status should show "Active"

2. **Wait longer**
   - Wait 3-5 minutes for full deployment
   - Refresh the page
   - Try running analysis again

3. **Check logs**
   - Supabase → Edge Functions → send-analysis-email → Logs
   - Look for error messages
   - Share error details for help

### Email Not Received?

1. **Check spam folder**
   - Add noreply@resurrectci.com to contacts

2. **Verify email address**
   - Settings → Analysis Automation
   - Check email is correct

3. **Check API key**
   - Verify API key is correct in Resend
   - Copy it again and update in Supabase

## Key Points

✅ **DO**:
- Add API key to **Supabase Secrets**
- Wait 2-3 minutes after adding
- Check secret status is "Active"
- Verify email address in Settings

❌ **DON'T**:
- Add API key to local .env file
- Expect emails immediately
- Share your API key
- Use invalid email addresses

## Time Breakdown

| Step | Time |
|------|------|
| Get Resend API Key | 2 min |
| Add to Supabase Secrets | 2 min |
| Wait for Deployment | 2-3 min |
| Test Email | 1-5 min |
| **Total** | **7-12 min** |

## Success Indicators

You'll know it's working when:

1. ✅ Secret shows "Active" in Supabase
2. ✅ Email arrives in your inbox
3. ✅ Email contains analysis report
4. ✅ Action buttons are clickable
5. ✅ PR is created when you click "Yes"

## Next Steps

1. **Right now**: Get Resend API key (2 min)
2. **Next**: Add to Supabase Secrets (2 min)
3. **Then**: Wait for deployment (2-3 min)
4. **Finally**: Test email sending (1-5 min)

## Support

### Check Edge Function Logs

```
Supabase Dashboard
├─ Edge Functions
├─ send-analysis-email
├─ Logs tab
└─ Look for error messages
```

### Resources

- **Resend Docs**: https://resend.com/docs
- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Setup Guide**: RESEND_API_KEY_SETUP_VISUAL.md

## Summary

**Problem**: Email 500 error

**Cause**: API key not in Supabase Secrets

**Solution**: Add RESEND_API_KEY to Supabase Secrets

**Time**: 5-10 minutes

**Result**: Emails work automatically! 🎉

---

**Ready?** Start with Step 1 above!
