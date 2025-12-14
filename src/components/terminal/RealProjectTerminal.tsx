import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Play, Square, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { projectEnvironmentService } from "@/services/projectEnvironment";

interface RealProjectTerminalProps {
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
  type: "input" | "output" | "error" | "system";
  content: string;
  timestamp: Date;
}

export function RealProjectTerminal({ 
  owner,
  repo,
  branch = "main",
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop 
}: RealProjectTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [projectReady, setProjectReady] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState("~");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
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

  // Initialize project environment
  useEffect(() => {
    const initializeProject = async () => {
      if (!projectKey) {
        addMessage("⚠️ No project specified", "system");
        addMessage("💡 Connect a GitHub repository to use real terminal", "system");
        setIsConnected(true);
        return;
      }

      try {
        addMessage("🚀 Setting up project environment...", "system");
        addMessage(`📂 Project: ${projectKey}`, "system");
        
        const environment = await projectEnvironmentService.setupProjectEnvironment(owner!, repo!, branch);
        
        setProjectReady(true);
        setCurrentDirectory(environment.projectPath);
        setIsConnected(true);
        
        addMessage("✅ Project environment ready!", "system");
        addMessage(`📁 Working directory: ${environment.projectPath}`, "system");
        addMessage("💡 You can now run real commands like 'npm install' and 'npm run dev'", "system");
        addMessage("", "output");
        
      } catch (error) {
        addMessage(`❌ Failed to setup project: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        setIsConnected(true); // Still allow terminal usage
      }
    };

    initializeProject();
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
        addMessage("Real Project Terminal Commands:", "system");
        addMessage("", "output");
        addMessage("📦 Project Commands:", "system");
        addMessage("  npm install, yarn install - Install dependencies", "output");
        addMessage("  npm run dev, yarn dev - Start development server", "output");
        addMessage("  npm run build - Build for production", "output");
        addMessage("  npm test - Run tests", "output");
        addMessage("", "output");
        addMessage("📁 File Commands:", "system");
        addMessage("  ls, dir - List files", "output");
        addMessage("  pwd - Show current directory", "output");
        addMessage("  cd <directory> - Change directory", "output");
        addMessage("", "output");
        addMessage("🔧 Git Commands:", "system");
        addMessage("  git status, git add, git commit, git push", "output");
        addMessage("", "output");
        addMessage("🛠️ Built-in Commands:", "system");
        addMessage("  clear - Clear terminal", "output");
        addMessage("  exit - Close terminal", "output");
        addMessage("  setup - Re-setup project environment", "output");
        setIsRunning(false);
        return;
      }

      if (command.trim() === "exit") {
        onClose?.();
        return;
      }

      if (command.trim() === "setup") {
        if (projectKey) {
          addMessage("🔄 Re-setting up project environment...", "system");
          try {
            await projectEnvironmentService.cleanupProject(projectKey);
            const environment = await projectEnvironmentService.setupProjectEnvironment(owner!, repo!, branch);
            setCurrentDirectory(environment.projectPath);
            addMessage("✅ Project environment re-initialized!", "system");
          } catch (error) {
            addMessage(`❌ Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
          }
        } else {
          addMessage("⚠️ No project connected", "error");
        }
        setIsRunning(false);
        return;
      }

      // Execute real command using project environment service
      if (projectKey && projectReady) {
        const result = await projectEnvironmentService.executeCommand(
          projectKey,
          command,
          (output) => {
            addMessage(output, "output");
          },
          (url) => {
            onDevServerStart?.(url);
          }
        );

        if (!result.success) {
          addMessage(result.output, "error");
        }
      } else {
        addMessage("⚠️ Project environment not ready. Run 'setup' to initialize.", "error");
      }

    } catch (error) {
      addMessage(`❌ Error: ${error instanceof Error ? error.message : 'Command failed'}`, "error");
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
      // TODO: Implement tab completion
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
      
      // Stop dev server if running
      if (projectKey) {
        projectEnvironmentService.stopDevServer(projectKey);
        onDevServerStop?.();
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

  const getStatusColor = () => {
    if (!isConnected) return "bg-red-400";
    if (!projectReady && projectKey) return "bg-yellow-400";
    return "bg-green-400";
  };

  const getStatusText = () => {
    if (!isConnected) return "Disconnected";
    if (!projectReady && projectKey) return "Setting up...";
    if (projectKey) return "Project Ready";
    return "No Project";
  };

  return (
    <div className={`bg-[#1e1e1e] border border-[#464647] rounded-lg flex flex-col ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#464647] bg-[#2d2d30]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#cccccc]" />
          <span className="text-sm font-medium text-[#cccccc]">Real Project Terminal</span>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span className="text-xs text-[#7d8590]">({getStatusText()})</span>
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
            placeholder={isRunning ? "Running command..." : projectReady ? "Type a command..." : "Setting up project..."}
          />
          {isRunning && (
            <div className="text-[#569cd6] animate-pulse">●</div>
          )}
        </div>
      </div>

      {/* Quick Commands */}
      <div className="p-2 border-t border-[#464647] bg-[#252526]">
        <div className="flex gap-1 flex-wrap">
          {(projectReady ? [
            "npm install",
            "npm run dev", 
            "npm run build",
            "git status",
            "ls",
            "help"
          ] : [
            "setup",
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