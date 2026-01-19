# DevOps Panel Setup Guide

## Overview

The DevOps Panel now fetches real Vercel projects and deployments. It displays:
- Total projects connected to Vercel
- Total deployments across all projects
- Live deployment status (READY, ERROR, BUILDING, etc.)
- Build logs for each deployment
- Real-time metrics and monitoring

## Prerequisites

1. **Vercel Account**: You need a Vercel account with projects
2. **Vercel API Token**: Generate a token from Vercel settings
3. **Supabase Edge Function**: The `vercel-api` function must be deployed

## Setup Steps

### 1. Get Your Vercel API Token

1. Go to [Vercel Settings](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name (e.g., "ResurrectCI")
4. Select scope: "Full Account"
5. Copy the token

### 2. Add Token to Your Settings

1. Open ResurrectCI dashboard
2. Go to Settings → Integrations
3. Find "Vercel Integration"
4. Paste your Vercel API token
5. Click "Connect Vercel"

### 3. Verify Connection

1. Open DevOps Panel
2. Go to "Deployments" tab
3. You should see your Vercel projects listed
4. Click on a project to view its deployments

## Features

### Overview Tab
- **Total Projects**: Number of projects connected to Vercel
- **Total Deployments**: All deployments across all projects
- **Ready Deployments**: Live and active deployments
- **System Status**: Overall system health

### Deployments Tab
- **Projects List**: All your Vercel projects
- **Deployments List**: Recent deployments for selected project
- **Build Logs**: Real-time build logs for each deployment
- **Status Badges**: Visual indicators for deployment status

### Status Indicators

| Status | Meaning | Color |
|--------|---------|-------|
| READY | Deployment is live | Green |
| ERROR | Deployment failed | Red |
| BUILDING | Currently building | Yellow |
| INITIALIZING | Starting build | Yellow |
| QUEUED | Waiting to build | Gray |
| CANCELED | Build was canceled | Gray |

## Troubleshooting

### No Projects Showing

**Problem**: Projects list is empty

**Solutions**:
1. Verify Vercel token is correct
2. Check that you have projects in your Vercel account
3. Click "Refresh" button to reload projects
4. Check browser console for errors

### Build Logs Not Showing

**Problem**: Logs are empty when you click "Logs"

**Solutions**:
1. Make sure deployment has completed
2. Try clicking "Logs" again
3. Check that the deployment has build logs available
4. Some deployments may not have logs if they were imported

### Connection Errors

**Problem**: "Failed to fetch projects" error

**Solutions**:
1. Verify your Vercel token is still valid
2. Check that your token has "Full Account" scope
3. Try disconnecting and reconnecting
4. Check your internet connection
5. Check browser console for detailed error messages

## API Integration

The DevOps Panel uses the `useVercel` hook which calls the Supabase Edge Function `vercel-api`.

### Available Actions

```typescript
// Fetch all projects
await callVercelAPI({ action: "list_projects", teamId?: string })

// Fetch deployments for a project
await callVercelAPI({ 
  action: "list_deployments", 
  projectId: string, 
  teamId?: string 
})

// Fetch build logs for a deployment
await callVercelAPI({ 
  action: "get_build_logs", 
  deploymentId: string, 
  teamId?: string 
})
```

## Real-Time Updates

The DevOps Panel automatically:
- Fetches projects on component mount
- Fetches deployments when you select a project
- Fetches build logs when you click the "Logs" button
- Shows loading states while fetching data
- Displays error messages if requests fail

## Performance Tips

1. **Limit Projects**: If you have many projects, consider filtering by team
2. **Cache Data**: The hook caches data in component state
3. **Refresh Manually**: Click "Refresh" to get latest data
4. **Check Logs**: Build logs can be large; they're displayed in a scrollable container

## Next Steps

1. ✅ Set up Vercel token
2. ✅ Connect Vercel account
3. ✅ View projects and deployments
4. ⏭️ Set up automation rules
5. ⏭️ Configure error detection
6. ⏭️ Enable auto-fix workflows

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Check Vercel API status at [status.vercel.com](https://status.vercel.com)
4. Contact support with error details

