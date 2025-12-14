import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Play, Square, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface SimpleRealTerminalProps {
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

export function SimpleRealTerminal({ 
  projectPath = ".", 
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop,
  projectFiles = {}
}: SimpleRealTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
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

  // Initialize simple real terminal
  useEffect(() => {
    const initializeSimpleRealTerminal = async () => {
      try {
        addMessage("🚀 Initializing Simple Real Terminal...", "system");
        addMessage("📡 Using direct Supabase function calls...", "system");
        
        // Test basic connection with GET request first
        const testResponse = await fetch('https://eahpikunzsaacibikwtj.supabase.co/functions/v1/terminal-executor', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (testResponse.ok) {
          const result = await testResponse.json();
          addMessage("✅ Simple Real Terminal Ready!", "system");
          addMessage(`📁 Working directory: ${projectPath}`, "system");
          addMessage("🎯 This executes REAL commands on the server!", "system");
          addMessage("💡 Try: ls, pwd, node --version, npm --version", "system");
          setIsConnected(true);
        } else {
          throw new Error(`Connection failed: ${testResponse.status}`);
        }
        
      } catch (error) {
        console.error('❌ Simple real terminal initialization failed:', error);
        addMessage(`❌ Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        addMessage("🔄 Check your network connection and try again", "system");
      }
    };

    initializeSimpleRealTerminal();
  }, [projectPath, addMessage]);

  const executeSimpleRealCommand = async (command: string) => {
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
        addMessage("🎯 Simple Real Terminal - Direct command execution:", "system");
        addMessage("", "output");
        addMessage("📦 Package Management:", "system");
        addMessage("  npm install, npm run dev, npm run build", "output");
        addMessage("", "output");
        addMessage("🗂️ File Operations:", "system");
        addMessage("  ls, pwd, echo, cat", "output");
        addMessage("", "output");
        addMessage("🔧 System Info:", "system");
        addMessage("  node --version, npm --version", "output");
        addMessage("", "output");
        addMessage("💡 All commands execute on real server!", "system");
        setIsRunning(false);
        return;
      }

      // Execute real command via Supabase function
      addMessage("⚡ Executing REAL command on server...", "system");
      
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Command failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Display real output
      if (result.success) {
        if (result.output) {
          // Split output into lines for better display
          const lines = result.output.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              addMessage(line, "output");
            }
          });
        }
        
        // Check for dev server startup
        if (result.devServerUrl && onDevServerStart) {
          onDevServerStart(result.devServerUrl);
          addMessage(`🌐 Development server detected: ${result.devServerUrl}`, "system");
        }
        
        addMessage("✅ Command executed successfully", "system");
      } else {
        if (result.output) {
          addMessage(result.output, "error");
        }
        if (result.error) {
          addMessage(result.error, "error");
        }
        addMessage("❌ Command failed", "error");
      }

    } catch (error) {
      addMessage(`❌ Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isRunning) {
      executeSimpleRealCommand(currentInput);
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
          <span className="text-sm font-medium text-[#cccccc]">Simple Real Terminal</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs text-[#7d8590]">({projectPath})</span>
          {isConnected && (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-yellow-400">Direct Execution</span>
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
            "ls -la",
            "pwd", 
            "node --version",
            "npm --version",
            "echo 'Hello Real World!'",
            "help"
          ].map((cmd) => (
            <Button
              key={cmd}
              variant="ghost"
              size="sm"
              onClick={() => executeSimpleRealCommand(cmd)}
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
            Simple real execution ready • Direct Supabase function calls
          </div>
        ) : (
          <div className="text-xs text-yellow-400 mt-1">
            Connecting to real terminal...
          </div>
        )}
      </div>
    </div>
  );
}