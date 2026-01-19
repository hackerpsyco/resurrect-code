# Email Service Setup Guide

## Overview

The ResurrectCI platform now supports email notifications for code analysis reports. Users can receive analysis summaries via email and approve/reject GitHub auto-push directly from their email.

## Supported Email Services

The system supports two email service providers:

1. **Resend** (Recommended for startups)
   - Free tier: 100 emails/day
   - Easy setup
   - Great deliverability

2. **SendGrid** (Enterprise-grade)
   - Free tier: 100 emails/day
   - Robust infrastructure
   - Advanced features

## Setup Instructions

### Option 1: Using Resend

1. **Create a Resend Account**
   - Go to https://resend.com
   - Sign up for a free account
   - Verify your email

2. **Get Your API Key**
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key

3. **Configure Supabase**
   - Go to your Supabase project
   - Navigate to Edge Functions → Secrets
   - Add a new secret:
     - Name: `RESEND_API_KEY`
     - Value: Your Resend API key

4. **Verify Domain (Optional but Recommended)**
   - In Resend dashboard, add your domain
   - Update DNS records as instructed
   - This improves email deliverability

### Option 2: Using SendGrid

1. **Create a SendGrid Account**
   - Go to https://sendgrid.com
   - Sign up for a free account
   - Verify your email

2. **Get Your API Key**
   - Navigate to Settings → API Keys
   - Create a new API key with Mail Send permissions
   - Copy the key

3. **Configure Supabase**
   - Go to your Supabase project
   - Navigate to Edge Functions → Secrets
   - Add a new secret:
     - Name: `SENDGRID_API_KEY`
     - Value: Your SendGrid API key

4. **Verify Sender Email**
   - In SendGrid dashboard, verify your sender email
   - This is required to send emails

## Configuration in ResurrectCI

Once you've set up an email service:

1. **Open Settings**
   - Click the Settings icon (⚙️) in the top navigation

2. **Navigate to Analysis Automation**
   - Click "Analysis Automation" in the sidebar

3. **Configure Email Settings**
   - Enable "Email Notifications"
   - Enter your email address
   - Choose report format (Short or Full)
   - Enable "Auto-push to GitHub" if desired
   - Select analysis schedule

4. **Save Settings**
   - Click "Save Settings"
   - You'll see a confirmation message

## Email Notification Features

### What You'll Receive

When analysis is complete, you'll receive an email with:

- **Summary Statistics**
  - Total issues found
  - Breakdown by priority (Critical, High, Medium, Low)

- **Issues by File**
  - List of files analyzed
  - Specific issues found in each file

- **Action Buttons**
  - ✅ "Yes, Push to GitHub" - Creates a PR with improvements
  - ❌ "No, Skip" - Skips GitHub push

- **Pull Request Link**
  - Direct link to the created PR (if applicable)

### Email Reply Workflow

1. **User receives email** with analysis report
2. **User clicks action button** in email
3. **GitHub PR is created automatically** (if "Yes" was clicked)
4. **Confirmation page** shows the result

## Troubleshooting

### Email Not Received

**Check 1: Email Service Configuration**
- Verify API key is correctly set in Supabase secrets
- Check that the secret name matches exactly (case-sensitive)

**Check 2: Email Address**
- Verify the email address is correct in Settings
- Check spam/junk folder

**Check 3: Service Status**
- Check Resend or SendGrid status page
- Verify your account has remaining email quota

**Check 4: Logs**
- Check Supabase Edge Function logs for errors
- Look for specific error messages

### "Error sending email notification"

This error typically means:

1. **No email service configured**
   - Set up either Resend or SendGrid
   - Add API key to Supabase secrets

2. **Invalid API key**
   - Verify the API key is correct
   - Check for typos or extra spaces

3. **Email service quota exceeded**
   - Check your email service account
   - Upgrade plan if needed

4. **Invalid email address**
   - Verify the recipient email is valid
   - Check for typos

## Development Mode

If no email service is configured:
- Emails are logged to the console
- No actual emails are sent
- This is useful for testing

To enable email sending, configure at least one email service provider.

## Best Practices

1. **Use a dedicated email address**
   - Create a team email for notifications
   - Easier to manage and filter

2. **Set up email filters**
   - Create a filter for ResurrectCI emails
   - Organize notifications in a folder

3. **Monitor email quota**
   - Keep track of emails sent
   - Upgrade plan if approaching limits

4. **Test the setup**
   - Run a test analysis
   - Verify you receive the email
   - Click the action buttons to test workflow

## Support

For issues with:

- **Resend**: https://resend.com/support
- **SendGrid**: https://support.sendgrid.com
- **ResurrectCI**: Check the GitHub issues or documentation

## Security Notes

- API keys are stored securely in Supabase secrets
- Never commit API keys to version control
- Rotate API keys periodically
- Use environment-specific keys for different environments
