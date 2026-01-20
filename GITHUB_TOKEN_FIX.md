# GitHub Token Fix

## What Changed
The system now saves your GitHub token to Supabase user metadata when you connect GitHub. This allows the edge function to access your GitHub token during scheduled analysis.

## What You Need to Do

### Step 1: Reconnect GitHub
1. Go to **Settings** (top right)
2. Click **GitHub Integration**
3. If already connected, click **Disconnect**
4. Click **Connect GitHub** again
5. Enter your GitHub token
6. Click **Connect GitHub**
7. Wait for success message ✅

**What happens:**
- Token is saved to localStorage (for client-side use)
- Token is also saved to Supabase user metadata (for edge functions)

### Step 2: Test Scheduled Analysis
1. Go to **DevOps** → **Automation**
2. Click **Analyze Code** button
3. Check browser console (F12)

**Expected result:**
- Console shows: "✅ GitHub token retrieved"
- Analysis completes successfully
- Email is sent

## How It Works Now

```
User connects GitHub
    ↓
Token saved to localStorage
    ↓
Token saved to Supabase user metadata
    ↓
Scheduled analysis triggers
    ↓
Edge function retrieves token from user metadata
    ↓
Analyzes repositories
    ↓
Creates PR and sends email
```

## Troubleshooting

### If you still get "GitHub token not found":

1. **Verify GitHub is connected:**
   - Go to Settings → GitHub Integration
   - You should see your GitHub username
   - If not, reconnect GitHub

2. **Verify token is in Supabase:**
   - Go to Supabase Dashboard
   - Click **Authentication** → **Users**
   - Click your user
   - Check "User Metadata" section
   - You should see `github_token` field

3. **Try reconnecting:**
   - Go to Settings → GitHub Integration
   - Click **Disconnect**
   - Click **Connect GitHub** again
   - Enter your token
   - Click **Connect GitHub**

4. **Check browser console:**
   - Open browser console (F12)
   - Look for logs like:
     - "📤 Saving GitHub token to Supabase user metadata..."
     - "✅ GitHub token saved to Supabase metadata"
   - If you see errors, share them

## Success Indicators

✅ GitHub is connected (Settings → GitHub Integration)
✅ Token is in Supabase metadata (Supabase Dashboard → Users → User Metadata)
✅ Manual analysis works (DevOps → Automation → Analyze Code)
✅ Scheduled analysis runs at scheduled time
✅ Email is received

## Next Steps

1. Reconnect GitHub (Step 1 above)
2. Test manual analysis
3. Test scheduled analysis
4. Configure your preferred schedule

