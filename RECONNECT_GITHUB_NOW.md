# ⚠️ IMPORTANT: Reconnect GitHub Now

## Why?
The system was updated to save your GitHub token to Supabase. You need to **reconnect GitHub** for the new code to take effect.

## Quick Steps (2 minutes)

### Step 1: Go to Settings
1. Click **Settings** (top right of your app)
2. Click **GitHub Integration**

### Step 2: Disconnect (if already connected)
- If you see "GitHub Connected!", click **Disconnect**
- Wait for confirmation

### Step 3: Reconnect GitHub
1. Click **Connect GitHub**
2. Enter your GitHub Personal Access Token
   - If you don't have one, click **Create Token**
   - This opens GitHub settings to create a new token
   - Make sure it has `repo` and `user` permissions
3. Click **Connect GitHub**
4. Wait for success message ✅

### Step 4: Verify in Supabase
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Authentication** (left sidebar)
4. Click **Users**
5. Click your user
6. Scroll down to **User Metadata**
7. You should see:
   ```json
   {
     "github_token": "ghp_...",
     "github_login": "your-username",
     "github_id": 12345
   }
   ```

If you don't see this, the token wasn't saved. Try reconnecting again.

### Step 5: Test Analysis
1. Go to **DevOps** → **Automation**
2. Click **Analyze Code** button
3. Open browser console (F12)
4. Look for these logs:
   - "🔍 Fetching user metadata for user: ..."
   - "✅ User fetched successfully"
   - "✅ GitHub token retrieved"
   - "📊 Analyzing repository: ..."

**Expected result:**
- Analysis completes successfully
- Email is sent
- No "GitHub token not found" error

## Troubleshooting

### If you still get "GitHub token not found":

**Check 1: Is GitHub connected?**
- Go to Settings → GitHub Integration
- You should see your GitHub username
- If not, reconnect GitHub

**Check 2: Is token in Supabase?**
- Go to Supabase Dashboard → Authentication → Users
- Click your user
- Check User Metadata section
- Should have `github_token` field

**Check 3: Browser cache**
- Clear browser cache (Ctrl+Shift+Delete)
- Select "All time"
- Click "Clear data"
- Reload the page

**Check 4: Edge function logs**
- Go to Supabase Dashboard
- Click **Logs** (left sidebar)
- Look for `run-scheduled-analysis` function
- Check for error messages

### If token is not saving to Supabase:

1. Check browser console (F12) when connecting GitHub
2. Look for logs like:
   - "📤 Saving GitHub token to Supabase user metadata..."
   - "✅ GitHub token saved to Supabase metadata"
3. If you see errors, share them

## Success Checklist

After reconnecting GitHub:
- [ ] GitHub is connected (Settings → GitHub Integration)
- [ ] Token is in Supabase metadata (Supabase Dashboard → Users → User Metadata)
- [ ] Manual analysis works (DevOps → Automation → Analyze Code)
- [ ] Console shows "✅ GitHub token retrieved"
- [ ] Analysis completes successfully
- [ ] Email is received

## Next Steps

Once GitHub is reconnected and working:
1. Test manual analysis (DevOps → Automation → Analyze Code)
2. Test scheduled analysis (set schedule to run in 2 minutes)
3. Verify email is received
4. Configure your preferred schedule (daily/weekly)

## Timeline

| Step | Time | Status |
|------|------|--------|
| Disconnect GitHub | 30 sec | ⏳ TODO |
| Reconnect GitHub | 1 min | ⏳ TODO |
| Verify in Supabase | 1 min | ⏳ TODO |
| Test analysis | 1 min | ⏳ TODO |
| **TOTAL** | **3-4 min** | ⏳ TODO |

---

**Do this now and the system will work!** 🚀

