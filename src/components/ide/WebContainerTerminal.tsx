import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useWebContainer } from '../../contexts/WebContainerContext';
import { Button } from '@/components/ui/button';
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Square } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

interface WebContainerTerminalProps {
  projectPath?: string;
  onClose?: () => void;
  className?: string;
  onDevServerStart?: (url: string) => void;
  onDevServerStop?: () => void;
}

export const WebContainerTerminal: React.FC<WebContainerTerminalProps> = ({ 
  projectPath = ".", 
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop 
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const processRef = useRef<any>(null);
  const inputWriterRef = useRef<any>(null);
  
  const { webContainer, isBooting } = useWebContainer();
  const [isReady, setIsReady] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isProcessRunning, setIsProcessRunning] = useState(false);

  useEffect(() => {
    if (!terminalRef.current || !webContainer || isBooting) return;

    let mounted = true;

    const initializeTerminal = async () => {
      try {
        // Create xterm instance with VS Code-like styling
        const xterm = new XTerm({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          theme: {
            background: '#0d1117',
            foreground: '#cccccc',
            cursor: '#ffffff',
            selection: '#264f78',
            black: '#000000',
            red: '#f44747',
            green: '#4ec9b0',
            yellow: '#ffcc02',
            blue: '#569cd6',
            magenta: '#c586c0',
            cyan: '#4ec9b0',
            white: '#cccccc',
            brightBlack: '#666666',
            brightRed: '#f44747',
            brightGreen: '#4ec9b0',
            brightYellow: '#ffcc02',
            brightBlue: '#569cd6',
            brightMagenta: '#c586c0',
            brightCyan: '#4ec9b0',
            brightWhite: '#ffffff'
          },
          convertEol: true,
          scrollback: 1000
        });

        // Create fit addon for responsive terminal sizing
        const fitAddon = new FitAddon();
        xterm.loadAddon(fitAddon);

        // Open terminal in DOM element
        xterm.open(terminalRef.current!);
        fitAddon.fit();

        // Store references
        xtermRef.current = xterm;
        fitAddonRef.current = fitAddon;

        console.log('🖥️ WebContainer Terminal UI initialized');

        // Spawn jsh (JavaScript Shell) process in WebContainer
        const jshProcess = await webContainer.spawn('jsh');
        processRef.current = jshProcess;

        console.log('🐚 jsh process spawned in WebContainer');

        if (!mounted) return;

        // CRITICAL PIPING LOGIC:
        // This creates a bidirectional stream between xterm and the WebContainer process
        
        // 1. Pipe WebContainer process OUTPUT to xterm (process -> terminal display)
        jshProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (mounted && xtermRef.current) {
                xtermRef.current.write(data);
              }
            }
          })
        );

        // 2. Pipe xterm INPUT to WebContainer process (keyboard -> process)
        const inputWriter = jshProcess.input.getWriter();
        inputWriterRef.current = inputWriter;
        
        xterm.onData((data) => {
          if (mounted && inputWriter) {
            inputWriter.write(data);
          }
        });

        // Listen for server-ready events from WebContainer
        webContainer.on('server-ready', (port, url) => {
          console.log(`🌐 WebContainer server ready on port ${port}: ${url}`);
          if (onDevServerStart) {
            onDevServerStart(url);
          }
        });

        // Also listen for port events
        webContainer.on('port', (port, type, url) => {
          if (type === 'open') {
            console.log(`🔌 WebContainer port ${port} opened: ${url}`);
            if (onDevServerStart) {
              onDevServerStart(url);
            }
          } else if (type === 'close') {
            console.log(`🔌 WebContainer port ${port} closed`);
            if (onDevServerStop) {
              onDevServerStop();
            }
          }
        });

        console.log('🔄 WebContainer Terminal streams connected');
        setIsReady(true);

      } catch (error) {
        console.error('❌ WebContainer Terminal initialization failed:', error);
      }
    };

    initializeTerminal();

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
      
      if (inputWriterRef.current) {
        inputWriterRef.current.close();
        inputWriterRef.current = null;
      }
      
      if (processRef.current) {
        processRef.current.kill();
        processRef.current = null;
      }
      
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
      
      fitAddonRef.current = null;
      setIsReady(false);
    };
  }, [webContainer, isBooting, onDevServerStart, onDevServerStop]);

  // Handle window resize events to resize terminal
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Also handle container resize (for resizable panels)
    const resizeObserver = new ResizeObserver(handleResize);
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [isReady]);

  const clearTerminal = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
  };

  const killProcess = () => {
    if (processRef.current && inputWriterRef.current) {
      // Send Ctrl+C to the process
      inputWriterRef.current.write('\x03');
      setIsProcessRunning(false);
    }
  };

  const runQuickCommand = (command: string) => {
    if (inputWriterRef.current) {
      inputWriterRef.current.write(command + '\r');
      setIsProcessRunning(true);
    }
  };

  if (isBooting) {
    return (
      <div className={`bg-[#1e1e1e] border border-[#464647] rounded-lg flex items-center justify-center ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}>
        <div className="text-center text-[#cccccc]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#569cd6] mx-auto mb-2"></div>
          <p>Booting WebContainer...</p>
          <p className="text-xs text-[#7d8590] mt-1">Initializing Node.js runtime in browser</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#1e1e1e] border border-[#464647] rounded-lg flex flex-col ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#464647] bg-[#2d2d30]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#cccccc]" />
          <span className="text-sm font-medium text-[#cccccc]">WebContainer Terminal</span>
          <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
          <span className="text-xs text-[#7d8590]">({projectPath})</span>
          {isReady && (
            <span className="text-xs text-[#4ec9b0]">Real Node.js Runtime</span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {isProcessRunning && (
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
      <div className="flex-1 relative">
        <div 
          ref={terminalRef} 
          className="h-full w-full"
          style={{ padding: '8px' }}
        />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117] text-[#cccccc]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#569cd6] mx-auto mb-2"></div>
              <p>Connecting to WebContainer shell...</p>
              <p className="text-xs text-[#7d8590] mt-1">Setting up real terminal environment</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Commands */}
      <div className="p-2 border-t border-[#464647] bg-[#252526]">
        <div className="flex gap-1 flex-wrap">
          {[
            "npm install",
            "npm run dev", 
            "npm run build",
            "ls -la",
            "pwd",
            "node --version"
          ].map((cmd) => (
            <Button
              key={cmd}
              variant="ghost"
              size="sm"
              onClick={() => runQuickCommand(cmd)}
              disabled={!isReady}
              className="h-6 px-2 text-xs text-[#cccccc] hover:bg-[#464647] disabled:opacity-50"
            >
              {cmd}
            </Button>
          ))}
        </div>
        {isReady && (
          <div className="text-xs text-[#7d8590] mt-1">
            ✅ Real Node.js environment ready • Type commands or click buttons above
          </div>
        )}
      </div>
    </div>
  );
};