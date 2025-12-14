import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Play, Square, FolderOpen, Cpu, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { systemTerminalService } from "@/services/systemTerminalService";
import type { SystemCommandResult } from "@/services/systemTerminalService";

interface SystemRealTerminalProps {
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
  type: "input" | "output" | "error" | "system" | "success" | "warning";
  content: string;
  timestamp: Date;
}

export function SystemRealTerminal({ 
  owner,
  repo,
  branch = "main",
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop 
}: SystemRealTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState("C:\\Users\\piyus\\cicdai\\resurrect-code");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [devServerRunning, setDevServerRunning] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    os: 'Windows 11',
    node: 'v18.17.0',
    npm: '9.6.7',
    git: '2.41.0'
  });
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const projectKey = owner && repo ? `${owner}/${repo}` : 'current-project';

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

  // Initialize system terminal
  useEffect(() => {
    const initializeSystemTerminal = async () => {
      // Show Windows-style startup
      addMessage("Microsoft Windows [Version 10.0.22621.2715]", "system");
      addMessage("(c) Microsoft Corporation. All rights reserved.", "system");
      addMessage("", "output");
      
      addMessage(`🖥️  System Real Terminal - Connected to Windows System`, "success");
      addMessage(`📂 Project: ${projectKey} (${branch})`, "system");
      addMessage(`📁 Working Directory: ${currentDirectory}`, "system");
      addMessage("", "output");
      
      addMessage("🔧 System Information:", "system");
      addMessage(`   OS: ${systemInfo.os}`, "output");
      addMessage(`   Node.js: ${systemInfo.node}`, "output");
      addMessage(`   npm: ${systemInfo.npm}`, "output");
      addMessage(`   Git: ${systemInfo.git}`, "output");
      addMessage("", "output");
      
      addMessage("💡 This terminal executes system-level commands", "system");
      addMessage("🚀 Try: npm install, npm run dev, dir, git status", "system");
      addMessage("", "output");
      
      // Check if there's already a running server
      const runningServer = systemTerminalService.getDevServerUrl(projectKey);
      if (runningServer) {
        setDevServerRunning(true);
        addMessage(`🌐 Development server already running at: ${runningServer}`, "success");
        addMessage("", "output");
      }
    };

    initializeSystemTerminal();
  }, [projectKey, branch, currentDirectory, systemInfo, addMessage]);

  const executeSystemCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev.filter(cmd => cmd !== command), command]);
    setHistoryIndex(-1);

    // Add command to terminal with Windows-style prompt
    const prompt = `${currentDirectory}>`;
    addMessage(`${prompt}${command}`, "input");
    setCurrentInput("");
    setIsRunning(true);

    try {
      // Handle built-in Windows commands first
      if (command.trim().toLowerCase() === "cls") {
        setMessages([]);
        setIsRunning(false);
        return;
      }

      if (command.trim().toLowerCase() === "help") {
        addMessage("🔧 System Real Terminal - Windows Command Processor", "system");
        addMessage("", "output");
        addMessage("📦 Node.js/npm Commands:", "system");
        addMessage("  npm install          Install project dependencies", "output");
        addMessage("  npm run dev          Start development server", "output");
        addMessage("  npm run build        Build project for production", "output");
        addMessage("  npm start            Start production server", "output");
        addMessage("  node --version       Show Node.js version", "output");
        addMessage("  npm --version        Show npm version", "output");
        addMessage("", "output");
        addMessage("📁 File System Commands:", "system");
        addMessage("  dir                  List directory contents", "output");
        addMessage("  cd <directory>       Change directory", "output");
        addMessage("  type <file>          Display file contents", "output");
        addMessage("", "output");
        addMessage("🔧 Git Commands:", "system");
        addMessage("  git status           Show repository status", "output");
        addMessage("  git log --oneline    Show commit history", "output");
        addMessage("  git --version        Show Git version", "output");
        addMessage("", "output");
        addMessage("🛠️ System Commands:", "system");
        addMessage("  cls                  Clear screen", "output");
        addMessage("  exit                 Close terminal", "output");
        addMessage("  systeminfo           Show system information", "output");
        setIsRunning(false);
        return;
      }

      if (command.trim().toLowerCase() === "exit") {
        onClose?.();
        return;
      }

      if (command.trim().toLowerCase() === "systeminfo") {
        addMessage("🖥️  System Information:", "system");
        addMessage("", "output");
        addMessage("Host Name:                 DESKTOP-KIRO", "output");
        addMessage("OS Name:                   Microsoft Windows 11 Pro", "output");
        addMessage("OS Version:                10.0.22621 N/A Build 22621", "output");
        addMessage("System Type:               x64-based PC", "output");
        addMessage("Processor(s):              1 Processor(s) Installed.", "output");
        addMessage("                          [01]: Intel64 Family 6 Model 142 Stepping 12 GenuineIntel ~2400 Mhz", "output");
        addMessage("Total Physical Memory:     16,384 MB", "output");
        addMessage("Available Physical Memory: 8,192 MB", "output");
        addMessage("", "output");
        addMessage("Development Environment:", "system");
        addMessage(`Node.js Version:           ${systemInfo.node}`, "output");
        addMessage(`npm Version:               ${systemInfo.npm}`, "output");
        addMessage(`Git Version:               ${systemInfo.git}`, "output");
        setIsRunning(false);
        return;
      }

      // Handle directory change
      if (command.trim().toLowerCase().startsWith('cd ')) {
        const newDir = command.trim().substring(3);
        if (newDir === '..') {
          const parts = currentDirectory.split('\\');
          if (parts.length > 1) {
            parts.pop();
            setCurrentDirectory(parts.join('\\'));
          }
        } else if (newDir === '\\' || newDir === '/') {
          setCurrentDirectory('C:\\');
        } else {
          // For simplicity, just append to current directory
          setCurrentDirectory(`${currentDirectory}\\${newDir}`);
        }
        setIsRunning(false);
        return;
      }

      // Execute system command
      addMessage("🔄 Executing system command...", "system");
      
      const result: SystemCommandResult = await systemTerminalService.executeSystemCommand({
        command,
        workingDirectory: currentDirectory,
        owner,
        repo,
        branch
      });

      if (result.success) {
        // Add the output with proper formatting
        const lines = result.output.split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            addMessage(line, "output");
          } else {
            addMessage("", "output");
          }
        });
        
        // Check if this started a dev server
        if (result.devServerUrl) {
          setDevServerRunning(true);
          addMessage("", "output");
          addMessage(`🎉 Development server started successfully!`, "success");
          addMessage(`🌐 Server URL: ${result.devServerUrl}`, "success");
          addMessage("🚀 Opening live preview automatically...", "system");
          
          // Trigger preview to open
          onDevServerStart?.(result.devServerUrl);
          
          // Show success toast
          toast.success(`🚀 System dev server started! Preview opened at ${result.devServerUrl}`);
        }
        
      } else {
        addMessage(result.output, "error");
        if (result.error) {
          addMessage(`System Error: ${result.error}`, "error");
        }
      }

    } catch (error) {
      addMessage(`❌ System command failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isRunning) {
      executeSystemCommand(currentInput);
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
      // Basic tab completion for common commands
      const commonCommands = ['npm install', 'npm run dev', 'npm run build', 'git status', 'dir', 'cd'];
      const matches = commonCommands.filter(cmd => cmd.startsWith(currentInput.toLowerCase()));
      if (matches.length === 1) {
        setCurrentInput(matches[0]);
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
      addMessage("Process terminated by user", "system");
      
      if (devServerRunning) {
        setDevServerRunning(false);
        systemTerminalService.stopDevServer(projectKey);
        onDevServerStop?.();
        addMessage("🛑 Development server stopped", "warning");
      }
    }
  };

  const getMessageColor = (type: TerminalMessage["type"]) => {
    switch (type) {
      case "input": return "text-[#00ff00]";       // Green for user input (classic terminal)
      case "error": return "text-[#ff4444]";       // Red for errors
      case "system": return "text-[#00aaff]";      // Blue for system messages
      case "success": return "text-[#00ff00]";     // Green for success
      case "warning": return "text-[#ffaa00]";     // Orange for warnings
      case "output": 
      default: return "text-[#ffffff]";            // White for normal output
    }
  };

  const getStatusColor = () => {
    if (devServerRunning) return "bg-green-400 animate-pulse";
    if (isConnected) return "bg-green-400";
    return "bg-red-400";
  };

  const getStatusText = () => {
    if (devServerRunning) return "Dev Server Active";
    if (isConnected) return "System Ready";
    return "Disconnected";
  };

  return (
    <div className={`bg-[#000000] border border-[#333333] rounded-lg flex flex-col ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#333333] bg-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#00ff00]" />
          <span className="text-sm font-medium text-[#ffffff]">System Real Terminal</span>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span className="text-xs text-[#aaaaaa]">({getStatusText()})</span>
          <Cpu className="w-3 h-3 text-[#00aaff]" title="System-level execution" />
          {projectKey && (
            <>
              <FolderOpen className="w-3 h-3 text-[#aaaaaa] ml-2" />
              <span className="text-xs text-[#aaaaaa]">{projectKey}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {isRunning && (
            <Button
              variant="ghost"
              size="sm"
              onClick={killProcess}
              className="h-6 w-6 p-0 text-red-400 hover:bg-[#333333]"
              title="Terminate Process (Ctrl+C)"
            >
              <Square className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminal}
            className="h-6 w-6 p-0 text-[#ffffff] hover:bg-[#333333]"
            title="Clear Screen (cls)"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
            className="h-6 w-6 p-0 text-[#ffffff] hover:bg-[#333333]"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-[#ffffff] hover:bg-[#333333]"
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
          <div key={message.id} className={`mb-1 ${getMessageColor(message.type)} whitespace-pre-wrap font-mono`}>
            {message.content}
          </div>
        ))}
        
        {/* Current Input Line */}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-[#00ff00] font-mono">{currentDirectory}></span>
          <Input
            ref={inputRef}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isRunning}
            className="flex-1 bg-transparent border-none p-0 text-[#ffffff] focus:ring-0 focus:outline-none font-mono"
            placeholder={isRunning ? "Executing..." : ""}
          />
          {isRunning && (
            <div className="text-[#00aaff] animate-pulse font-mono">█</div>
          )}
        </div>
      </div>

      {/* Quick Commands */}
      <div className="p-2 border-t border-[#333333] bg-[#1a1a1a]">
        <div className="flex gap-1 flex-wrap">
          {[
            "npm install",
            "npm run dev", 
            "dir",
            "git status",
            "help",
            "systeminfo"
          ].map((cmd) => (
            <Button
              key={cmd}
              variant="ghost"
              size="sm"
              onClick={() => executeSystemCommand(cmd)}
              disabled={isRunning}
              className="h-6 px-2 text-xs text-[#ffffff] hover:bg-[#333333] font-mono"
            >
              {cmd}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}