import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Zap, Server, CheckCircle, FolderOpen, Play } from 'lucide-react';
import { useWebContainer } from '@/contexts/WebContainerContext';

interface TrueWebContainerTerminalProps {
  projectPath?: string;
  onClose?: () => void;
  className?: string;
  onDevServerStart?: (url: string) => void;
  onDevServerStop?: () => void;
  projectFiles?: Record<string, string>;
  openFiles?: Array<{path: string, content: string, sha: string, isModified: boolean}>;
  repoFileTree?: Array<{path: string, type: string, name: string}>;
  project?: {owner: string, repo: string, branch: string};
}

interface TerminalMessage {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

export function TrueWebContainerTerminal({ 
  projectPath = ".", 
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop,
  projectFiles = {},
  openFiles = [],
  repoFileTree = [],
  project
}: TrueWebContainerTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { webContainer, isLoading: webContainerLoading, error: webContainerError, isReady } = useWebContainer();
  const [devServerProcess, setDevServerProcess] = useState<any>(null);
  const [isDevServerRunning, setIsDevServerRunning] = useState(false);
  const [isProjectMounted, setIsProjectMounted] = useState(false);
  
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

  // Mount project files when WebContainer is ready
  useEffect(() => {
    const mountProjectFiles = async () => {
      if (!webContainer || !isReady || isProjectMounted) return;
      
      try {
        addMessage("🚀 Initializing TRUE WebContainer Terminal...", "system");
        addMessage("📦 WebContainer ready - mounting project files...", "system");
        
        // Prepare project files for WebContainer
        const projectFileSystem: Record<string, any> = {};
        
        // Add real project files from editor
        openFiles.forEach(file => {
          const pathParts = file.path.split('/');
          let current = projectFileSystem;
          
          // Create nested directory structure
          for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (!current[part]) {
              current[part] = { directory: {} };
            }
            current = current[part].directory;
          }
          
          // Add file content
          const fileName = pathParts[pathParts.length - 1];
          current[fileName] = {
            file: {
              contents: file.content
            }
          };
        });
        
        // Add default package.json if not present
        if (!projectFileSystem['package.json']) {
          const defaultPackageJson = {
            name: project?.repo || 'webcontainer-project',
            version: '1.0.0',
            description: `Real WebContainer project: ${project?.owner}/${project?.repo}`,
            main: 'index.js',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview',
              start: 'node server.js'
            },
            dependencies: {
              'vite': '^4.4.0'
            },
            devDependencies: {
              '@vitejs/plugin-react': '^4.0.0'
            }
          };
          
          projectFileSystem['package.json'] = {
            file: {
              contents: JSON.stringify(defaultPackageJson, null, 2)
            }
          };
        }
        
        // Add default index.html if not present
        if (!projectFileSystem['index.html']) {
          projectFileSystem['index.html'] = {
            file: {
              contents: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project?.repo || 'WebContainer Project'}</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>`
            }
          };
        }
        
        // Mount the file system
        await webContainer.mount(projectFileSystem);
        setIsProjectMounted(true);
        
        addMessage("✅ Project files mounted successfully!", "system");
        addMessage(`📁 Mounted ${openFiles.length} real project files`, "system");
        addMessage("🔥 TRUE command execution ready!", "system");
        addMessage("💡 Try: npm install, npm run dev, ls, cat package.json", "system");
        
        setIsConnected(true);
        
      } catch (error) {
        console.error('❌ Project mounting failed:', error);
        addMessage(`❌ Project mounting failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        setIsConnected(true); // Still allow basic usage
      }
    };

    if (webContainerError) {
      addMessage(`❌ WebContainer error: ${webContainerError}`, "error");
      addMessage("🔄 Terminal available in simulation mode", "system");
      setIsConnected(true);
    } else if (isReady) {
      mountProjectFiles();
    } else if (webContainerLoading) {
      addMessage("⏳ Loading WebContainer...", "system");
    }
  }, [webContainer, isReady, webContainerError, webContainerLoading, openFiles, project, addMessage, isProjectMounted]);

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
        addMessage("🎯 TRUE WebContainer Terminal - REAL execution:", "system");
        addMessage("", "output");
        addMessage("📦 Package Management (REAL):", "system");
        addMessage("  npm install - Actually installs packages", "output");
        addMessage("  npm run dev - Starts REAL dev server", "output");
        addMessage("  npm run build - REAL build process", "output");
        addMessage("", "output");
        addMessage("🗂️ File Operations (REAL):", "system");
        addMessage("  ls, pwd, cat, mkdir, touch", "output");
        addMessage("", "output");
        addMessage("⚡ ALL COMMANDS EXECUTE FOR REAL!", "system");
        setIsRunning(false);
        return;
      }

