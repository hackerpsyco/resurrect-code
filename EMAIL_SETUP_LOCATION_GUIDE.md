# Email Setup Location Guide

## Where to Find Email Configuration in the UI

### Step 1: Open Settings
1. Click the **⚙️ Settings** icon in the top navigation bar
2. Or use keyboard shortcut: `Ctrl+,` (Windows/Linux) or `Cmd+,` (Mac)

### Step 2: Navigate to Analysis Automation
In the Settings panel, you'll see a sidebar with different sections:

```
Settings Sidebar:
├── General
├── Editor
├── Terminal
├── Appearance
├── Notifications
├── Keybindings
├── Integrations
└── ✨ Analysis Automation  ← Click here
```

### Step 3: Configure Email Settings

Once you click **Analysis Automation**, you'll see:

#### Email Notifications Section
```
📧 Email Notifications
├── Enable Email Notifications [Toggle Switch]
├── Email Address [Input Field]
└── Short Report Format [Toggle Switch]
```

**Steps:**
1. Toggle **Enable Email Notifications** to ON
2. Enter your email address
3. Choose report format:
   - ✅ Short Report (concise summary)
   - ❌ Full Report (detailed analysis)
4. Click **Save Settings**

#### Automatic Improvements Section
```
✨ Automatic Improvements
├── Auto-Generate Improvements [Toggle Switch]
└── Auto-Push to GitHub [Toggle Switch]
```

**Steps:**
1. Toggle **Auto-Generate Improvements** to enable suggestions
2. Toggle **Auto-Push to GitHub** to create PRs automatically
3. Click **Save Settings**

#### Analysis Schedule Section
```
⏰ Analysis Schedule
└── Schedule Type [Dropdown]
    ├── Manual (On Demand)
    ├── On Git Push
    ├── Daily
    └── Weekly
```

**Steps:**
1. Select your preferred schedule
2. Click **Save Settings**

#### Recent Analysis Reports Section
```
👁️ Recent Analysis Reports
├── Report 1 [with status badges]
├── Report 2 [with status badges]
└── Clear All [button]
```

**View:**
- See all previous analysis reports
- Check email delivery status (📧 Sent badge)
- View PR links (View PR button)
- Clear old reports

## Visual Navigation Path

```
Dashboard
    ↓
Click ⚙️ Settings (top right)
    ↓
Settings Panel Opens
    ↓
Sidebar appears on left
    ↓
Click "✨ Analysis Automation"
    ↓
Email Configuration Page Loads
    ↓
Configure Email & Auto-Push Settings
    ↓
Click "💾 Save Settings"
    ↓
Settings Saved ✅
```

## Email Configuration Checklist

- [ ] Open Settings (⚙️ icon)
- [ ] Click "Analysis Automation" in sidebar
- [ ] Toggle "Enable Email Notifications"
- [ ] Enter your email address
- [ ] Choose report format (Short or Full)
- [ ] Toggle "Auto-Generate Improvements" (optional)
- [ ] Toggle "Auto-Push to GitHub" (optional)
- [ ] Select "Analysis Schedule"
- [ ] Click "💾 Save Settings"
- [ ] Verify settings saved (success message)

## What Each Setting Does

### Enable Email Notifications
- **ON**: Receive analysis reports via email
- **OFF**: No email notifications

### Email Address
- Where analysis reports will be sent
- Must be a valid email address
- Used for email reply buttons

### Short Report Format
- **ON**: Concise summary (recommended for quick review)
- **OFF**: Full detailed report with all issues

### Auto-Generate Improvements
- **ON**: Automatically generate code suggestions
- **OFF**: Manual review before generating

### Auto-Push to GitHub
- **ON**: Create PRs automatically after email approval
- **OFF**: Manual PR creation

### Analysis Schedule
- **Manual**: Run analysis on demand
- **On Git Push**: Analyze when code is pushed
- **Daily**: Automatic daily analysis
- **Weekly**: Automatic weekly analysis

## Email Workflow

```
1. Configure Email Settings
   ↓
2. Run Code Analysis
   ↓
3. Email Sent with Report + Buttons
   ↓
4. User Clicks "Yes" or "No"
   ↓
5. If "Yes": PR Created Automatically
   If "No": Report Saved (No PR)
   ↓
6. Success Page Shown
```

## Troubleshooting

### Can't Find Analysis Automation?
- ✅ Make sure you're in Settings (⚙️ icon)
- ✅ Look for "✨ Analysis Automation" in the sidebar
- ✅ Scroll down in sidebar if needed

### Email Not Saving?
- ✅ Check email address format (must be valid)
- ✅ Click "💾 Save Settings" button
- ✅ Look for success message

### Settings Not Persisting?
- ✅ Verify you clicked "Save Settings"
- ✅ Check browser console for errors
- ✅ Try refreshing the page

### Email Not Received?
- ✅ Check spam/junk folder
- ✅ Verify email address is correct
- ✅ Check email notifications are enabled
- ✅ Wait a few minutes for delivery

## Quick Access

### From Dashboard
1. Click ⚙️ Settings
2. Click "Analysis Automation"
3. Configure email settings

### From DevOps Panel
1. Click ⚙️ Settings tab
2. Click "Analysis Automation"
3. Configure email settings

### From Automation Tab
1. Click ⚙️ Settings (top right)
2. Click "Analysis Automation"
3. Configure email settings

## Settings Persistence

- All settings are saved to browser localStorage
- Settings persist across sessions
- Settings are user-specific
- Clearing browser data will reset settings

## Next Steps

After configuring email:
1. Go to **DevOps Panel** → **Automation**
2. Click **Analyze Code**
3. Wait for analysis to complete
4. Check your email for the report
5. Click "Yes" or "No" in the email
6. View the result in your dashboard

---

**Last Updated**: 2024-01-20
**Version**: 1.0.0
