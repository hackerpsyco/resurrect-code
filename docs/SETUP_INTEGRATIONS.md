# 🔧 Real Integration Setup Guide

This guide shows you how to set up real connections for CodeRabbit and Kestra to enable full automated action-taking capabilities.

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

## 🔄 Kestra Setup

### Option 1: Local Kestra (Development)
1. **Install Kestra**:
   ```bash
   # Using Docker
   docker run --rm -it -p 8080:8080 kestra/kestra:latest server local
   
   # Or using Java
   java -jar kestra-0.15.0.jar server local
   ```

2. **Configure Environment**:
   ```bash
   # Add to .env
   KESTRA_URL=http://localhost:8080
   KESTRA_NAMESPACE=resurrectci
   ```

3. **Deploy ResurrectCI Workflow**:
   - Open Kestra UI: http://localhost:8080
   - Go to "Flows" → "Create"
   - Copy content from `kestra/workflows/resurrect-agent.yml`
   - Save as `resurrectci.resurrect-agent`

### Option 2: Kestra Cloud (Production)
1. **Sign up for Kestra Cloud**:
   - Go to: https://kestra.io/cloud
   - Create account and get your instance URL

2. **Get API Token**:
   - Go to Settings → API Tokens
   - Create new token with workflow execution permissions
   - Add to `.env`: `KESTRA_API_TOKEN=your_token_here`

3. **Configure Environment**:
   ```bash
   # Add to .env
   KESTRA_URL=https://your-instance.kestra.cloud
   KESTRA_API_TOKEN=your_api_token_here
   KESTRA_NAMESPACE=resurrectci
   ```

### Option 3: Self-Hosted Kestra (Enterprise)
1. **Deploy Kestra**:
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     kestra:
       image: kestra/kestra:latest
       ports:
         - "8080:8080"
       environment:
         KESTRA_CONFIGURATION: |
           kestra:
             server:
               basic-auth:
                 enabled: true
                 username: admin
                 password: your_password
   ```

2. **Configure Authentication**:
   ```bash
   # Add to .env
   KESTRA_URL=https://your-kestra-instance.com
   KESTRA_API_TOKEN=your_basic_auth_token
   ```

## 🔐 Supabase Secrets Configuration

For production, add these secrets to your Supabase project:

1. **Go to Supabase Dashboard** → Project Settings → Edge Functions → Secrets

2. **Add Required Secrets**:
   ```bash
   GITHUB_TOKEN=ghp_your_github_token_here
   VERCEL_TOKEN=your_vercel_token_here
   KESTRA_URL=your_kestra_url_here
   KESTRA_API_TOKEN=your_kestra_token_here
   CODERABBIT_API_KEY=your_coderabbit_key_here
   GEMINI_API_KEY=your_gemini_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## 🧪 Testing the Setup

### 1. Test Kestra Connection
```bash
# In DevOps Panel → Settings → Kestra Integration
# Click "Test Connection" button
```

### 2. Test CodeRabbit Integration
```bash
# In DevOps Panel → Deployments
# Click "Test Automation" button
# This will create a failing deployment and trigger automated actions
```

### 3. Verify Full Workflow
1. **Trigger Test Deployment**: Use "Test Automation" button
2. **Watch Automated Actions**: Check Automation tab for real-time progress
3. **Verify PR Creation**: Check GitHub for automatically created PR
4. **Check CodeRabbit Analysis**: PR should have CodeRabbit review comments
5. **Monitor Kestra Execution**: Check Kestra UI for workflow progress

## 📊 Monitoring & Debugging

### Kestra Monitoring
- **UI**: http://localhost:8080 (or your Kestra URL)
- **Executions**: Monitor workflow runs in real-time
- **Logs**: View detailed execution logs

### CodeRabbit Monitoring
- **GitHub**: Check PR comments for CodeRabbit analysis
- **Dashboard**: https://coderabbit.ai/dashboard (if using API)

### ResurrectCI Monitoring
- **DevOps Panel**: Real-time action monitoring
- **Browser Console**: Detailed service logs
- **Supabase Logs**: Edge function execution logs

## 🚨 Troubleshooting

### Kestra Issues
- **Connection Failed**: Check URL and network access
- **Authentication Error**: Verify API token permissions
- **Workflow Not Found**: Ensure workflow is deployed to correct namespace

### CodeRabbit Issues
- **No PR Comments**: Check GitHub App installation
- **API Errors**: Verify API key and organization ID
- **Rate Limits**: CodeRabbit has usage limits on free tier

### General Issues
- **Environment Variables**: Ensure all required vars are set
- **Network Access**: Check firewall/proxy settings
- **Permissions**: Verify GitHub token has repo access

## 🎯 Production Checklist

- [ ] Kestra instance deployed and accessible
- [ ] CodeRabbit GitHub App installed on repositories
- [ ] All environment variables configured
- [ ] Supabase secrets added for Edge Functions
- [ ] ResurrectCI workflow deployed to Kestra
- [ ] Test automation workflow end-to-end
- [ ] Monitor logs and error handling
- [ ] Set up alerts for failed workflows

## 📚 Additional Resources

- **Kestra Documentation**: https://kestra.io/docs
- **CodeRabbit Documentation**: https://docs.coderabbit.ai
- **GitHub API**: https://docs.github.com/en/rest
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

---

Once you complete this setup, ResurrectCI will have full automated action-taking capabilities:
- 🔍 **Real error detection** from Vercel deployments
- 🤖 **AI-powered analysis** with Gemini and CodeRabbit
- 🔄 **Workflow orchestration** with Kestra
- 📝 **Automatic PR creation** with GitHub API
- ✅ **Auto-merge** when tests pass
- 🚀 **Retry deployments** after fixes are applied