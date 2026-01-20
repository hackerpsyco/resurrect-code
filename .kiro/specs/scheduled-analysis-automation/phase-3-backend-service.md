# Phase 3: Backend Service - Implementation Guide

## Overview

Phase 3 implements the core backend service for scheduled analysis execution. This service handles:
- Job scheduling and execution
- Repository analysis
- PR creation with results
- Email notifications
- Execution tracking and monitoring

## What Was Implemented

### 1. Scheduled Analysis Service

**File**: `src/services/scheduledAnalysisService.ts`

Core service with the following capabilities:

#### Job Management
- `createJob()` - Create new scheduled analysis job
- `pauseJob()` - Pause a running job
- `resumeJob()` - Resume a paused job
- `deleteJob()` - Delete a job
- `getJobs()` - Get all jobs
- `getJob()` - Get specific job

#### Job Execution
- `executeJob()` - Execute a scheduled job
- `analyzeRepository()` - Analyze single repository
- `triggerManualAnalysis()` - Trigger manual analysis

#### Analysis Workflow
- `fetchRepositoryCode()` - Fetch code files from GitHub
- `runAnalysis()` - Run code analysis
- `createAnalysisPR()` - Create PR with results
- `sendAnalysisNotification()` - Send email notification

#### Scheduling
- `scheduleDailyJob()` - Schedule daily analysis
- `scheduleWeeklyJob()` - Schedule weekly analysis
- `calculateNextRun()` - Calculate next execution time

#### Monitoring
- `getExecutions()` - Get all executions
- `getJobExecutions()` - Get executions for specific job
- `addListener()` - Add execution listener
- `removeListener()` - Remove listener

### 2. Data Models

#### ScheduledAnalysisJob
```typescript
{
  id: string;                    // Unique job ID
  userId: string;                // User who created job
  repositories: string[];        // GitHub repos to analyze
  projects: string[];            // Vercel projects
  schedule: 'manual' | 'on-push' | 'daily' | 'weekly';
  scheduledTime?: string;        // HH:MM format in UTC
  status: 'active' | 'paused' | 'failed';
  lastRun?: string;              // ISO timestamp of last execution
  nextRun?: string;              // ISO timestamp of next execution
  createdAt: string;
  updatedAt: string;
}
```

#### AnalysisExecution
```typescript
{
  id: string;                    // Unique execution ID
  jobId: string;                 // Associated job ID
  repository: string;            // Repository being analyzed
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;             // ISO timestamp
  endTime?: string;              // ISO timestamp
  result?: {
    totalIssues: number;
    byPriority: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  error?: string;                // Error message if failed
  prUrl?: string;                // Created PR URL
}
```

## Architecture

### Job Lifecycle

```
Create Job
    ↓
Calculate Next Run
    ↓
Schedule Timer
    ↓
Timer Triggers
    ↓
Execute Job
    ├─ Fetch Code
    ├─ Run Analysis
    ├─ Create PR
    └─ Send Email
    ↓
Calculate Next Run
    ↓
Schedule Next Timer
```

### Analysis Workflow

```
Repository Selected
    ↓
Fetch Code Files from GitHub
    ↓
Run Analysis (Simulated)
    ↓
Create Analysis PR
    ├─ Create Branch
    ├─ Create Commit
    └─ Create Pull Request
    ↓
Send Email Notification
    ├─ Generate Report
    ├─ Save to Database
    └─ Send Email
    ↓
Track Execution
```

## Key Features

### 1. Flexible Scheduling
- **Manual**: Run on demand
- **On-Push**: Run when code is pushed
- **Daily**: Run at specific UTC time every day
- **Weekly**: Run at specific UTC time every Monday

### 2. Job Management
- Create, pause, resume, and delete jobs
- Track job status and execution history
- Calculate next run time automatically

### 3. Analysis Execution
- Fetch code from GitHub repositories
- Run analysis (simulated for now, can integrate with Gemini)
- Create PR with analysis results
- Send email notifications

### 4. Error Handling
- Graceful error handling with detailed logging
- Job status tracking (active, paused, failed)
- Execution error tracking

### 5. Monitoring
- Real-time execution tracking
- Listener pattern for execution updates
- Execution history with timestamps

## Usage Examples

### Create a Daily Job

```typescript
const job = await scheduledAnalysisService.createJob(
  userId,
  ['owner/repo1', 'owner/repo2'],
  ['project-id-1', 'project-id-2'],
  'daily',
  '14:30' // 2:30 PM UTC
);
```

### Create a Weekly Job

