# Quick Fix: GitHub Token Not Found Error

## The Problem
You're getting "GitHub token not found" error when trying to run scheduled analysis.

## The Solution (3 Steps)

### 1️⃣ Disconnect GitHub
- Go to **Settings** → **GitHub Integration**
- Click **Disconnect**

### 2️⃣ Reconnect GitHub
- Click **Connect GitHub**
- Enter your GitHub Personal Access Token
- Click **Connect GitHub**

### 3️⃣ Verify It Worked
- Go to **Settings** → **Analysis Automation**
- Scroll to **GitHub Token Diagnostic**
- Click **🔍 Check Status**
- You should see ✅ for both:
  - Browser Storage: Found
  - Supabase Settings Table: Saved

## Done! 🎉
Your GitHub token is now saved to Supabase. Scheduled analysis will work.

## Test It
1. Go to **DevOps** → **Automation**
2. Click **Analyze Code**
3. Should work without errors

---

**Still having issues?** Check the browser console (F12) for error messages and refer to `GITHUB_TOKEN_FIX_COMPLETE.md` for detailed troubleshooting.
