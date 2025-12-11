# Cline API Service Guide

## Overview

The Cline API service provides a structured way to interact with AI for code-related tasks. It's built on top of the existing AI service and provides task-based interactions with proper state management.

## Architecture

### Core Components

1. **ClineApiService** (`src/services/clineApi.ts`)
   - Main service for creating and managing AI tasks
   - Handles streaming responses
   - Parses AI responses into structured data

2. **useCline Hook** (`src/hooks/useCline.ts`)
   - React hook for easy integration
   - Manages task state and streaming
   - Provides convenience methods

3. **ClinePanel Component** (`src/components/dashboard/ide/ClinePanel.tsx`)
   - Updated UI for task-based interactions
   - Shows task history and progress
   - Provides quick actions for common tasks

## Task Types

### Available Task Types

- **`fix_error`** - Fix code errors and bugs
- **`explain_code`** - Explain how code works
- **`generate_code`** - Generate new code based on requirements
- **`refactor`** - Improve code structure and quality
- **`optimize`** - Optimize code for better performance
- **`test`** - Generate test cases
- **`document`** - Generate documentation

### Task Structure

```typescript
interface ClineTask {
  id: string;
  type: 'fix_error' | 'explain_code' | 'generate_code' | 'refactor' | 'optimize' | 'test' | 'document';
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: {
    code?: string;
    filePath?: string;
    errorMessage?: string;
    instruction: string;
    language?: string;
  };
  output?: {
    explanation?: string;
    code?: string;
    suggestions?: string[];
    confidence?: number;
  };
  createdAt: Date;
  completedAt?: Date;
}
```

## Usage Examples

### Basic Usage with Hook

```typescript
import { useCline } from '@/hooks/useCline';

function MyComponent() {
  const { 
    fixError, 
    generateCode, 
    isLoading, 
    currentTask, 
    tasks 
  } = useCline();

  const handleFixError = async () => {
    const context = {
      currentFile: 'src/App.tsx',
      fileContent: 'const App = () => { return <div>Hello</div> }',
      errorLogs: ['Missing semicolon'],
      projectName: 'My Project'
    };

    try {
      const response = await fixError(
        'Missing semicolon', 
        'const App = () => { return <div>Hello</div> }', 
        context
      );
      
      if (response.success) {
        console.log('Fix applied:', response.task.output?.code);
      }
    } catch (error) {
      console.error('Fix failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleFixError} disabled={isLoading}>
        Fix Error
      </button>
      {currentTask && <div>Current: {currentTask.type}</div>}
    </div>
  );
}
```

### Streaming Usage

```typescript
const handleStreamingTask = async () => {
  const context = { /* ... */ };
  
  try {
    for await (const chunk of streamTask('generate_code', 'Create a React component', context)) {
      console.log('Streaming:', chunk.content);
      
      if (chunk.done) {
        console.log('Task completed:', chunk.task.output);
      }
    }
  } catch (error) {
    console.error('Streaming failed:', error);
  }
};
```

### Direct API Usage

```typescript
import { clineApi } from '@/services/clineApi';

const context = {
  currentFile: 'src/utils.ts',
  fileContent: 'export const add = (a, b) => a + b;',
  language: 'typescript'
};

// Create a task
const response = await clineApi.createTask(
  'document',
  'Generate JSDoc comments for this function',
  context,
  { code: 'export const add = (a, b) => a + b;' }
);

// Stream a task
for await (const chunk of clineApi.streamTask('refactor', 'Improve this code', context)) {
  console.log(chunk);
}
```

## Features

### Smart Context Building

The service automatically builds context from:
- Current file path and content
- Error logs and messages
- Project information
- Selected code snippets
- Programming language detection

### Response Parsing

AI responses are automatically parsed to extract:
- **Code blocks** with language detection
- **Suggestions** as bullet points
- **Confidence scores** based on response characteristics
- **Explanations** as formatted text

### Task Management

- **Task History** - All tasks are stored and can be retrieved
- **Status Tracking** - Real-time status updates (pending → running → completed/failed)
- **Streaming Support** - Real-time response streaming for better UX
- **Error Handling** - Graceful error handling with detailed messages

### UI Integration

The ClinePanel provides:
- **Quick Actions** - One-click buttons for common tasks
- **Task History** - Visual timeline of all tasks
- **Real-time Streaming** - Live updates as AI responds
- **Code Application** - Direct code application to files
- **Confidence Indicators** - Visual confidence scores

## Configuration

### AI Provider Setup

1. Click the Settings button in ClinePanel
2. Choose your AI provider (OpenAI, Claude, Gemini, etc.)
3. Enter your API key
4. Select the model
5. Save configuration

### Supported Providers

- **OpenAI** - GPT-3.5, GPT-4, GPT-4 Turbo
- **Anthropic Claude** - Claude 3 Haiku, Sonnet, Opus
- **Google Gemini** - Gemini Pro, Gemini Pro Vision
- **Lovable AI** - Via Supabase edge function

## Best Practices

### Context Optimization

- Provide relevant file content
- Include specific error messages
- Add project context when available
- Specify programming language

### Task Selection

- Use **fix_error** for specific bugs
- Use **explain_code** for understanding
- Use **generate_code** for new features
- Use **refactor** for code improvements
- Use **optimize** for performance issues

### Error Handling

```typescript
try {
  const response = await clineApi.createTask(type, instruction, context);
  
  if (!response.success) {
    console.error('Task failed:', response.task.status);
    return;
  }
  
  // Handle successful response
  console.log('Task completed:', response.task.output);
  
} catch (error) {
  console.error('API error:', error);
  // Handle network or API errors
}
```

## Integration with Extensions

The Cline API works seamlessly with the extension system:

1. **Extension Context** - Automatically detects active extensions
2. **Language Support** - Uses extension language detection
3. **Code Formatting** - Integrates with Prettier for output formatting
4. **IntelliSense** - Leverages extension completions for better suggestions

## Performance Considerations

- **Streaming** - Use streaming for long-running tasks
- **Context Size** - Limit context to relevant information
- **Task Batching** - Group related tasks when possible
- **Caching** - Task results are cached for quick retrieval

This new Cline API provides a much more structured and powerful way to interact with AI for coding tasks, with better state management, streaming support, and integration with the IDE's extension system.