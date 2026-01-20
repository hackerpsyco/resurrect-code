# Visual Guide - GitHub Token Fix

## The Problem (Before Fix)

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Client-Side)                    │
│                                                              │
│  localStorage:                                              │
│  ✅ github_token = "ghp_xxxxx..."                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    (Can't access from server)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE (Server-Side)                     │
│                                                              │
│  analysis_automation_settings table:                        │
│  ❌ github_token = NULL                                     │
│                                                              │
│  Edge Function tries to get token:                          │
│  ❌ Token not found!                                        │
│  ❌ Error: "GitHub token not found"                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## The Solution (After Fix)

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Client-Side)                    │
│                                                              │
│  localStorage:                                              │
│  ✅ github_token = "ghp_xxxxx..."                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    (Saves to database)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE (Server-Side)                     │
│                                                              │
│  analysis_automation_settings table:                        │
│  ✅ github_token = "ghp_xxxxx..."                           │
│                                                              │
│  Edge Function retrieves token:                            │
│  ✅ Token found!                                            │
│  ✅ Analysis runs successfully                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Step-by-Step Visual

### Step 1: Disconnect GitHub
```
Settings Panel
    ↓
GitHub Integration Section
    ↓
[Disconnect] Button
    ↓
✅ GitHub Disconnected
```

### Step 2: Reconnect GitHub
```
Settings Panel
    ↓
GitHub Integration Section
    ↓
[Connect GitHub] Button
    ↓
Enter Token Dialog
    ↓
[Connect GitHub] Button
    ↓
✅ Successfully connected as [username]!
```

### Step 3: Verify Token is Saved
```
Settings Panel
    ↓
Analysis Automation Section
    ↓
GitHub Token Diagnostic Card
    ↓
[🔍 Check Status] Button
    ↓
Results:
  ✅ Browser Storage: Found
  ✅ Supabase Settings Table: Saved
```

## Token Storage Locations

### Browser Storage (localStorage)
```
Key: "github_token"
Value: "ghp_xxxxxxxxxxxxxxxxxxxxx"
Purpose: Client-side use (GitHub API calls from browser)
Accessible: Only from browser
```

### Supabase Database
```
Table: analysis_automation_settings
Column: github_token
Value: "ghp_xxxxxxxxxxxxxxxxxxxxx"
Purpose: Server-side use (Edge functions)
Accessible: From edge functions and server code
```

## Data Flow Diagram

### Before Fix
```
User connects GitHub
    ↓
Token saved to localStorage
    ↓
User runs analysis
    ↓
Edge function called
    ↓
Edge function queries database
    ↓
❌ Token not found
    ↓
Error returned to user
```

### After Fix
```
User reconnects GitHub
    ↓
Token saved to localStorage
    ↓
Token saved to database
    ↓
User runs analysis
    ↓
Edge function called
    ↓
Edge function queries database
    ↓
✅ Token found
    ↓
Analysis runs successfully
    ↓
Results returned to user
```

## Diagnostic Tool Status

### Before Reconnecting
```
GitHub Token Diagnostic
├─ Browser Storage: ⚠️ Missing
└─ Supabase Settings Table: ❌ Not Saved
```

### After Reconnecting
```
GitHub Token Diagnostic
├─ Browser Storage: ✅ Found
└─ Supabase Settings Table: ✅ Saved
```

## Analysis Execution Flow

### Manual Analysis
```
User clicks "Analyze Code"
    ↓
Client retrieves userId from session
    ↓
Client calls edge function with:
  - userId
  - repositories
    ↓
Edge function retrieves settings from database
    ↓
Edge function extracts github_token
    ↓
Edge function uses token to access GitHub API
    ↓
Analysis runs on code
    ↓
Results returned
    ↓
PR created with results
    ↓
Email sent with notification
```

### Scheduled Analysis
```
Scheduler monitors time
    ↓
Scheduled time arrives
    ↓
Scheduler calls edge function
    ↓
(Same as Manual Analysis from here)
```

## Error Resolution

### Error: "GitHub token not found"

**Before Fix**:
```
❌ Token in localStorage
❌ Token NOT in database
❌ Edge function can't find it
❌ Error returned
```

**After Fix**:
```
✅ Token in localStorage
✅ Token in database
✅ Edge function finds it
✅ Analysis runs successfully
```

## Component Interaction

### GitHubAuth Component
```
User enters token
    ↓
Verify with GitHub API
    ↓
Save to localStorage
    ↓
Save to Supabase database ← NEW!
    ↓
Show success message
```

### GitHubTokenDiagnostic Component
```
User clicks "Check Status"
    ↓
Check localStorage for token ← WORKS
    ↓
Get Supabase session ← FIXED!
    ↓
Query database for token ← FIXED!
    ↓
Show status with indicators
```

## Security Model

```
┌─────────────────────────────────────────┐
│         Supabase Database               │
│                                         │
│  analysis_automation_settings           │
│  ├─ user_id (FK to auth.users)         │
│  ├─ github_token (encrypted)           │
│  └─ RLS Policy: Only user can access   │
│                                         │
│  Service Role: Can access for          │
│  edge function execution               │
└─────────────────────────────────────────┘
```

---

**Visual Guide Complete** ✅

For detailed steps, see: QUICK_FIX_STEPS.md
For verification, see: VERIFICATION_CHECKLIST.md
