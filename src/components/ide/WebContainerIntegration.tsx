import React, { useState, useEffect } from 'react';
import { WebContainerProvider } from '../../contexts/WebContainerContext';
import { WebContainerTerminal } from './WebContainerTerminal';
import { WebContainerPreview } from './WebContainerPreview';
import { WebContainerCodeEditor } from './WebContainerCodeEditor';
import { Button } from '@/components/ui/button';
import { Terminal, Globe, Code, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface WebContainerIntegrationProps {
  // File management props
  activeFile?: string;
  fileContent?: string;
  originalContent?: string;
  isFileModified?: boolean;
  onFileContentChange?: (content: string) => void;
  onFileSave?: (content: string) => void;
  
  // Layout props
  showTerminal?: boolean;
  showPreview?: boolean;
  onToggleTerminal?: () => void;
  onTogglePreview?: () => void;
  
  // Project props
  projectPath?: string;
  className?: string;
}

export const WebContainerIntegration: React.FC<WebContainerIntegrationProps> = ({
  activeFile,
  fileContent = '',
  originalContent = '',
  isFileModified = false,
  onFileContentChange,
  onFileSave,
  showTerminal = true,
  showPreview = false,
  onToggleTerminal,
  onTogglePreview,
  projectPath = '.',
  className = ''
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isServerRunning, setIsServerRunning] = useState(false);

  const handleDevServerStart = (url: string) => {
    console.log('🚀 Development server started:', url);
    setPreviewUrl(url);
    setIsServerRunning(true);
    
    // Auto-open preview when server starts
    if (onTogglePreview && !showPreview) {
      onTogglePreview();
    }
    
    toast.success(`🌐 Server started at ${url}`, {
      description: 'Preview panel opened automatically',
      action: {
        label: 'Open in new tab',
        onClick: () => window.open(url, '_blank')
      }
    });
  };

  const handleDevServerStop = () => {
    console.log('🛑 Development server stopped');
    setIsServerRunning(false);
    toast.info('Development server stopped');
  };

  // Check if WebContainer is supported
  const isWebContainerSupported = () => {
    // WebContainer requires SharedArrayBuffer and cross-origin isolation
    return typeof SharedArrayBuffer !== 'undefined' && crossOriginIsolated;
  };

  if (!isWebContainerSupported()) {
    return (
      <div className={`flex items-center justify-center h-full bg-[#1e1e1e] border border-[#464647] rounded-lg ${className}`}>
        <div className="text-center text-[#cccccc] max-w-md p-6">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-lg font-semibold mb-2">WebContainer Not Supported</h3>
          <p className="text-sm text-[#7d8590] mb-4">
            WebContainer requires cross-origin isolation to run Node.js in the browser.
          </p>
          <div className="bg-[#252526] border border-[#464647] rounded p-4 text-left">
            <h4 className="text-sm font-medium mb-2">To enable WebContainer:</h4>
            <div className="text-xs space-y-1 font-mono">
              <div className="text-[#7d8590]"># Add to your server headers:</div>
              <div className="text-[#4ec9b0]">Cross-Origin-Embedder-Policy: require-corp</div>
              <div className="text-[#4ec9b0]">Cross-Origin-Opener-Policy: same-origin</div>
            </div>
          </div>
          <p className="text-xs text-[#7d8590] mt-4">
            Falling back to simulated terminal for now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <WebContainerProvider>
      <div className={`flex flex-col h-full ${className}`}>
        {/* Main Content Area */}
        <div className="flex flex-1">
          {/* Code Editor Section */}
          {activeFile && (
            <div className="flex-1">
              <WebContainerCodeEditor
                filePath={activeFile}
                content={fileContent}
                originalContent={originalContent}
                isModified={isFileModified}
                onContentChange={onFileContentChange}
                onSave={onFileSave}
              />
            </div>
          )}
          
          {/* Terminal Section */}
          {showTerminal && (
            <div className="w-80 border-l border-[#464647]">
              <WebContainerTerminal
                projectPath={projectPath}
                onClose={onToggleTerminal}
                onDevServerStart={handleDevServerStart}
                onDevServerStop={handleDevServerStop}
              />
            </div>
          )}
        </div>
        
        {/* Preview Section */}
        {showPreview && (
          <div className="h-1/2 border-t border-[#464647]">
            <WebContainerPreview
              url={previewUrl}
              onClose={onTogglePreview}
            />
          </div>
        )}
        
        {/* Quick Actions Bar */}
        <div className="h-8 bg-[#252526] border-t border-[#464647] flex items-center justify-between px-3 text-xs">
          <div className="flex items-center gap-4 text-[#7d8590]">
            <span>WebContainer IDE</span>
            {isServerRunning && (
              <span className="flex items-center gap-1 text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                Server running at {previewUrl}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleTerminal}
              className={`h-6 px-2 text-xs ${showTerminal ? 'text-[#569cd6]' : 'text-[#cccccc]'} hover:bg-[#464647]`}
              title="Toggle Terminal (Ctrl+`)"
            >
              <Terminal className="w-3 h-3 mr-1" />
              Terminal
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePreview}
              className={`h-6 px-2 text-xs ${showPreview ? 'text-[#569cd6]' : 'text-[#cccccc]'} hover:bg-[#464647]`}
              title="Toggle Preview (Ctrl+Shift+P)"
            >
              <Globe className="w-3 h-3 mr-1" />
              Preview
            </Button>
          </div>
        </div>
      </div>
    </WebContainerProvider>
  );
};