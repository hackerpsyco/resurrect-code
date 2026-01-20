# GitHub Token Flow for Automation & Backend

## Complete Token Flow Architecture

### 1. Client-Side (Browser)
```
User enters GitHub token in GitHubAuth component
    ↓
Token verified with GitHub API
    ↓
userStorageService.storeGitHubToken(token)
    ↓
Saves to localStorage (immediate access)
Saves to user_credentials table (persistent)
```

### 2. Diagnostic Check (Browser)
```
GitHubTokenDiagnostic component
    ↓
Checks localStorage (browser storage)
Checks user_credentials table (database)
    ↓
Shows status to user
```

### 3. Scheduled Analysis (Backend/Edge Function)
```
run-scheduled-analysis edge function triggered
    ↓
Retrieves user_id from request
    ↓
Checks user_credentials table for githubToken
    ↓
If found: Uses token for GitHub API calls
If not found: Falls back to analysis_automation_settings
If still not found: Falls back to user metadata
    ↓
Analyzes repositories
Creates pull requests
Sends email notifications
```

## Token Storage Locations

### Primary: user_credentials Table
- **Where**: Supabase database
- **What**: Stores all user credentials (GitHub, Vercel, Gemini, etc.)
- **Who saves**: userStorageService
- **Who reads**: Diagnostic, Edge functions
- **RLS**: Users can only access their own credentials

```sql
SELECT * FROM user_credentials WHERE user_id = current_user_id;
-- Returns: { credentials: { githubToken: "ghp_...", ... } }
```

### Secondary: analysis_automation_settings Table
- **Where**: Supabase database
- **What**: Stores automation-specific settings
- **Who saves**: analysis-settings edge function
- **Who reads**: Edge functions (fallback)
- **RLS**: Users can only access their own settings

```sql
SELECT * FROM analysis_automation_settings WHERE user_id = current_user_id;
-- Returns: { github_token: "ghp_...", github_login: "...", ... }
```

### Tertiary: localStorage
- **Where**: Browser
- **What**: Cached token for immediate access
- **Who saves**: userStorageService
- **Who reads**: Client-side components
- **Scope**: Single browser, single user

```javascript
localStorage.getItem('github_token')
// Returns: "ghp_..."
```

### Fallback: User Metadata
- **Where**: Supabase auth.users table
- **What**: User profile metadata
- **Who saves**: Manual (not automatic)
- **Who reads**: Edge functions (last resort)
- **Scope**: Global user profile

```sql
SELECT user_metadata FROM auth.users WHERE id = user_id;
-- Returns: { github_token: "ghp_...", ... }
```

## Automation Token Retrieval Flow

### When Scheduled Analysis Runs

```
1. Cron job or manual trigger
    ↓
2. Call run-scheduled-analysis edge function
    ↓
3. Edge function receives userId
    ↓
4. Try to get token from user_credentials table
    if (credentials.credentials.githubToken) {
      use it ✅
    }
    ↓
5. If not found, try analysis_automation_settings table
    if (settings.github_token) {
      use it ✅
    }
    ↓
6. If still not found, try user metadata
    if (user.user_metadata.github_token) {
      use it ✅
    }
    ↓
7. If all fail, throw error
    throw new Error("GitHub token not found")
```

## Direct Backend Approach (Alternative)

If you want to bypass the client-side storage entirely:

### Option 1: Store in Environment Variables
```bash
# .env.local
VITE_GITHUB_TOKEN=ghp_xxxxx
```

**Pros**: Simple, no database needed
**Cons**: Not per-user, not secure, hardcoded

### Option 2: Store in Supabase Secrets
```bash
# Supabase dashboard → Settings → Secrets
GITHUB_TOKEN=ghp_xxxxx
```

**Pros**: Secure, centralized
**Cons**: Not per-user, requires manual update

### Option 3: Store in analysis_automation_settings (Current)
```sql
INSERT INTO analysis_automation_settings (user_id, github_token)
VALUES (user_id, 'ghp_xxxxx')
```

**Pros**: Per-user, persistent, works with edge functions
**Cons**: Requires RLS policies, separate from other credentials

### Option 4: Store in user_credentials (Recommended)
```typescript
await userStorageService.storeGitHubToken(token)
```

**Pros**: Per-user, persistent, centralized credentials, works everywhere
**Cons**: Requires userStorageService integration

## Current Implementation (Recommended)

We're using **Option 4** (user_credentials table):

1. **Client saves**: userStorageService.storeGitHubToken()
2. **Diagnostic checks**: user_credentials table
3. **Edge function retrieves**: user_credentials table (primary), analysis_automation_settings (fallback)
4. **Fallback**: user metadata

This provides:
- ✅ Per-user tokens
- ✅ Persistent storage
- ✅ Centralized credentials management
- ✅ Multiple fallback options
- ✅ Proper RLS security
- ✅ Works with all features

## Testing the Flow

### Test 1: Verify Token is Saved
```javascript
// In browser console
localStorage.getItem('github_token')
// Should return: "ghp_..."
```

### Test 2: Verify Token in Database
```sql
-- In Supabase SQL Editor
SELECT credentials FROM user_credentials WHERE user_id = 'your-user-id';
-- Should return: { "githubToken": "ghp_..." }
```

### Test 3: Verify Diagnostic Shows Token
1. Go to Settings → GitHub Integration
2. Scroll to GitHub Token Diagnostic
3. Click "🔍 Check Status"
4. Should show both ✅

### Test 4: Verify Edge Function Can Retrieve Token
1. Go to DevOps → Automation
2. Click "Analyze Code"
3. Check edge function logs in Supabase dashboard
4. Should show: "✅ GitHub token found in user_credentials table"

## Troubleshooting

### Token Not Saving
1. Check browser console for errors
2. Verify userStorageService is being called
3. Check user_credentials table in Supabase

### Token Not Retrieved by Edge Function
1. Check edge function logs
2. Verify user_credentials table has the token
3. Check RLS policies allow service role access

### Diagnostic Shows "Not Saved"
1. Refresh browser
2. Disconnect and reconnect GitHub
3. Check user_credentials table directly

## Summary

The GitHub token now flows through the system correctly:

```
Client → userStorageService → user_credentials table
                                    ↓
                            Diagnostic checks here ✅
                            Edge function retrieves here ✅
                            Automation uses token ✅
```

All components now use the same source of truth!
