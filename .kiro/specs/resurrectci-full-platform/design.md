# ResurrectCI Full Platform - Design Document

## Overview

ResurrectCI is a comprehensive autonomous DevOps platform that integrates multiple services to detect, analyze, and fix build errors automatically. The system architecture consists of:

1. **Frontend Layer**: React-based UI with responsive design for desktop, tablet, and mobile
2. **Integration Layer**: Connections to Vercel, GitHub, Kestra, Gemini AI, and CodeRabbit
3. **Orchestration Layer**: Kestra workflows coordinating the entire fix process
4. **Analysis Layer**: Gemini AI for error analysis and fix generation
5. **Monitoring Layer**: Real-time logging and DevOps dashboard

The platform operates in a continuous cycle: detect failures → analyze errors → generate fixes → create PRs → review code → auto-merge → redeploy.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ResurrectCI Platform                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Frontend   │  │   Dashboard  │  │     IDE      │           │
│  │   (React)    │  │  (DevOps)    │  │  (Gemini)    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│         │                 │                  │                   │
│         └─────────────────┼──────────────────┘                   │
│                           │                                       │
│  ┌────────────────────────▼────────────────────────┐             │
│  │         Supabase Backend Services               │             │
│  │  - Authentication (OTP)                         │             │
│  │  - Real-time Database                           │             │
│  │  - Edge Functions                               │             │
│  └────────────────────────┬────────────────────────┘             │
│                           │                                       │
│  ┌────────────────────────▼────────────────────────┐             │
│  │      Integration & Orchestration Layer          │             │
│  │  ┌──────────────┐  ┌──────────────┐             │             │
│  │  │   Vercel     │  │   GitHub     │             │             │
│  │  │  Monitoring  │  │  PR Creation │             │             │
│  │  └──────────────┘  └──────────────┘             │             │
│  │  ┌──────────────┐  ┌──────────────┐             │             │
│  │  │   Kestra     │  │  CodeRabbit  │             │             │
│  │  │  Workflows   │  │  Code Review │             │             │
│  │  └──────────────┘  └──────────────┘             │             │
│  │  ┌──────────────┐                               │             │
│  │  │  Gemini AI   │                               │             │
│  │  │  Analysis    │                               │             │
│  │  └──────────────┘                               │             │
│  └────────────────────────────────────────────────┘             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Frontend Components

#### DevOps Panel
- **Purpose**: Real-time monitoring and control of automation
- **Features**:
  - Deployment metrics display
  - Action feed with real-time updates
  - Build log viewer with categorization
  - Service connection status
  - Test automation button
- **Responsive**: Mobile (hamburger menu), Tablet (2-column), Desktop (3-column)

#### Mobile Responsive Dashboard
- **Purpose**: Provide seamless experience across all device sizes
- **Features**:
  - Hamburger menu navigation on mobile
  - Collapsible sidebar on tablet
  - Full layout on desktop
  - Automatic sidebar closing on navigation
  - Touch-friendly controls

#### Integrated IDE
- **Purpose**: Code editing with AI assistance
- **Features**:
  - Syntax highlighting for multiple languages
  - Gemini AI chat panel
  - Code context extraction
  - Copy-to-clipboard functionality
  - Insert-into-editor functionality
  - Mobile-responsive terminal

#### Gemini AI Chat Panel
- **Purpose**: AI-powered code assistance
- **Features**:
  - Real-time message streaming
  - Code block parsing and syntax highlighting
  - Copy and insert functionality
  - Error handling with user feedback
  - Context-aware responses

### 2. Service Integration Components

#### Vercel Deployment Monitor
- **Purpose**: Track deployment status and capture errors
- **Interface**:
  ```typescript
  interface DeploymentMonitor {
    triggerDeployment(projectId: string, options: DeploymentOptions): Promise<Deployment>
    monitorDeployment(deploymentId: string): Promise<DeploymentStatus>
    captureErrorLogs(deploymentId: string): Promise<ErrorLogs>
  }
  ```

