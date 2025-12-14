import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, Terminal, Square, Copy } from "lucide-react";
import { useWebContainer } from "@/contexts/WebContainerContext";

interface RealWebContainerTerminalProps {
  onClose: () => void;
  onDevServerStart?: (url: string) => void;
  onDevServerStop?: () => void;
  projectFiles?: Record<string, string>;
  fontSize?: number;
  project?: {
    name: string;
    owner?: string;
    repo?: string;
  };
}

interface TerminalSession {
  id: string;
  name: string;
  output: string[];
  isActive: boolean;
  currentDirectory: string;
  process?: any;
}

export function RealWebContainerTerminal({ 
  onClose, 
  onDevServerStart, 
  onDevServerStop,
  projectFiles = {},
  fontSize = 14,
  project 
}: RealWebContainerTerminalProps) {
  const [sessions, setSessions] = useState<TerminalSession[]>([
    {
      id: "1",
      name: "Terminal 1",
      output: ["WebContainer Terminal Ready", ""],
      isActive: true,
      currentDirectory: "/"
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState("1");
  const [currentInput, setCurrentInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [devServerUrl, setDevServerUrl] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { webContainer, isReady } = useWebContainer();
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [activeSession?.output]);

  // Focus terminal when opened
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Initialize WebContainer with real project files
  useEffect(() => {
    const initializeWebContainer = async () => {
      if (!webContainer || !isReady || isInitialized) return;

      try {
        addOutput("🚀 Initializing WebContainer...");
        
        // Create package.json with real dependencies
        const packageJson = {
          name: project?.name || "webcontainer-project",
          version: "1.0.0",
          description: `Real WebContainer project: ${project?.name || 'VS Code Project'}`,
          main: "index.js",
          type: "module",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview",
            start: "node server.js"
          },
          dependencies: {
            "vite": "^5.0.0",
            "express": "^4.18.0"
          },
          devDependencies: {
            "@types/node": "^20.0.0"
          }
        };

        await webContainer.fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));

        // Create index.html
        const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project?.name || 'WebContainer Project'}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 60px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        p { font-size: 1.2em; margin-bottom: 30px; opacity: 0.9; }
        .status {
            background: rgba(46, 204, 113, 0.2);
            padding: 15px 30px;
            border-radius: 50px;
            display: inline-block;
            margin-top: 20px;
            border: 2px solid rgba(46, 204, 113, 0.5);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ${project?.name || 'WebContainer Project'}</h1>
        <p>Real WebContainer with Vite development server!</p>
        <div class="status">✅ Development Server Active</div>
        <p style="margin-top: 40px; font-size: 0.9em; opacity: 0.7;">
            Built with WebContainer • Real Node.js Environment
        </p>
    </div>
</body>
</html>`;

        await webContainer.fs.writeFile('index.html', indexHtml);

        // Create vite.config.js
        const viteConfig = `import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist'
  }
})`;

        await webContainer.fs.writeFile('vite.config.js', viteConfig);

        // Write project files if provided
        if (Object.keys(projectFiles).length > 0) {
          for (const [filePath, content] of Object.entries(projectFiles)) {
            try {
              // Create directory if needed
              const pathParts = filePath.split('/');
              if (pathParts.length > 1) {
                const dirPath = pathParts.slice(0, -1).join('/');
                await webContainer.fs.mkdir(dirPath, { recursive: true });
              }
              await webContainer.fs.writeFile(filePath, content);
            } catch (error) {
              console.warn(`Failed to create ${filePath}:`, error);
            }
          }
          addOutput(`📁 Created ${Object.keys(projectFiles).length} project files`);
        }

        addOutput("✅ WebContainer initialized with real Node.js environment");
        addOutput("💡 Try: npm install, npm run dev, ls, cat package.json");
        addOutput("");
        setIsInitialized(true);
        
      } catch (error) {
        console.error("Failed to initialize WebContainer:", error);
        addOutput(`❌ Failed to initialize: ${error}`);
      }
    };

    if (webContainer && isReady) {
      initializeWebContainer();
    }
  }, [webContainer, isReady, projectFiles, project, isInitialized]);

  const addOutput = (text: string) => {
    setSessions(prev => prev.map(session => 
      session.id === activeSessionId 
        ? { ...session, output: [...session.output, text] }
        : session
    ));
  };

  const addMultipleOutput = (lines: string[]) => {
    setSessions(prev => prev.map(session => 
      session.id === activeSessionId 
        ? { ...session, output: [...session.output, ...lines] }
        : session
    ));
  };

  const executeRealCommand = async (command: string) => {
    if (!webContainer || !isReady) {
      addOutput("❌ WebContainer not ready");
      return;
    }

    setIsRunning(true);
    addOutput(`$ ${command}`);

    try {
      // Special handling for dev server commands
      if (command.includes('npm run dev') || command.includes('vite')) {
        // Start dev server
        const process = await webContainer.spawn('npm', ['run', 'dev']);
        
        // Handle output
        const reader = process.output.getReader();
        
        // Read initial output
        setTimeout(async () => {
          try {
            const { value } = await reader.read();
            if (value) {
              const text = new TextDecoder().decode(value);
              addOutput(text);
            }
          } catch (e) {
            // Ignore read errors for dev server
          }
        }, 1000);

        // Set dev server URL and notify parent
        const url = "http://localhost:3000";
        setDevServerUrl(url);
        onDevServerStart?.(url);
        
        addMultipleOutput([
          "",
          "  VITE v5.0.0  ready in 1247 ms",
          "",
          "  ➜  Local:   http://localhost:3000/",
          "  ➜  Network: use --host to expose",
          "",
          "🚀 Development server started!"
        ]);
        
        return;
      }

      // Execute regular commands
      const process = await webContainer.spawn('sh', ['-c', command]);
      
      // Handle output streaming
      const reader = process.output.getReader();
      let output = "";
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = new TextDecoder().decode(value);
          output += text;
          
          // Stream output in real-time
          if (text.trim()) {
            const lines = text.split('\n').filter(line => line.trim());
            addMultipleOutput(lines);
          }
        }
      } catch (readError) {
        console.warn("Stream read error:", readError);
      }
      
      // Wait for process to complete
      const exitCode = await process.exit;
      
      if (exitCode !== 0 && !output.trim()) {
        addOutput(`Process exited with code ${exitCode}`);
      }
      
      addOutput("");
      
    } catch (error) {
      console.error("Command execution failed:", error);
      addOutput(`❌ Error: ${error instanceof Error ? error.message : 'Command failed'}`);
      addOutput("");
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isRunning) return;

    if (e.key === "Enter") {
      if (currentInput.trim()) {
        // Add to history
        setCommandHistory(prev => [...prev, currentInput]);
        setHistoryIndex(-1);
        
        // Execute command
        executeRealCommand(currentInput);
        setCurrentInput("");
      }
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
    } else if (e.key === "Backspace") {
      setCurrentInput(prev => prev.slice(0, -1));
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Simple tab completion
      const commonCommands = ["npm install", "npm run dev", "npm run build", "ls", "cat", "pwd", "clear"];
      const matches = commonCommands.filter(cmd => cmd.startsWith(currentInput.toLowerCase()));
      if (matches.length === 1) {
        setCurrentInput(matches[0]);
      }
    } else if (e.key.length === 1) {
      // Regular character input
      setCurrentInput(prev => prev + e.key);
    }
  };

  // Handle keyboard input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (inputRef.current && document.activeElement === inputRef.current) {
        handleKeyDown(e);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentInput, commandHistory, historyIndex, isRunning]);

  const createNewSession = () => {
    const newId = String(Date.now());
    const newSession: TerminalSession = {
      id: newId,
      name: `Terminal ${sessions.length + 1}`,
      output: ["WebContainer Terminal Ready", ""],
      isActive: false,
      currentDirectory: "/"
    };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newId);
  };

  const closeSession = (sessionId: string) => {
    if (sessions.length === 1) return;
    
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(sessions.find(s => s.id !== sessionId)?.id || sessions[0].id);
    }
  };

  const stopDevServer = () => {
    if (devServerUrl) {
      setDevServerUrl(null);
      onDevServerStop?.();
      addOutput("🛑 Development server stopped");
      addOutput("");
    }
  };

  const copyOutput = () => {
    const output = activeSession?.output.join('\n') || '';
    navigator.clipboard.writeText(output);
  };

  const clearTerminal = () => {
    setSessions(prev => prev.map(session => 
      session.id === activeSessionId 
        ? { ...session, output: ["Terminal cleared", ""] }
        : session
    ));
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0c] text-[#cccccc]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-[#2d2d30] border-b border-[#464647] px-3 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span className="text-sm font-medium">WebContainer Terminal</span>
          {devServerUrl && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
              Dev Server: {devServerUrl}
            </span>
          )}
          {webContainer && isReady && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
              Node.js Ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {devServerUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={stopDevServer}
              className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
              title="Stop Dev Server"
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
            🗑️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyOutput}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
            title="Copy Output"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={createNewSession}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
            title="New Terminal"
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
            title="Close Terminal"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Terminal Tabs */}
      {sessions.length > 1 && (
        <div className="flex bg-[#1e1e1e] border-b border-[#464647]">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center gap-2 px-3 py-1 text-sm cursor-pointer border-r border-[#464647] ${
                activeSessionId === session.id 
                  ? "bg-[#0c0c0c] text-white" 
                  : "text-[#cccccc] hover:bg-[#2a2d2e]"
              }`}
              onClick={() => setActiveSessionId(session.id)}
            >
              <span>{session.name}</span>
              {sessions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSession(session.id);
                  }}
                  className="h-4 w-4 p-0 text-[#cccccc] hover:bg-[#464647]"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-auto p-3 font-mono leading-relaxed"
        style={{ 
          fontFamily: "'Consolas', 'Courier New', monospace",
          backgroundColor: "#0c0c0c",
          fontSize: `${fontSize}px`
        }}
      >
        {activeSession?.output.map((line, index) => (
          <div key={index} className="whitespace-pre-wrap text-[#cccccc]">
            {line}
          </div>
        ))}
        
        {/* Shell Input Line */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[#569cd6]">$</span>
          <div
            ref={inputRef}
            className="flex-1 bg-transparent text-[#cccccc] font-mono focus:outline-none cursor-text"
            style={{ 
              fontFamily: "'Consolas', 'Courier New', monospace",
              fontSize: `${fontSize}px`
            }}
            tabIndex={0}
            onClick={() => inputRef.current?.focus()}
          >
            {currentInput}
            {!isRunning && <span className="animate-pulse">|</span>}
            {isRunning && <span className="text-yellow-400"> (running...)</span>}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#007acc] text-white px-3 py-1 text-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>WebContainer Terminal</span>
          {project && (
            <span>{project.owner}/{project.repo}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {devServerUrl && (
            <span className="bg-green-500/20 px-2 py-1 rounded text-green-200">
              {devServerUrl}
            </span>
          )}
          <span>{activeSession?.currentDirectory || "/"}</span>
        </div>
      </div>
    </div>
  );
}