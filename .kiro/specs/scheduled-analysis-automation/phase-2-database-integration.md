# Phase 2: Database Integration - Implementation Guide

## Overview

Phase 2 implements database persistence for analysis automation settings and reports. This allows settings to persist across sessions and devices, and provides a backend for future scheduled automation workflows.

## What Was Implemented

### 1. Database Migrations

**File**: `supabase/migrations/20250120000001_analysis_automation.sql`

Created two new tables:

#### `analysis_automation_settings` Table
Stores user's automation configuration:
- `id` (UUID): Primary key
- `user_id` (UUID): References auth.users
- `enable_email_notifications` (BOOLEAN): Email notification toggle
- `user_email` (VARCHAR): User's email address
- `auto_generate_improvements` (BOOLEAN): Auto-generate improvements toggle
- `auto_push_to_github` (BOOLEAN): Auto-push to GitHub toggle
- `analysis_schedule` (VARCHAR): Schedule type (manual, on-push, daily, weekly)
- `scheduled_time` (VARCHAR): Time in HH:MM format (UTC)
- `short_report_format` (BOOLEAN): Report format preference
- `selected_repositories` (JSONB): Array of selected GitHub repos
- `selected_projects` (JSONB): Array of selected Vercel projects
- `created_at`, `updated_at`: Timestamps

#### `analysis_reports` Table
Stores analysis reports and results:
- `id` (UUID): Primary key
- `user_id` (UUID): References auth.users
- `report_id` (VARCHAR): Unique report identifier
- `timestamp` (TIMESTAMP): When analysis was run
- `repository` (VARCHAR): Repository name
- `total_issues`, `critical_issues`, `high_issues`, `medium_issues`, `low_issues` (INTEGER): Issue counts
- `short_summary`, `full_report` (TEXT): Report content
- `pr_url`, `pr_number`, `branch_name` (VARCHAR): GitHub PR information
- `email_sent`, `email_sent_at` (BOOLEAN, TIMESTAMP): Email tracking
- `user_approved`, `user_approved_at` (BOOLEAN, TIMESTAMP): User approval tracking
- `created_at`, `updated_at`: Timestamps

**Security**: Both tables have Row Level Security (RLS) enabled with policies ensuring users can only access their own data.

**Indexes**: Created indexes on frequently queried columns for performance:
- `user_id` (both tables)
- `repository` (reports)
- `timestamp` (reports)
- `report_id` (reports)

### 2. Edge Functions

#### `analysis-settings` Function
**File**: `supabase/functions/analysis-settings/index.ts`

Manages automation settings with GET/POST/PUT methods:

**GET** - Retrieve user's settings
```
GET /functions/v1/analysis-settings
Authorization: Bearer {token}
```
Returns current settings or defaults if none exist.

**POST/PUT** - Save user's settings
```
POST /functions/v1/analysis-settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "enableEmailNotifications": true,
  "userEmail": "user@example.com",
  "autoGenerateImprovements": true,
  "autoPushToGitHub": false,
  "analysisSchedule": "daily",
  "shortReportFormat": true,
  "scheduledTime": "14:30",
  "selectedRepositories": ["owner/repo1", "owner/repo2"],
  "selectedProjects": ["project-id-1", "project-id-2"]
}
```

#### `analysis-reports` Function
**File**: `supabase/functions/analysis-reports/index.ts`

Manages analysis reports with GET/POST/PUT methods:

**GET** - Retrieve reports
```
GET /functions/v1/analysis-reports?repository=owner/repo&limit=50
Authorization: Bearer {token}
```
Returns reports for user, optionally filtered by repository.

**POST** - Save new report
```
POST /functions/v1/analysis-reports
Authorization: Bearer {token}
Content-Type: application/json

{
  "reportId": "report_1234567890",
  "timestamp": "2025-01-20T14:30:00Z",
  "repository": "owner/repo",
  "totalIssues": 15,
  "byPriority": {
    "critical": 2,
    "high": 4,
    "medium": 5,
    "low": 4
  },
  "shortSummary": "...",
  "fullReport": "...",
  "prUrl": "https://github.com/...",
  "emailSent": true
}
```

**PUT** - Update report (e.g., after PR creation or user approval)
```
PUT /functions/v1/analysis-reports
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "uuid-of-report",
  "prUrl": "https://github.com/...",
  "prNumber": 42,
  "branchName": "ai-improvements-123",
  "emailSent": true,
  "userApproved": true,
  "userApprovedAt": "2025-01-20T14:35:00Z"
}
```

### 3. Service Updates

**File**: `src/services/analysisAutomationService.ts`

Enhanced with database support:

**New Methods**:
- `loadSettingsFromDatabase()` - Fetch settings from database
- `loadReportsFromDatabase(repository?)` - Fetch reports from database
- `saveSettings()` - Now saves to both localStorage and database
- `saveReport()` - Now saves to both localStorage and database

**Hybrid Approach**:
- Always saves to localStorage for offline support
- Attempts to save to database if available
- Falls back gracefully if database is unavailable
- Loads from localStorage on initialization, then syncs with database

