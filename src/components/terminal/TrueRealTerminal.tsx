import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Play, Square, FolderOpen, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { realTerminalService, TerminalExecutionResult } from "@/services/realTerminalService";

interface TrueRealTerminalProps {
  owner?: string;
  repo?: string;
  branch?: string;
  onClose?: () => void;
  className?: string;
  onDevServerStart?: (url: string) => void;
  onDevServerStop?: () => void;
}

interface TerminalMessage {
  id: string;
  type: "input" | "output" | "error" | "system" | "success";
  content: string;
  timestamp: Date;
}

export function TrueRealTerminal({ 
  owner,
  repo,
  branch = "main",
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop 
}: TrueRealTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [projectReady, setProjectReady] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState("~");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [devServerRunning, setDevServerRunning] = useState(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const projectKey = owner && repo ? `${owner}/${repo}` : null;

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

  // Initialize terminal connection
  useEffect(() => {
    const initializeTerminal = async () => {
      if (!projectKey) {
        addMessage("⚠️ No GitHub project connected", "system");
        addMessage("💡 Connect a GitHub repository to use real terminal", "system");
        addMessage("🔧 This terminal will execute real commands on your project", "system");
        setIsConnected(true);
        return;
      }

      try {
        addMessage("🚀 Connecting to real terminal backend...", "system");
        addMessage(`📂 Project: ${projectKey} (${branch})`, "system");
        
        // Test connection by getting project info
        const result = await realTerminalService.getProjectInfo(owner!, repo!, branch);
        
        if (result.success) {
          setIsConnected(true);
          setProjectReady(true);
          setCurrentDirectory(result.projectPath || `/tmp/projects/${owner}-${repo}`);
          
          addMessage("✅ Connected to real terminal backend!", "success");
          addMessage(`📁 Project workspace: ${result.projectPath}`, "system");
          addMessage("🔧 Ready to execute real commands!", "system");
          addMessage("💡 Try: npm install, npm run dev, ls, git status", "system");
          addMessage("", "output");
          
        } else {
          throw new Error(result.error || 'Failed to connect');
        }
        
      } catch (error) {
        addMessage(`❌ Failed to connect to terminal backend`, "error");
        addMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        addMessage("🔄 You can still try commands - they may work", "system");
        setIsConnected(true); // Allow trying anyway
      }
    };

    initializeTerminal();
  }, [projectKey, owner, repo, branch, addMessage]);

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
      // Handle built-in commands first
      if (command.trim() === "clear") {
        setMessages([]);
        setIsRunning(false);
        return;
      }

      if (command.trim() === "help") {
        addMessage("🔧 True Real Terminal - Executes actual commands!", "system");
        addMessage("", "output");
        addMessage("📦 Project Commands (REAL):", "system");
        addMessage("  npm install - Actually install dependencies", "output");
        addMessage("  npm run dev - Actually start development server", "output");
        addMessage("  npm run build - Actually build your project", "output");
        addMessage("  npm start - Start production server", "output");
        addMessage("", "output");
        addMessage("📁 File Commands (REAL):", "system");
        addMessage("  ls - List actual project files", "output");
        addMessage("  pwd - Show actual project directory", "output");
        addMessage("", "output");
        addMessage("🔧 Git Commands (REAL):", "system");
        addMessage("  git status - Actual git status", "output");
        addMessage("  git log --oneline -5 - Recent commits", "output");
        addMessage("", "output");
        addMessage("🛠️ Built-in Commands:", "system");
        addMessage("  clear - Clear terminal", "output");
        addMessage("  exit - Close terminal", "output");
        addMessage("  test-connection - Test backend connection", "output");
        setIsRunning(false);
        return;
      }

      if (command.trim() === "exit") {
        onClose?.();
        return;
      }

      if (command.trim() === "test-connection") {
        addMessage("🔍 Testing connection to terminal backend...", "system");
        try {
          const result = await realTerminalService.getProjectInfo(owner || 'test', repo || 'test', branch);
          if (result.success) {
            addMessage("✅ Connection successful!", "success");
            addMessage(`Backend response: ${result.output}`, "output");
          } else {
            addMessage("❌ Connection failed!", "error");
            addMessage(`Error: ${result.error}`, "error");
          }
        } catch (error) {
          addMessage("❌ Connection test failed!", "error");
          addMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        }
        setIsRunning(false);
        return;
      }

      // Execute real command using backend service
      if (projectKey) {
        addMessage("🔄 Executing real command via backend...", "system");
        
        const result: TerminalExecutionResult = await realTerminalService.executeCommand({
          command,
          owner: owner!,
          repo: repo!,
          branch
        });

        if (result.success) {
          // Add the output
          addMessage(result.output, "output");
          
          // Check if this started a dev server
          if (result.devServerUrl) {
            setDevServerRunning(true);
            addMessage("", "output");
            addMessage(`🎉 Development server started at: ${result.devServerUrl}`, "success");
            addMessage("🌐 Opening live preview automatically...", "system");
            
            // Trigger preview to open
            onDevServerStart?.(result.devServerUrl);
            
            // Show success toast
            toast.success(`🚀 Real dev server started! Preview opened at ${result.devServerUrl}`);
          }
          
          // Update project path if provided
          if (result.projectPath) {
            setCurrentDirectory(result.projectPath);
          }
          
        } else {
          addMessage(result.output, "error");
          if (result.error) {
            addMessage(`Error details: ${result.error}`, "error");
          }
        }
      } else {
        addMessage("⚠️ No project connected. Connect a GitHub repository first.", "error");
      }

    } catch (error) {
      addMessage(`❌ Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
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

  const killProcess = () => {
    if (isRunning) {
      setIsRunning(false);
      addMessage("^C", "input");
      addMessage("Process interrupted", "system");
      
      if (devServerRunning) {
        setDevServerRunning(false);
        onDevServerStop?.();
        addMessage("🛑 Development server stopped", "system");
      }
    }
  };

  const getMessageColor = (type: TerminalMessage["type"]) => {
    switch (type) {
      case "input": return "text-[#4ec9b0]";     // Cyan for user input
      case "error": return "text-[#f44747]";     // Red for errors
      case "system": return "text-[#569cd6]";    // Blue for system messages
      case "success": return "text-[#4caf50]";   // Green for success
      case "output": 
      default: return "text-[#cccccc]";          // White for normal output
    }
  };

  const getStatusColor = () => {
    if (!isConnected) return "bg-red-400";
    if (devServerRunning) return "bg-green-400 animate-pulse";
    if (projectReady) return "bg-green-400";
    return "bg-yellow-400";
  };

  const getStatusText = () => {
    if (!isConnected) return "Disconnected";
    if (devServerRunning) return "Dev Server Running";
    if (projectReady) return "Ready";
    return "Connecting...";
  };

  return (
    <div className={`bg-[#1e1e1e] border border-[#464647] rounded-lg flex flex-col ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#464647] bg-[#2d2d30]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#cccccc]" />
          <span className="text-sm font-medium text-[#cccccc]">True Real Terminal</span>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span className="text-xs text-[#7d8590]">({getStatusText()})</span>
          {isConnected ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
          {projectKey && (
            <>
              <FolderOpen className="w-3 h-3 text-[#7d8590] ml-2" />
              <span className="text-xs text-[#7d8590]">{projectKey}</span>
            </>
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
            disabled={isRunning}
            className="flex-1 bg-transparent border-none p-0 text-[#cccccc] focus:ring-0 focus:outline-none"
            placeholder={isRunning ? "Executing real command..." : isConnected ? "Type a real command..." : "Connecting..."}
          />
          {isRunning && (
            <div className="text-[#569cd6] animate-pulse">●</div>
          )}
        </div>
      </div>

      {/* Quick Commands */}
      <div className="p-2 border-t border-[#464647] bg-[#252526]">
        <div className="flex gap-1 flex-wrap">
          {(isConnected ? [
            "npm install",
            "npm run dev", 
            "ls",
            "git status",
            "help",
            "test-connection"
          ] : [
            "test-connection",
            "help"
          ]).map((cmd) => (
            <Button
              key={cmd}
              variant="ghost"
              size="sm"
              onClick={() => executeRealCommand(cmd)}
              disabled={isRunning}
              className="h-6 px-2 text-xs text-[#cccccc] hover:bg-[#464647]"
            >
              {cmd}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}