# GitHub Token Reconnection Guide

## Problem
Your GitHub token is stored in browser localStorage but NOT in the Supabase database. The edge function (which runs on the server) cannot access tokens from the browser, so it needs the token to be in the database.

## Solution: Reconnect GitHub

Follow these steps to save your GitHub token to Supabase:

### Step 1: Go to Settings
1. Click on **Settings** in the left sidebar
2. Scroll down to **Analysis Automation** section
3. Look for **GitHub Token Diagnostic** card at the top

### Step 2: Check Current Status
- Click the **🔍 Check Status** button
- You should see:
  - ✅ Browser Storage: Found (token in localStorage)
  - ❌ Supabase Settings Table: Not Saved (token NOT in database)

### Step 3: Reconnect GitHub
1. Scroll down to find **GitHub Integration** section
2. Click the **Disconnect** button
3. Click the **Connect GitHub** button
4. Enter your GitHub Personal Access Token
5. Click **Connect GitHub**

### Step 4: Verify Token is Saved
1. Go back to **GitHub Token Diagnostic**
2. Click **🔍 Check Status** again
3. You should now see:
   - ✅ Browser Storage: Found
   - ✅ Supabase Settings Table: Saved

### Step 5: Test Scheduled Analysis
1. Go to **DevOps** panel
2. Click **Automation** tab
3. Click **Analyze Code** button
4. The analysis should now work without "GitHub token not found" error

## What Changed
The code has been updated so that when you reconnect GitHub:
- Your token is saved to browser localStorage (for client-side use)
- Your token is ALSO saved to Supabase database (for edge functions)
- The edge function can now retrieve the token from the database

## Troubleshooting

### Token still not in Supabase after reconnecting?
1. Check browser console for errors (F12 → Console tab)
2. Look for messages like "✅ GitHub token saved to settings table"
3. If you see "⚠️ Failed to save to settings table", there may be a network issue
4. Try disconnecting and reconnecting again

### Still getting "GitHub token not found" error?
1. Make sure you completed Step 4 (verification)
2. Try refreshing the page (Ctrl+R or Cmd+R)
3. Check the diagnostic tool again
4. If still failing, check browser console for detailed error messages

### Need to create a new token?
1. In the GitHub Integration section, click **Create Token**
2. This opens GitHub's token creation page
3. Make sure to select:
   - ✅ repo (access repositories)
   - ✅ user (read user profile)
4. Copy the token and paste it in the connection dialog

## Next Steps
Once your token is saved to Supabase:
1. Scheduled analysis will work correctly
2. Edge functions can access your GitHub repositories
3. Analysis reports will be generated and PRs will be created
4. Emails will be sent with analysis results (if enabled)
