# GitHub Token Storage - Final Fix

## The Real Problem

The issue was a **mismatch between where the token was being saved and where it was being checked**:

- ✅ `userStorageService.storeGitHubToken()` saves to `user_credentials` table
- ❌ Diagnostic was checking `analysis_automation_settings` table
- ❌ Edge function was only checking `analysis_automation_settings` table

So the token WAS being saved, but in the wrong place!

## Solution Applied

### 1. Fixed the Diagnostic Tool
Updated `src/components/settings/GitHubTokenDiagnostic.tsx` to:
- Check the correct `user_credentials` table instead of `analysis_automation_settings`
- Show accurate status of where the token is actually stored

### 2. Updated Edge Function
Updated `supabase/functions/run-scheduled-analysis/index.ts` to:
- Check `user_credentials` table first (where userStorageService saves it)
- Fall back to `analysis_automation_settings` if not found
- Fall back to user metadata as last resort

### 3. Verified GitHubAuth Component
`src/components/auth/GitHubAuth.tsx` already uses `userStorageService.storeGitHubToken()` which saves correctly.

## How It Works Now

```
User connects GitHub
    ↓
GitHubAuth component calls userStorageService.storeGitHubToken()
    ↓
Token saved to user_credentials table ✅
Token saved to localStorage ✅
    ↓
Diagnostic checks user_credentials table ✅
    ↓
Edge function retrieves from user_credentials table ✅
    ↓
Scheduled analysis works ✅
```

## Steps to Verify

### Step 1: Refresh Browser
Press `Ctrl+R` to load the updated code.

### Step 2: Disconnect and Reconnect GitHub
1. Go to **Settings → GitHub Integration**
2. Click **Disconnect**
3. Click **Connect GitHub**
4. Enter your token
5. Click **Connect**

### Step 3: Check the Diagnostic
1. Scroll down to **GitHub Token Diagnostic**
2. Click **🔍 Check Status**
3. You should now see:
   - ✅ Browser Storage: Found
   - ✅ Supabase Database: Saved

### Step 4: Test Scheduled Analysis
1. Go to **DevOps → Automation**
2. Configure repositories
3. Click **Analyze Code**
4. Should work without errors

## What Changed

| File | Change |
|------|--------|
| `src/components/settings/GitHubTokenDiagnostic.tsx` | Now checks `user_credentials` table instead of `analysis_automation_settings` |
| `supabase/functions/run-scheduled-analysis/index.ts` | Now checks `user_credentials` table first for the token |
| `src/components/auth/GitHubAuth.tsx` | Already correct - uses userStorageService |

## Why This Works

1. **Single Source of Truth**: All tokens go through `userStorageService` which saves to `user_credentials`
2. **Consistent Checking**: Diagnostic and edge functions now check the same table
3. **Fallback Logic**: Edge function has multiple fallbacks if token not found
4. **No RLS Issues**: `user_credentials` table has proper RLS policies already in place

## If It Still Doesn't Work

### Check 1: Verify Token is in Database
Open browser console (F12) and run:
```javascript
// Check localStorage
console.log(localStorage.getItem('github_token'))

// Should show your token
```

### Check 2: Verify Diagnostic Shows Token
Click "🔍 Check Status" in the diagnostic tool. If it shows:
- ✅ Browser Storage: Found
- ✅ Supabase Database: Saved

Then the token is properly saved!

### Check 3: Check Edge Function Logs
In Supabase dashboard:
1. Go to Functions → run-scheduled-analysis
2. Check the logs
3. Should show: `✅ GitHub token found in user_credentials table`

## Next Steps

Once token is verified as saved:
1. Configure your repositories in Automation settings
2. Set up email notifications if desired
3. Configure analysis schedule (manual, on-push, daily, weekly)
4. Test by running an analysis

The system should now work end-to-end without token errors.

## Technical Details

**user_credentials table structure:**
```
{
  user_id: UUID,
  credentials: {
    githubToken: string,
    vercelToken?: string,
    geminiApiKey?: string,
    ...
  },
  updated_at: timestamp
}
```

**How userStorageService saves:**
```typescript
await userStorageService.storeGitHubToken(token, []);
// Saves to user_credentials.credentials.githubToken
// Also saves to localStorage for immediate access
```

**How edge function retrieves:**
```typescript
// Check user_credentials table
const { data: credentials } = await supabase
  .from('user_credentials')
  .select('credentials')
  .eq('user_id', userId)
  .single();

const githubToken = credentials.credentials.githubToken;
```

This is now the correct flow!
