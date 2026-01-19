# Quick Start: Email Notifications

## 5-Minute Setup

### 1. Get an Email API Key (2 minutes)

**Choose one:**

**Option A: Resend (Recommended)**
1. Go to https://resend.com
2. Sign up (free)
3. Go to API Keys
4. Copy your API key

**Option B: SendGrid**
1. Go to https://sendgrid.com
2. Sign up (free)
3. Go to Settings → API Keys
4. Create new key with Mail Send permission
5. Copy your API key

### 2. Add API Key to Supabase (2 minutes)

1. Open your Supabase project
2. Go to **Edge Functions** → **Secrets**
3. Click **New Secret**
4. Enter:
   - **Name**: `RESEND_API_KEY` (or `SENDGRID_API_KEY`)
   - **Value**: Your API key from step 1
5. Click **Add Secret**

### 3. Configure ResurrectCI (1 minute)

1. Click **Settings** (⚙️) in ResurrectCI
2. Click **Analysis Automation** in sidebar
3. Check **Enable Email Notifications**
4. Enter your email address
5. Click **Save Settings**

### Done! 🎉

Now when you run code analysis:
- You'll receive an email with the report
- Click **Yes, Push to GitHub** to create a PR
- Click **No, Skip** to skip the PR

## Troubleshooting

### Email not received?

1. **Check spam folder** - Add noreply@resurrectci.com to contacts
2. **Verify email address** - Check Settings → Analysis Automation
3. **Check API key** - Verify it's correct in Supabase Secrets
4. **Check logs** - Go to Supabase → Edge Functions → Logs

### Still not working?

See full guide: `EMAIL_SERVICE_SETUP.md`

## What You'll Get

Each email includes:
- 📊 Analysis summary (issues by priority)
- 📋 Issues by file
- ✅ Action buttons (Yes/No)
- 🔗 PR link (if created)

## Next Steps

1. Run a code analysis
2. Check your email
3. Click an action button
4. See the PR created automatically!

---

**Need help?** See `EMAIL_SERVICE_SETUP.md` for detailed instructions.
