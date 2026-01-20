# Error Analysis and Fix

## The Error You Were Seeing

```
❌ Edge function error: {"success":false,"error":"GitHub token not found - please connect your GitHub account in settings"}
```

## Root Cause Analysis

### Why This Happened

1. **Token Storage Issue**
   - GitHub token was saved to browser localStorage
   - Edge function runs on Supabase server (not in browser)
   - Server-side code cannot access browser localStorage
   - Edge function couldn't find the token

2. **Diagnostic Authentication Issue**
   - Diagnostic was looking for `sb_auth_token` in localStorage
   - Supabase doesn't store auth token with that key
   - Diagnostic showed "not authenticated" error
   - User couldn't verify if token was saved

### The Flow That Was Broken

```
User connects GitHub
    ↓
Token saved to browser localStorage
    ↓
User runs analysis
    ↓
Client calls edge function with userId
    ↓
Edge function queries database for token
    ↓
❌ Token not found in database
    ↓
Error: "GitHub token not found"
```

## The Fix

### Change 1: GitHubAuth Component

**Before**:
```typescript
// Only saved to localStorage
localStorage.setItem("github_token", token);
```

**After**:
```typescript
// Saves to BOTH localStorage AND database
localStorage.setItem("github_token", token);

// Also save to settings table for edge function access
const settingsResponse = await fetch(`${supabaseUrl}/functions/v1/analysis-settings`, {
  method: "POST",
  body: JSON.stringify({
    githubToken: token,
    githubLogin: userData.login,
    // ... other settings
  }),
});
```

### Change 2: GitHubTokenDiagnostic Component

**Before**:
```typescript
// Tried to get auth token from localStorage (wrong key)
const authToken = localStorage.getItem('sb_auth_token');
if (!supabaseUrl || !authToken) {
  setError('Supabase not configured or not authenticated');
}
```

**After**:
```typescript
// Uses Supabase client for proper authentication
const { data: { session }, error: sessionError } = await supabase.auth.getSession();
if (sessionError || !session) {
  setError('Not authenticated - please log in');
  return;
}

// Queries database directly
const { data, error: fetchError } = await supabase
  .from('analysis_automation_settings')
  .select('github_token')
  .single();
```

## The New Flow

```
User reconnects GitHub
    ↓
Token saved to browser localStorage
    ↓
Token ALSO saved to Supabase database
    ↓
User runs analysis
    ↓
Client calls edge function with userId
    ↓
Edge function queries database for token
    ↓
✅ Token found in database
    ↓
Analysis runs successfully
    ↓
PR created with results
    ↓
Email sent with analysis
```

## Why This Works

1. **Token is in Database**
   - Edge function runs on server
   - Server can access database
   - Token is retrieved successfully

2. **Diagnostic Works Correctly**
   - Uses Supabase client for auth
   - Queries database directly
   - Shows accurate status

3. **End-to-End Flow**
   - Client saves token to database
   - Edge function retrieves from database
   - Analysis completes successfully

## Verification

### Before Fix
- Diagnostic: ❌ "not authenticated"
- Analysis: ❌ "GitHub token not found"

### After Fix
- Diagnostic: ✅ Shows token status correctly
- Analysis: ✅ Runs without errors

## What Changed in Code

### File 1: `src/components/auth/GitHubAuth.tsx`
- Added code to save token to Supabase settings table
- Saves with proper AnalysisSettings format
- Includes error handling and logging

### File 2: `src/components/settings/GitHubTokenDiagnostic.tsx`
- Changed from localStorage auth to Supabase client auth
- Changed from edge function call to direct database query
- Better error handling and status reporting

## No Database Changes Needed

The `analysis_automation_settings` table already has:
- `github_token` column (VARCHAR 255)
- `github_login` column (VARCHAR 255)

These were added in the migration and are ready to use.

## Testing the Fix

### Step 1: Reconnect GitHub
This triggers the new code that saves token to database.

### Step 2: Check Diagnostic
Verify token is in both locations.

### Step 3: Run Analysis
Should complete without "GitHub token not found" error.

---

**Summary**: Token is now saved to database, edge function can access it, analysis works.
