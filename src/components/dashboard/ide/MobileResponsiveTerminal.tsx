import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Maximize2, Minimize2, X, Copy, Check } from 'lucide-react';

interface MobileResponsiveTerminalProps {
  isMaximized?: boolean;
  onMaximize?: (maximized: boolean) => void;
  onClose?: () => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
}

interface TerminalLine {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error' | 'success';
  timestamp: Date;
}

export function MobileResponsiveTerminal({
  isMaximized = false,
  onMaximize,
  onClose,
  fontSize = 14,
  onFontSizeChange,
}: MobileResponsiveTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '0',
      text: '$ Welcome to ResurrectCI Terminal',
      type: 'output',
      timestamp: new Date(),
    },
    {
      id: '1',
      text: '$ Type commands to get started (npm run dev, npm test, etc.)',
      type: 'output',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest line
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines]);

  const handleExecuteCommand = () => {
    if (!input.trim()) return;

    // Add user input to terminal
    const inputLine: TerminalLine = {
      id: `input-${Date.now()}`,
      text: `$ ${input}`,
      type: 'input',
      timestamp: new Date(),
    };

    setLines((prev) => [...prev, inputLine]);

    // Simulate command execution
    setTimeout(() => {
      let outputLines: TerminalLine[] = [];

      if (input.toLowerCase().includes('npm run dev')) {
        outputLines = [
          {
            id: `output-${Date.now()}-1`,
            text: '> vite',
            type: 'output',
            timestamp: new Date(),
          },
          {
            id: `output-${Date.now()}-2`,
            text: '  VITE v5.4.19  ready in 234 ms',
            type: 'output',
            timestamp: new Date(),
          },
          {
            id: `output-${Date.now()}-3`,
            text: '  ➜  Local:   http://localhost:5173/',
            type: 'success',
            timestamp: new Date(),
          },
        ];
      } else if (input.toLowerCase().includes('npm test')) {
        outputLines = [
          {
            id: `output-${Date.now()}-1`,
            text: '> vitest',
            type: 'output',
            timestamp: new Date(),
          },
          {
            id: `output-${Date.now()}-2`,
            text: '✓ 24 passed (234ms)',
            type: 'success',
            timestamp: new Date(),
          },
        ];
      } else if (input.toLowerCase().includes('npm install')) {
        outputLines = [
          {
            id: `output-${Date.now()}-1`,
            text: 'added 234 packages in 12.34s',
            type: 'success',
            timestamp: new Date(),
          },
        ];
      } else if (input.toLowerCase().includes('npm run build')) {
        outputLines = [
          {
            id: `output-${Date.now()}-1`,
            text: '> vite build',
            type: 'output',
            timestamp: new Date(),
          },
          {
            id: `output-${Date.now()}-2`,
            text: '✓ 1234 modules transformed.',
            type: 'success',
            timestamp: new Date(),
          },
          {
            id: `output-${Date.now()}-3`,
            text: 'dist/index.html                   0.45 kB │ gzip:  0.30 kB',
            type: 'output',
            timestamp: new Date(),
          },
        ];
      } else if (input.toLowerCase().includes('clear')) {
        setLines([]);
        setInput('');
        return;
      } else if (input.toLowerCase().includes('help')) {
        outputLines = [
          {
            id: `output-${Date.now()}-1`,
            text: 'Available commands:',
            type: 'output',
            timestamp: new Date(),
          },
          {
            id: `output-${Date.now()}-2`,
            text: '  npm run dev     - Start development server',
            type: 'output',
            timestamp: new Date(),
          },
          {
            id: `output-${Date.now()}-3`,
            text: '  npm test        - Run tests',
            type: 'output',
            timestamp: new Date(),
          },
          {
            id: `output-${Date.now()}-4`,
            text: '  npm run build   - Build for production',
            type: 'output',
            timestamp: new Date(),
          },
          {
            id: `output-${Date.now()}-5`,
            text: '  npm install     - Install dependencies',
            type: 'output',
            timestamp: new Date(),
          },
          {
            id: `output-${Date.now()}-6`,
            text: '  clear           - Clear terminal',
            type: 'output',
            timestamp: new Date(),
          },
        ];
      } else {
        outputLines = [
          {
            id: `output-${Date.now()}`,
            text: `Command not found: ${input}. Type 'help' for available commands.`,
            type: 'error',
            timestamp: new Date(),
          },
        ];
      }

      setLines((prev) => [...prev, ...outputLines]);
    }, 300);

    setInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const copyLine = (text: string, lineId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(lineId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input':
        return 'text-[#238636]';
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-green-400';
      default:
        return 'text-[#e6edf3]';
    }
  };

  return (
    <div className="w-full h-full bg-[#0d1117] flex flex-col">
      {/* Header */}
      <div className="h-10 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">Terminal</span>
          <span className="text-xs text-[#7d8590]">
            {lines.length} lines
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onFontSizeChange && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFontSizeChange(Math.max(10, fontSize - 2))}
                className="h-6 w-6 p-0 text-[#7d8590] hover:text-white text-xs"
              >
                −
              </Button>
              <span className="text-xs text-[#7d8590] w-6 text-center">
                {fontSize}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFontSizeChange(Math.min(24, fontSize + 2))}
                className="h-6 w-6 p-0 text-[#7d8590] hover:text-white text-xs"
              >
                +
              </Button>
            </>
          )}
          {onMaximize && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMaximize(!isMaximized)}
              className="h-6 w-6 p-0 text-[#7d8590] hover:text-white"
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          )}
          {onClose && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-6 w-6 p-0 text-[#7d8590] hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Output Area */}
      <ScrollArea className="flex-1 p-3">
        <div
          className="space-y-0 font-mono"
          style={{ fontSize: `${fontSize}px` }}
          ref={scrollRef}
        >
          {lines.map((line) => (
            <div
              key={line.id}
              className="group flex items-start gap-2 hover:bg-[#161b22] px-2 py-1 rounded transition-colors"
            >
              <span className={`flex-shrink-0 ${getLineColor(line.type)}`}>
                {line.text}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyLine(line.text, line.id)}
                className="h-5 w-5 p-0 text-[#7d8590] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                {copiedId === line.id ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="h-12 bg-[#161b22] border-t border-[#30363d] flex items-center px-3 gap-2 flex-shrink-0">
        <span className="text-[#238636] font-mono text-sm flex-shrink-0">$</span>
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleExecuteCommand();
            }
          }}
          placeholder="Type command..."
          className="flex-1 bg-[#0d1117] border-0 text-white placeholder:text-[#7d8590] text-sm font-mono focus:ring-0 focus:outline-none"
          autoFocus
        />
        <Button
          onClick={handleExecuteCommand}
          disabled={!input.trim()}
          className="bg-[#238636] hover:bg-[#2ea043] text-white h-8 px-3 text-sm flex-shrink-0"
        >
          Run
        </Button>
      </div>
    </div>
  );
}
