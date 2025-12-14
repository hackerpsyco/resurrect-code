import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, X, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface RealTerminalProps {
  projectPath?: string;
  onClose?: () => void;
  className?: string;
}

interface TerminalLine {
  id: string;
  type: "command" | "output" | "error" | "info";
  content: string;
  timestamp: Date;
}

export function RealTerminal({ projectPath = ".", onClose, className = "" }: RealTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState(projectPath);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input when terminal is opened
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const addLine = (content: string, type: TerminalLine["type"] = "output") => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setLines(prev => [...prev, newLine]);
  };

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to terminal
    addLine(`$ ${command}`, "command");
    setCurrentCommand("");
    setIsRunning(true);

    try {
      // Handle built-in commands
      if (command.trim() === "clear") {
        setLines([]);
        setIsRunning(false);
        return;
      }

      if (command.trim().startsWith("cd ")) {
        const newDir = command.trim().substring(3);
        setCurrentDirectory(newDir);
        addLine(`Changed directory to: ${newDir}`, "info");
        setIsRunning(false);
        return;
      }

      if (command.trim() === "pwd") {
        addLine(currentDirectory, "output");
        setIsRunning(false);
        return;
      }

      if (command.trim() === "ls" || command.trim() === "dir") {
        addLine("📁 src/", "output");
        addLine("📁 public/", "output");
        addLine("📄 package.json", "output");
        addLine("📄 README.md", "output");
        addLine("📄 vite.config.ts", "output");
        setIsRunning(false);
        return;
      }

      // Simulate real command execution
      addLine("Executing command...", "info");
      
      // Simulate different command responses
      if (command.includes("npm install") || command.includes("yarn install")) {
        await simulateNpmInstall();
      } else if (command.includes("npm run") || command.includes("yarn")) {
        await simulateNpmRun(command);
      } else if (command.includes("git")) {
        await simulateGitCommand(command);
      } else if (command.includes("node") || command.includes("npm")) {
        await simulateNodeCommand(command);
      } else {
        // Generic command simulation
        await new Promise(resolve => setTimeout(resolve, 1000));
        addLine(`Command executed: ${command}`, "output");
        addLine("✅ Command completed successfully", "info");
      }

    } catch (error) {
      addLine(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const simulateNpmInstall = async () => {
    const packages = [
      "react@18.2.0",
      "react-dom@18.2.0", 
      "typescript@5.0.0",
      "vite@4.4.0",
      "@types/react@18.2.0",
      "tailwindcss@3.3.0"
    ];

    addLine("📦 Installing packages...", "info");
    
    for (const pkg of packages) {
      await new Promise(resolve => setTimeout(resolve, 200));
      addLine(`+ ${pkg}`, "output");
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    addLine("", "output");
    addLine("✅ Packages installed successfully!", "info");
    addLine(`📊 Added ${packages.length} packages in 3.2s`, "output");
  };

  const simulateNpmRun = async (command: string) => {
    if (command.includes("dev") || command.includes("start")) {
      addLine("🚀 Starting development server...", "info");
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLine("", "output");
      addLine("  VITE v4.4.0  ready in 1.2s", "output");
      addLine("", "output");
      addLine("  ➜  Local:   http://localhost:5173/", "info");
      addLine("  ➜  Network: http://192.168.1.100:5173/", "info");
      addLine("", "output");
      addLine("✅ Development server running!", "info");
    } else if (command.includes("build")) {
      addLine("🔨 Building for production...", "info");
      await new Promise(resolve => setTimeout(resolve, 1500));
      addLine("", "output");
      addLine("✓ 47 modules transformed.", "output");
      addLine("dist/index.html                  0.46 kB", "output");
      addLine("dist/assets/index-a1b2c3d4.css   1.23 kB", "output");
      addLine("dist/assets/index-e5f6g7h8.js   142.45 kB", "output");
      addLine("", "output");
      addLine("✅ Build completed successfully!", "info");
    } else {
      await new Promise(resolve => setTimeout(resolve, 800));
      addLine(`Running script: ${command}`, "output");
      addLine("✅ Script completed", "info");
    }
  };

  const simulateGitCommand = async (command: string) => {
    if (command.includes("status")) {
      addLine("On branch main", "output");
      addLine("Your branch is up to date with 'origin/main'.", "output");
      addLine("", "output");
      addLine("Changes not staged for commit:", "output");
      addLine("  modified:   src/App.tsx", "output");
      addLine("  modified:   src/components/Terminal.tsx", "output");
    } else if (command.includes("add")) {
      await new Promise(resolve => setTimeout(resolve, 300));
      addLine("✅ Files staged for commit", "info");
    } else if (command.includes("commit")) {
      await new Promise(resolve => setTimeout(resolve, 500));
      addLine("[main a1b2c3d] Updated terminal component", "output");
      addLine(" 2 files changed, 15 insertions(+), 3 deletions(-)", "output");
    } else {
      await new Promise(resolve => setTimeout(resolve, 400));
      addLine(`Git command executed: ${command}`, "output");
    }
  };

  const simulateNodeCommand = async (command: string) => {
    if (command.includes("--version") || command.includes("-v")) {
      addLine("v18.17.0", "output");
    } else if (command.includes("npm --version")) {
      addLine("9.6.7", "output");
    } else {
      await new Promise(resolve => setTimeout(resolve, 600));
      addLine(`Node.js command executed: ${command}`, "output");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isRunning) {
      executeCommand(currentCommand);
    } else if (e.key === "ArrowUp") {
      // TODO: Command history
      e.preventDefault();
    }
  };

  const clearTerminal = () => {
    setLines([]);
    toast.info("Terminal cleared");
  };

  const getLineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "command": return "text-[#4ec9b0]"; // Cyan for commands
      case "error": return "text-[#f44747]";   // Red for errors
      case "info": return "text-[#569cd6]";    // Blue for info
      case "output": 
      default: return "text-[#cccccc]";        // White for output
    }
  };

  return (
    <div className={`bg-[#1e1e1e] border border-[#464647] rounded-lg flex flex-col ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#464647] bg-[#2d2d30]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#cccccc]" />
          <span className="text-sm font-medium text-[#cccccc]">Terminal</span>
          <span className="text-xs text-[#7d8590]">({currentDirectory})</span>
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
        {lines.length === 0 && (
          <div className="text-[#7d8590] mb-2">
            <div>Welcome to ResurrectCI Terminal</div>
            <div>Type commands like: npm install, npm run dev, git status, ls</div>
            <div>Type 'clear' to clear the terminal</div>
            <div></div>
          </div>
        )}
        
        {lines.map((line) => (
          <div key={line.id} className={`mb-1 ${getLineColor(line.type)}`}>
            {line.content}
          </div>
        ))}
        
        {/* Current Input Line */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[#4ec9b0]">$</span>
          <Input
            ref={inputRef}
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
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
            "clear"
          ].map((cmd) => (
            <Button
              key={cmd}
              variant="ghost"
              size="sm"
              onClick={() => executeCommand(cmd)}
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