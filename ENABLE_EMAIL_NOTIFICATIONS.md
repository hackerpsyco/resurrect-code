# Enable Email Notifications for Scheduled Analysis

## Current Status
✅ Analysis is working and creating pull requests
❌ Emails are not being sent because notifications are disabled

## Why Emails Aren't Sending

The system has two requirements for sending emails:

1. **Email notifications must be enabled** in your automation settings
2. **Your email address must be saved** in the settings

## How to Enable Email Notifications

### Step 1: Go to Automation Settings
1. Go to **DevOps → Automation**
2. Scroll down to **Analysis Automation Settings**

### Step 2: Enable Email Notifications
1. Find the toggle for **"Enable Email Notifications"**
2. Turn it **ON** ✅

### Step 3: Enter Your Email Address
1. Find the **"Email Address"** field
2. Enter your email address (e.g., `your-email@example.com`)
3. Make sure it's correct!

### Step 4: Save Settings
1. Click **"Save Settings"** button
2. You should see a success message

### Step 5: Test Email Sending
1. Go to **DevOps → Automation**
2. Click **"Analyze Code"** to trigger manual analysis
3. Check your email inbox for the analysis report

## What You'll Receive

When emails are enabled, you'll get:

📧 **Email Subject:** `📊 Code Analysis Complete - X issues found`

📧 **Email Content:**
- Summary of analysis results
- Issues found by priority (Critical, High, Medium, Low)
- Link to view the pull request on GitHub
- Action buttons to approve or reject the improvements

## Email Service Configuration

The system supports two email services:

### Option 1: Resend (Recommended)
1. Sign up at https://resend.com
2. Get your API key
3. Add to Supabase Secrets:
   - Go to Supabase Dashboard → Settings → Secrets
   - Add: `RESEND_API_KEY` = `your-api-key`

### Option 2: SendGrid
1. Sign up at https://sendgrid.com
2. Get your API key
3. Add to Supabase Secrets:
   - Go to Supabase Dashboard → Settings → Secrets
   - Add: `SENDGRID_API_KEY` = `your-api-key`

## Troubleshooting

### Emails Still Not Sending?

**Check 1: Verify Settings Are Saved**
1. Go to DevOps → Automation
2. Scroll to Analysis Automation Settings
3. Verify:
   - ✅ Email notifications toggle is ON
   - ✅ Email address is filled in
   - ✅ Settings were saved

**Check 2: Verify Email Service is Configured**
1. Go to Supabase Dashboard
2. Go to Settings → Secrets
3. Check if `RESEND_API_KEY` or `SENDGRID_API_KEY` is set
4. If not, add one of them

**Check 3: Check Edge Function Logs**
1. Go to Supabase Dashboard
2. Go to Functions → send-analysis-email
3. Check the latest execution logs
4. Look for:
   - `🔍 Checking for RESEND_API_KEY: ✅ Found` (or SendGrid)
   - `✅ Email sent via Resend` (or SendGrid)

**Check 4: Verify Email Address**
1. Make sure the email address in settings is correct
2. Check your spam/junk folder
3. Add `noreply@resurrectci.com` to your contacts

## Email Flow

```
1. Analysis completes
   ↓
2. Check if email notifications are enabled
   ↓
3. Check if email address is set
   ↓
4. Call send-analysis-email function
   ↓
5. Try Resend API
   ↓
6. If Resend fails, try SendGrid API
   ↓
7. Email sent to your inbox ✅
```

## Next Steps

1. **Enable email notifications** in your automation settings
2. **Enter your email address**
3. **Save settings**
4. **Configure email service** (Resend or SendGrid) in Supabase Secrets
5. **Trigger analysis** to test
6. **Check your inbox** for the email

Once configured, you'll receive emails for every scheduled analysis!

## Quick Checklist

- [ ] Email notifications toggle is ON
- [ ] Email address is entered and correct
- [ ] Settings are saved
- [ ] Email service API key is in Supabase Secrets
- [ ] Trigger analysis to test
- [ ] Check inbox for email

Done! 🎉
