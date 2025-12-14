import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Play, Square, FolderOpen, Wifi } from "lucide-react";
import { toast } from "sonner";
import { localTerminalService, LocalTerminalResult } from "@/services/localTerminalService";

interface LocalRealTerminalProps {
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

export function LocalRealTerminal({ 
  owner,
  repo,
  branch = "main",
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop 
}: LocalRealTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(true); // Always connected for local
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [projectReady, setProjectReady] = useState(true); // Always ready for local
  const [currentDirectory, setCurrentDirectory] = useState("C:/Users/piyus/cicdai/resurrect-code");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [devServerRunning, setDevServerRunning] = useState(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const projectKey = owner && repo ? `${owner}/${repo}` : 'local-project';

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

  // Initialize terminal
  useEffect(() => {
    const initializeTerminal = async () => {
      addMessage("Microsoft Windows [Version 10.0.22621.2715]", "system");
      addMessage("(c) Microsoft Corporation. All rights reserved.", "system");
      addMessage("", "output");
      addMessage(`🖥️  System Real Terminal - Connected to Windows System`, "success");
      addMessage(`📂 Project: ${projectKey} (${branch})`, "system");
      addMessage(`📁 Working Directory: C:\\Users\\piyus\\cicdai\\resurrect-code`, "system");
      addMessage("", "output");
      addMessage("🔧 System Information:", "system");
      addMessage("   OS: Windows 11 Pro", "output");
      addMessage("   Node.js: v18.17.0", "output");
      addMessage("   npm: 9.6.7", "output");
      addMessage("   Git: 2.41.0", "output");
      addMessage("", "output");
      addMessage("💡 This terminal executes system-level commands", "system");
      addMessage("🚀 Try: npm install, npm run dev, dir, git status", "system");
      addMessage("", "output");
      
      // Check if there's already a running server
      const runningServer = localTerminalService.getRunningServer(projectKey);
      if (runningServer) {
        setDevServerRunning(true);
        addMessage(`🌐 Development server already running at: ${runningServer}`, "success");
      }
    };

    initializeTerminal();
  }, [projectKey, branch, currentDirectory, addMessage]);

  const executeLocalCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev.filter(cmd => cmd !== command), command]);
    setHistoryIndex(-1);

    // Add command to terminal with Windows-style prompt
    const prompt = `C:\\Users\\piyus\\cicdai\\resurrect-code>`;
    addMessage(`${prompt}${command}`, "input");
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
        addMessage("🔧 Local Real Terminal - Works without Supabase!", "system");
        addMessage("", "output");
        addMessage("📦 Project Commands:", "system");
        addMessage("  npm install - Install dependencies locally", "output");
        addMessage("  npm run dev - Start local development server", "output");
        addMessage("  npm run build - Build project locally", "output");
        addMessage("  npm start - Start production server", "output");
        addMessage("", "output");
        addMessage("📁 File Commands:", "system");
        addMessage("  ls, dir - List project files", "output");
        addMessage("  pwd - Show current directory", "output");
        addMessage("", "output");
        addMessage("🔧 Git Commands:", "system");
        addMessage("  git status - Show git status", "output");
        addMessage("  git log --oneline -5 - Recent commits", "output");
        addMessage("", "output");
        addMessage("🛠️ Built-in Commands:", "system");
        addMessage("  clear - Clear terminal", "output");
        addMessage("  exit - Close terminal", "output");
        addMessage("  status - Show terminal status", "output");
        setIsRunning(false);
        return;
      }

      if (command.trim() === "exit") {
        onClose?.();
        return;
      }

      if (command.trim() === "status") {
        addMessage("📊 Local Real Terminal Status:", "system");
        addMessage(`📁 Project: ${projectKey}`, "output");
        addMessage(`📂 Directory: ${currentDirectory}`, "output");
        addMessage(`🌐 Dev Server: ${devServerRunning ? 'Running' : 'Stopped'}`, "output");
        addMessage(`🔗 Connection: Local (No Supabase required)`, "output");
        addMessage(`✅ Status: Ready`, "success");
        setIsRunning(false);
        return;
      }

      // Execute command using local terminal service
      addMessage("🔄 Executing command locally...", "system");
      
      const result: LocalTerminalResult = await localTerminalService.executeCommand({
        command,
        owner,
        repo,
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
          toast.success(`🚀 Local dev server started! Preview opened at ${result.devServerUrl}`);
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

    } catch (error) {
      addMessage(`❌ Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isRunning) {
      executeLocalCommand(currentInput);
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
        localTerminalService.stopServer(projectKey);
        onDevServerStop?.();
        addMessage("🛑 Development server stopped", "system");
      }
    }
  };

  const getMessageColor = (type: TerminalMessage["type"]) => {
    switch (type) {
      case "input": return "text-[#00ff00]";     // Green for user input (classic terminal)
      case "error": return "text-[#ff4444]";     // Red for errors
      case "system": return "text-[#00aaff]";    // Blue for system messages
      case "success": return "text-[#00ff00]";   // Green for success
      case "output": 
      default: return "text-[#ffffff]";          // White for normal output
    }
  };

  const getStatusColor = () => {
    if (devServerRunning) return "bg-green-400 animate-pulse";
    if (projectReady) return "bg-green-400";
    return "bg-blue-400";
  };

  const getStatusText = () => {
    if (devServerRunning) return "Dev Server Running";
    if (projectReady) return "Ready (Local)";
    return "Local Mode";
  };

  return (
    <div className={`bg-[#000000] border border-[#333333] rounded-lg flex flex-col ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#333333] bg-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#cccccc]" />
          <span className="text-sm font-medium text-[#ffffff]">System Real Terminal</span>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span className="text-xs text-[#7d8590]">({getStatusText()})</span>
          <Wifi className="w-3 h-3 text-green-400" title="Local connection - no internet required" />
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
        className="flex-1 p-3 font-mono text-sm overflow-y-auto bg-[#000000]"
        style={{ minHeight: '200px' }}
      >
        {messages.map((message) => (
          <div key={message.id} className={`mb-1 ${getMessageColor(message.type)} whitespace-pre-wrap`}>
            {message.content}
          </div>
        ))}
        
        {/* Current Input Line */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[#00ff00]">C:\\Users\\piyus\\cicdai\\resurrect-code></span>
          <Input
            ref={inputRef}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isRunning}
            className="flex-1 bg-transparent border-none p-0 text-[#ffffff] focus:ring-0 focus:outline-none font-mono"
            placeholder={isRunning ? "Executing command..." : "Type a command..."}
          />
          {isRunning && (
            <div className="text-[#569cd6] animate-pulse">●</div>
          )}
        </div>
      </div>

      {/* Quick Commands */}
      <div className="p-2 border-t border-[#333333] bg-[#1a1a1a]">
        <div className="flex gap-1 flex-wrap">
          {[
            "npm install",
            "npm run dev", 
            "ls",
            "git status",
            "help",
            "status"
          ].map((cmd) => (
            <Button
              key={cmd}
              variant="ghost"
              size="sm"
              onClick={() => executeLocalCommand(cmd)}
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