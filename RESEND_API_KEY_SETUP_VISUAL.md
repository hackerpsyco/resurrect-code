# Resend API Key Setup - Visual Guide

## Problem You're Facing

```
✅ PR Created Successfully
✅ Branch Created
✅ Commit Created
❌ Failed to send email notification (500 error)
```

## Solution: Add API Key to Supabase Secrets

### Part 1: Get Resend API Key

#### Step 1.1: Go to Resend

```
Open browser
    ↓
Go to: https://resend.com
    ↓
You should see the Resend homepage
```

#### Step 1.2: Sign Up or Log In

```
Click "Sign Up" or "Log In"
    ↓
Enter your email
    ↓
Verify email
    ↓
You're logged in
```

#### Step 1.3: Get API Key

```
Click your profile icon (top right)
    ↓
Click "API Keys"
    ↓
You should see your API key
    ↓
It looks like: re_abc123def456ghi789jkl012mno345pqr678
    ↓
Click "Copy" button
    ↓
API key is now in your clipboard
```

### Part 2: Add to Supabase Secrets

#### Step 2.1: Open Supabase Dashboard

```
Open browser
    ↓
Go to: https://app.supabase.com
    ↓
Log in with your account
    ↓
Select your ResurrectCI project
```

#### Step 2.2: Navigate to Secrets

```
Left sidebar
    ↓
Click "Edge Functions"
    ↓
Click "Secrets" tab
    ↓
You should see a list of secrets (or empty)
```

#### Step 2.3: Add New Secret

```
Click "New Secret" button
    ↓
A form appears
    ↓
Enter:
  Name: RESEND_API_KEY
  Value: (paste your API key from Step 1.3)
    ↓
Click "Add Secret"
    ↓
You should see RESEND_API_KEY in the list
```

#### Step 2.4: Verify Secret

```
Look at the secrets list
    ↓
Find: RESEND_API_KEY
    ↓
Status should show: "Active" ✅
    ↓
If not active, wait 1-2 minutes and refresh
```

### Part 3: Wait for Deployment

```
Supabase automatically redeploys
    ↓
Wait 2-3 minutes
    ↓
Edge function now has access to API key
```

### Part 4: Test Email Sending

```
Open ResurrectCI
    ↓
Click Settings (⚙️)
    ↓
Click "Analysis Automation"
    ↓
Check "Enable Email Notifications"
    ↓
Enter your email address
    ↓
Click "Save Settings"
    ↓
Run code analysis
    ↓
Check your email (1-5 minutes)
    ↓
You should receive the analysis report!
```

## Visual Checklist

```
┌─────────────────────────────────────────────────────────────┐
│                    Setup Progress                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ☐ Step 1: Get Resend API Key                              │
│    └─ Go to https://resend.com                             │
│    └─ Copy API key                                         │
│                                                               │
│  ☐ Step 2: Add to Supabase Secrets                         │
│    └─ Go to https://app.supabase.com                       │
│    └─ Edge Functions → Secrets                             │
│    └─ Add RESEND_API_KEY                                   │
│                                                               │
│  ☐ Step 3: Wait for Deployment                             │
│    └─ Wait 2-3 minutes                                     │
│    └─ Secret should show "Active"                          │
│                                                               │
│  ☐ Step 4: Test Email Sending                              │
│    └─ Configure email in ResurrectCI                       │
│    └─ Run code analysis                                    │
│    └─ Check your email                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Screenshots Guide

### Resend Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Resend                                                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Profile Menu (top right)                                   │
│  ├─ API Keys ← Click here                                  │
│  └─ Settings                                                │
│                                                               │
│  API Keys Page                                              │
│  ├─ Your API Key: re_abc123def456...                       │
│  ├─ Copy button ← Click to copy                            │
│  └─ Delete button                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Supabase Secrets

```
┌─────────────────────────────────────────────────────────────┐
│  Supabase Dashboard                                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Left Sidebar                                               │
│  ├─ Edge Functions ← Click here                            │
│  └─ Other options                                           │
│                                                               │
│  Edge Functions Page                                        │
│  ├─ Secrets tab ← Click here                               │
│  └─ Functions tab                                           │
│                                                               │
│  Secrets List                                               │
│  ├─ New Secret button ← Click here                         │
│  └─ Existing secrets                                        │
│                                                               │
│  New Secret Form                                            │
│  ├─ Name: RESEND_API_KEY                                   │
│  ├─ Value: re_abc123def456...                              │
│  └─ Add Secret button ← Click here                         │
│                                                               │
│  Secrets List (Updated)                                     │
│  ├─ RESEND_API_KEY ✅ Active                               │
│  └─ Other secrets                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Secret Not Appearing

```
Problem: Added secret but it's not showing
    ↓
Solution:
  1. Refresh the page (F5)
  2. Wait 1-2 minutes
  3. Check you're in the right project
  4. Check you're in Edge Functions → Secrets
```

### Secret Shows "Inactive"

```
Problem: Secret shows as "Inactive"
    ↓
Solution:
  1. Wait 2-3 minutes
  2. Refresh the page
  3. Check the status again
  4. It should change to "Active"
```

### Email Still Not Sending

```
Problem: Added secret but email still fails
    ↓
Solution:
  1. Check edge function logs
  2. Verify API key is correct
  3. Wait 3-5 minutes for full deployment
  4. Try running analysis again
```

## Key Points

✅ **DO**:
- Add API key to **Supabase Secrets** (not local .env)
- Wait 2-3 minutes after adding secret
- Check secret status shows "Active"
- Verify email address in ResurrectCI Settings

❌ **DON'T**:
- Add API key to local .env file
- Expect emails immediately
- Share your API key publicly
- Use invalid email addresses

## Time Estimates

```
Get Resend API Key:        2-3 minutes
Add to Supabase Secrets:   1-2 minutes
Wait for Deployment:       2-3 minutes
Test Email Sending:        1-5 minutes
─────────────────────────────────────
Total Time:                6-13 minutes
```

## Success Indicators

✅ **You'll know it's working when**:
1. Secret shows "Active" in Supabase
2. Email arrives in your inbox (1-5 minutes)
3. Email contains analysis report
4. Action buttons are clickable
5. PR is created when you click "Yes"

## Next Steps

1. Get Resend API key (2-3 min)
2. Add to Supabase Secrets (1-2 min)
3. Wait for deployment (2-3 min)
4. Test email sending (1-5 min)
5. Enjoy automated email notifications! 🎉

---

**Questions?** Check the edge function logs in Supabase for detailed error messages.
