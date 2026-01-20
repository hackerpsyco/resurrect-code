# Scheduled Analysis Automation - Requirements

## Introduction

This feature enables users to schedule automated code analysis at specific times (daily/weekly) with automatic PR creation and email notifications. The system will:

1. Allow users to select GitHub repos and Vercel projects in Settings
2. Schedule analysis to run at specific times
3. Automatically create PRs with analysis results
4. Send email notifications for user approval
5. Push to GitHub when user approves via email

## Glossary

- **Analysis Automation**: Scheduled code analysis that runs without manual intervention
- **Scheduled Time**: UTC time when analysis should run (e.g., 14:30)
- **Analysis Schedule**: Frequency of analysis (Manual, On-Push, Daily, Weekly)
- **Repository Selection**: User-selected GitHub repos for analysis
- **Project Selection**: User-selected Vercel projects for analysis
- **Kestra Workflow**: Backend job scheduler that triggers analysis at scheduled times
- **Email Approval**: User approval via email to push improvements to GitHub

## Requirements

### Requirement 1: Repository & Project Selection

**User Story**: As a user, I want to select which GitHub repositories and Vercel projects to analyze, so that automation only runs on the projects I care about.

#### Acceptance Criteria

1. WHEN user opens Settings → Analysis Automation THEN the system SHALL display a section to select GitHub repositories
2. WHEN user opens Settings → Analysis Automation THEN the system SHALL display a section to select Vercel projects
3. WHEN user selects repositories THEN the system SHALL save the selection to localStorage
4. WHEN user selects projects THEN the system SHALL save the selection to localStorage
5. WHEN user saves settings THEN the system SHALL persist selections to backend database
6. WHEN user returns to Settings THEN the system SHALL display previously selected repositories and projects

### Requirement 2: Scheduled Analysis Execution

**User Story**: As a user, I want analysis to run automatically at my scheduled time, so that I don't have to manually trigger it.

#### Acceptance Criteria

1. WHEN analysis schedule is set to Daily THEN the system SHALL run analysis at the specified UTC time every day
2. WHEN analysis schedule is set to Weekly THEN the system SHALL run analysis at the specified UTC time every Monday
3. WHEN scheduled time arrives THEN the system SHALL execute analysis on selected repositories
4. WHEN analysis completes THEN the system SHALL create a PR with analysis results
5. WHEN PR is created THEN the system SHALL send email notification to user
6. WHEN analysis fails THEN the system SHALL log error and retry after 1 hour

### Requirement 3: Automated PR Creation

**User Story**: As a user, I want PRs to be created automatically with analysis results, so that improvements are ready for review.

#### Acceptance Criteria

1. WHEN analysis completes THEN the system SHALL create a GitHub branch with analysis results
2. WHEN branch is created THEN the system SHALL commit analysis report to the branch
3. WHEN commit is created THEN the system SHALL create a pull request with analysis summary
4. WHEN PR is created THEN the system SHALL include link to analysis report
5. WHEN PR creation fails THEN the system SHALL log error and notify user via email

### Requirement 4: Email Notification & Approval

**User Story**: As a user, I want to receive email notifications with analysis results and approve/reject pushing to GitHub, so that I maintain control over code changes.

#### Acceptance Criteria

1. WHEN PR is created THEN the system SHALL send email with analysis summary
2. WHEN email is sent THEN the system SHALL include "Yes, Push to GitHub" button
3. WHEN email is sent THEN the system SHALL include "No, Skip" button
4. WHEN user clicks "Yes" THEN the system SHALL push improvements to GitHub
5. WHEN user clicks "No" THEN the system SHALL skip GitHub push
6. WHEN user approves THEN the system SHALL update PR with approval status

### Requirement 5: Kestra Workflow Integration

**User Story**: As a system, I want to use Kestra to schedule and execute analysis jobs, so that analysis runs reliably at scheduled times.

#### Acceptance Criteria

1. WHEN analysis schedule is configured THEN the system SHALL create Kestra job with schedule
2. WHEN scheduled time arrives THEN Kestra SHALL trigger analysis workflow
3. WHEN workflow executes THEN Kestra SHALL pass selected repos and projects to analysis
4. WHEN analysis completes THEN Kestra SHALL log results and status
5. WHEN workflow fails THEN Kestra SHALL retry with exponential backoff

### Requirement 6: Settings Persistence

**User Story**: As a user, I want my automation settings to persist across sessions, so that I don't have to reconfigure them.

#### Acceptance Criteria

1. WHEN user saves automation settings THEN the system SHALL store in database
2. WHEN user returns to Settings THEN the system SHALL load saved settings
3. WHEN user changes settings THEN the system SHALL update database
4. WHEN database update fails THEN the system SHALL show error message
5. WHEN user logs out and logs back in THEN the system SHALL restore all settings

## Implementation Notes

- Repository/Project selection UI should show available options from GitHub/Vercel APIs
- Scheduled time should be in UTC format (HH:MM)
- Kestra workflow should be created dynamically based on user settings
- Email notifications should include secure approval tokens
- PR creation should follow existing manual analysis pattern
- All settings should be encrypted in database for security
