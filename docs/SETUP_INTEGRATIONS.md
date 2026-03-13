# 🔧 Real Integration Setup Guide

This guide shows you how to set up real connections for CodeRabbit and other services to enable full automated action-taking capabilities.

## 🐰 CodeRabbit Setup

### Option 1: GitHub App (Recommended)
1. **Install CodeRabbit GitHub App**:
   - Go to: https://github.com/apps/coderabbitai
   - Click "Install" and select your repositories
   - CodeRabbit will automatically analyze PRs created by ResurrectCI

2. **Verify Installation**:
   - Check that `.coderabbit.yaml` exists in your repo (✅ already configured)
   - CodeRabbit will comment on PRs automatically

### Option 2: API Integration (Advanced)
1. **Get API Key**:
   - Sign up at: https://coderabbit.ai
   - Get your API key from dashboard
   - Add to `.env`: `CODERABBIT_API_KEY=your_api_key_here`

2. **Configure Organization**:
   - Get your org ID from CodeRabbit dashboard
   - Add to `.env`: `CODERABBIT_ORG_ID=your_org_id_here`

## 🔐 Supabase Secrets Configuration

For production, add these secrets to your Supabase project:

1. **Go to Supabase Dashboard** → Project Settings → Edge Functions → Secrets

2. **Add Required Secrets**:
   ```bash
   GITHUB_TOKEN=ghp_your_github_token_here
   VERCEL_TOKEN=your_vercel_token_here
   CODERABBIT_API_KEY=your_coderabbit_key_here
   GEMINI_API_KEY=your_gemini_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## 🧪 Testing the Setup

### 1. Test CodeRabbit Integration
```bash
# In DevOps Panel → Deployments
# Click "Test Automation" button
# This will create a failing deployment and trigger automated actions
```

### 2. Verify Full Workflow
1. **Trigger Test Deployment**: Use "Test Automation" button
2. **Watch Automated Actions**: Check Automation tab for real-time progress
3. **Verify PR Creation**: Check GitHub for automatically created PR
4. **Check CodeRabbit Analysis**: PR should have CodeRabbit review comments

## 📊 Monitoring & Debugging

### CodeRabbit Monitoring
- **GitHub**: Check PR comments for CodeRabbit analysis
- **Dashboard**: https://coderabbit.ai/dashboard (if using API)

### ResurrectCI Monitoring
- **DevOps Panel**: Real-time action monitoring
- **Browser Console**: Detailed service logs
- **Supabase Logs**: Edge function execution logs

## 🚨 Troubleshooting

### CodeRabbit Issues
- **No PR Comments**: Check GitHub App installation
- **API Errors**: Verify API key and organization ID
- **Rate Limits**: CodeRabbit has usage limits on free tier

### General Issues
- **Environment Variables**: Ensure all required vars are set
- **Network Access**: Check firewall/proxy settings
- **Permissions**: Verify GitHub token has repo access

## 🎯 Production Checklist

- [ ] CodeRabbit GitHub App installed on repositories
- [ ] All environment variables configured
- [ ] Supabase secrets added for Edge Functions
- [ ] Test automation workflow end-to-end
- [ ] Monitor logs and error handling

## 📚 Additional Resources

- **CodeRabbit Documentation**: https://docs.coderabbit.ai
- **GitHub API**: https://docs.github.com/en/rest
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

---

Once you complete this setup, ResurrectCI will have full automated action-taking capabilities:
- 🔍 **Real error detection** from Vercel deployments
- 🤖 **AI-powered analysis** with Gemini and CodeRabbit
- 🔄 **Workflow orchestration** with automated flows
- 📝 **Automatic PR creation** with GitHub API
- ✅ **Auto-merge** when tests pass
- 🚀 **Retry deployments** after fixes are applied