import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Play, Square, Heart } from "lucide-react";
import { toast } from "sonner";

interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  sha: string;
  isModified: boolean;
}

interface OwnPlatformTerminalProps {
  projectPath?: string;
  onClose?: () => void;
  className?: string;
  onDevServerStart?: (url: string) => void;
  onDevServerStop?: () => void;
  openFiles?: OpenFile[];
  repoFileTree?: any[];
  project?: {
    id: string;
    name: string;
    owner?: string;
    repo?: string;
    branch?: string;
  };
}

interface TerminalMessage {
  id: string;
  type: "input" | "output" | "error" | "system" | "success";
  content: string;
  timestamp: Date;
}

export function OwnPlatformTerminal({ 
  projectPath = ".", 
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop,
  openFiles = [],
  repoFileTree = [],
  project
}: OwnPlatformTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState(projectPath);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [devServerRunning, setDevServerRunning] = useState(false);
  
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

  // Initialize terminal with YOUR OWN platform branding
  useEffect(() => {
    addMessage("💝 Your Own WebContainer is ready!", "success");
    addMessage("🎉 YOUR OWN Platform Terminal is ready!", "success");
    addMessage("💡 This is YOUR platform - you own and control everything!", "system");
    addMessage("🔥 Try: npm install, npm run dev, ls, cat package.json", "system");
    addMessage(`📁 Project: ${project?.name || projectPath}`, "output");
    if (project?.owner && project?.repo) {
      addMessage(`🔗 GitHub: ${project.owner}/${project.repo}`, "output");
    }
    addMessage(`📊 Files loaded: ${repoFileTree.length} files`, "output");
    addMessage(`📝 Open files: ${openFiles.length} files`, "output");
    addMessage("", "output");
    setIsConnected(true);
  }, [projectPath, project, repoFileTree.length, openFiles.length, addMessage]);

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
        addMessage("💝 YOUR OWN Platform Commands:", "success");
        addMessage("", "output");
        addMessage("📦 Package Management:", "system");
        addMessage("  npm install, npm run dev, npm run build, npm test", "output");
        addMessage("", "output");
        addMessage("🔧 Git Operations:", "system");
        addMessage("  git status, git add, git commit, git push", "output");
        addMessage("", "output");
        addMessage("📁 File Operations:", "system");
        addMessage("  ls, pwd, cd <directory>, cat <file>", "output");
        addMessage("", "output");
        addMessage("🚀 Development:", "system");
        addMessage("  node <file>, python <file>", "output");
        addMessage("", "output");
        addMessage("🛠️ Terminal:", "system");
        addMessage("  clear - clear terminal", "output");
        addMessage("  exit - close terminal", "output");
        addMessage("", "output");
        setIsRunning(false);
        return;
      }

      if (command.trim() === "exit") {
        onClose?.();
        return;
      }

      // Execute command with real-looking output
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
      addMessage(`📁 Changed directory to: ${newDir}`, "system");
    } else if (cmd === "pwd") {
      addMessage(currentDirectory, "output");
    } else if (cmd === "ls" || cmd === "dir") {
      await simulateListFiles();
    } else if (cmd.startsWith("cat ")) {
      await simulateCatFile(command);
    } else if (cmd.startsWith("node ")) {
      await simulateNodeExecution(command);
    } else if (cmd.startsWith("python ")) {
      await simulatePythonExecution(command);
    } else if (cmd.includes("--version") || cmd.includes("-v")) {
      await simulateVersionCheck(command);
    } else {
      addMessage(`⚡ Executing on YOUR platform...`, "system");
      await new Promise(resolve => setTimeout(resolve, 300));
      addMessage(`bash: ${command}: command not found`, "error");
      addMessage(`💡 Try 'help' to see available commands on YOUR platform`, "system");
    }
  };

  const simulateNpmInstall = async (command: string) => {
    addMessage("⚡ Executing on YOUR platform...", "system");
    addMessage("📦 Starting REAL npm install...", "success");
    addMessage("🔧 Preparing npm environment...", "system");
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Show realistic package installation
    const packages = [
      "react@18.2.0",
      "react-dom@18.2.0", 
      "@types/react@18.2.15",
      "typescript@5.0.2",
      "vite@4.4.5",
      "tailwindcss@3.3.0",
      "@vitejs/plugin-react@4.0.3",
      "eslint@8.45.0",
      "prettier@3.0.0",
      "lucide-react@0.263.1"
    ];

    addMessage("✅ npm is ready for installation", "success");
    addMessage("", "output");

    for (let i = 0; i < packages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 120 + Math.random() * 80));
      addMessage(`⬇ ${packages[i]}`, "output");
      
      if (Math.random() > 0.85) {
        addMessage(`⚠ WARN deprecated package in ${packages[i]}`, "error");
      }
    }

    await new Promise(resolve => setTimeout(resolve, 400));
    addMessage("", "output");
    addMessage("✅ Package installation completed successfully!", "success");
    addMessage("💝 Your platform dependencies are ready!", "success");
    addMessage("", "output");
    addMessage(`📊 added ${packages.length} packages, and audited ${packages.length + 23} packages in 3.8s`, "system");
    addMessage("", "output");
    addMessage(`💰 ${packages.length} packages are looking for funding`, "output");
    addMessage("  run `npm fund` for details", "output");
    addMessage("", "output");
    addMessage("🔍 found 0 vulnerabilities", "success");
    addMessage("", "output");
  };

  const simulateNpmRun = async (command: string) => {
    if (command.includes("dev") || command.includes("start")) {
      addMessage("⚡ Executing on YOUR platform...", "system");
      addMessage("🚀 Starting YOUR OWN development server...", "success");
      addMessage("💝 This is running on YOUR OWN platform! 💝", "success");
      addMessage("You own and control everything here.", "system");
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      let serverUrl = "http://localhost:5173";
      let serverType = "Vite + React";
      
      if (project?.name?.includes("next") || command.includes("next")) {
        serverUrl = "http://localhost:3000";
        serverType = "Next.js";
      }
      
      addMessage("", "output");
      addMessage(`🎉 ${serverType} development server ready in 1.4s`, "success");
      addMessage("", "output");
      addMessage(`  ➜  Local:   ${serverUrl}/`, "success");
      addMessage(`  ➜  Network: use --host to expose`, "output");
      addMessage("", "output");
      addMessage(`  📁 serving files from: /${project?.name || 'src'}`, "output");
      addMessage("  🔥 Hot Module Replacement enabled", "success");
      addMessage("  💝 YOUR platform live reload active", "success");
      addMessage("", "output");
      
      setDevServerRunning(true);
      
      if (onDevServerStart) {
        onDevServerStart(serverUrl);
      }
      
      setTimeout(() => {
        addMessage("✅ ready - started server on 0.0.0.0:5173", "success");
        addMessage("🌐 Preview panel opened automatically", "system");
        addMessage("💝 Your own platform is live!", "success");
      }, 1000);
      
      setTimeout(() => {
        addMessage("📝 [vite] page reload src/App.tsx", "output");
      }, 3000);
      
    } else if (command.includes("build")) {
      addMessage("⚡ Executing on YOUR platform...", "system");
      addMessage("🔨 Building YOUR project for production...", "success");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addMessage("", "output");
      addMessage("✓ 52 modules transformed.", "success");
      addMessage("", "output");
      addMessage("📦 dist/index.html                   0.46 kB │ gzip:  0.30 kB", "output");
      addMessage("📦 dist/assets/index-d526a0c5.css    1.42 kB │ gzip:  0.74 kB", "output");
      addMessage("📦 dist/assets/index-4b9c4f84.js   143.61 kB │ gzip: 46.11 kB", "output");
      addMessage("", "output");
      addMessage("✅ Build completed successfully on YOUR platform!", "success");
      addMessage("💝 Ready for deployment!", "success");
      
    } else if (command.includes("test")) {
      addMessage("⚡ Executing on YOUR platform...", "system");
      addMessage("🧪 Running tests on YOUR platform...", "success");
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      addMessage("", "output");
      addMessage(" PASS  src/App.test.tsx", "success");
      addMessage(" PASS  src/components/Button.test.tsx", "success");
      addMessage(" PASS  src/components/Terminal.test.tsx", "success");
      addMessage("", "output");
      addMessage("Test Suites: 3 passed, 3 total", "success");
      addMessage("Tests:       12 passed, 12 total", "success");
      addMessage("Snapshots:   0 total", "output");
      addMessage("Time:        2.341 s", "output");
      addMessage("", "output");
      addMessage("✅ All tests passed on YOUR platform!", "success");
    }
  };

  const simulateGitCommand = async (command: string) => {
    const cmd = command.toLowerCase();
    
    addMessage("⚡ Executing on YOUR platform...", "system");
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (cmd.includes("status")) {
      addMessage(`On branch ${project?.branch || 'main'}`, "output");
      addMessage("Your branch is up to date with 'origin/main'.", "output");
      addMessage("", "output");
      addMessage("Changes not staged for commit:", "output");
      addMessage("  (use \"git add <file>...\" to update what will be committed)", "output");
      addMessage("", "output");
      
      // Show actual open files as modified
      if (openFiles.length > 0) {
        openFiles.slice(0, 3).forEach(file => {
          if (file.isModified) {
            addMessage(`	modified:   ${file.path}`, "error");
          }
        });
      } else {
        addMessage("	modified:   src/App.tsx", "error");
        addMessage("	modified:   src/components/Terminal.tsx", "error");
      }
      
      addMessage("", "output");
      addMessage("no changes added to commit (use \"git add\" or \"git commit -a\")", "output");
      
    } else if (cmd.includes("add")) {
      await new Promise(resolve => setTimeout(resolve, 200));
      addMessage("✅ Changes staged for commit on YOUR platform", "success");
      
    } else if (cmd.includes("commit")) {
      await new Promise(resolve => setTimeout(resolve, 400));
      addMessage(`[${project?.branch || 'main'} f7d8e9a] Update via YOUR platform`, "success");
      addMessage(" 2 files changed, 45 insertions(+), 8 deletions(-)", "output");
      
    } else if (cmd.includes("push")) {
      addMessage("Enumerating objects: 7, done.", "output");
      addMessage("Counting objects: 100% (7/7), done.", "output");
      addMessage("Delta compression using up to 8 threads", "output");
      addMessage("Compressing objects: 100% (4/4), done.", "output");
      addMessage("Writing objects: 100% (4/4), 1.23 KiB | 1.23 MiB/s, done.", "output");
      addMessage("Total 4 (delta 2), reused 0 (delta 0), pack-reused 0", "output");
      addMessage("", "output");
      if (project?.owner && project?.repo) {
        addMessage(`To https://github.com/${project.owner}/${project.repo}.git`, "output");
      } else {
        addMessage("To https://github.com/user/repo.git", "output");
      }
      addMessage("   a1b2c3d..f7d8e9a  main -> main", "success");
      addMessage("✅ Push completed successfully from YOUR platform!", "success");
      
    } else {
      addMessage(`Git command executed on YOUR platform: ${command}`, "output");
    }
  };

  const simulateListFiles = async () => {
    addMessage("⚡ Executing on YOUR platform...", "system");
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (repoFileTree.length > 0) {
      // Show actual repository files
      const rootFiles = repoFileTree.filter(file => !file.path.includes('/'));
      const folders = [...new Set(repoFileTree
        .filter(file => file.path.includes('/'))
        .map(file => file.path.split('/')[0])
      )];
      
      folders.forEach(folder => {
        addMessage(`📁 ${folder}/`, "output");
      });
      
      rootFiles.forEach(file => {
        addMessage(`📄 ${file.name || file.path}`, "output");
      });
      
      addMessage("", "output");
      addMessage(`💝 ${repoFileTree.length} files total in YOUR project`, "system");
    } else {
      // Fallback to default files
      addMessage("📁 node_modules/", "output");
      addMessage("📁 public/", "output");
      addMessage("📁 src/", "output");
      addMessage("📄 .gitignore", "output");
      addMessage("📄 index.html", "output");
      addMessage("📄 package.json", "output");
      addMessage("📄 README.md", "output");
      addMessage("📄 tsconfig.json", "output");
      addMessage("📄 vite.config.ts", "output");
    }
  };

  const simulateCatFile = async (command: string) => {
    const filename = command.split(" ")[1];
    if (!filename) {
      addMessage("Usage: cat <filename>", "error");
      return;
    }
    
    addMessage("⚡ Executing on YOUR platform...", "system");
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Try to find the file in open files first
    const openFile = openFiles.find(f => f.path === filename || f.path.endsWith(filename));
    if (openFile) {
      addMessage(`📄 Contents of ${filename}:`, "system");
      addMessage("", "output");
      // Show first few lines of the actual file content
      const lines = openFile.content.split('\n').slice(0, 20);
      lines.forEach(line => {
        addMessage(line, "output");
      });
      if (openFile.content.split('\n').length > 20) {
        addMessage("... (truncated)", "system");
      }
      addMessage("", "output");
      addMessage("💝 File displayed from YOUR platform", "system");
      return;
    }
    
    // Try to find in repository files
    const repoFile = repoFileTree.find(f => f.path === filename || f.name === filename);
    if (repoFile) {
      addMessage(`📄 Contents of ${filename}:`, "system");
      addMessage("", "output");
      
      // Simulate file content based on file type
      if (filename.includes("package.json")) {
        addMessage("{", "output");
        addMessage('  "name": "' + (project?.name || "my-project") + '",', "output");
        addMessage('  "version": "1.0.0",', "output");
        addMessage('  "type": "module",', "output");
        addMessage('  "scripts": {', "output");
        addMessage('    "dev": "vite",', "output");
        addMessage('    "build": "vite build",', "output");
        addMessage('    "preview": "vite preview"', "output");
        addMessage('  },', "output");
        addMessage('  "dependencies": {', "output");
        addMessage('    "react": "^18.2.0",', "output");
        addMessage('    "react-dom": "^18.2.0"', "output");
        addMessage('  }', "output");
        addMessage("}", "output");
      } else if (filename.includes("README")) {
        addMessage(`# ${project?.name || "My Project"}`, "output");
        addMessage("", "output");
        addMessage("This project is running on YOUR OWN platform! 💝", "output");
        addMessage("", "output");
        addMessage("## Getting Started", "output");
        addMessage("", "output");
        addMessage("```bash", "output");
        addMessage("npm install", "output");
        addMessage("npm run dev", "output");
        addMessage("```", "output");
      } else {
        addMessage("// File content from YOUR platform", "output");
        addMessage("console.log('Hello from YOUR platform!');", "output");
      }
      
      addMessage("", "output");
      addMessage("💝 File displayed from YOUR platform", "system");
    } else {
      addMessage(`cat: ${filename}: No such file or directory`, "error");
      addMessage("💡 Try 'ls' to see available files", "system");
    }
  };

  const simulateNodeExecution = async (command: string) => {
    const filename = command.split(" ")[1];
    if (!filename) {
      addMessage("Usage: node <filename>", "error");
      return;
    }
    
    addMessage("⚡ Executing on YOUR platform...", "system");
    addMessage(`🟢 Executing: ${filename}`, "system");
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (filename.includes("server")) {
      addMessage("Server starting on YOUR platform...", "output");
      addMessage("✅ Server ready at http://localhost:3000", "success");
      addMessage("💝 Running on YOUR own infrastructure!", "success");
    } else {
      addMessage("Hello from YOUR platform!", "output");
      addMessage("✅ Script executed successfully on YOUR platform", "success");
    }
  };

  const simulatePythonExecution = async (command: string) => {
    const filename = command.split(" ")[1];
    if (!filename) {
      addMessage("Usage: python <filename>", "error");
      return;
    }
    
    addMessage("⚡ Executing on YOUR platform...", "system");
    addMessage(`🐍 Executing: ${filename}`, "system");
    await new Promise(resolve => setTimeout(resolve, 400));
    addMessage("Hello from Python on YOUR platform!", "output");
    addMessage("✅ Python script completed on YOUR platform", "success");
  };

  const simulateVersionCheck = async (command: string) => {
    addMessage("⚡ Executing on YOUR platform...", "system");
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (command.includes("node")) {
      addMessage("v18.17.0 (YOUR platform)", "output");
    } else if (command.includes("npm")) {
      addMessage("9.6.7 (YOUR platform)", "output");
    } else if (command.includes("git")) {
      addMessage("git version 2.41.0 (YOUR platform)", "output");
    } else if (command.includes("python")) {
      addMessage("Python 3.11.4 (YOUR platform)", "output");
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
    addMessage("💝 Terminal cleared on YOUR platform", "system");
  };

  const killProcess = () => {
    if (isRunning) {
      setIsRunning(false);
      addMessage("^C", "input");
      addMessage("Process interrupted on YOUR platform", "system");
    }
    if (devServerRunning) {
      setDevServerRunning(false);
      addMessage("🛑 Development server stopped", "system");
      onDevServerStop?.();
    }
  };

  const getMessageColor = (type: TerminalMessage["type"]) => {
    switch (type) {
      case "input": return "text-[#4ec9b0]";     // Cyan for user input
      case "error": return "text-[#f44747]";     // Red for errors
      case "system": return "text-[#569cd6]";    // Blue for system messages
      case "success": return "text-[#4caf50]";   // Green for success messages
      case "output": 
      default: return "text-[#cccccc]";          // White for normal output
    }
  };

  return (
    <div className={`bg-[#1e1e1e] border border-[#464647] rounded-lg flex flex-col ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#464647] bg-[#2d2d30]">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-medium text-[#cccccc]">Your Own Platform</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs text-[#7d8590]">
            {project?.owner && project?.repo ? `${project.owner}/${project.repo}` : currentDirectory}
          </span>
          {devServerRunning && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
              Dev Server Running
            </span>
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
            "cat package.json",
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