# Quick Fix - Apply Service Role Policy

## The Issue
Edge function can't read the GitHub token from the database because of RLS policies.

## The Fix
Add one SQL command to allow service role access.

## Do This Now

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste this:**

```sql
CREATE POLICY "Service role can access all credentials" ON user_credentials
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all settings" ON user_settings
  FOR ALL USING (auth.role() = 'service_role');
```

4. **Click Run**
5. **Go back to your app**
6. **Try Analyze Code again**

## That's It!

The edge function should now be able to read your GitHub token and run scheduled analysis.

## Verify It Worked
1. Go to DevOps → Automation
2. Click "Analyze Code"
3. Should work without errors
4. Check browser console for: `✅ GitHub token found in user_credentials table`

Done! 🎉
