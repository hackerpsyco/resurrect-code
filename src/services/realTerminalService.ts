interface TerminalSession {
  id: string;
  projectPath: string;
  isActive: boolean;
}

interface CommandResult {
  output: string;
  error?: string;
  exitCode: number;
  isRunning: boolean;
}

export class RealTerminalService {
  private sessions = new Map<string, TerminalSession>();
  private ws: WebSocket | null = null;
  private baseUrl: string;

  constructor() {
    // Use your existing Supabase edge function
    this.baseUrl = 'https://eahpikunzsaacibikwtj.supabase.co/functions/v1';
  }

  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    };
  }

  // Create a real terminal session
  async createSession(projectPath: string): Promise<string> {
    const sessionId = `terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log('🔄 Creating real terminal session...', sessionId);
      
      const response = await fetch(`${this.baseUrl}/terminal-executor`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          action: 'create_session',
          sessionId,
          projectPath,
          // Initialize with project files if needed
          initCommands: [
            'pwd',
            'ls -la',
            'node --version',
            'npm --version'
          ]
        })
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to create terminal session: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Session created:', result);
      
      this.sessions.set(sessionId, {
        id: sessionId,
        projectPath,
        isActive: true
      });

      console.log('✅ Real terminal session created:', sessionId);
      return sessionId;
      
    } catch (error) {
      console.error('❌ Failed to create real terminal session:', error);
      throw error;
    }
  }

  // Execute real command
  async executeCommand(sessionId: string, command: string): Promise<CommandResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Terminal session not found');
    }

    try {
      console.log(`🔄 Executing real command: ${command}`);
      
      const response = await fetch(`${this.baseUrl}/terminal-executor`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          action: 'execute_command',
          sessionId,
          command,
          cwd: session.projectPath
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Command execution error:', errorText);
        throw new Error(`Command execution failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log('✅ Real command executed:', {
        command,
        exitCode: result.exitCode,
        outputLength: result.output?.length || 0,
        realExecution: result.realExecution
      });

      return {
        output: result.output || '',
        error: result.error,
        exitCode: result.exitCode || 0,
        isRunning: result.isRunning || false
      };
      
    } catch (error) {
      console.error('❌ Real command execution failed:', error);
      return {
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        isRunning: false
      };
    }
  }

  // Upload project files to real environment
  async uploadProjectFiles(sessionId: string, files: Record<string, string>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Terminal session not found');
    }

    try {
      console.log(`📁 Uploading ${Object.keys(files).length} files to real environment...`);
      
      const response = await fetch(`${this.baseUrl}/terminal-executor`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          action: 'upload_files',
          sessionId,
          files,
          projectPath: session.projectPath
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`File upload failed: ${response.status} - ${errorText}`);
      }

      console.log('✅ Project files uploaded to real environment');
      
    } catch (error) {
      console.error('❌ Failed to upload project files:', error);
      throw error;
    }
  }

  // Cleanup session
  async destroySession(sessionId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/terminal-executor`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          action: 'destroy_session',
          sessionId
        })
      });

      this.sessions.delete(sessionId);
      console.log('🗑️ Real terminal session destroyed:', sessionId);
      
    } catch (error) {
      console.error('❌ Failed to destroy terminal session:', error);
    }
  }

  // Check if command is long-running (npm install, npm run dev, etc.)
  isLongRunningCommand(command: string): boolean {
    const longRunningCommands = [
      'npm install',
      'npm run dev',
      'npm run start',
      'npm run build',
      'yarn install',
      'yarn dev',
      'yarn start',
      'yarn build',
      'node server',
      'python manage.py runserver',
      'rails server'
    ];

    return longRunningCommands.some(cmd => 
      command.trim().toLowerCase().startsWith(cmd.toLowerCase())
    );
  }

  // Test connection to backend
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing connection to terminal backend...');
      
      const response = await fetch(`${this.baseUrl}/terminal-executor`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          command: 'echo "Connection test"',
          projectPath: 'test'
        })
      });

      console.log('📡 Test response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Connection test successful:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Connection test failed:', response.status, errorText);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Connection test error:', error);
      return false;
    }
  }
}