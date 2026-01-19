# AI Code Analysis & Automation - Design Document

## Overview

The AI Code Analysis & Automation feature enables users to automatically analyze their GitHub project code using Google's Gemini AI, receive improvement suggestions, and automatically push changes back to GitHub. The feature integrates seamlessly with the existing DevOps Panel and Settings, providing a complete workflow for code quality improvement.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                           │
├─────────────────────────────────────────────────────────────┤
│  Settings Panel          │         DevOps Panel              │
│  - Gemini Config         │  - Automation Tab                 │
│  - API Key Management    │  - Project Selection              │
│                          │  - Analysis Status                │
│                          │  - Improvements Display           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Services Layer                            │
├─────────────────────────────────────────────────────────────┤
│  - geminiService.ts (AI analysis)                            │
│  - githubService.ts (code fetching & pushing)                │
│  - analysisService.ts (workflow orchestration)               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    External APIs                             │
├─────────────────────────────────────────────────────────────┤
│  - Gemini API (code analysis)                                │
│  - GitHub API (repository access)                            │
│  - Vercel API (deployment info)                              │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. GeminiIntegration Component
**Location:** `src/components/settings/GeminiIntegration.tsx`

Manages Gemini API key configuration in Settings.

```typescript
interface GeminiIntegrationProps {
  onClose?: () => void;
}

interface GeminiConfig {
  apiKey: string;
  isConnected: boolean;
  lastVerified: number;
}
```

### 2. AutomationTab Component
**Location:** `src/components/dashboard/AutomationTab.tsx`

Displays automation workflow in DevOps Panel.

```typescript
interface AutomationTabProps {
  selectedProject?: string;
}

interface AnalysisState {
  status: 'idle' | 'analyzing' | 'generating' | 'pushing' | 'complete' | 'error';
  progress: number;
  results?: AnalysisResults;
  error?: string;
}
```

### 3. GeminiService
**Location:** `src/services/geminiService.ts`

Handles communication with Gemini API.

```typescript
interface CodeAnalysisRequest {
  files: Array<{ name: string; content: string }>;
  projectName: string;
}

interface AnalysisResult {
  file: string;
  suggestions: Array<{
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    issue: string;
    suggestion: string;
    codeSection: string;
  }>;
}
```

### 4. AnalysisService
**Location:** `src/services/analysisService.ts`

Orchestrates the complete analysis and push workflow.

```typescript
interface WorkflowState {
  projectId: string;
  githubRepo: string;
  analysisResults: AnalysisResult[];
  improvements: Map<string, string>;
  branchName: string;
  prUrl?: string;
}
```

## Data Models

### Gemini Configuration
```typescript
interface GeminiConfig {
  apiKey: string;
  isConnected: boolean;
  lastVerified: number;
  createdAt: number;
}
```

### Code Analysis Results
```typescript
interface AnalysisResults {
  projectName: string;
  timestamp: number;
  totalIssues: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  files: AnalysisResult[];
}
```

### Improvement Suggestion
```typescript
interface Suggestion {
  id: string;
  file: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  issue: string;
  suggestion: string;
  codeSection: string;
  improvement: string;
  applied: boolean;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Gemini Key Validation
*For any* Gemini API key, if the key is valid, the system SHALL successfully authenticate with Gemini API and return analysis results.
**Validates: Requirements 1.2, 8.4**

### Property 2: Code Analysis Completeness
*For any* GitHub project with N files, the analysis SHALL return suggestions for all files that contain issues, and the total issues count SHALL equal the sum of all file suggestions.
**Validates: Requirements 3.3, 3.4**

### Property 3: Improvement Generation Idempotence
*For any* set of analysis results, generating improvements multiple times SHALL produce identical improved code without duplicating changes.
**Validates: Requirements 5.2, 5.3**

### Property 4: GitHub Push Atomicity
*For any* improvement set, pushing to GitHub SHALL either create a complete branch with all changes and a PR, or fail completely without partial commits.
**Validates: Requirements 6.1, 6.2, 6.4**

### Property 5: Status Update Consistency
*For any* automation workflow, the displayed status SHALL always reflect the actual state of the operation (analyzing, generating, pushing, complete, or error).
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 6: Error Recovery
*For any* failed operation, the system SHALL preserve all previous analysis results and allow retry without losing data.
**Validates: Requirements 10.3, 10.4**

### Property 7: API Key Security
*For any* stored Gemini API key, the key SHALL be encrypted in localStorage and never logged or displayed in plain text.
**Validates: Requirements 1.2, 8.4**

### Property 8: Analysis Results Persistence
*For any* completed analysis, the results SHALL be persisted and retrievable until the user explicitly clears them or starts a new analysis.
**Validates: Requirements 3.4, 5.1**

## Error Handling

### Gemini API Errors
- Invalid API key → Display "Invalid Gemini API key" with link to Settings
- Rate limit exceeded → Display "Analysis limit reached, try again later"
- API timeout → Display "Analysis took too long, please retry"

### GitHub API Errors
- Invalid token → Display "GitHub connection failed, reconnect in Settings"
- Repository not found → Display "Repository not accessible"
- Push failed → Display "Failed to push changes, check GitHub permissions"

### Analysis Errors
- No files found → Display "No code files found in repository"
- Analysis failed → Display "Analysis failed, please retry"
- Improvement generation failed → Display "Could not generate improvements"

## Testing Strategy

### Unit Tests
- Test Gemini API key validation
- Test analysis result parsing
- Test improvement generation logic
- Test GitHub push workflow
- Test error handling and recovery

### Property-Based Tests
- **Property 1**: Validate Gemini key authentication across various key formats
- **Property 2**: Verify analysis completeness with random file sets
- **Property 3**: Test improvement idempotence with multiple generations
- **Property 4**: Verify GitHub push atomicity with various file changes
- **Property 5**: Test status consistency throughout workflow
- **Property 6**: Verify error recovery preserves data
- **Property 7**: Test API key encryption and security
- **Property 8**: Test analysis results persistence

### Integration Tests
- Test complete workflow: analyze → generate → push
- Test with real GitHub and Gemini APIs (using test credentials)
- Test error scenarios and recovery
- Test concurrent analysis requests

### Testing Framework
- **Unit/Integration**: Jest with React Testing Library
- **Property-Based**: fast-check (100+ iterations per property)
- **E2E**: Playwright for full workflow testing
