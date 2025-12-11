import { AIService, AIMessage, getAIConfig } from './aiService';

export interface ClineTask {
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

export interface ClineContext {
  currentFile?: string;
  fileContent?: string;
  errorLogs?: string[];
  projectName?: string;
  language?: string;
  selectedCode?: string;
}

export interface ClineResponse {
  success: boolean;
  task: ClineTask;
  streamId?: string;
}

class ClineApiService {
  private aiService: AIService | null = null;
  private activeTasks: Map<string, ClineTask> = new Map();

  constructor() {
    this.initializeAI();
  }

  private initializeAI() {
    const config = getAIConfig();
    if (config) {
      try {
        this.aiService = new AIService(config.provider, config.apiKey, config.model);
        console.log('Cline AI service initialized with provider:', config.provider);
      } catch (error) {
        console.error('Failed to initialize AI service:', error);
        this.aiService = null;
      }
    } else {
      console.warn('No AI config found, Cline service not initialized');
    }
  }

  private generateTaskId(): string {
    return `cline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createSystemPrompt(taskType: ClineTask['type'], context: ClineContext): string {
    const basePrompt = `You are Cline, an AI coding assistant integrated into a VS Code-like IDE. You help developers with code analysis, debugging, refactoring, and generation.

Project Context:
- Project: ${context.projectName || 'Unknown'}
- Current File: ${context.currentFile || 'None'}
- Language: ${context.language || 'Unknown'}

Guidelines:
- Provide clear, actionable responses
- Include code examples when relevant
- Explain your reasoning
- Be concise but thorough
- Focus on best practices and clean code`;

    const taskSpecificPrompts = {
      fix_error: `
Task: Fix Code Error
- Analyze the error message and code
- Identify the root cause
- Provide a specific fix with explanation
- Include the corrected code
- Suggest preventive measures`,

      explain_code: `
Task: Explain Code
- Break down the code functionality
- Explain complex logic or patterns
- Identify potential issues or improvements
- Use clear, beginner-friendly language`,

      generate_code: `
Task: Generate Code
- Create code based on the requirements
- Follow language best practices
- Include proper error handling
- Add helpful comments
- Ensure code is production-ready`,

      refactor: `
Task: Refactor Code
- Improve code structure and readability
- Maintain existing functionality
- Apply design patterns where appropriate
- Optimize performance if possible
- Explain the improvements made`,

      optimize: `
Task: Optimize Code
- Identify performance bottlenecks
- Suggest algorithmic improvements
- Reduce complexity where possible
- Maintain code readability
- Provide before/after comparisons`,

      test: `
Task: Generate Tests
- Create comprehensive test cases
- Cover edge cases and error scenarios
- Use appropriate testing frameworks
- Include setup and teardown if needed
- Explain test strategy`,

      document: `
Task: Generate Documentation
- Create clear, comprehensive documentation
- Include usage examples
- Document parameters and return values
- Add JSDoc/docstring comments
- Follow documentation standards`
    };

    return basePrompt + '\n\n' + taskSpecificPrompts[taskType];
  }

  private createUserPrompt(task: ClineTask, context: ClineContext): string {
    let prompt = `Task: ${task.input.instruction}\n\n`;

    if (context.currentFile) {
      prompt += `Current File: ${context.currentFile}\n`;
    }

    if (task.input.code || context.fileContent) {
      prompt += `Code:\n\`\`\`${task.input.language || context.language || ''}\n${task.input.code || context.fileContent || ''}\n\`\`\`\n\n`;
    }

    if (task.input.errorMessage) {
      prompt += `Error Message:\n${task.input.errorMessage}\n\n`;
    }

    if (context.errorLogs && context.errorLogs.length > 0) {
      prompt += `Error Logs:\n${context.errorLogs.join('\n')}\n\n`;
    }

    if (context.selectedCode) {
      prompt += `Selected Code:\n\`\`\`${context.language || ''}\n${context.selectedCode}\n\`\`\`\n\n`;
    }

