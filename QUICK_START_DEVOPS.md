# Quick Start: DevOps Panel

## 5-Minute Setup

### Step 1: Get Vercel Token (1 min)
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it "ResurrectCI"
4. Select "Full Account" scope
5. Copy the token

### Step 2: Connect Vercel (2 min)
1. Open ResurrectCI Dashboard
2. Click **Settings** ⚙️
3. Click **Integrations** tab
4. Click **Vercel** tab
5. Paste your token
6. Click **Connect**
7. Click **Save**

### Step 3: Open DevOps Panel (1 min)
1. Go back to Dashboard
2. Click **DevOps** button
3. You should see your projects!

### Step 4: View Deployments (1 min)
1. Go to **Deployments** tab
2. Select a project
3. See your recent deployments
4. Click **Logs** to view build logs

## What You'll See

### Overview Tab
- Total Projects
- Total Deployments
- Ready Deployments
- System Status

### Deployments Tab
- Your Vercel projects
- Recent deployments
- Deployment status (READY, ERROR, BUILDING)
- Build logs

### Status Indicators
- 🟢 **READY** - Live and active
- 🔴 **ERROR** - Deployment failed
- 🟡 **BUILDING** - Currently building
- ⚪ **QUEUED** - Waiting to build

## Troubleshooting

### No Projects Showing?
1. Check token is correct
2. Verify you have projects in Vercel
3. Click "Refresh" button
4. Check browser console for errors

### Build Logs Not Showing?
1. Make sure deployment completed
2. Try clicking "Logs" again
3. Some deployments may not have logs

### Still Not Working?
1. Disconnect and reconnect Vercel
2. Clear browser cache
3. Refresh the page
4. Check https://status.vercel.com

## Next Steps

- ✅ View your projects and deployments
- ⏭️ Set up error detection
- ⏭️ Enable auto-fix workflows
- ⏭️ Configure GitHub integration

## Support

See detailed guides:
- `DEVOPS_PANEL_SETUP.md` - Complete setup guide
- `DEVOPS_PANEL_TROUBLESHOOTING.md` - Troubleshooting
- `DEVOPS_PANEL_FIXES_SUMMARY.md` - Technical details

