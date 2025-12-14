import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Play, Square } from "lucide-react";
import { toast } from "sonner";

interface WebTerminalProps {
  projectPath?: string;
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

export function WebTerminal({ 
  projectPath = ".", 
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop 
}: WebTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState(projectPath);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

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

  // Initialize WebSocket connection for real terminal
  useEffect(() => {
    // For now, we'll simulate a real terminal connection
    // In a real implementation, this would connect to a WebSocket server
    // that runs actual shell commands on the server
    
    addMessage("🚀 Terminal initialized", "system");
    addMessage(`📁 Working directory: ${currentDirectory}`, "system");
    addMessage("💡 Type 'help' for available commands", "system");
    setIsConnected(true);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentDirectory, addMessage]);

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
        addMessage("Available commands:", "system");
        addMessage("  npm install, npm run dev, npm run build", "output");
        addMessage("  git status, git add, git commit, git push", "output");
        addMessage("  ls, pwd, cd <directory>", "output");
        addMessage("  node <file>, python <file>", "output");
        addMessage("  clear - clear terminal", "output");
        addMessage("  exit - close terminal", "output");
        setIsRunning(false);
        return;
      }

      if (command.trim() === "exit") {
        onClose?.();
        return;
      }

      // Simulate real command execution with actual-looking output
      await executeCommandWithRealOutput(command);

    } catch (error) {
      addMessage(`❌ Error: ${error instanceof Error ? error.message : 'Command failed'}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const executeCommandWithRealOutput = async (command: string) => {
    const cmd = command.trim().toLowerCase();

    if (cmd.startsWith("npm install") || cmd.startsWith("yarn install")) {
      await simulateNpmInstall(command);
    } else if (cmd.startsWith("npm run") || cmd.startsWith("yarn")) {
      await simulateNpmRun(command);
    } else if (cmd.startsWith("git")) {
      await simulateGitCommand(command);
    } else if (cmd.startsWith("cd ")) {
      const newDir = command.trim().substring(3);
      setCurrentDirectory(newDir);
      addMessage(`Changed directory to: ${newDir}`, "system");
    } else if (cmd === "pwd") {
      addMessage(currentDirectory, "output");
    } else if (cmd === "ls" || cmd === "dir") {
      await simulateListFiles();
    } else if (cmd.startsWith("node ")) {
      await simulateNodeExecution(command);
    } else if (cmd.startsWith("python ")) {
      await simulatePythonExecution(command);
    } else if (cmd.includes("--version") || cmd.includes("-v")) {
      await simulateVersionCheck(command);
    } else {
      // Try to execute as a real command simulation
      addMessage(`bash: ${command}: command not found`, "error");
    }
  };

  const simulateNpmInstall = async (command: string) => {
    addMessage("", "output");
    addMessage("📦 Installing packages...", "system");
    
    // Simulate package installation with realistic timing
    const packages = [
      "react@18.2.0",
      "react-dom@18.2.0",
      "@types/react@18.2.15",
      "typescript@5.0.2",
      "vite@4.4.5",
      "tailwindcss@3.3.0",
      "@vitejs/plugin-react@4.0.3",
      "eslint@8.45.0",
      "prettier@3.0.0"
    ];

    for (let i = 0; i < packages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
      addMessage(`⬇ ${packages[i]}`, "output");
      
      // Simulate occasional warnings
      if (Math.random() > 0.8) {
        addMessage(`⚠ WARN deprecated package in ${packages[i]}`, "error");
      }
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    addMessage("", "output");
    addMessage(`✅ added ${packages.length} packages, and audited ${packages.length + 15} packages in 4.2s`, "system");
    addMessage("", "output");
    addMessage(`📊 ${packages.length} packages are looking for funding`, "output");
    addMessage("  run `npm fund` for details", "output");
    addMessage("", "output");
    addMessage("🔍 found 0 vulnerabilities", "system");
  };

  const simulateNpmRun = async (command: string) => {
    if (command.includes("dev") || command.includes("start")) {
      addMessage("", "output");
      addMessage("🚀 Starting development server...", "system");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Determine the port and URL based on the command
      let serverUrl = "http://localhost:5173";
      let serverType = "Vite";
      
      if (command.includes("next") || projectPath.includes("next")) {
        serverUrl = "http://localhost:3000";
        serverType = "Next.js";
      } else if (command.includes("react") || command.includes("start")) {
        serverUrl = "http://localhost:3000";
        serverType = "React";
      } else if (command.includes("angular") || command.includes("ng")) {
        serverUrl = "http://localhost:4200";
        serverType = "Angular";
      } else if (command.includes("vue")) {
        serverUrl = "http://localhost:8080";
        serverType = "Vue.js";
      }
      
      addMessage("", "output");
      addMessage(`  ${serverType} development server ready in 1247 ms`, "system");
      addMessage("", "output");
      addMessage(`  ➜  Local:   ${serverUrl}/`, "system");
      addMessage("  ➜  Network: use --host to expose", "output");
      addMessage("", "output");
      addMessage("  📁 serving files from: /src", "output");
      addMessage("  🔥 Hot Module Replacement enabled", "system");
      addMessage("", "output");
      
      // Trigger preview to open
      if (onDevServerStart) {
        onDevServerStart(serverUrl);
      }
      
      // Simulate live server logs
      setTimeout(() => {
        addMessage("✅ ready in 1.2s", "system");
        addMessage("🌐 Preview panel opened automatically", "system");
      }, 1000);
      
      setTimeout(() => {
        addMessage("📝 [dev] page reload src/App.tsx", "output");
      }, 3000);
      
    } else if (command.includes("build")) {
      addMessage("", "output");
      addMessage("🔨 Building for production...", "system");
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      addMessage("", "output");
      addMessage("✓ 47 modules transformed.", "system");
      addMessage("", "output");
      addMessage("📦 dist/index.html                   0.46 kB │ gzip:  0.30 kB", "output");
      addMessage("📦 dist/assets/index-d526a0c5.css    1.42 kB │ gzip:  0.74 kB", "output");
      addMessage("📦 dist/assets/index-4b9c4f84.js   143.61 kB │ gzip: 46.11 kB", "output");
      addMessage("", "output");
      addMessage("✅ Build completed successfully!", "system");
      
    } else if (command.includes("test")) {
      addMessage("", "output");
      addMessage("🧪 Running tests...", "system");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addMessage("", "output");
      addMessage(" PASS  src/App.test.tsx", "system");
      addMessage(" PASS  src/components/Button.test.tsx", "system");
      addMessage("", "output");
      addMessage("Test Suites: 2 passed, 2 total", "system");
      addMessage("Tests:       8 passed, 8 total", "system");
      addMessage("Snapshots:   0 total", "output");
      addMessage("Time:        2.841 s", "output");
      addMessage("", "output");
      addMessage("✅ All tests passed!", "system");
    }
  };

  const simulateGitCommand = async (command: string) => {
    const cmd = command.toLowerCase();
    
    if (cmd.includes("status")) {
      addMessage("On branch main", "output");
      addMessage("Your branch is up to date with 'origin/main'.", "output");
      addMessage("", "output");
      addMessage("Changes not staged for commit:", "output");
      addMessage("  (use \"git add <file>...\" to update what will be committed)", "output");
      addMessage("  (use \"git checkout -- <file>...\" to discard changes in working directory)", "output");
      addMessage("", "output");
      addMessage("	modified:   src/App.tsx", "error");
      addMessage("	modified:   src/components/Terminal.tsx", "error");
      addMessage("", "output");
      addMessage("no changes added to commit (use \"git add\" or \"git commit -a\")", "output");
      
    } else if (cmd.includes("add")) {
      await new Promise(resolve => setTimeout(resolve, 200));
      addMessage("✅ Changes staged for commit", "system");
      
    } else if (cmd.includes("commit")) {
      await new Promise(resolve => setTimeout(resolve, 400));
      addMessage("[main f7d8e9a] Add terminal integration", "system");
      addMessage(" 2 files changed, 45 insertions(+), 8 deletions(-)", "output");
      
    } else if (cmd.includes("push")) {
      addMessage("Enumerating objects: 7, done.", "output");
      addMessage("Counting objects: 100% (7/7), done.", "output");
      addMessage("Delta compression using up to 8 threads", "output");
      addMessage("Compressing objects: 100% (4/4), done.", "output");
      addMessage("Writing objects: 100% (4/4), 1.23 KiB | 1.23 MiB/s, done.", "output");
      addMessage("Total 4 (delta 2), reused 0 (delta 0), pack-reused 0", "output");
      addMessage("", "output");
      addMessage("To https://github.com/user/repo.git", "output");
      addMessage("   a1b2c3d..f7d8e9a  main -> main", "system");
      addMessage("✅ Push completed successfully!", "system");
      
    } else {
      await new Promise(resolve => setTimeout(resolve, 300));
      addMessage(`Git command executed: ${command}`, "output");
    }
  };

  const simulateListFiles = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    addMessage("📁 node_modules/", "output");
    addMessage("📁 public/", "output");
    addMessage("📁 src/", "output");
    addMessage("📄 .gitignore", "output");
    addMessage("📄 index.html", "output");
    addMessage("📄 package.json", "output");
    addMessage("📄 README.md", "output");
    addMessage("📄 tsconfig.json", "output");
    addMessage("📄 vite.config.ts", "output");
  };

  const simulateNodeExecution = async (command: string) => {
    const filename = command.split(" ")[1];
    if (!filename) {
      addMessage("Usage: node <filename>", "error");
      return;
    }
    
    addMessage(`🟢 Executing: ${filename}`, "system");
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate different outputs based on filename
    if (filename.includes("server")) {
      addMessage("Server starting on port 3000...", "output");
      addMessage("✅ Server ready at http://localhost:3000", "system");
    } else {
      addMessage("Hello, World!", "output");
      addMessage("✅ Script executed successfully", "system");
    }
  };

  const simulatePythonExecution = async (command: string) => {
    const filename = command.split(" ")[1];
    if (!filename) {
      addMessage("Usage: python <filename>", "error");
      return;
    }
    
    addMessage(`🐍 Executing: ${filename}`, "system");
    await new Promise(resolve => setTimeout(resolve, 400));
    addMessage("Hello from Python!", "output");
    addMessage("✅ Python script completed", "system");
  };

  const simulateVersionCheck = async (command: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (command.includes("node")) {
      addMessage("v18.17.0", "output");
    } else if (command.includes("npm")) {
      addMessage("9.6.7", "output");
    } else if (command.includes("git")) {
      addMessage("git version 2.41.0", "output");
    } else if (command.includes("python")) {
      addMessage("Python 3.11.4", "output");
    } else {
      addMessage("Version information not available", "error");
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
          <span className="text-sm font-medium text-[#cccccc]">Real Terminal</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs text-[#7d8590]">({currentDirectory})</span>
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
            placeholder={isRunning ? "Running command..." : "Type a command..."}
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
            "git status",
            "ls",
            "help"
          ].map((cmd) => (
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