```typescript
const job = await scheduledAnalysisService.createJob(
  userId,
  ['owner/repo1'],
  ['project-id-1'],
  'weekly',
  '09:00' // 9:00 AM UTC, every Monday
);
```

### Trigger Manual Analysis

```typescript
await scheduledAnalysisService.triggerManualAnalysis([
  'owner/repo1',
  'owner/repo2'
]);
```

### Monitor Executions

```typescript
scheduledAnalysisService.addListener((execution) => {
  console.log(`Execution ${execution.id}: ${execution.status}`);
  if (execution.status === 'completed') {
    console.log(`Issues found: ${execution.result?.totalIssues}`);
    console.log(`PR: ${execution.prUrl}`);
  }
});
```

### Pause/Resume Job

```typescript
scheduledAnalysisService.pauseJob(jobId);
// ... later ...
scheduledAnalysisService.resumeJob(jobId);
```

## Integration Points

### 1. Analysis Automation Service
- Uses `analysisAutomationService.generateShortReport()`
- Uses `analysisAutomationService.generateFullReport()`
- Uses `analysisAutomationService.saveReport()`
- Uses `analysisAutomationService.sendEmailNotification()`

### 2. GitHub API
- Fetches repository code
- Creates branches
- Creates pull requests
- Uses GitHub token from localStorage

### 3. Email Notifications
- Integrates with existing email system
- Sends analysis reports
- Includes PR links

## Current Limitations

1. **Analysis is Simulated** - Currently generates random issue counts
   - Future: Integrate with Gemini API for real analysis

2. **No Database Persistence** - Jobs only exist in memory
   - Future: Persist to database for reliability

3. **No Retry Logic** - Failed jobs don't retry
   - Future: Add exponential backoff retry

4. **Client-Side Only** - Runs in browser
   - Future: Move to backend/Kestra for reliability

5. **No Execution History** - Executions cleared on page refresh
   - Future: Persist to database

## Next Steps (Phase 4)

Phase 4 will integrate with Kestra for reliable backend execution:

1. Create `scheduled-analysis.yml` Kestra workflow
2. Configure cron schedule based on user settings
3. Add workflow parameters for repos and projects
4. Implement workflow execution and monitoring
5. Add workflow status tracking

## Testing

### Manual Testing

1. **Create Daily Job**:
   - Open Settings → Analysis Automation
   - Select repos and projects
   - Set schedule to "Daily"
   - Set time to current time + 1 minute
   - Click Save
   - Wait for job to execute

2. **Monitor Execution**:
   - Check browser console for logs
   - Look for "🔔 Daily job triggered" message
   - Verify PR was created
   - Check email for notification

3. **Pause/Resume**:
   - Create a job
   - Pause it
   - Verify no execution happens
   - Resume it
   - Verify execution resumes

### Automated Testing (Future)

- Unit tests for job creation
- Unit tests for scheduling logic
- Integration tests for analysis execution
- End-to-end tests for full workflow

## Performance Considerations

1. **Memory Usage**:
   - Jobs stored in Map (minimal overhead)
   - Executions stored in Map (can grow large)
   - Consider cleanup of old executions

2. **Timer Management**:
   - One timer per job
   - Timers cleared when job is paused/deleted
   - No memory leaks

3. **API Calls**:
   - GitHub API calls for code fetching
   - Rate limiting: 60 requests/hour (unauthenticated)
   - Consider caching for large repositories

## Security Considerations

1. **GitHub Token**:
   - Stored in localStorage
   - Used for API authentication
   - Should be encrypted in production

2. **User Data**:
   - Jobs associated with userId
   - Repositories and projects user-selected
   - No sensitive data in logs

3. **Email Notifications**:
   - Uses existing email service
   - Respects user email preferences
   - Includes secure approval tokens

## Files Created

1. `src/services/scheduledAnalysisService.ts` - Main service implementation
2. `.kiro/specs/scheduled-analysis-automation/phase-3-backend-service.md` - This documentation

## Files Modified

1. `.kiro/specs/scheduled-analysis-automation/tasks.md` - Updated task status

## Summary

Phase 3 successfully implements the backend service for scheduled analysis execution. The service provides:

✅ Job scheduling (daily, weekly, manual)
✅ Analysis execution workflow
✅ PR creation with results
✅ Email notifications
✅ Execution tracking and monitoring
✅ Error handling and logging

The service is ready for integration with Kestra (Phase 4) for reliable backend execution.

---

**Status**: 🔄 Phase 3 In Progress
**Next**: Phase 4 - Kestra Integration
