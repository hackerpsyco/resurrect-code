import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Zap, Server, CheckCircle } from 'lucide-react';

interface PublicRealTerminalProps {
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

export function PublicRealTerminal({ 
  projectPath = ".", 
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop,
  projectFiles = {}
}: PublicRealTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Supabase function URL
  const FUNCTION_URL = 'https://eahpikunzsaacibikwtj.supabase.co/functions/v1/terminal-executor';

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

  // Initialize public real terminal
  useEffect(() => {
    const initializePublicRealTerminal = async () => {
      try {
        addMessage("🚀 Initializing PUBLIC Real Terminal...", "system");
        addMessage("🔍 Testing Supabase function connection...", "system");
        
        // Test function with GET request (no auth needed)
        const healthResponse = await fetch(FUNCTION_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('Health check response:', healthResponse.status, healthResponse.statusText);

        if (healthResponse.ok) {
          const healthResult = await healthResponse.json();
          addMessage(`✅ Connected: ${healthResult.message}`, "system");
          
          // Test a real command to verify execution
          addMessage("⚡ Testing REAL command execution...", "system");
          
          const testResponse = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              command: 'echo "REAL TERMINAL TEST SUCCESS"',
              projectPath: projectPath,
              owner: projectPath.split('/')[0] || 'user',
              repo: projectPath.split('/')[1] || 'project'
            })
          });

          console.log('Test command response:', testResponse.status, testResponse.statusText);

          if (testResponse.ok) {
            const testResult = await testResponse.json();
            console.log('Test result:', testResult);
            
            if (testResult.success) {
              addMessage("✅ REAL TERMINAL IS WORKING!", "system");
              addMessage(`Real output: ${testResult.output}`, "output");
              addMessage("🔥 ALL COMMANDS NOW EXECUTE ON REAL LINUX SERVER!", "system");
              setIsConnected(true);
            } else {
              addMessage(`⚠️ Test command failed: ${testResult.output || testResult.error}`, "error");
              setIsConnected(true); // Still allow usage
            }
          } else {
            const errorText = await testResponse.text();
            addMessage(`⚠️ Test failed (${testResponse.status}): ${errorText}`, "error");
            setIsConnected(true); // Still allow usage
          }
        } else {
          const errorText = await healthResponse.text();
          throw new Error(`Health check failed (${healthResponse.status}): ${errorText}`);
        }
        
        addMessage("💡 Try: pwd, whoami, ls -la, echo 'Hello Real World!'", "system");
        
      } catch (error) {
        console.error('❌ Real terminal initialization failed:', error);
        addMessage(`❌ Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        addMessage("🔧 Check Supabase function deployment", "error");
        
        // Still allow terminal usage for debugging
        setIsConnected(true);
        addMessage("⚠️ Terminal available for debugging", "system");
      }
    };

    initializePublicRealTerminal();
  }, [projectPath, addMessage]);

  const executeRealCommand = async (command: string) => {
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
        addMessage("🎯 PUBLIC Real Terminal - TRUE Linux execution:", "system");
        addMessage("", "output");
        addMessage("📦 Package Management:", "system");
        addMessage("  npm install, npm run dev, npm run build", "output");
        addMessage("", "output");
        addMessage("🗂️ File Operations:", "system");
        addMessage("  ls -la, pwd, cat file.txt, mkdir dir", "output");
        addMessage("", "output");
        addMessage("🔧 System Commands:", "system");
        addMessage("  whoami, uname -a, ps aux, df -h", "output");
        addMessage("", "output");
        addMessage("⚡ ALL COMMANDS RUN ON REAL LINUX SERVER!", "system");
        setIsRunning(false);
        return;
      }

      if (command.trim() === "test") {
        addMessage("🧪 Running connection test...", "system");
        
        const testResponse = await fetch(FUNCTION_URL, {
          method: 'GET'
        });
        
        if (testResponse.ok) {
          const result = await testResponse.json();
          addMessage(`✅ Connection test passed: ${result.message}`, "system");
        } else {
          addMessage(`❌ Connection test failed: ${testResponse.status}`, "error");
        }
        
        setIsRunning(false);
        return;
      }

      // Execute REAL command via Supabase function
      addMessage("⚡ Executing on REAL Linux server...", "system");
      
      const requestBody = {
        command: command,
        projectPath: projectPath,
        owner: projectPath.split('/')[0] || 'user',
        repo: projectPath.split('/')[1] || 'project'
      };
      
      console.log('Sending request:', requestBody);
      
      const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Command response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Command failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Command result:', result);
      
      // Display REAL output
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
        
        if (result.realExecution) {
          addMessage("🔥 REAL command executed on Linux server!", "system");
        } else {
          addMessage("✅ Command executed successfully", "system");
        }
        
        // Check for dev server startup
        if (result.devServerUrl && onDevServerStart) {
          onDevServerStart(result.devServerUrl);
          addMessage(`🌐 Development server detected: ${result.devServerUrl}`, "system");
        }
        
      } else {
        if (result.output) {
          addMessage(result.output, "error");
        }
        if (result.error) {
          addMessage(result.error, "error");
        }
        addMessage("❌ Command failed on real server", "error");
      }

    } catch (error) {
      console.error('Command execution error:', error);
      addMessage(`❌ Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
      addMessage("🔧 Check browser console for details", "system");
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
          <span className="text-sm font-medium text-[#cccccc]">PUBLIC Real Terminal</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs text-[#7d8590]">({projectPath})</span>
          {isConnected && (
            <div className="flex items-center gap-1">
              <Server className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">Linux Server</span>
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
            disabled={isRunning}
            className="flex-1 bg-transparent border-none p-0 text-[#cccccc] focus:ring-0 focus:outline-none"
            placeholder={
              isRunning ? "Command running on Linux server..." : 
              "Type REAL Linux command..."
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
            "test",
            "pwd",
            "whoami", 
            "ls -la",
            "uname -a",
            "echo 'REAL!'",
            "help"
          ].map((cmd) => (
            <Button
              key={cmd}
              variant="ghost"
              size="sm"
              onClick={() => executeRealCommand(cmd)}
              disabled={isRunning}
              className="h-6 px-2 text-xs text-[#cccccc] hover:bg-[#464647] disabled:opacity-50"
            >
              {cmd}
            </Button>
          ))}
        </div>
        {isConnected ? (
          <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            PUBLIC real execution active • No authentication required
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