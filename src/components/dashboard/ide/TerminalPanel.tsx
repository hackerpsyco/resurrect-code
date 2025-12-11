import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Play, Square, Trash2, Copy, Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { ExtensionsManager } from "./ExtensionsManager";

interface TerminalLine {
  id: string;
  type: "command" | "output" | "error";
  content: string;
  timestamp: Date;
}

interface TerminalPanelProps {
  projectPath?: string;
  onCommandRun?: (command: string) => void;
}

export function TerminalPanel({ projectPath, onCommandRun }: TerminalPanelProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: "welcome",
      type: "output",
      content: `Welcome to ResurrectCI Terminal\nProject: ${projectPath || "No project loaded"}\nType 'help' for available commands`,
      timestamp: new Date(),
    },
  ]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState(projectPath || "~");
  const [showExtensions, setShowExtensions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = (type: TerminalLine["type"], content: string) => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setLines((prev) => [...prev, newLine]);
  };

  const runCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    addLine("command", `$ ${command}`);
    setCurrentCommand("");
    setIsRunning(true);

    try {
      // Handle built-in commands
      if (command === "help") {
        addLine("output", `Available commands:
• npm install - Install dependencies
• npm run dev - Start development server
• npm run build - Build for production
• npm run preview - Preview production build
• ls - List files
• pwd - Show current directory
• clear - Clear terminal
• help - Show this help`);
        setIsRunning(false);
        return;
      }

      if (command === "clear") {
        setLines([]);
        setIsRunning(false);
        return;
      }

      if (command === "pwd") {
        addLine("output", currentDirectory);
        setIsRunning(false);
        return;
      }

      // Simulate command execution
      await simulateCommand(command);
      onCommandRun?.(command);

    } catch (error) {
      addLine("error", `Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsRunning(false);
    }
  };

  const simulateCommand = async (command: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (command.startsWith("npm install")) {
          addLine("output", "📦 Installing dependencies...");
          setTimeout(() => {
            addLine("output", "✅ Dependencies installed successfully!");
            addLine("output", "added 396 packages in 23s");
            resolve();
          }, 2000);
        } else if (command.startsWith("npm run dev")) {
          addLine("output", "🚀 Starting development server...");
          setTimeout(() => {
            addLine("output", "✅ Server running at http://localhost:8080");
            addLine("output", "📱 Network: http://192.168.1.100:8080");
            resolve();
          }, 1500);
        } else if (command.startsWith("npm run build")) {
          addLine("output", "🏗️ Building for production...");
          setTimeout(() => {
            addLine("output", "✅ Build completed successfully!");
            addLine("output", "📦 Output: dist/ (2.3 MB)");
            resolve();
          }, 3000);
        } else if (command === "ls") {
          addLine("output", `src/
public/
package.json
README.md
vite.config.ts
tsconfig.json`);
          resolve();
        } else {
          addLine("output", `Command executed: ${command}`);
          resolve();
        }
      }, 500);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isRunning) {
      runCommand(currentCommand);
    }
  };

  const quickCommands = [
    { label: "Install", command: "npm install", icon: "📦" },
    { label: "Dev Server", command: "npm run dev", icon: "🚀" },
    { label: "Build", command: "npm run build", icon: "🏗️" },
    { label: "List Files", command: "ls", icon: "📁" },
  ];

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  if (showExtensions) {
    return <ExtensionsManager onClose={() => setShowExtensions(false)} />;
  }

  return (
    <Card className="h-full flex flex-col bg-black text-green-400 font-mono">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 bg-gray-900">
        <CardTitle className="text-sm flex items-center gap-2 text-green-400">
          <Terminal className="w-4 h-4" />
          Terminal - {currentDirectory}
        </CardTitle>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLines([])}
            className="h-7 text-gray-400 hover:text-white"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>

      {/* Quick Commands */}
      <div className="px-3 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex gap-2 overflow-x-auto">
          {quickCommands.map((cmd) => (
            <Button
              key={cmd.command}
              size="sm"
              variant="outline"
              className="shrink-0 text-xs bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={isRunning}
              onClick={() => runCommand(cmd.command)}
            >
              <span className="mr-1">{cmd.icon}</span>
              {cmd.label}
            </Button>
          ))}
          <div className="border-l border-gray-600 mx-2" />
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-xs bg-blue-800 border-blue-600 text-blue-300 hover:bg-blue-700"
            onClick={() => setShowExtensions(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Extensions
          </Button>
        </div>
      </div>

      {/* Terminal Output */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="p-3 space-y-1">
            {lines.map((line) => (
              <div
                key={line.id}
                className={`text-sm whitespace-pre-wrap group relative ${
                  line.type === "command"
                    ? "text-yellow-400 font-semibold"
                    : line.type === "error"
                    ? "text-red-400"
                    : "text-green-300"
                }`}
              >
                {line.content}
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 h-5 w-5 p-0 text-gray-500 hover:text-white"
                  onClick={() => copyToClipboard(line.content)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            ))}
            {isRunning && (
              <div className="text-yellow-400 text-sm flex items-center gap-2">
                <div className="animate-spin">⚡</div>
                Running command...
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Command Input */}
      <div className="p-3 bg-gray-900 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-sm">$</span>
          <Input
            ref={inputRef}
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            disabled={isRunning}
            className="bg-transparent border-none text-green-400 placeholder-gray-500 focus:ring-0 focus:border-none"
          />
          <Button
            size="sm"
            onClick={() => runCommand(currentCommand)}
            disabled={!currentCommand.trim() || isRunning}
            className="bg-green-600 hover:bg-green-700 text-black"
          >
            {isRunning ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}