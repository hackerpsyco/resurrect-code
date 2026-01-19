# Supabase Secrets Setup for Email Notifications

## Problem

The email sending is failing because the Resend API key is not configured in **Supabase Secrets**. 

The local `.env` file is only used for client-side environment variables (prefixed with `VITE_`). Edge Functions run on Supabase servers and need secrets configured in the Supabase dashboard.

## Solution: Add API Key to Supabase Secrets

### Step 1: Get Your Resend API Key

1. Go to https://resend.com
2. Sign up or log in
3. Navigate to **API Keys** section
4. Copy your API key (starts with `re_`)

### Step 2: Add Secret to Supabase

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to Edge Functions Secrets**
   - Click **Edge Functions** in left sidebar
   - Click **Secrets** tab (or look for a secrets icon)

3. **Add New Secret**
   - Click **New Secret** button
   - Enter:
     - **Name**: `RESEND_API_KEY`
     - **Value**: Your Resend API key (paste the full key)
   - Click **Add Secret**

4. **Verify Secret Added**
   - You should see `RESEND_API_KEY` in the secrets list
   - Status should show as "Active"

### Step 3: Redeploy Edge Function

After adding the secret, the edge function needs to be redeployed:

**Option A: Automatic (Recommended)**
- Supabase automatically redeploys when secrets change
- Wait 1-2 minutes for deployment

**Option B: Manual**
- Go to Edge Functions
- Find `send-analysis-email`
- Click the three dots menu
- Select "Redeploy"

### Step 4: Test Email Sending

1. Open ResurrectCI
2. Go to Settings → Analysis Automation
3. Enable Email Notifications
4. Enter your email address
5. Click Save Settings
6. Run a code analysis
7. Check your email for the report

## Troubleshooting

### Secret Not Appearing in Supabase

**Check 1: Correct Project**
- Make sure you're in the correct Supabase project
- Verify project name matches your ResurrectCI project

**Check 2: Correct Location**
- Go to Edge Functions → Secrets (not Settings)
- Look for the Secrets tab

**Check 3: Secret Name**
- Must be exactly: `RESEND_API_KEY`
- Case-sensitive!

### Email Still Not Sending

**Check 1: API Key Valid**
- Verify the API key is correct
- Check for extra spaces or typos
- Try copying from Resend again

**Check 2: Edge Function Redeployed**
- Wait 2-3 minutes after adding secret
- Try refreshing the page
- Check Edge Functions → Logs for errors

**Check 3: Email Address Valid**
- Verify email address in Settings
- Check for typos
- Try a different email address

**Check 4: Check Logs**
- Go to Edge Functions
- Click `send-analysis-email`
- Click **Logs** tab
- Look for error messages
- Share error details for debugging

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Resend error: Unauthorized" | Invalid API key | Verify API key in Supabase Secrets |
| "Resend error: Invalid email" | Bad email address | Check email format in Settings |
| "No email service configured" | Secret not set | Add RESEND_API_KEY to Supabase Secrets |
| "Failed to send email" | Network issue | Check internet connection, try again |

## Verification Checklist

- [ ] Resend account created
- [ ] API key copied from Resend
- [ ] Logged into Supabase dashboard
- [ ] Navigated to Edge Functions → Secrets
- [ ] Added `RESEND_API_KEY` secret
- [ ] Secret shows as "Active"
- [ ] Waited 2-3 minutes for deployment
- [ ] Email configured in ResurrectCI Settings
- [ ] Test email sent and received

## Alternative: SendGrid

If you prefer SendGrid instead of Resend:

1. Get API key from https://app.sendgrid.com/settings/api_keys
2. Add to Supabase Secrets as `SENDGRID_API_KEY`
3. The edge function will automatically use SendGrid as fallback

## Need Help?

### Check Edge Function Logs

1. Go to Supabase Dashboard
2. Click **Edge Functions**
3. Click `send-analysis-email`
4. Click **Logs** tab
5. Look for recent errors
6. Share the error message

### Resend Support

- Documentation: https://resend.com/docs
- Support: https://resend.com/support

### Supabase Support

- Documentation: https://supabase.com/docs/guides/functions
- Support: https://supabase.com/support

## Summary

The key difference:
- **Local `.env`** → Client-side variables (VITE_*)
- **Supabase Secrets** → Server-side variables (Edge Functions)

Email sending requires the API key in **Supabase Secrets**, not in `.env`.

Once you add the secret and wait for deployment, emails will start sending automatically!
