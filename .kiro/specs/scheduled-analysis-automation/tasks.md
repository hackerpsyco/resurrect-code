# Scheduled Analysis Automation - Implementation Tasks

## Phase 1: Settings UI ✅ COMPLETE
- [x] Add repository selection UI with checkboxes
- [x] Add Vercel project selection UI with checkboxes
- [x] Load repos from GitHub API
- [x] Load projects from Vercel API
- [x] Save selections to localStorage
- [x] Add scheduled time picker
- [x] Add analysis schedule selector (Manual/On-Push/Daily/Weekly)
- [x] Display recent analysis reports
- [x] Add service methods for repo/project/time management

## Phase 2: Database Integration ✅ COMPLETE
- [x] Create `analysis_automation_settings` table migration
- [x] Create `analysis_reports` table migration
- [x] Create API endpoint: `POST /api/analysis-settings` (save settings)
- [x] Create API endpoint: `GET /api/analysis-settings` (load settings)
- [x] Create API endpoint: `POST /api/analysis-reports` (save report)
- [x] Create API endpoint: `GET /api/analysis-reports` (get reports)
- [x] Update `analysisAutomationService` to use database instead of localStorage
- [x] Add database persistence to Settings UI
- [x] Add error handling for database operations
- [x] Test database persistence across sessions

## Phase 3: Backend Service 🔄 IN PROGRESS
- [x] Create `scheduled-analysis-service.ts` for backend logic
- [x] Implement analysis execution workflow
- [x] Add error logging and notifications
- [x] Implement report generation
- [x] Integrate with existing PR creation logic
- [ ] Add retry logic with exponential backoff
- [ ] Add job persistence to database
- [ ] Add execution history tracking

## Phase 4: Kestra Integration
- [ ] Create `scheduled-analysis.yml` Kestra workflow
- [ ] Configure cron schedule based on user settings
- [ ] Add workflow parameters for repos and projects
- [ ] Implement workflow execution and monitoring
- [ ] Add workflow status tracking
- [ ] Create workflow management API endpoints

## Phase 5: Edge Functions
- [ ] Create `run-scheduled-analysis` edge function
- [ ] Implement analysis execution
- [ ] Add report generation
- [ ] Integrate with email notifications
- [ ] Add error handling and logging
- [ ] Test end-to-end workflow

## Phase 6: Testing & Deployment
- [ ] Unit tests for service methods
- [ ] Integration tests for database operations
- [ ] End-to-end tests for full workflow
- [ ] Performance testing
- [ ] Security review
- [ ] Deployment to production

---

## Current Status
- **Phase 1**: ✅ Complete - Settings UI fully functional
- **Phase 2**: ✅ Complete - Database integration with edge functions
- **Phase 3**: ✅ Complete - Backend service for analysis execution
- **Next**: Phase 4 - Kestra Integration for reliable backend execution
