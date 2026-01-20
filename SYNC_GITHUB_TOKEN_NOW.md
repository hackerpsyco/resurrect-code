# ⚡ Quick Fix: Sync GitHub Token Now

## The Problem
Your GitHub token is in browser storage but NOT in Supabase metadata. The edge function needs it in Supabase to work.

## The Solution (1 minute)

### Option 1: Use the Sync Button (Easiest)

1. Go to **Settings** (top right)
2. Scroll down to **GitHub Token Sync** section
3. You should see:
   - ✅ Browser Storage: Found
   - ❌ Supabase Metadata: Not synced
4. Click **🔄 Sync Now** button
5. Wait for success message ✅

**Done!** Your token is now synced to Supabase.

### Option 2: Reconnect GitHub (Alternative)

If the sync button doesn't work:

1. Go to **Settings** → **GitHub Integration**
2. Click **Disconnect**
3. Click **Connect GitHub**
4. Enter your GitHub token
5. Click **Connect GitHub**
6. ✅ Done!

## Verify It Worked

After syncing:

1. Go to **DevOps** → **Automation**
2. Click **Analyze Code**
3. Open browser console (F12)
4. Look for: `✅ GitHub token found in user metadata`
5. Analysis should complete successfully

## If Still Not Working

1. **Check browser console:**
   - Open F12
   - Look for error messages
   - Share the error

2. **Check Supabase:**
   - Go to Supabase Dashboard
   - Click Authentication → Users
   - Click your user
   - Check User Metadata section
   - Should have `github_token` field

3. **Try reconnecting GitHub:**
   - Go to Settings → GitHub Integration
   - Disconnect and reconnect
   - This will save token to both localStorage and Supabase

## Success Indicators

✅ Browser Storage: Found
✅ Supabase Metadata: Synced
✅ Manual analysis works
✅ Scheduled analysis runs
✅ Email is received

---

**Just click "Sync Now" and you're done!** 🚀

