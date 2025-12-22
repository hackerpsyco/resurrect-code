import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, Terminal, Square, Copy } from "lucide-react";
import { useWebContainer } from "@/contexts/WebContainerContext";
import { useGitHub } from "@/hooks/useGitHub";

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
    branch?: string;
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
  const { fetchFile, fetchFileTree } = useGitHub();
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const outputBufferRef = useRef<string>('');
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasAutoInstalled, setHasAutoInstalled] = useState(false);

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

  // Initialize WebContainer with real project files from GitHub
  useEffect(() => {
    const initializeWebContainer = async () => {
      if (!webContainer || !isReady || isInitialized) return;

      try {
        addOutput("🚀 Initializing WebContainer...");
        
        // If project has GitHub owner/repo, load real files
        if (project?.owner && project?.repo) {
          addOutput(`📥 Loading project files from GitHub: ${project.owner}/${project.repo}`);
          
          try {
            // Get file tree
            const files = await fetchFileTree(project.owner, project.repo, project.branch || 'main');
            
            if (files && files.length > 0) {
              // Filter out node_modules, .git, etc.
              const projectFiles = files.filter(file => 
                !file.path.includes('node_modules') && 
                !file.path.includes('.git/') &&
                !file.path.includes('dist/') &&
                !file.path.includes('build/')
              );
              
              addOutput(`📂 Found ${projectFiles.length} files, loading...`);
              
              // Load files into WebContainer (limit to important files first)
              const importantFiles = projectFiles.filter(file => 
                file.type === 'file' && (
                  file.path === 'package.json' ||
                  file.path === 'package-lock.json' ||
                  file.path === 'yarn.lock' ||
                  file.path === 'tsconfig.json' ||
                  file.path === 'vite.config.js' ||
                  file.path === 'vite.config.ts' ||
                  file.path === 'index.html' ||
                  file.path.startsWith('src/') ||
                  file.path.startsWith('app/') ||
                  file.path.startsWith('components/') ||
                  file.path.endsWith('.ts') ||
                  file.path.endsWith('.tsx') ||
                  file.path.endsWith('.js') ||
                  file.path.endsWith('.jsx')
                )
              ).slice(0, 50); // Limit to first 50 important files
              
              let loadedCount = 0;
              for (const file of importantFiles) {
                try {
                  const fileContent = await fetchFile(project.owner!, project.repo!, file.path, project.branch);
                  if (fileContent?.content) {
                    // Create directory if needed
                    const pathParts = file.path.split('/');
                    if (pathParts.length > 1) {
                      const dirPath = pathParts.slice(0, -1).join('/');
                      await webContainer.fs.mkdir(dirPath, { recursive: true });
                    }
                    await webContainer.fs.writeFile(file.path, fileContent.content);
                    loadedCount++;
                  }
                } catch (error) {
                  console.warn(`Failed to load ${file.path}:`, error);
                }
              }
              
              addOutput(`✅ Loaded ${loadedCount} project files`);
              
              // Check if package.json exists and auto-install
              try {
                const packageJsonContent = await webContainer.fs.readFile('package.json', 'utf-8');
                if (packageJsonContent) {
                  addOutput("📦 Found package.json, installing dependencies...");
                  addOutput("");
                  
                  // Auto-run npm install
                  const installProcess = await webContainer.spawn('npm', ['install']);
                  const installReader = installProcess.output.getReader();
                  const installDecoder = new TextDecoder();
                  
                  (async () => {
                    try {
                      while (true) {
                        const { done, value } = await installReader.read();
                        if (done) break;
                        if (!value) continue;
                        
                        let text = "";
                        if (value instanceof Uint8Array) {
                          text = installDecoder.decode(value);
                        } else if (value instanceof ArrayBuffer) {
                          text = installDecoder.decode(new Uint8Array(value));
                        } else if (typeof value === 'string') {
                          text = value;
                        } else {
                          continue;
                        }
                        
                        const cleaned = stripAnsiCodes(text);
                        if (cleaned.trim()) {
                          addToBuffer(cleaned);
                        }
                      }
                      
                      const exitCode = await installProcess.exit;
                      if (exitCode === 0) {
                        addOutput("");
                        addOutput("✅ Dependencies installed successfully!");
                        addOutput("💡 Ready to run: npm run dev");
                      } else {
                        addOutput("");
                        addOutput(`⚠️ npm install exited with code ${exitCode}`);
                      }
                      addOutput("");
                      setHasAutoInstalled(true);
                    } catch (e) {
                      console.warn("npm install stream error:", e);
                    }
                  })();
                }
              } catch (error) {
                // No package.json found, that's okay
                addOutput("ℹ️ No package.json found, skipping auto-install");
              }
            } else {
              addOutput("⚠️ No files found in repository");
            }
          } catch (error) {
            console.error("Failed to load GitHub files:", error);
            addOutput(`⚠️ Could not load files from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
            addOutput("💡 You can still use the terminal manually");
          }
        } else {
          // No GitHub project, use provided projectFiles or create demo
          if (Object.keys(projectFiles || {}).length > 0) {
            for (const [filePath, content] of Object.entries(projectFiles!)) {
              try {
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
            addOutput(`📁 Created ${Object.keys(projectFiles!).length} project files`);
          }
        }

        addOutput("✅ WebContainer initialized with real Node.js environment");
        if (!hasAutoInstalled) {
          addOutput("💡 Try: npm install, npm run dev, ls, cat package.json");
        }
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
  }, [webContainer, isReady, projectFiles, project, isInitialized, fetchFileTree, fetchFile, hasAutoInstalled]);

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

  // Strip ANSI escape codes from terminal output - AGGRESSIVE filtering
  const stripAnsiCodes = (text: string): string => {
    if (!text) return '';
    
    // Remove ALL ANSI escape sequences
    let cleaned = text
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // ANSI escape codes [0K, [1G, [31m, etc.
      .replace(/\x1b\]8;;.*?\x1b\\/g, '') // Hyperlink escape sequences
      .replace(/\x1b\[K/g, '') // Clear line
      .replace(/\x1b\[[0-9]+G/g, '') // Cursor positioning
      .replace(/\x1b\[[0-9]+m/g, '') // Color codes
      .replace(/\x1b\[H/g, '') // Home cursor
      .replace(/\x1b\[J/g, '') // Clear screen
      .replace(/\x1b\[2J/g, '') // Clear entire screen
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      .replace(/\x1b/g, '') // Remove any remaining escape characters
      .replace(/\x08/g, ''); // Remove backspace
    
    // Filter out spinner patterns (single chars or patterns like \|/-\|/-)
    const lines = cleaned.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      
      // Filter out single-character spinner lines
      if (trimmed.length === 1 && ['/', '-', '\\', '|'].includes(trimmed)) {
        return false;
      }
      
      // Filter out spinner patterns like \|/-\|/-
      if (/^[\\|/\-]+$/.test(trimmed)) {
        return false;
      }
      
      // Filter out lines that are just escape sequences
      if (/^\[[0-9;]*[a-zA-Z]$/.test(trimmed)) {
        return false;
      }
      
      return true;
    });
    
    return filteredLines.join('\n');
  };

  const flushOutputBuffer = () => {
    if (outputBufferRef.current.trim()) {
      const cleaned = stripAnsiCodes(outputBufferRef.current);
      if (cleaned.trim()) {
        const lines = cleaned.split('\n').filter(line => {
          const trimmed = line.trim();
          // Skip single-character spinner lines
          if (trimmed.length === 1 && ['/', '-', '\\', '|'].includes(trimmed)) {
            return false;
          }
          return true;
        });
        
        lines.forEach(line => {
          if (line.trim() || (line === '' && outputBufferRef.current.includes('\n'))) {
            addOutput(line);
          }
        });
      }
      outputBufferRef.current = '';
    }
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = null;
    }
  };

  const addToBuffer = (text: string) => {
    outputBufferRef.current += text;
    
    // Flush buffer if we have a newline or after 100ms
    if (text.includes('\n')) {
      if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
      flushOutputBuffer();
    } else {
      // Debounce single characters
      if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = setTimeout(flushOutputBuffer, 100);
    }
  };

  const executeRealCommand = async (command: string) => {
    if (!webContainer || !isReady) {
      addOutput("❌ WebContainer not ready");
      return;
    }

    setIsRunning(true);
    // Reset output buffer for new command
    outputBufferRef.current = '';
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = null;
    }
    addOutput(`$ ${command}`);

    try {
      // Special handling for dev server commands (long-running)
      if (command.includes('npm run dev') || command.includes('vite')) {
        // Start dev server
        const process = await webContainer.spawn('npm', ['run', 'dev']);
        
        // Handle output with proper stream reading
        const reader = process.output.getReader();
        const decoder = new TextDecoder();
        
        // Read output stream continuously (don't wait for exit)
        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (!value) continue;

              // Handle different value types
              let text = "";
              if (value instanceof Uint8Array) {
                text = decoder.decode(value);
              } else if (value instanceof ArrayBuffer) {
                text = decoder.decode(new Uint8Array(value));
              } else if (typeof value === 'string') {
                text = value;
              } else {
                continue;
              }

              // Add to buffer (will be flushed automatically)
              addToBuffer(text);
            }
          } catch (e) {
            console.warn("Dev server stream read error:", e);
          }
        })();

        // Don't wait for dev server to exit (it runs indefinitely)
        // Just mark as not running so user can type new commands
        setTimeout(() => {
          setIsRunning(false);
        }, 2000);
        
        return;
      }

      // Execute regular commands (npm install, ls, etc.)
      const process = await webContainer.spawn('sh', ['-c', command]);
      
      // Handle output streaming
      const reader = process.output.getReader();
      const decoder = new TextDecoder();
      let output = "";
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;

          // Handle different value types from WebContainer stream
          let text = "";
          if (value instanceof Uint8Array) {
            text = decoder.decode(value);
          } else if (value instanceof ArrayBuffer) {
            text = decoder.decode(new Uint8Array(value));
          } else if (typeof value === 'string') {
            text = value;
          } else {
            continue;
          }

          // Add to buffer (will be flushed automatically)
          output += text;
          addToBuffer(text);
        }
      } catch (readError) {
        console.warn("Stream read error:", readError);
      } finally {
        // Flush any remaining buffered output
        if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
        flushOutputBuffer();
      }
      
      // Wait for process to complete
      const exitCode = await process.exit;
      
      // Show exit code if command failed
      if (exitCode !== 0) {
        addOutput(`\n❌ Command exited with code ${exitCode}`);
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