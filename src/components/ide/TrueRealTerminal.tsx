import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Zap, Server, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TrueRealTerminalProps {
  projectPath?: string;
  onClose?: () => void;
  className?: string;
  onDevServerStart?: (url: string) => void;
  onDevServerStop?: () => void;
  projectFiles?: Record<string, string>;
}

interface TerminalMessage {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

export function TrueRealTerminal({ 
  projectPath = ".", 
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop,
  projectFiles = {}
}: TrueRealTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [sessionId, setSessionId] = useState<string>("");
  const [workingDir, setWorkingDir] = useState<string>("");
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when terminal is opened
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const addMessage = useCallback((content: string, type: TerminalMessage["type"] = "output") => {
    const newMessage: TerminalMessage = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Initialize TRUE real terminal with session
  useEffect(() => {
    const initializeTrueRealTerminal = async () => {
      try {
        addMessage("🚀 Initializing TRUE Real Terminal...", "system");
        addMessage("🔍 Testing connection to real server...", "system");
        
        // Test health check first
        const healthResponse = await fetch('https://eahpikunzsaacibikwtj.supabase.co/functions/v1/terminal-executor', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!healthResponse.ok) {
          throw new Error(`Health check failed: ${healthResponse.status}`);
        }

        const healthResult = await healthResponse.json();
        addMessage(`✅ Server connection successful: ${healthResult.message}`, "system");
        addMessage("🔧 Creating real Linux session on server...", "system");
        
        // Generate unique session ID
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create real terminal session
        const sessionResponse = await fetch('https://eahpikunzsaacibikwtj.supabase.co/functions/v1/terminal-executor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create_session',
            sessionId: newSessionId,
            projectPath: projectPath
          })
        });

        if (!sessionResponse.ok) {
          throw new Error(`Session creation failed: ${sessionResponse.status}`);
        }

        const sessionResult = await sessionResponse.json();
        
        if (sessionResult.success) {
          setSessionId(newSessionId);
          setWorkingDir(sessionResult.workingDir);
          setIsConnected(true);
          
          addMessage("✅ TRUE Real Terminal Session Created!", "system");
          addMessage(`📁 Real working directory: ${sessionResult.workingDir}`, "system");
          addMessage(`🆔 Session ID: ${newSessionId}`, "system");
          addMessage("⚡ All commands execute on REAL Linux server!", "system");
          addMessage("💡 Try: ls -la, pwd, echo 'Hello Real World!', node --version", "system");
          
          // Upload project files if provided
          if (Object.keys(projectFiles).length > 0) {
            await uploadProjectFiles(newSessionId, projectFiles);
          }
          
        } else {
          throw new Error(sessionResult.error || 'Failed to create session');
        }
        
      } catch (error) {
        console.error('❌ TRUE real terminal initialization failed:', error);
        addMessage(`❌ Failed to create real session: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        addMessage("🔄 Falling back to simple mode...", "system");
        
        // Fallback to simple mode
        setIsConnected(true);
        addMessage("⚠️ Running in fallback mode - limited real execution", "system");
      }
    };

    initializeTrueRealTerminal();

    // Cleanup session on unmount
    return () => {
      if (sessionId) {
        destroySession(sessionId);
      }
    };
  }, [projectPath, addMessage]);

  const uploadProjectFiles = async (sessionId: string, files: Record<string, string>) => {
    try {
      addMessage(`📁 Uploading ${Object.keys(files).length} project files...`, "system");
      
      const uploadResponse = await fetch('https://eahpikunzsaacibikwtj.supabase.co/functions/v1/terminal-executor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'upload_files',
          sessionId: sessionId,
          files: files,
          projectPath: projectPath
        })
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        if (result.success) {
          addMessage("✅ Project files uploaded to real file system!", "system");
        }
      }
    } catch (error) {
      addMessage(`⚠️ File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };

  const destroySession = async (sessionId: string) => {
    try {
      await fetch('https://eahpikunzsaacibikwtj.supabase.co/functions/v1/terminal-executor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'destroy_session',
          sessionId: sessionId
        })
      });
    } catch (error) {
      console.warn('Failed to destroy session:', error);
    }
  };

  const executeTrueRealCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev.filter(cmd => cmd !== command), command]);
    setHistoryIndex(-1);

    // Add command to terminal
    addMessage(`$ ${command}`, "input");
    setCurrentInput("");
    setIsRunning(true);

    try {
      // Handle built-in commands
      if (command.trim() === "clear") {
        setMessages([]);
        setIsRunning(false);
        return;
      }

      if (command.trim() === "help") {
        addMessage("🎯 TRUE Real Terminal - Actual Linux command execution:", "system");
        addMessage("", "output");
        addMessage("📦 Package Management:", "system");
        addMessage("  npm install, npm run dev, npm run build, yarn install", "output");
        addMessage("", "output");
        addMessage("🗂️ File Operations:", "system");
        addMessage("  ls -la, pwd, cat file.txt, mkdir dir, touch file", "output");
        addMessage("", "output");
        addMessage("🔧 System Commands:", "system");
        addMessage("  node --version, npm --version, which node, ps aux", "output");
        addMessage("", "output");
        addMessage("⚡ ALL COMMANDS RUN ON REAL LINUX SERVER!", "system");
        setIsRunning(false);
        return;
      }

      // Execute TRUE real command
      if (sessionId) {
        addMessage("⚡ Executing on REAL Linux server...", "system");
        
        const response = await fetch('https://eahpikunzsaacibikwtj.supabase.co/functions/v1/terminal-executor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'execute_command',
            sessionId: sessionId,
            command: command,
            cwd: workingDir
          })
        });

        if (!response.ok) {
          throw new Error(`Command execution failed: ${response.status}`);
        }

        const result = await response.json();
        
        // Display REAL output from Linux server
        if (result.success) {
          if (result.output) {
            // Split output into lines for better display
            const lines = result.output.split('\n');
            lines.forEach(line => {
              addMessage(line, "output");
            });
          }
          
          if (result.realExecution) {
            addMessage("✅ Command executed on REAL Linux server", "system");
          }
          
          // Check for dev server startup
          if (result.output && result.output.includes('localhost:') && onDevServerStart) {
            const urlMatch = result.output.match(/localhost:(\d+)/);
            if (urlMatch) {
              const devUrl = `http://localhost:${urlMatch[1]}`;
              onDevServerStart(devUrl);
              addMessage(`🌐 Development server detected: ${devUrl}`, "system");
            }
          }
          
        } else {
          if (result.output) {
            addMessage(result.output, "error");
          }
          if (result.error) {
            addMessage(result.error, "error");
          }
          addMessage(`❌ Command failed (exit code: ${result.exitCode || 'unknown'})`, "error");
        }
      } else {
        // Fallback to simple execution
        addMessage("⚠️ No session - using fallback execution", "system");
        
        const response = await fetch('https://eahpikunzsaacibikwtj.supabase.co/functions/v1/terminal-executor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            command: command,
            projectPath: projectPath,
            owner: projectPath.split('/')[0] || 'user',
            repo: projectPath.split('/')[1] || 'project'
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.output) {
            const lines = result.output.split('\n');
            lines.forEach(line => {
              if (line.trim()) {
                addMessage(line, "output");
              }
            });
          }
        } else {
          throw new Error(`Fallback execution failed: ${response.status}`);
        }
      }

    } catch (error) {
      addMessage(`❌ Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isRunning) {
      executeTrueRealCommand(currentInput);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput("");
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const clearTerminal = () => {
    setMessages([]);
    addMessage("Terminal cleared", "system");
  };

  const getMessageColor = (type: TerminalMessage["type"]) => {
    switch (type) {
      case "input": return "text-[#4ec9b0]";     // Cyan for user input
      case "error": return "text-[#f44747]";     // Red for errors
      case "system": return "text-[#569cd6]";    // Blue for system messages
      case "output": 
      default: return "text-[#cccccc]";          // White for normal output
    }
  };

  return (
    <div className={`bg-[#1e1e1e] border border-[#464647] rounded-lg flex flex-col ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#464647] bg-[#2d2d30]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#cccccc]" />
          <span className="text-sm font-medium text-[#cccccc]">TRUE Real Terminal</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs text-[#7d8590]">({projectPath})</span>
          {sessionId && (
            <div className="flex items-center gap-1">
              <Server className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">Real Linux Session</span>
            </div>
          )}
          {isConnected && (
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-400">Live Execution</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminal}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
            title="Clear Terminal"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
              title="Close Terminal"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 p-3 font-mono text-sm overflow-y-auto bg-[#0d1117]"
        style={{ minHeight: '200px' }}
      >
        {messages.map((message) => (
          <div key={message.id} className={`mb-1 ${getMessageColor(message.type)} whitespace-pre-wrap`}>
            {message.content}
          </div>
        ))}
        
        {/* Current Input Line */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[#4ec9b0]">$</span>
          <Input
            ref={inputRef}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isRunning || !isConnected}
            className="flex-1 bg-transparent border-none p-0 text-[#cccccc] focus:ring-0 focus:outline-none"
            placeholder={
              !isConnected ? "Connecting..." :
              isRunning ? "Command running on real server..." : 
              "Type a REAL Linux command..."
            }
          />
          {isRunning && (
            <div className="text-[#569cd6] animate-pulse">●</div>
          )}
        </div>
      </div>

      {/* Quick Commands */}
      <div className="p-2 border-t border-[#464647] bg-[#252526]">
        <div className="flex gap-1 flex-wrap">
          {[
            "ls -la",
            "pwd", 
            "whoami",
            "uname -a",
            "node --version",
            "npm --version",
            "echo 'Real Linux!'",
            "help"
          ].map((cmd) => (
            <Button
              key={cmd}
              variant="ghost"
              size="sm"
              onClick={() => executeTrueRealCommand(cmd)}
              disabled={isRunning || !isConnected}
              className="h-6 px-2 text-xs text-[#cccccc] hover:bg-[#464647] disabled:opacity-50"
            >
              {cmd}
            </Button>
          ))}
        </div>
        {sessionId ? (
          <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
            <Server className="w-3 h-3" />
            TRUE real Linux execution • Session: {sessionId.slice(-8)}
          </div>
        ) : isConnected ? (
          <div className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Fallback mode • Limited real execution
          </div>
        ) : (
          <div className="text-xs text-red-400 mt-1">
            Connecting to real Linux server...
          </div>
        )}
      </div>
    </div>
  );
}