**Error Handling**:
- Graceful fallback to localStorage if database operations fail
- Detailed logging for debugging
- No user-facing errors for database sync failures

### 4. UI Updates

**File**: `src/components/settings/AnalysisAutomationSettings.tsx`

Enhanced to load from database:

**On Mount**:
- Loads GitHub repos from API
- Loads Vercel projects from API
- Calls `loadSettingsFromDatabase()` to sync with server
- Calls `loadReportsFromDatabase()` to sync reports

**On Save**:
- Saves settings to both localStorage and database
- Shows success message when complete
- Handles errors gracefully

## How It Works

### Settings Persistence Flow

```
User Updates Settings
    ↓
Component calls saveSettings()
    ↓
Service saves to localStorage (immediate)
    ↓
Service calls analysis-settings edge function
    ↓
Edge function verifies JWT token
    ↓
Edge function saves to database
    ↓
Settings persist across sessions and devices
```

### Report Persistence Flow

```
Analysis Completes
    ↓
Component calls saveReport()
    ↓
Service saves to localStorage (immediate)
    ↓
Service calls analysis-reports edge function
    ↓
Edge function verifies JWT token
    ↓
Edge function saves to database
    ↓
Reports available for history and future automation
```

### Loading Flow

```
User Opens Settings
    ↓
Component mounts
    ↓
Calls loadSettingsFromDatabase()
    ↓
Edge function fetches from database
    ↓
Settings loaded and displayed
    ↓
User can see previously saved configuration
```

## Database Setup

To deploy these changes:

1. **Apply Migration**:
   ```bash
   supabase migration up
   ```

2. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy analysis-settings
   supabase functions deploy analysis-reports
   ```

3. **Set Environment Variables** (if needed):
   - `SUPABASE_URL` - Already set
   - `SUPABASE_SERVICE_ROLE_KEY` - Already set
   - `SUPABASE_PUBLISHABLE_KEY` - Already set

## Security Considerations

1. **Row Level Security (RLS)**:
   - All tables have RLS enabled
   - Users can only access their own data
   - Policies enforce `auth.uid() = user_id`

2. **Authentication**:
   - All edge functions verify JWT token
   - Token extracted from Authorization header
   - Invalid tokens return 401 Unauthorized

3. **Data Validation**:
   - Edge functions validate required fields
   - Type checking on all inputs
   - Error messages don't leak sensitive information

4. **Encryption**:
   - All data in transit uses HTTPS
   - Supabase handles encryption at rest
   - Sensitive data (API keys) stored separately in credentials table

## Testing

### Manual Testing

1. **Settings Persistence**:
   - Open Settings → Analysis Automation
   - Change settings and click Save
   - Refresh page - settings should persist
   - Log out and log back in - settings should still be there

2. **Report Tracking**:
   - Run analysis in DevOps panel
   - Check "Recent Analysis Reports" section
   - Reports should appear immediately
   - Refresh page - reports should still be there

3. **Database Sync**:
   - Open browser console
   - Look for "✅ Settings saved to database" messages
   - Verify no errors in console

### Automated Testing (Future)

- Unit tests for service methods
- Integration tests for edge functions
- End-to-end tests for full workflow

## Next Steps (Phase 3)

Phase 3 will implement the backend service for scheduled analysis execution:

1. Create `scheduled-analysis-service.ts` for backend logic
2. Implement analysis execution workflow
3. Add retry logic with exponential backoff
4. Implement report generation
5. Integrate with existing PR creation logic

## Troubleshooting

### Settings Not Saving to Database

**Symptoms**: Settings save to localStorage but not to database

**Causes**:
- User not authenticated
- Supabase URL/key not configured
- Edge function not deployed
- Database migration not applied

**Solution**:
1. Check browser console for error messages
2. Verify user is logged in
3. Check Supabase dashboard for function deployment
4. Run migration: `supabase migration up`

### Reports Not Appearing

**Symptoms**: Reports save locally but don't appear after refresh

**Causes**:
- Database not syncing
- User not authenticated
- Edge function error

**Solution**:
1. Check browser console for errors
2. Verify user is logged in
3. Check Supabase function logs
4. Try manual refresh of page

### Performance Issues

**Symptoms**: Settings/reports load slowly

**Causes**:
- Missing database indexes
- Large number of reports
- Network latency

**Solution**:
1. Verify indexes are created (check migration)
2. Implement pagination for reports (limit=50 by default)
3. Add caching layer if needed

## Files Modified/Created

**Created**:
- `supabase/migrations/20250120000001_analysis_automation.sql`
- `supabase/functions/analysis-settings/index.ts`
- `supabase/functions/analysis-reports/index.ts`
- `.kiro/specs/scheduled-analysis-automation/phase-2-database-integration.md`

**Modified**:
- `src/services/analysisAutomationService.ts` - Added database methods
- `src/components/settings/AnalysisAutomationSettings.tsx` - Added database loading

## Summary

Phase 2 successfully implements database persistence for analysis automation. Settings and reports now persist across sessions and devices, providing a solid foundation for Phase 3 (backend service) and Phase 4 (Kestra integration).

The implementation uses a hybrid approach with localStorage for offline support and database for persistent storage, ensuring reliability and performance.