    return prompt;
  }

  async createTask(
    type: ClineTask['type'],
    instruction: string,
    context: ClineContext,
    options?: {
      code?: string;
      errorMessage?: string;
      language?: string;
    }
  ): Promise<ClineResponse> {
    console.log('Creating Cline task:', { type, instruction, context });
    
    if (!this.aiService) {
      this.initializeAI();
      if (!this.aiService) {
        const failedTask = {
          id: this.generateTaskId(),
          type,
          status: 'failed' as const,
          input: { instruction },
          output: {
            explanation: 'AI service not configured. Please configure an AI provider in settings.',
            confidence: 0
          },
          createdAt: new Date()
        };
        this.activeTasks.set(failedTask.id, failedTask);
        return {
          success: false,
          task: failedTask
        };
      }
    }

    const task: ClineTask = {
      id: this.generateTaskId(),
      type,
      status: 'pending',
      input: {
        instruction,
        code: options?.code,
        errorMessage: options?.errorMessage,
        language: options?.language || context.language,
        filePath: context.currentFile
      },
      createdAt: new Date()
    };

    this.activeTasks.set(task.id, task);

    try {
      task.status = 'running';
      
      const systemPrompt = this.createSystemPrompt(type, context);
      const userPrompt = this.createUserPrompt(task, context);

      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      let fullResponse = '';
      const startTime = Date.now();

      try {
        for await (const chunk of this.aiService.streamChat(messages)) {
          if (!chunk.done) {
            fullResponse += chunk.content;
          }
        }
      } catch (streamError) {
        console.error('AI streaming error:', streamError);
        // Provide a fallback response
        fullResponse = this.getFallbackResponse(type, instruction);
      }

      // Parse the response to extract structured information
      const output = this.parseResponse(fullResponse, type);
      
      task.status = 'completed';
      task.output = output;
      task.completedAt = new Date();

      this.activeTasks.set(task.id, task);

      return {
        success: true,
        task,
        streamId: task.id
      };

    } catch (error) {
      task.status = 'failed';
      task.completedAt = new Date();
      task.output = {
        explanation: `Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0
      };
      this.activeTasks.set(task.id, task);

      console.error('Cline task failed:', error);
      console.error('Task details:', { type, instruction, context });
      return {
        success: false,
        task
      };
    }
  }

  private parseResponse(response: string, taskType: ClineTask['type']): ClineTask['output'] {
    console.log('🔍 Parsing response:', { taskType, responseLength: response.length, preview: response.substring(0, 200) });
    
    const output: ClineTask['output'] = {
      explanation: '',
      suggestions: [],
      confidence: 0.8 // Default confidence
    };

    // Extract code blocks with more flexible regex
    const codeBlockRegex = /```(?:[\w]*\n)?([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      const code = match[1].trim();
      if (code) {
        codeBlocks.push(code);
        console.log('📝 Extracted code block:', code.substring(0, 100) + '...');
      }
    }

    // If we found code blocks, use them
    if (codeBlocks.length > 0) {
      output.code = codeBlocks.join('\n\n');
      
      // For code generation tasks, the explanation should be the text outside code blocks
      let explanationText = response;
      codeBlocks.forEach(code => {
        explanationText = explanationText.replace(new RegExp('```[\\w]*\\n?' + code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n?```', 'g'), '');
      });
      output.explanation = explanationText.trim() || 'Generated code as requested.';
    } else {
      // No code blocks found, check if the response looks like code anyway
      const looksLikeCode = /function\s+\w+|const\s+\w+|let\s+\w+|var\s+\w+|class\s+\w+|import\s+|export\s+|return\s+/.test(response);
      
      if (looksLikeCode && (taskType === 'generate_code' || taskType === 'fix_error')) {
        // Treat the entire response as code
        output.code = response.trim();
        output.explanation = 'Generated code as requested.';
        console.log('📝 Treating entire response as code (no code blocks found)');
      } else {
        // Regular explanation
        output.explanation = response.trim();
      }
    }

    // Extract suggestions (lines starting with "- " or numbered lists)
    const suggestionRegex = /^[-*]\s+(.+)$/gm;
    const suggestions = [];
    
    while ((match = suggestionRegex.exec(response)) !== null) {
      suggestions.push(match[1]);
    }

    if (suggestions.length > 0) {
      output.suggestions = suggestions;
    }

    // Estimate confidence based on response characteristics
    if (response.includes('I\'m not sure') || response.includes('might be') || response.includes('possibly')) {
      output.confidence = 0.6;
    } else if (response.includes('definitely') || response.includes('certainly') || codeBlocks.length > 0) {
      output.confidence = 0.9;
    }

    console.log('✅ Parsed output:', { 
      hasCode: !!output.code, 
      hasExplanation: !!output.explanation, 
      confidence: output.confidence,
      suggestionsCount: output.suggestions?.length || 0
    });

    return output;
  }

  async *streamTask(
    type: ClineTask['type'],
    instruction: string,
    context: ClineContext,
    options?: {
      code?: string;
      errorMessage?: string;
      language?: string;
    }
  ): AsyncGenerator<{ task: ClineTask; content?: string; done: boolean }> {
    console.log('Streaming Cline task:', { type, instruction, context });
    
    if (!this.aiService) {
      this.initializeAI();
      if (!this.aiService) {
        const failedTask: ClineTask = {
          id: this.generateTaskId(),
          type,
          status: 'failed',
          input: { instruction },
          output: {
            explanation: 'AI service not configured. Please configure an AI provider in settings.',
            confidence: 0
          },
          createdAt: new Date()
        };
        this.activeTasks.set(failedTask.id, failedTask);
        yield { task: failedTask, done: true };
        return;
      }
    }

    const task: ClineTask = {
      id: this.generateTaskId(),
      type,
      status: 'running',
      input: {
        instruction,
        code: options?.code,
        errorMessage: options?.errorMessage,
        language: options?.language || context.language,
        filePath: context.currentFile
      },
      createdAt: new Date()
    };

    this.activeTasks.set(task.id, task);
    yield { task, done: false };

    try {
      const systemPrompt = this.createSystemPrompt(type, context);
      const userPrompt = this.createUserPrompt(task, context);

      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      let fullResponse = '';

      try {
        for await (const chunk of this.aiService.streamChat(messages)) {
          if (!chunk.done) {
            fullResponse += chunk.content;
            yield { task, content: chunk.content, done: false };
          }
        }
      } catch (streamError) {
        console.error('AI streaming error:', streamError);
        // Provide a fallback response
        fullResponse = this.getFallbackResponse(type, instruction);
        yield { task, content: fullResponse, done: false };
      }

      // Final processing
      console.log('🔄 Processing final response:', { 
        taskType: type, 
        responseLength: fullResponse.length, 
        preview: fullResponse.substring(0, 300) + '...' 
      });
      
      const output = this.parseResponse(fullResponse, type);
      task.status = 'completed';
      task.output = output;
      task.completedAt = new Date();

      console.log('✅ Task completed:', { 
        taskId: task.id, 
        type: task.type, 
        hasOutput: !!task.output,
        hasCode: !!task.output?.code,
        hasExplanation: !!task.output?.explanation
      });

      this.activeTasks.set(task.id, task);
      yield { task, done: true };

    } catch (error) {
      task.status = 'failed';
      task.completedAt = new Date();
      task.output = {
        explanation: `Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0
      };
      this.activeTasks.set(task.id, task);

      console.error('Cline streaming task failed:', error);
      console.error('Task details:', { type, instruction, context });
      yield { task, done: true };
    }
  }

  getTask(taskId: string): ClineTask | undefined {
    return this.activeTasks.get(taskId);
  }

  getAllTasks(): ClineTask[] {
    return Array.from(this.activeTasks.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  clearTasks(): void {
    this.activeTasks.clear();
  }

  // Convenience methods for common tasks
  async fixError(errorMessage: string, code: string, context: ClineContext): Promise<ClineResponse> {
    return this.createTask('fix_error', `Fix this error: ${errorMessage}`, context, {
      code,
      errorMessage
    });
  }

  async explainCode(code: string, context: ClineContext): Promise<ClineResponse> {
    return this.createTask('explain_code', 'Explain how this code works', context, { code });
  }

  async generateCode(instruction: string, context: ClineContext): Promise<ClineResponse> {
    return this.createTask('generate_code', instruction, context);
  }

  async refactorCode(code: string, context: ClineContext): Promise<ClineResponse> {
    return this.createTask('refactor', 'Refactor this code to improve quality', context, { code });
  }

  async optimizeCode(code: string, context: ClineContext): Promise<ClineResponse> {
    return this.createTask('optimize', 'Optimize this code for better performance', context, { code });
  }

  async generateTests(code: string, context: ClineContext): Promise<ClineResponse> {
    return this.createTask('test', 'Generate comprehensive tests for this code', context, { code });
  }

  async generateDocs(code: string, context: ClineContext): Promise<ClineResponse> {
    return this.createTask('document', 'Generate documentation for this code', context, { code });
  }

  private getFallbackResponse(type: ClineTask['type'], instruction: string): string {
    const fallbacks = {
      fix_error: `I apologize, but I'm currently unable to analyze the specific error due to a service issue. Here are some general debugging steps:

1. Check the console for detailed error messages
2. Verify all imports and dependencies are correct
3. Ensure proper syntax and bracket matching
4. Check for typos in variable and function names

For the instruction: "${instruction}"

Please try again or configure a different AI provider in settings.`,

      explain_code: `I'm currently unable to analyze the code due to a service issue. Here's what I would typically help with:

1. Breaking down the code functionality
2. Explaining complex logic patterns
3. Identifying potential improvements
4. Clarifying the code's purpose

For: "${instruction}"

Please try again or configure a different AI provider in settings.`,

      generate_code: `I'm currently unable to generate code due to a service issue. For the request: "${instruction}"

Here's a basic template you can start with:

\`\`\`javascript
// TODO: Implement ${instruction}
function placeholder() {
  // Add your implementation here
  console.log('Placeholder for: ${instruction}');
}
\`\`\`

Please try again or configure a different AI provider in settings.`,

      refactor: `I'm currently unable to refactor the code due to a service issue. General refactoring principles:

1. Extract repeated code into functions
2. Use meaningful variable names
3. Break large functions into smaller ones
4. Remove unused code
5. Add proper error handling

For: "${instruction}"

Please try again or configure a different AI provider in settings.`,

      optimize: `I'm currently unable to optimize the code due to a service issue. General optimization tips:

1. Reduce unnecessary loops and iterations
2. Use efficient data structures
3. Minimize DOM manipulations
4. Cache expensive calculations
5. Use lazy loading where appropriate

For: "${instruction}"

Please try again or configure a different AI provider in settings.`,

      test: `I'm currently unable to generate tests due to a service issue. Basic test structure:

\`\`\`javascript
describe('${instruction}', () => {
  test('should work correctly', () => {
    // Arrange
    // Act
    // Assert
    expect(true).toBe(true);
  });
});
\`\`\`

Please try again or configure a different AI provider in settings.`,

      document: `I'm currently unable to generate documentation due to a service issue. Basic documentation template:

\`\`\`javascript
/**
 * ${instruction}
 * @param {type} param - Description
 * @returns {type} Description
 */
\`\`\`

Please try again or configure a different AI provider in settings.`
    };

    return fallbacks[type] || `I'm currently unable to process this request due to a service issue. Please try again or configure a different AI provider in settings.`;
  }
}

export const clineApi = new ClineApiService();