# Setup Email Service for Automation

## Quick Setup (5 minutes)

### Option 1: Using Resend (Recommended)

**Step 1: Get Resend API Key**
1. Go to https://resend.com
2. Sign up (free tier available)
3. Go to API Keys
4. Copy your API key

**Step 2: Add to Supabase**
1. Go to https://supabase.com
2. Select your project
3. Click "Edge Functions" in left sidebar
4. Click "Secrets" tab
5. Click "New Secret"
6. Name: `RESEND_API_KEY`
7. Value: Paste your Resend API key
8. Click "Add Secret"
9. **Wait 2-3 minutes** for deployment

**Step 3: Test**
1. Go to DevOps → Automation
2. Click "Analyze Code" button
3. Check your email inbox
4. You should receive the analysis report

### Option 2: Using SendGrid

**Step 1: Get SendGrid API Key**
1. Go to https://sendgrid.com
2. Sign up (free tier available)
3. Go to Settings → API Keys
4. Create new API key
5. Copy the key

**Step 2: Add to Supabase**
1. Go to https://supabase.com
2. Select your project
3. Click "Edge Functions" in left sidebar
4. Click "Secrets" tab
5. Click "New Secret"
6. Name: `SENDGRID_API_KEY`
7. Value: Paste your SendGrid API key
8. Click "Add Secret"
9. **Wait 2-3 minutes** for deployment

**Step 3: Test**
1. Go to DevOps → Automation
2. Click "Analyze Code" button
3. Check your email inbox
4. You should receive the analysis report

## Verify Setup

### Check if Email Service is Configured

**In Browser Console:**
```javascript
// This will show if email service is working
import { scheduledAnalysisService } from '@/services/scheduledAnalysisService'
scheduledAnalysisService.triggerManualAnalysis(['owner/repo'])
```

**In Supabase Logs:**
1. Go to Supabase Dashboard
2. Click "Edge Functions"
3. Click "send-analysis-email"
4. Click "Logs" tab
5. Look for recent invocations
6. Should show:
   - ✅ Email sent via Resend
   - OR ✅ Email sent via SendGrid

### Troubleshooting

**Error: "Email service not configured"**
- Check Supabase secrets are added
- Wait 2-3 minutes after adding secret
- Refresh the page

**Error: "Resend error (401)"**
- API key is invalid
- Copy the key again from Resend dashboard
- Update the secret in Supabase

**Error: "SendGrid error (401)"**
- API key is invalid
- Copy the key again from SendGrid dashboard
- Update the secret in Supabase

**Email not received**
- Check spam/junk folder
- Verify email address in settings
- Check edge function logs for errors

## Email Content

When you receive an email, it will contain:

1. **Analysis Summary**
   - Total issues found
   - Critical, High, Medium, Low counts
   - Repository name

2. **Pull Request Link**
   - Direct link to GitHub PR with analysis results

3. **Action Buttons**
   - ✅ Yes, Push to GitHub (approve changes)
   - ❌ No, Skip (reject changes)

4. **Report Details**
   - Full analysis report
   - Issues by priority
   - File-by-file breakdown

## Automation Flow After Setup

```
1. You save automation settings
   ↓
2. Scheduler monitors the scheduled time
   ↓
3. At scheduled time, analysis runs automatically
   ↓
4. Email is sent to your configured email address
   ↓
5. You receive email with analysis results
   ↓
6. You can approve/reject changes via email links
```

## Next Steps

1. ✅ Configure email service (Resend or SendGrid)
2. ✅ Test with manual analysis
3. ✅ Set up automation schedule
4. ✅ Wait for scheduled time or test manually
5. ✅ Receive email with analysis results

## Support

If emails still don't send:
1. Check AUTOMATION_EMAIL_DEBUGGING.md for detailed troubleshooting
2. Check Supabase edge function logs
3. Verify all settings are saved to database
4. Ensure GitHub token is configured