#### GitHub Integration
- **Purpose**: Create PRs and manage branches
- **Interface**:
  ```typescript
  interface GitHubIntegration {
    createBranch(branchName: string): Promise<Branch>
    createPR(title: string, description: string, files: FileChange[]): Promise<PR>
    addLabels(prNumber: number, labels: string[]): Promise<void>
    requestReview(prNumber: number, reviewers: string[]): Promise<void>
  }
  ```

#### Kestra Workflow Orchestration
- **Purpose**: Coordinate multi-step automation workflows
- **Interface**:
  ```typescript
  interface KestraOrchestration {
    triggerWorkflow(workflowId: string, inputs: WorkflowInput): Promise<ExecutionId>
    monitorExecution(executionId: string): Promise<ExecutionStatus>
    getExecutionLogs(executionId: string): Promise<ExecutionLogs>
  }
  ```

#### Gemini AI Analysis
- **Purpose**: Analyze errors and generate fixes
- **Interface**:
  ```typescript
  interface GeminiAnalysis {
    analyzeError(errorLogs: string, codeContext: string): Promise<ErrorAnalysis>
    generateFix(errorAnalysis: ErrorAnalysis): Promise<CodeFix>
    validateFix(fix: CodeFix, buildConfig: BuildConfig): Promise<ValidationResult>
  }
  ```

#### CodeRabbit Review
- **Purpose**: AI-powered code quality review
- **Interface**:
  ```typescript
  interface CodeRabbitReview {
    requestReview(prNumber: number, files: FileChange[]): Promise<ReviewId>
    getReviewStatus(reviewId: string): Promise<ReviewStatus>
    getReviewComments(reviewId: string): Promise<ReviewComment[]>
  }
  ```

### 3. Data Models

#### Deployment
```typescript
interface Deployment {
  id: string
  projectId: string
  status: 'pending' | 'building' | 'success' | 'failed'
  errorLogs: string
  timestamp: Date
  branch: string
}
```

#### ErrorAnalysis
```typescript
interface ErrorAnalysis {
  rootCause: string
  errorType: 'dependency' | 'syntax' | 'configuration' | 'other'
  affectedFiles: string[]
  severity: 'critical' | 'high' | 'medium' | 'low'
  suggestedFixes: string[]
  confidence: number
}
```

#### CodeFix
```typescript
interface CodeFix {
  id: string
  strategy: string
  changes: FileChange[]
  explanation: string
  validationStatus: 'pending' | 'valid' | 'invalid'
  confidenceScore: number
}
```

#### FileChange
```typescript
interface FileChange {
  path: string
  originalContent: string
  newContent: string
  changeType: 'create' | 'modify' | 'delete'
}
```

