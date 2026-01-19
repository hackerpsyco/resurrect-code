# Email 500 Error - Summary & Solution

## What's Happening

When you click "Push to GitHub":
1. ✅ PR is created successfully
2. ✅ Branch is created
3. ✅ Commit is created
4. ❌ Email sending fails with 500 error

## Why It's Failing

The edge function is trying to send an email but:
- **RESEND_API_KEY is not in Supabase Secrets**
- Function can't find the API key
- Returns 500 (Server Error)

## The Fix (One Step)

### Add RESEND_API_KEY to Supabase Secrets

```
1. Go to https://app.supabase.com
2. Select your project
3. Click Edge Functions → Secrets
4. Click "New Secret"
5. Name: RESEND_API_KEY
6. Value: Your Resend API key (from https://resend.com/api-keys)
7. Click "Add Secret"
8. Wait 2-3 minutes
9. Done! ✅
```

## That's It!

After adding the secret and waiting 2-3 minutes:
- Emails will send automatically
- You'll receive analysis reports
- Action buttons will work
- GitHub PRs will be created on approval

## Important Notes

⚠️ **Critical**:
- Add API key to **Supabase Secrets**, NOT local .env
- Edge functions run on Supabase servers
- They can't access your local .env file
- They read from Supabase Secrets

⏱️ **Timing**:
- Wait 2-3 minutes after adding secret
- Supabase needs time to redeploy
- Then emails will work

## Verification

### Check Secret is Added

```
Supabase Dashboard
├─ Edge Functions
├─ Secrets
└─ RESEND_API_KEY should appear with status "Active" ✅
```

### Check Logs

```
Supabase Dashboard
├─ Edge Functions
├─ send-analysis-email
├─ Logs
└─ Should show "✅ Email sent via Resend"
```

### Test Email

```
ResurrectCI
├─ Settings → Analysis Automation
├─ Enable Email Notifications
├─ Enter your email
├─ Save Settings
├─ Run code analysis
└─ Check your email (1-5 minutes)
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Still getting 500 error | Secret not deployed | Wait 3-5 minutes, refresh page |
| Email not received | Email service not working | Check edge function logs |
| "Email service not configured" | API key not in Secrets | Add RESEND_API_KEY to Secrets |
| Email received but no buttons | HTML rendering issue | Try different email client |

## Files to Read

1. **RESEND_API_KEY_SETUP_VISUAL.md** - Step-by-step visual guide
2. **EMAIL_SENDING_500_ERROR_FIX.md** - Detailed troubleshooting
3. **SUPABASE_SECRETS_SETUP.md** - Complete setup guide
4. **EMAIL_ARCHITECTURE_DIAGRAM.md** - System architecture

## Quick Links

- **Resend**: https://resend.com/api-keys
- **Supabase**: https://app.supabase.com
- **ResurrectCI**: Your local instance

## Summary

**Problem**: Email sending returns 500 error

**Cause**: API key not in Supabase Secrets

**Solution**: Add RESEND_API_KEY to Supabase Secrets

**Time**: 2-3 minutes setup + 2-3 minutes deployment = 5-6 minutes total

**Result**: Emails will send automatically! 🎉

---

**Ready to fix it?** Follow the one-step solution above!
