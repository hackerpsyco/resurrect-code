# Email Sending Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ResurrectCI Application                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  User Interface (React)                                  │   │
│  │  - Settings → Analysis Automation                        │   │
│  │  - Configure email address                              │   │
│  │  - Enable email notifications                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  analysisAutomationService.ts (Client-side)             │   │
│  │  - Stores email settings in localStorage                │   │
│  │  - Calls Supabase edge function                         │   │
│  │  - Uses VITE_SUPABASE_URL and VITE_SUPABASE_KEY        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│                   HTTP POST Request                              │
│              (with email settings & report)                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Cloud                                │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Edge Function: send-analysis-email                     │   │
│  │  - Receives email request                               │   │
│  │  - Reads RESEND_API_KEY from Secrets                    │   │
│  │  - Calls Resend API                                     │   │
│  │  - Returns success/error response                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Supabase Secrets (Secure Storage)                      │   │
│  │  - RESEND_API_KEY (or SENDGRID_API_KEY)                │   │
│  │  - Only accessible to edge functions                    │   │
│  │  - NOT in local .env file                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│                   HTTP POST Request                              │
│              (with API key & email content)                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Resend Email Service                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Resend API (https://api.resend.com/emails)             │   │
│  │  - Validates API key                                    │   │
│  │  - Validates email address                              │   │
│  │  - Sends email                                          │   │
│  │  - Returns email ID or error                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Email Delivery                                         │   │
│  │  - Sends to user's email address                        │   │
│  │  - Typical delivery: 1-5 minutes                        │   │
│  │  - Includes action buttons (Yes/No)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    User's Email Inbox                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Email from ResurrectCI                                 │   │
│  │  - Analysis report                                      │   │
│  │  - Issues by priority                                   │   │
│  │  - Action buttons:                                      │   │
│  │    ✅ Yes, Push to GitHub                              │   │
│  │    ❌ No, Skip                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│                   User clicks button                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Email Reply Webhook                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  email-reply-webhook (Supabase Function)                │   │
│  │  - Receives user's action (Yes/No)                      │   │
│  │  - If "Yes": Triggers GitHub auto-push                  │   │
│  │  - If "No": Skips PR creation                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Email Sending

```
1. User configures email in Settings
   └─ Email stored in localStorage
   └─ Settings saved

2. User runs code analysis
   └─ Analysis completes
   └─ Report generated

3. analysisAutomationService calls edge function
   └─ Sends: email address, subject, report content
   └─ Uses: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY

4. Supabase edge function receives request
   └─ Reads RESEND_API_KEY from Secrets
   └─ Validates email address
   └─ Calls Resend API

5. Resend sends email
   └─ Email delivered to user's inbox
   └─ Includes action buttons

6. User receives email
   └─ Reads analysis report
   └─ Clicks action button
```

## Configuration Locations

```
┌─────────────────────────────────────────────────────────────────┐
│                    Configuration Storage                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  LOCAL MACHINE (.env file)                                      │
│  ├─ VITE_SUPABASE_URL ✅ (used by client)                      │
│  ├─ VITE_SUPABASE_PUBLISHABLE_KEY ✅ (used by client)          │
│  ├─ RESEND_API_KEY ❌ (NOT used by edge function)              │
│  └─ Other VITE_* variables ✅ (client-side only)               │
│                                                                   │
│  SUPABASE SECRETS (Secure Cloud Storage)                        │
│  ├─ RESEND_API_KEY ✅ (used by edge function)                  │
│  ├─ SENDGRID_API_KEY ✅ (used by edge function)                │
│  └─ Other secrets ✅ (server-side only)                        │
│                                                                   │
│  BROWSER LOCALSTORAGE (Client-side)                             │
│  ├─ analysis_automation_settings ✅ (email address, etc)       │
│  ├─ email_reply_actions ✅ (tracking user responses)           │
│  └─ Other app settings ✅ (client-side only)                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Why Email Sending Fails

```
❌ WRONG: API key in local .env
   └─ Edge function runs on Supabase servers
   └─ Can't access local .env file
   └─ Result: "No email service configured"

✅ CORRECT: API key in Supabase Secrets
   └─ Edge function reads from Supabase Secrets
   └─ Secrets are available to edge functions
   └─ Result: Email sent successfully
```

## Setup Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│                    Setup Checklist                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Step 1: Get Resend API Key                                     │
│  ├─ Go to https://resend.com                                    │
│  ├─ Sign up or log in                                           │
│  ├─ Navigate to API Keys                                        │
│  └─ Copy API key (starts with "re_")                            │
│                                                                   │
│  Step 2: Add to Supabase Secrets                                │
│  ├─ Go to https://app.supabase.com                              │
│  ├─ Select your project                                         │
│  ├─ Click Edge Functions → Secrets                              │
│  ├─ Click "New Secret"                                          │
│  ├─ Name: RESEND_API_KEY                                        │
│  ├─ Value: Your API key                                         │
│  └─ Click "Add Secret"                                          │
│                                                                   │
│  Step 3: Wait for Deployment                                    │
│  ├─ Supabase redeploys automatically                            │
│  ├─ Wait 2-3 minutes                                            │
│  └─ Check Edge Functions → Logs                                 │
│                                                                   │
│  Step 4: Configure ResurrectCI                                  │
│  ├─ Open ResurrectCI                                            │
│  ├─ Settings → Analysis Automation                              │
│  ├─ Enable Email Notifications                                  │
│  ├─ Enter your email address                                    │
│  └─ Click Save Settings                                         │
│                                                                   │
│  Step 5: Test Email Sending                                     │
│  ├─ Run code analysis                                           │
│  ├─ Check your email (1-5 minutes)                              │
│  ├─ Verify email contains report                                │
│  └─ Click action button to test workflow                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Troubleshooting Flow

```
Email not received?
│
├─ Check 1: Is RESEND_API_KEY in Supabase Secrets?
│  ├─ NO → Add it (see Setup Checklist)
│  └─ YES → Continue
│
├─ Check 2: Is email address correct in Settings?
│  ├─ NO → Update it
│  └─ YES → Continue
│
├─ Check 3: Check Edge Function Logs
│  ├─ "No email service configured" → Add API key to Secrets
│  ├─ "Unauthorized" → API key is invalid
│  ├─ "Invalid email" → Email address is wrong
│  └─ "Email sent successfully" → Check spam folder
│
└─ Check 4: Wait 2-3 minutes
   └─ Email delivery takes time
```

## Key Differences

| Aspect | Local .env | Supabase Secrets |
|--------|-----------|-----------------|
| **Location** | Your computer | Supabase cloud |
| **Access** | Client-side code | Edge functions |
| **Prefix** | VITE_* | Any name |
| **Security** | Not secure | Encrypted |
| **Use Case** | Client variables | Server variables |
| **Email API Key** | ❌ Won't work | ✅ Works |

## Summary

The email sending system works like this:

1. **Client** (ResurrectCI UI) → Calls edge function
2. **Edge Function** (Supabase) → Reads API key from Secrets
3. **Email Service** (Resend) → Sends email
4. **User** → Receives email with action buttons
5. **Webhook** → Processes user's action (Yes/No)

The critical step is **Step 2**: The API key MUST be in Supabase Secrets, not in the local `.env` file.

Once configured correctly, emails will send automatically!