#### ActionLog
```typescript
interface ActionLog {
  id: string
  timestamp: Date
  type: 'detection' | 'analysis' | 'fix_generation' | 'pr_creation' | 'review' | 'merge' | 'deploy'
  status: 'pending' | 'success' | 'failed'
  details: Record<string, any>
  errorMessage?: string
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Deployment Monitoring Completeness
*For any* Vercel deployment, when a deployment fails, the system SHALL capture the complete error logs within 30 seconds of failure detection.
**Validates: Requirements 1.2, 1.3**

### Property 2: Error Analysis Accuracy
*For any* captured error logs, when Gemini AI analyzes the error, the system SHALL extract a root cause, error type, and affected files that are consistent with the error content.
**Validates: Requirements 2.1, 2.2**

### Property 3: Fix Generation Validity
*For any* generated code fix, the fix SHALL be syntactically valid and include explanatory comments describing the change.
**Validates: Requirements 3.1, 3.3**

### Property 4: PR Creation Completeness
*For any* generated fix, when a GitHub PR is created, the PR SHALL include a description with error analysis, fix explanation, and affected files.
**Validates: Requirements 4.1, 4.2**

### Property 5: Workflow Orchestration Sequencing
*For any* Kestra workflow execution, the workflow steps SHALL execute in the correct sequence (error analysis → fix generation → PR creation) without skipping steps.
**Validates: Requirements 5.1, 5.2**

### Property 6: CodeRabbit Review Integration
*For any* AI-generated PR, when CodeRabbit completes a review, the system SHALL extract quality scores and update the PR with review comments.
**Validates: Requirements 6.1, 6.2**

### Property 7: Dashboard Real-Time Updates
*For any* automated action, when an action occurs, the DevOps Panel SHALL display the action in the Action Feed within 2 seconds of completion.
**Validates: Requirements 7.2, 7.3**

### Property 8: Mobile Responsiveness
*For any* viewport size, the UI SHALL display correctly with appropriate layout (mobile < 640px, tablet 640-1024px, desktop ≥ 1024px) and all controls SHALL be accessible.
**Validates: Requirements 8.1, 8.2, 8.3**

### Property 9: API Key Security
*For any* stored API key, the key SHALL be encrypted before storage and SHALL never appear in full in console logs or UI display.
**Validates: Requirements 10.1, 10.4**

### Property 10: Error Handling Consistency
*For any* failed operation, the system SHALL display a user-friendly error message and provide suggested remediation steps.
**Validates: Requirements 12.1, 12.2**

## Error Handling

### Deployment Monitoring Failures
- **Scenario**: Vercel connection fails during monitoring
- **Handling**: Attempt reconnection with exponential backoff (max 5 retries)
- **User Feedback**: Display connection status in DevOps Panel
- **Fallback**: Allow manual error log upload

### Error Analysis Failures
- **Scenario**: Gemini AI API returns error
- **Handling**: Log failure and provide raw error logs to user
- **User Feedback**: Display error message with raw logs
- **Fallback**: Allow manual error analysis

### Fix Generation Failures
- **Scenario**: Generated fix fails validation
- **Handling**: Attempt alternative fix strategies
- **User Feedback**: Display validation errors and suggestions
- **Fallback**: Allow manual fix creation

### PR Creation Failures
- **Scenario**: GitHub API returns error
- **Handling**: Log failure and provide generated fix content
- **User Feedback**: Display error message with fix content
- **Fallback**: Allow manual PR creation

### Workflow Execution Failures
- **Scenario**: Kestra workflow step fails
- **Handling**: Execute error handling logic and retry
- **User Feedback**: Display step failure in DevOps Panel
- **Fallback**: Allow manual workflow trigger

### Service Connection Failures
- **Scenario**: Service authentication fails
- **Handling**: Display connection status and require re-authentication
- **User Feedback**: Show connection error with remediation steps
- **Fallback**: Allow manual service configuration

## Testing Strategy

### Unit Testing
- Test individual service integrations (Vercel, GitHub, Kestra, Gemini, CodeRabbit)
- Test data model validation and transformation
- Test error handling and retry logic
- Test UI component rendering and interactions
- Test API key encryption and decryption

### Property-Based Testing
- **Property 1**: Generate random deployments and verify error capture within 30 seconds
- **Property 2**: Generate random error logs and verify analysis consistency
- **Property 3**: Generate random fixes and verify syntax validity
- **Property 4**: Generate random fixes and verify PR completeness
- **Property 5**: Generate random workflows and verify step sequencing
- **Property 6**: Generate random PRs and verify CodeRabbit integration
- **Property 7**: Generate random actions and verify dashboard updates
- **Property 8**: Generate random viewport sizes and verify responsive layout
- **Property 9**: Generate random API keys and verify encryption/masking
- **Property 10**: Generate random errors and verify user feedback

### Integration Testing
- Test complete automation flow: detection → analysis → fix → PR → review → merge
- Test service integration with real APIs (staging environment)
- Test Kestra workflow execution with real deployments
- Test GitHub PR creation and CodeRabbit review
- Test mobile responsiveness across devices

### Performance Testing
- Verify error detection within 30 seconds
- Verify dashboard updates within 2 seconds
- Verify API key validation completes within 5 seconds
- Verify fix generation completes within 60 seconds

### Security Testing
- Verify API keys are encrypted and never logged
- Verify authentication tokens are securely stored
- Verify CORS headers are properly configured
- Verify sensitive data is not exposed in error messages

