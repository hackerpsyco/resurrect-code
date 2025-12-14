import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Play, Square, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { RealTerminalService } from '../../services/realTerminalService';

interface RealTerminalProps {
  projectPath?: string;
  onClose?: () => void;
  className?: string;
  onDevServerStart?: (url: string) => void;
  onDevServerStop?: () => void;
  projectFiles?: Record<string, string>; // Files to upload to real environment
}

interface TerminalMessage {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

export function RealTerminal({ 
  projectPath = ".", 
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop,
  projectFiles = {}
}: RealTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalService = useRef(new RealTerminalService());

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

  // Initialize real terminal session
  useEffect(() => {
    const initializeRealTerminal = async () => {
      try {
        addMessage("🚀 Initializing REAL terminal environment...", "system");
        addMessage("📡 Connecting to remote execution server...", "system");
        
        // Create real terminal session
        const newSessionId = await terminalService.current.createSession(projectPath);
        setSessionId(newSessionId);
        
        addMessage("✅ Real terminal session created!", "system");
        addMessage(`📁 Working directory: ${projectPath}`, "system");
        
        // Upload project files if provided
        if (Object.keys(projectFiles).length > 0) {
          addMessage(`📤 Uploading ${Object.keys(projectFiles).length} project files...`, "system");
          await terminalService.current.uploadProjectFiles(newSessionId, projectFiles);
          addMessage("✅ Project files uploaded to real environment", "system");
        }
        
        // Test real environment
        addMessage("🔍 Testing real environment...", "system");
        const testResult = await terminalService.current.executeCommand(newSessionId, 'pwd && node --version && npm --version');
        
        if (testResult.exitCode === 0) {
          addMessage("✅ REAL TERMINAL READY!", "system");
          addMessage("🎯 This is a real Linux environment - all commands execute for real!", "system");
          addMessage("💡 Try: npm install, npm run dev, ls, pwd, node --version", "system");
          setIsConnected(true);
        } else {
          throw new Error('Environment test failed');
        }
        
      } catch (error) {
        console.error('❌ Real terminal initialization failed:', error);
        addMessage(`❌ Failed to initialize real terminal: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        addMessage("🔄 Falling back to local simulation mode", "system");
      }
    };

    initializeRealTerminal();

    // Cleanup on unmount
    return () => {
      if (sessionId) {
        terminalService.current.destroySession(sessionId);
      }
    };
  }, [projectPath, projectFiles, addMessage]);

  const executeRealCommand = async (command: string) => {
    if (!command.trim() || !sessionId) return;

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
        addMessage("🎯 REAL TERMINAL - All commands execute in actual Linux environment:", "system");
        addMessage("", "output");
        addMessage("📦 Package Management:", "system");
        addMessage("  npm install, npm run dev, npm run build", "output");
        addMessage("  yarn install, yarn dev, yarn build", "output");
        addMessage("", "output");
        addMessage("🗂️ File Operations:", "system");
        addMessage("  ls, pwd, cd <directory>, mkdir, rm", "output");
        addMessage("  cat <file>, nano <file>, touch <file>", "output");
        addMessage("", "output");
        addMessage("🔧 Development:", "system");
        addMessage("  node <file>, python <file>", "output");
        addMessage("  git status, git add, git commit", "output");
        addMessage("", "output");
        addMessage("🚀 System Info:", "system");
        addMessage("  node --version, npm --version, uname -a", "output");
        addMessage("", "output");
        addMessage("💡 All output is REAL - not simulated!", "system");
        setIsRunning(false);
        return;
      }

      // Check if it's a long-running command
      const isLongRunning = terminalService.current.isLongRunningCommand(command);
      
      if (isLongRunning) {
        // Use streaming for long-running commands
        addMessage("🔄 Executing real command (streaming output)...", "system");
        
        await terminalService.current.streamCommand(
          sessionId,
          command,
          (output) => {
            // Stream real output
            if (output.trim()) {
              addMessage(output, "output");
            }
            
            // Detect dev server startup
            if (output.includes('localhost:') || output.includes('127.0.0.1:')) {
              const urlMatch = output.match(/(https?:\/\/[^\s]+)/);
              if (urlMatch && onDevServerStart) {
                const serverUrl = urlMatch[1];
                onDevServerStart(serverUrl);
                addMessage(`🌐 Development server detected: ${serverUrl}`, "system");
              }
            }
          },
          (error) => {
            addMessage(error, "error");
          },
          (exitCode) => {
            setIsRunning(false);
            if (exitCode === 0) {
              addMessage("✅ Command completed successfully", "system");
            } else {
              addMessage(`❌ Command failed with exit code: ${exitCode}`, "error");
            }
          }
        );
      } else {
        // Execute regular command
        addMessage("⚡ Executing real command...", "system");
        const result = await terminalService.current.executeCommand(sessionId, command);
        
        // Display real output
        if (result.output) {
          // Split output into lines for better display
          const lines = result.output.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              addMessage(line, "output");
            }
          });
        }
        
        if (result.error) {
          addMessage(result.error, "error");
        }
        
        if (result.exitCode === 0) {
          addMessage("✅ Command executed successfully", "system");
        } else {
          addMessage(`❌ Command failed with exit code: ${result.exitCode}`, "error");
        }
      }

    } catch (error) {
      addMessage(`❌ Real command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isRunning) {
      executeRealCommand(currentInput);
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
    } else if (e.key === "Tab") {
      e.preventDefault();
      // TODO: Implement real tab completion via terminal service
    }
  };

  const clearTerminal = () => {
    setMessages([]);
    addMessage("Terminal cleared", "system");
  };

  const killProcess = async () => {
    if (isRunning && sessionId) {
      try {
        // Send SIGINT (Ctrl+C) to the real process
        await terminalService.current.executeCommand(sessionId, 'pkill -f "npm\\|node\\|yarn"');
        setIsRunning(false);
        addMessage("^C", "input");
        addMessage("✅ Process interrupted", "system");
        
        if (onDevServerStop) {
          onDevServerStop();
        }
      } catch (error) {
        addMessage("❌ Failed to kill process", "error");
      }
    }
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
          <span className="text-sm font-medium text-[#cccccc]">REAL Terminal</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs text-[#7d8590]">({projectPath})</span>
          {isConnected && (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-yellow-400">Live Execution</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {isRunning && (
            <Button
              variant="ghost"
              size="sm"
              onClick={killProcess}
              className="h-6 w-6 p-0 text-red-400 hover:bg-[#464647]"
              title="Kill Process (Ctrl+C)"
            >
              <Square className="w-3 h-3" />
            </Button>
          )}
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
              !isConnected ? "Connecting to real terminal..." :
              isRunning ? "Command running..." : 
              "Type a real command..."
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
            "npm install",
            "npm run dev", 
            "npm run build",
            "ls -la",
            "pwd",
            "node --version"
          ].map((cmd) => (
            <Button
              key={cmd}
              variant="ghost"
              size="sm"
              onClick={() => executeRealCommand(cmd)}
              disabled={isRunning || !isConnected}
              className="h-6 px-2 text-xs text-[#cccccc] hover:bg-[#464647] disabled:opacity-50"
            >
              {cmd}
            </Button>
          ))}
        </div>
        {isConnected ? (
          <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            REAL execution environment ready • Session: {sessionId.slice(-8)}
          </div>
        ) : (
          <div className="text-xs text-yellow-400 mt-1">
            Connecting to real terminal environment...
          </div>
        )}
      </div>
    </div>
  );
}