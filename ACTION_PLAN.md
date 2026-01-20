# Action Plan: Fix Automation System 500 Error

## Current Status
❌ Edge function returns 500 error: "Failed to fetch user settings"

## Root Cause
The database tables don't exist and the service role key isn't configured.

## Solution (Do These 3 Things)

### ACTION 1: Create Database Tables (5 minutes)

**Go to:** https://supabase.com/dashboard

**Steps:**
1. Select your project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire content from `SETUP_DATABASE.sql` file
5. Paste it into the SQL editor
6. Click **Run**
7. Wait for success message ✅

**What it does:**
- Creates `analysis_automation_settings` table
- Creates `analysis_reports` table
- Sets up RLS policies
- Creates indexes for performance

---

### ACTION 2: Set Service Role Key (3 minutes)

**Go to:** https://supabase.com/dashboard

**Steps:**
1. Click **Settings** (bottom left)
2. Click **API**
3. Copy the **Service Role Key** (the long secret starting with `eyJ...`)
4. Go back to your project
5. Click **Edge Functions** (left sidebar)
6. Click **Secrets** (top right)
7. Click **New Secret**
8. Name: `SUPABASE_SERVICE_ROLE_KEY`
9. Value: Paste the key from step 3
10. Click **Save**
11. **Wait 2-3 minutes** for deployment

**What it does:**
- Allows edge functions to access the database
- Bypasses RLS restrictions for service role

---

### ACTION 3: Redeploy Edge Functions (5 minutes)

**Go to:** https://supabase.com/dashboard

**Steps:**
1. Click **Edge Functions** (left sidebar)
2. For each function below, click the three dots and select **Deploy**:
   - `run-scheduled-analysis`
   - `send-analysis-email`
   - `analysis-settings`
3. Wait for each to show "Deployed" status
4. **Wait 2-3 minutes** for all deployments to complete

**What it does:**
- Deploys the updated code with better error handling
- Uses the new service role key
- Enables graceful fallbacks for missing tables

---

## Verification (2 minutes)

After completing all 3 actions:

1. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Select "All time"
   - Click "Clear data"

2. **Test the system:**
   - Go to your app
   - Click **DevOps** (left sidebar)
   - Click **Automation** tab
   - Click **Analyze Code** button
   - Open browser console (F12)

3. **Expected result:**
   - Console shows analysis logs (not 500 error)
   - Analysis completes successfully
   - Email is sent

---

## Troubleshooting

### If you still get 500 error:

1. **Check tables exist:**
   - Go to Supabase Dashboard
   - Click **Table Editor**
   - Look for `analysis_automation_settings` and `analysis_reports`
   - If missing, re-run the SQL from ACTION 1

2. **Check service role key:**
   - Go to Supabase Dashboard
   - Click **Edge Functions** → **Secrets**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is listed
   - If missing, follow ACTION 2 again

3. **Check edge functions deployed:**
   - Go to Supabase Dashboard
   - Click **Edge Functions**
   - All three functions should show "Deployed" status
   - If not, follow ACTION 3 again

4. **Check browser console:**
   - Open browser console (F12)
   - Look for detailed error messages
   - Share the error message if still stuck

---

## Timeline

| Action | Time | Status |
|--------|------|--------|
| Create database tables | 5 min | ⏳ TODO |
| Set service role key | 3 min | ⏳ TODO |
| Redeploy edge functions | 5 min | ⏳ TODO |
| Wait for deployment | 3 min | ⏳ TODO |
| Clear browser cache | 1 min | ⏳ TODO |
| Test the system | 2 min | ⏳ TODO |
| **TOTAL** | **19 min** | ⏳ TODO |

---

## Success Checklist

After completing all actions, verify:

- [ ] Database tables exist (Supabase Table Editor)
- [ ] Service role key is set (Edge Functions → Secrets)
- [ ] Edge functions are deployed (Edge Functions list)
- [ ] Browser cache is cleared
- [ ] Manual analysis works (DevOps → Automation → Analyze Code)
- [ ] Console shows success logs (not 500 error)
- [ ] Email is received

---

## Next Steps (After Fix)

Once the system is working:

1. Go to **DevOps** → **Automation**
2. Configure your settings:
   - Enable Email Notifications: ON
   - Your Email: your-email@example.com
   - Select repositories to analyze
   - Choose schedule (Manual/Daily/Weekly)
   - Set scheduled time if needed
3. Click **Save Settings**
4. System will run analysis automatically at scheduled time

---

## Support

If you get stuck:
1. Check `VERIFY_SETUP.md` for detailed verification steps
2. Check `EDGE_FUNCTION_DEBUG.md` for debugging guide
3. Check browser console (F12) for error messages
4. Share the console error output

---

## Files Reference

- `SETUP_DATABASE.sql` - SQL to create tables
- `FIX_EDGE_FUNCTION_ERROR.md` - Quick fix guide
- `VERIFY_SETUP.md` - Verification checklist
- `EDGE_FUNCTION_DEBUG.md` - Detailed debugging
- `AUTOMATION_FIX_SUMMARY.md` - What was fixed

---

**Ready to fix? Start with ACTION 1 above!**