      if (!webContainer) {
        addMessage("❌ WebContainer not available - command simulated", "error");
        setIsRunning(false);
        return;
      }

      // Execute REAL command in WebContainer
      addMessage("⚡ Executing REAL command in WebContainer...", "system");
      
      const process = await webContainer.spawn('sh', ['-c', command]);
      
      // Handle special case for dev server
      if (command.includes('npm run dev') || command.includes('vite')) {
        setDevServerProcess(process);
        setIsDevServerRunning(true);
        
        // Listen for server ready
        webContainer.on('server-ready', (port: number, url: string) => {
          addMessage(`🌐 Development server ready at: ${url}`, "system");
          if (onDevServerStart) {
            onDevServerStart(url);
          }
        });
      }
      
      // Stream output in real-time
      const reader = process.output.getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = new TextDecoder().decode(value);
          if (text.trim()) {
            // Split into lines and display each
            const lines = text.split('\n');
            lines.forEach(line => {
              if (line.trim()) {
                addMessage(line, "output");
              }
            });
          }
        }
      } catch (readError) {
        console.log('Stream reading completed or interrupted');
      }
      
      const exitCode = await process.exit;
      
      if (exitCode === 0) {
        addMessage("✅ REAL command completed successfully!", "system");
      } else {
        addMessage(`❌ Command failed with exit code: ${exitCode}`, "error");
      }

    } catch (error) {
      console.error('Command execution error:', error);
      addMessage(`❌ Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const stopDevServer = () => {
    if (devServerProcess) {
      devServerProcess.kill();
      setDevServerProcess(null);
      setIsDevServerRunning(false);
      addMessage("🛑 Development server stopped", "system");
      if (onDevServerStop) {
        onDevServerStop();
      }
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
          <span className="text-sm font-medium text-[#cccccc]">TRUE WebContainer Terminal</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs text-[#7d8590]">({project?.owner}/{project?.repo || projectPath})</span>
          {webContainer && (
            <div className="flex items-center gap-1">
              <Server className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-400">WebContainer</span>
            </div>
          )}
          {isDevServerRunning && (
            <div className="flex items-center gap-1">
              <Play className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">Dev Server</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {isDevServerRunning && (
            <Button
              variant="ghost"
              size="sm"
              onClick={stopDevServer}
              className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
              title="Stop Dev Server"
            >
              <X className="w-3 h-3" />
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
            placeholder={
              isRunning ? "Command running..." : 
              "Type REAL command (WebContainer execution)..."
            }
          />
          {isRunning && (
            <div className="text-[#569cd6] animate-pulse">⚡</div>
          )}
        </div>
      </div>

      {/* Quick Commands */}
      <div className="p-2 border-t border-[#464647] bg-[#252526]">
        <div className="flex gap-1 flex-wrap">
          {[
            "ls",
            "cat package.json",
            "npm install",
            "npm run dev",
            "npm run build",
            "pwd",
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
        {webContainer ? (
          <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
            <Server className="w-3 h-3" />
            TRUE WebContainer execution • REAL npm commands • {openFiles.length} files loaded
          </div>
        ) : (
          <div className="text-xs text-yellow-400 mt-1">
            Loading WebContainer for REAL execution...
          </div>
        )}
      </div>
    </div>
  );
}