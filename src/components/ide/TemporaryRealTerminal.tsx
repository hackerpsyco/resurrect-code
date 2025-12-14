import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Zap, Server, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TemporaryRealTerminalProps {
  projectPath?: string;
  onClose?: () => void;
  className?: string;
  onDevServerStart?: (url: string) => void;
  onDevServerStop?: () => void;
  projectFiles?: Record<string, string>;
}

interface TerminalMessage {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

export function TemporaryRealTerminal({ 
  projectPath = ".", 
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop,
  projectFiles = {}
}: TemporaryRealTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDirectory, setCurrentDirectory] = useState("/workspace");
  
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

  // Initialize temporary real terminal
  useEffect(() => {
    const initializeTemporaryRealTerminal = async () => {
      try {
        addMessage("🚀 Initializing Temporary Real Terminal...", "system");
        addMessage("⚠️ Using alternative execution while Supabase function is being deployed", "system");
        addMessage("🔧 Setting up local simulation with real-like behavior...", "system");
        
        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsConnected(true);
        setCurrentDirectory(`/workspace/${projectPath}`);
        
        addMessage("✅ Temporary Real Terminal Ready!", "system");
        addMessage(`📁 Working directory: ${currentDirectory}`, "system");
        addMessage("🎯 This simulates real command execution with actual logic!", "system");
        addMessage("💡 Deploy the Supabase function for TRUE real execution", "system");
        addMessage("", "output");
        addMessage("Available commands:", "system");
        addMessage("• ls, pwd, cat, echo, mkdir, touch", "output");
        addMessage("• npm install, npm run dev, npm run build", "output");
        addMessage("• node --version, npm --version", "output");
        addMessage("• git status, git log", "output");
        
      } catch (error) {
        console.error('❌ Temporary terminal initialization failed:', error);
        addMessage(`❌ Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
      }
    };

    initializeTemporaryRealTerminal();
  }, [projectPath, addMessage, currentDirectory]);

  const executeTemporaryRealCommand = async (command: string) => {
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
        addMessage("🎯 Temporary Real Terminal - Advanced Simulation:", "system");
        addMessage("", "output");
        addMessage("📦 Package Management:", "system");
        addMessage("  npm install, npm run dev, npm run build, yarn install", "output");
        addMessage("", "output");
        addMessage("🗂️ File Operations:", "system");
        addMessage("  ls -la, pwd, cat file.txt, mkdir dir, touch file", "output");
        addMessage("", "output");
        addMessage("🔧 System Commands:", "system");
        addMessage("  node --version, npm --version, whoami, uname -a", "output");
        addMessage("", "output");
        addMessage("⚠️ Deploy Supabase function for REAL Linux execution!", "system");
        setIsRunning(false);
        return;
      }

      // Simulate command execution with realistic responses
      addMessage("⚡ Executing command with advanced simulation...", "system");
      
      // Add realistic delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      const cmd = command.toLowerCase().trim();
      let output = '';
      let success = true;

      if (cmd === 'pwd') {
        output = currentDirectory;
        
      } else if (cmd === 'whoami') {
        output = 'developer';
        
      } else if (cmd === 'uname -a' || cmd === 'uname') {
        output = 'Linux terminal-server 5.15.0-72-generic #79-Ubuntu SMP Wed Apr 19 08:22:18 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux';
        
      } else if (cmd.startsWith('ls')) {
        if (cmd.includes('-la') || cmd.includes('-l')) {
          output = `total 24
drwxr-xr-x 6 developer developer 4096 Dec 13 10:30 .
drwxr-xr-x 3 root      root      4096 Dec 13 09:15 ..
-rw-r--r-- 1 developer developer  585 Dec 13 10:25 .gitignore
drwxr-xr-x 8 developer developer 4096 Dec 13 10:30 .git
drwxr-xr-x 2 developer developer 4096 Dec 13 10:28 node_modules
-rw-r--r-- 1 developer developer 1247 Dec 13 10:25 package.json
-rw-r--r-- 1 developer developer 2156 Dec 13 10:28 README.md
drwxr-xr-x 3 developer developer 4096 Dec 13 10:29 src`;
        } else {
          output = `.gitignore  node_modules  package.json  README.md  src`;
        }
        
      } else if (cmd.startsWith('cat')) {
        const filename = cmd.split(' ')[1];
        if (filename === 'package.json') {
          output = `{
  "name": "${projectPath}",
  "version": "1.0.0",
  "description": "Real project simulation",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "node server.js"
  },
  "dependencies": {
    "react": "^18.2.0",
    "vite": "^4.4.0"
  }
}`;
        } else if (filename === 'README.md') {
          output = `# ${projectPath}

This is a simulated real project environment.
Deploy the Supabase function for TRUE real execution!

## Available Commands
- npm install
- npm run dev
- npm run build`;
        } else {
          output = `cat: ${filename}: No such file or directory`;
          success = false;
        }
        
      } else if (cmd.includes('npm install') || cmd.includes('yarn install')) {
        output = `📦 Installing dependencies for ${projectPath}...
⬇️  Downloading packages...
⬇️  react@18.2.0
⬇️  vite@4.4.0
⬇️  @types/react@18.2.15
✅ Dependencies installed successfully!
📊 Added 847 packages in 12.3s
💡 Run 'npm run dev' to start development server`;
        
      } else if (cmd.includes('npm run dev') || cmd.includes('yarn dev')) {
        const port = 5173;
        const devUrl = `http://localhost:${port}`;
        output = `🚀 Starting development server for ${projectPath}...
📁 Project directory: ${currentDirectory}
✅ Vite development server ready!
🌐 Local:   ${devUrl}/
📱 Network: use --host to expose
🔥 Hot Module Replacement enabled
🎉 Development server is running!`;
        
        if (onDevServerStart) {
          onDevServerStart(devUrl);
        }
        
      } else if (cmd.includes('npm run build') || cmd.includes('yarn build')) {
        output = `🏗️  Building ${projectPath} for production...
📦 Bundling assets...
✓ 47 modules transformed.
📦 dist/index.html                   0.46 kB │ gzip:  0.30 kB
📦 dist/assets/index-d526a0c5.css    1.42 kB │ gzip:  0.74 kB
📦 dist/assets/index-4b9c4f84.js   143.61 kB │ gzip: 46.11 kB
✅ Build completed successfully!
📊 Output: dist/ (145.5 kB)
🚀 Ready for deployment!`;
        
      } else if (cmd.includes('--version')) {
        if (cmd.includes('node')) {
          output = 'v18.17.0';
        } else if (cmd.includes('npm')) {
          output = '9.6.7';
        } else {
          output = 'Version information not available';
        }
        
      } else if (cmd.includes('git status')) {
        output = `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

        modified:   src/App.tsx
        modified:   package.json

no changes added to commit (use "git add ." or "git commit -a")`;
        
      } else if (cmd.includes('git log')) {
        output = `commit a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0 (HEAD -> main)
Author: Developer <dev@example.com>
Date:   ${new Date().toDateString()}

    Add real terminal functionality

commit d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0a1b2c3d4
Author: Developer <dev@example.com>
Date:   ${new Date(Date.now() - 86400000).toDateString()}

    Initial project setup`;
        
      } else if (cmd.startsWith('echo')) {
        const text = command.substring(4).trim().replace(/['"]/g, '');
        output = text;
        
      } else if (cmd.startsWith('mkdir')) {
        const dirname = cmd.split(' ')[1];
        output = `Directory '${dirname}' created successfully`;
        
      } else if (cmd.startsWith('touch')) {
        const filename = cmd.split(' ')[1];
        output = `File '${filename}' created successfully`;
        
      } else {
        output = `Command executed: ${command}
Project: ${projectPath}
Directory: ${currentDirectory}
⚠️ This is advanced simulation - deploy Supabase function for REAL execution!`;
      }

      // Display output
      if (output) {
        const lines = output.split('\n');
        lines.forEach(line => {
          addMessage(line, success ? "output" : "error");
        });
      }
      
      if (success) {
        addMessage("✅ Command completed (simulated)", "system");
      } else {
        addMessage("❌ Command failed (simulated)", "error");
      }

    } catch (error) {
      addMessage(`❌ Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isRunning) {
      executeTemporaryRealCommand(currentInput);
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
          <span className="text-sm font-medium text-[#cccccc]">Temporary Real Terminal</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
          <span className="text-xs text-[#7d8590]">({projectPath})</span>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
            <span className="text-xs text-yellow-400">Advanced Simulation</span>
          </div>
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
            disabled={isRunning || !isConnected}
            className="flex-1 bg-transparent border-none p-0 text-[#cccccc] focus:ring-0 focus:outline-none"
            placeholder={
              !isConnected ? "Connecting..." :
              isRunning ? "Command running..." : 
              "Type a command (advanced simulation)..."
            }
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
            "ls -la",
            "pwd", 
            "whoami",
            "npm install",
            "npm run dev",
            "node --version",
            "help"
          ].map((cmd) => (
            <Button
              key={cmd}
              variant="ghost"
              size="sm"
              onClick={() => executeTemporaryRealCommand(cmd)}
              disabled={isRunning || !isConnected}
              className="h-6 px-2 text-xs text-[#cccccc] hover:bg-[#464647] disabled:opacity-50"
            >
              {cmd}
            </Button>
          ))}
        </div>
        <div className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Advanced simulation mode • Deploy Supabase function for REAL execution
        </div>
      </div>
    </div>
  );
}