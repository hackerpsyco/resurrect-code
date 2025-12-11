import { toast } from "sonner";
import { AIService, getAIConfig } from "./aiService";

export interface ClineMessage {
  id: string;
  type: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  timestamp: Date;
  toolUse?: {
    tool: string;
    input: any;
    output?: any;
  };
}

export interface ClineSession {
  id: string;
  name: string;
  messages: ClineMessage[];
  createdAt: Date;
  updatedAt: Date;
  projectPath?: string;
  currentFile?: string;
}

export interface ClineTask {
  id: string;
  type: 'edit_file' | 'create_file' | 'read_file' | 'run_command' | 'analyze_code' | 'fix_error';
  status: 'pending' | 'running' | 'completed' | 'failed';
  description: string;
  input: any;
  output?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class ClineService {
  private static instance: ClineService;
  private sessions: Map<string, ClineSession> = new Map();
  private currentSession: ClineSession | null = null;
  private aiService: AIService | null = null;
  private tasks: Map<string, ClineTask> = new Map();

  static getInstance(): ClineService {
    if (!ClineService.instance) {
      ClineService.instance = new ClineService();
    }
    return ClineService.instance;
  }

  // Initialize AI service
  private initializeAI(): boolean {
    if (this.aiService) return true;

    const config = getAIConfig();
    if (!config) {
      console.error('❌ AI service not configured for Cline');
      return false;
    }

    this.aiService = new AIService(config.provider, config.apiKey, config.model);
    return true;
  }

  // Create a new Cline session
  createSession(name: string, projectPath?: string): ClineSession {
    const session: ClineSession = {
      id: this.generateId(),
      name,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      projectPath,
    };

    // Add system message
    session.messages.push({
      id: this.generateId(),
      type: 'system',
      content: `I'm Cline, an AI assistant that can help you with coding tasks. I can:

• Read and analyze your code files
• Edit and create new files
• Run terminal commands
• Fix errors and bugs
• Explain code and suggest improvements
• Refactor and optimize code

I work just like the Cline VS Code extension. What would you like me to help you with?`,
      timestamp: new Date()
    });

    this.sessions.set(session.id, session);
    this.currentSession = session;
    
    console.log('✅ Created new Cline session:', session.name);
    return session;
  }

  // Get current session or create default
  getCurrentSession(): ClineSession {
    if (!this.currentSession) {
      this.currentSession = this.createSession('Default Session');
    }
    return this.currentSession;
  }

  // Send message to Cline
  async sendMessage(content: string, context?: {
    currentFile?: string;
    fileContent?: string;
    errorLogs?: string[];
    projectName?: string;
  }): Promise<void> {
    const session = this.getCurrentSession();
    
    // Add user message
    const userMessage: ClineMessage = {
      id: this.generateId(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    
    session.messages.push(userMessage);
    session.updatedAt = new Date();

    // Update context
    if (context?.currentFile) {
      session.currentFile = context.currentFile;
    }

    console.log('💬 User message:', content);
    
    // Process with AI
    await this.processMessage(content, context);
  }

  // Process message with AI (like real Cline)
  private async processMessage(content: string, context?: {
    currentFile?: string;
    fileContent?: string;
    errorLogs?: string[];
    projectName?: string;
  }): Promise<void> {
    if (!this.initializeAI()) {
      this.addAssistantMessage('❌ AI service not configured. Please configure an AI provider first.');
      return;
    }

    const session = this.getCurrentSession();

    try {
      // Create context-aware prompt (like real Cline)
      const systemPrompt = this.createClineSystemPrompt(context);
      const conversationHistory = this.getConversationHistory(session);
      
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory,
        { role: 'user' as const, content }
      ];

      console.log('🤖 Processing with AI...');
      
      // Stream response like real Cline
      let fullResponse = '';
      let currentMessage: ClineMessage | null = null;

      for await (const chunk of this.aiService!.streamChat(messages)) {
        if (!chunk.done && chunk.content) {
          fullResponse += chunk.content;
          
          // Create or update streaming message
          if (!currentMessage) {
            currentMessage = {
              id: this.generateId(),
              type: 'assistant',
              content: chunk.content,
              timestamp: new Date()
            };
            session.messages.push(currentMessage);
          } else {
            currentMessage.content = fullResponse;
          }
          
          // Notify UI of update (you can add callback here)
          this.notifyMessageUpdate(session.id, currentMessage);
        }
      }

      // Process any tool usage or file operations
      if (fullResponse) {
        await this.processToolUsage(fullResponse, context);
      }

      session.updatedAt = new Date();
      console.log('✅ Cline response completed');

    } catch (error) {
      console.error('❌ Cline processing error:', error);
      this.addAssistantMessage(`❌ Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create system prompt like real Cline
  private createClineSystemPrompt(context?: {
    currentFile?: string;
    fileContent?: string;
    errorLogs?: string[];
    projectName?: string;
  }): string {
    let prompt = `You are Cline, an AI assistant that helps with coding tasks. You work like the Cline VS Code extension.

CAPABILITIES:
- Read and analyze code files
- Edit and create files
- Run terminal commands
- Fix errors and bugs
- Explain code and provide suggestions
- Refactor and optimize code

CURRENT CONTEXT:`;

    if (context?.projectName) {
      prompt += `\nProject: ${context.projectName}`;
    }

    if (context?.currentFile) {
      prompt += `\nCurrent file: ${context.currentFile}`;
    }

    if (context?.fileContent) {
      prompt += `\nFile content:\n\`\`\`\n${context.fileContent}\n\`\`\``;
    }

    if (context?.errorLogs && context.errorLogs.length > 0) {
      prompt += `\nError logs:\n${context.errorLogs.map(log => `- ${log}`).join('\n')}`;
    }

    prompt += `\n\nINSTRUCTIONS:
- Be helpful and provide practical solutions
- When suggesting code changes, provide complete, working code
- Explain your reasoning and approach
- If you need to see more files or run commands, let me know
- Format code properly with syntax highlighting
- Be concise but thorough in explanations`;

    return prompt;
  }

  // Get conversation history for context
  private getConversationHistory(session: ClineSession): Array<{role: 'user' | 'assistant', content: string}> {
    return session.messages
      .filter(m => m.type === 'user' || m.type === 'assistant')
      .slice(-10) // Keep last 10 messages for context
      .map(m => ({
        role: m.type as 'user' | 'assistant',
        content: m.content
      }));
  }

  // Process tool usage (file operations, commands, etc.)
  private async processToolUsage(response: string, context?: any): Promise<void> {
    // Look for file operations in the response
    const fileEditPattern = /```(?:typescript|javascript|tsx|jsx|css|html|json)\n([\s\S]*?)\n```/g;
    const matches = Array.from(response.matchAll(fileEditPattern));

    if (matches.length > 0) {
      console.log(`🔧 Found ${matches.length} code blocks that could be applied`);
      
      // Create tasks for file operations
      matches.forEach((match, index) => {
        const code = match[1];
        const task: ClineTask = {
          id: this.generateId(),
          type: 'edit_file',
          status: 'pending',
          description: `Apply code changes ${index + 1}`,
          input: {
            file: context?.currentFile || 'unknown',
            code: code
          },
          createdAt: new Date()
        };
        
        this.tasks.set(task.id, task);
      });
    }

    // Look for command suggestions
    const commandPattern = /```(?:bash|shell|cmd)\n([\s\S]*?)\n```/g;
    const commandMatches = Array.from(response.matchAll(commandPattern));

    if (commandMatches.length > 0) {
      console.log(`⚡ Found ${commandMatches.length} command suggestions`);
      
      commandMatches.forEach((match, index) => {
        const command = match[1];
        const task: ClineTask = {
          id: this.generateId(),
          type: 'run_command',
          status: 'pending',
          description: `Run command: ${command}`,
          input: { command },
          createdAt: new Date()
        };
        
        this.tasks.set(task.id, task);
      });
    }
  }

  // Add assistant message
  private addAssistantMessage(content: string): void {
    const session = this.getCurrentSession();
    const message: ClineMessage = {
      id: this.generateId(),
      type: 'assistant',
      content,
      timestamp: new Date()
    };
    
    session.messages.push(message);
    session.updatedAt = new Date();
  }

  // Get all messages from current session
  getMessages(): ClineMessage[] {
    return this.getCurrentSession().messages;
  }

  // Get pending tasks
  getPendingTasks(): ClineTask[] {
    return Array.from(this.tasks.values()).filter(task => task.status === 'pending');
  }

  // Execute a task
  async executeTask(taskId: string, onApplyFix?: (path: string, content: string) => void): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.status = 'running';
    console.log('🚀 Executing task:', task.description);

    try {
      switch (task.type) {
        case 'edit_file':
          if (onApplyFix && task.input.file && task.input.code) {
            onApplyFix(task.input.file, task.input.code);
            task.output = { applied: true };
            toast.success(`Applied changes to ${task.input.file}`);
          }
          break;
          
        case 'run_command':
          // In a real implementation, this would execute the command
          console.log('Would run command:', task.input.command);
          task.output = { command: task.input.command, note: 'Command logged (not executed in browser)' };
          toast.info(`Command suggested: ${task.input.command}`);
          break;
          
        default:
          console.log('Task type not implemented:', task.type);
      }

      task.status = 'completed';
      task.completedAt = new Date();
      return true;

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();
      console.error('❌ Task execution failed:', error);
      return false;
    }
  }

  // Clear current session
  clearSession(): void {
    if (this.currentSession) {
      this.currentSession.messages = [];
      this.currentSession.updatedAt = new Date();
    }
    this.tasks.clear();
    console.log('🧹 Cleared Cline session');
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private notifyMessageUpdate(sessionId: string, message: ClineMessage): void {
    // This would notify the UI of message updates for real-time streaming
    // You can implement callbacks here for UI updates
  }
}

export const clineService = ClineService.getInstance();