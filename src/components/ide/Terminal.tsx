import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useWebContainer } from '../../contexts/WebContainerContext';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  className?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ className = '' }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const processRef = useRef<any>(null);
  const { webContainer, isBooting } = useWebContainer();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!terminalRef.current || !webContainer || isBooting) return;

    let mounted = true;

    const initializeTerminal = async () => {
      try {
        // Create xterm instance with configuration
        const xterm = new XTerm({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          theme: {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            cursor: '#ffffff',
            selection: '#264f78'
          },
          convertEol: true
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

        console.log('🖥️ Terminal UI initialized');

        // Spawn jsh (JavaScript Shell) process in WebContainer
        // This is the critical part - jsh is WebContainer's internal shell
        const jshProcess = await webContainer.spawn('jsh');
        processRef.current = jshProcess;

        console.log('🐚 jsh process spawned');

        if (!mounted) return;

        // CRITICAL PIPING LOGIC:
        // This creates a bidirectional stream between xterm and the WebContainer process
        
        // 1. Pipe WebContainer process OUTPUT to xterm (process -> terminal display)
        // This stream carries all command outputs, errors, and shell responses
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
        // This stream carries user keystrokes and commands to the shell
        const inputWriter = jshProcess.input.getWriter();
        
        xterm.onData((data) => {
          if (mounted && inputWriter) {
            inputWriter.write(data);
          }
        });

        console.log('🔄 Terminal streams connected');
        setIsReady(true);

      } catch (error) {
        console.error('❌ Terminal initialization failed:', error);
      }
    };

    initializeTerminal();

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
      
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
  }, [webContainer, isBooting]);

  // Handle window resize events to resize terminal
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        // Fit terminal to container size
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

  if (isBooting) {
    return (
      <div className={`flex items-center justify-center h-full bg-[#1e1e1e] text-white ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Booting WebContainer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full bg-[#1e1e1e] ${className}`}>
      <div 
        ref={terminalRef} 
        className="h-full w-full"
        style={{ padding: '8px' }}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
            <p>Initializing terminal...</p>
          </div>
        </div>
      )}
    </div>
  );
};