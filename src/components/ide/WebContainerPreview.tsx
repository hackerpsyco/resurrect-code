import React, { useEffect, useState, useRef } from 'react';
import { useWebContainer } from '../../contexts/WebContainerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Globe, 
  RefreshCw, 
  ExternalLink, 
  X, 
  Maximize2, 
  Minimize2,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';

interface WebContainerPreviewProps {
  url?: string;
  onClose?: () => void;
  className?: string;
}

type DeviceType = "desktop" | "tablet" | "mobile";

export const WebContainerPreview: React.FC<WebContainerPreviewProps> = ({ 
  url: initialUrl, 
  onClose, 
  className = "" 
}) => {
  const { webContainer, isBooting } = useWebContainer();
  const [previewUrl, setPreviewUrl] = useState<string>(initialUrl || '');
  const [customUrl, setCustomUrl] = useState<string>(initialUrl || 'http://localhost:3000');
  const [isServerReady, setIsServerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");
  const [serverPorts, setServerPorts] = useState<Set<number>>(new Set());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!webContainer || isBooting) return;

    let mounted = true;

    // Listen for server-ready event from WebContainer
    const setupServerListener = () => {
      // WebContainer emits 'server-ready' when a dev server starts
      webContainer.on('server-ready', (port, url) => {
        console.log(`🌐 WebContainer server ready on port ${port}: ${url}`);
        
        if (mounted) {
          setPreviewUrl(url);
          setCustomUrl(url);
          setIsServerReady(true);
          setIsLoading(false);
          setServerPorts(prev => new Set([...prev, port]));
        }
      });

      // Also listen for port events (alternative approach)
      webContainer.on('port', (port, type, url) => {
        console.log(`🔌 WebContainer port ${port} ${type}: ${url}`);
        
        if (mounted) {
          if (type === 'open') {
            setPreviewUrl(url);
            setCustomUrl(url);
            setIsServerReady(true);
            setIsLoading(false);
            setServerPorts(prev => new Set([...prev, port]));
          } else if (type === 'close') {
            setServerPorts(prev => {
              const newPorts = new Set(prev);
              newPorts.delete(port);
              return newPorts;
            });
            
            // If no servers are running, hide preview
            if (serverPorts.size <= 1) {
              setIsServerReady(false);
              setPreviewUrl('');
            }
          }
        }
      });
    };

    setupServerListener();

    return () => {
      mounted = false;
    };
  }, [webContainer, isBooting, serverPorts.size]);

  // Update preview URL when prop changes
  useEffect(() => {
    if (initialUrl && initialUrl !== previewUrl) {
      setPreviewUrl(initialUrl);
      setCustomUrl(initialUrl);
      setIsServerReady(true);
    }
  }, [initialUrl, previewUrl]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      // Force iframe reload
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  };

  const handleCustomUrlLoad = () => {
    if (!customUrl.trim()) return;
    
    setIsLoading(true);
    setPreviewUrl(customUrl);
    setIsServerReady(true);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    console.error('❌ WebContainer preview iframe failed to load');
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const getDeviceStyles = () => {
    switch (deviceType) {
      case "mobile":
        return "w-80 h-[600px] mx-auto";
      case "tablet":
        return "w-[768px] h-[600px] mx-auto";
      case "desktop":
      default:
        return "w-full h-full";
    }
  };

  const commonPorts = [3000, 5173, 8080, 4200, 3001, 8000];

  if (isBooting) {
    return (
      <div className={`bg-[#1e1e1e] border border-[#464647] rounded-lg flex items-center justify-center ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}>
        <div className="text-center text-[#cccccc]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#569cd6] mx-auto mb-2"></div>
          <p>Booting WebContainer...</p>
          <p className="text-xs text-[#7d8590] mt-1">Preparing preview environment</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#1e1e1e] border border-[#464647] rounded-lg flex flex-col ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}>
      {/* Preview Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#464647] bg-[#2d2d30]">
        <div className="flex items-center gap-2 flex-1">
          <Globe className="w-4 h-4 text-[#cccccc]" />
          <span className="text-sm font-medium text-[#cccccc]">WebContainer Preview</span>
          <div className={`w-2 h-2 rounded-full ${isServerReady ? 'bg-green-400' : 'bg-gray-400'}`}></div>
          
          <div className="flex items-center gap-2 ml-4 flex-1">
            <Input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomUrlLoad()}
              className="flex-1 h-7 text-xs bg-[#3c3c3c] border-[#464647] text-[#cccccc]"
              placeholder="http://localhost:3000"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCustomUrlLoad}
              disabled={isLoading}
              className="h-7 px-2 text-[#cccccc] hover:bg-[#464647]"
            >
              Go
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Device Type Selector */}
          <div className="flex items-center gap-1 mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeviceType("desktop")}
              className={`h-6 w-6 p-0 ${deviceType === "desktop" ? 'text-[#569cd6]' : 'text-[#cccccc]'} hover:bg-[#464647]`}
              title="Desktop View"
            >
              <Monitor className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeviceType("tablet")}
              className={`h-6 w-6 p-0 ${deviceType === "tablet" ? 'text-[#569cd6]' : 'text-[#cccccc]'} hover:bg-[#464647]`}
              title="Tablet View"
            >
              <Tablet className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeviceType("mobile")}
              className={`h-6 w-6 p-0 ${deviceType === "mobile" ? 'text-[#569cd6]' : 'text-[#cccccc]'} hover:bg-[#464647]`}
              title="Mobile View"
            >
              <Smartphone className="w-3 h-3" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
            title="Refresh Preview"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={openInNewTab}
            disabled={!previewUrl}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
            title="Open in New Tab"
          >
            <ExternalLink className="w-3 h-3" />
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
              title="Close Preview"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-[#0d1117] flex items-center justify-center p-4">
        {!isServerReady ? (
          <div className="text-center text-[#7d8590] max-w-md">
            <div className="w-16 h-16 bg-[#464647] rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-[#7d8590]" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-[#cccccc]">No Server Running</h3>
            <p className="text-sm mb-4">Start a development server in the WebContainer terminal to see your app preview.</p>
            
            <div className="bg-[#252526] border border-[#464647] rounded p-4">
              <h4 className="text-sm font-medium text-[#cccccc] mb-2">Quick Start Commands:</h4>
              <div className="text-xs text-left space-y-1 font-mono">
                <div className="text-[#4ec9b0]">$ npm install</div>
                <div className="text-[#4ec9b0]">$ npm run dev</div>
                <div className="text-[#7d8590]"># Server will auto-open in preview</div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-[#cccccc] mb-2">Or try a specific port:</h4>
              <div className="flex flex-wrap gap-2 justify-center">
                {commonPorts.map((port) => (
                  <Button
                    key={port}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = `http://localhost:${port}`;
                      setCustomUrl(url);
                      setPreviewUrl(url);
                      setIsServerReady(true);
                    }}
                    className="text-xs border-[#464647] text-[#cccccc] hover:bg-[#464647]"
                  >
                    :{port}
                  </Button>
                ))}
              </div>
            </div>

            {serverPorts.size > 0 && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-600/30 rounded">
                <p className="text-green-400 text-sm">
                  🟢 Active ports: {Array.from(serverPorts).join(', ')}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className={`${getDeviceStyles()} relative`}>
            {isLoading && (
              <div className="absolute inset-0 bg-[#1e1e1e] bg-opacity-75 flex items-center justify-center z-10">
                <div className="flex items-center space-x-2 text-[#cccccc]">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#569cd6]" />
                  <span className="text-sm">Loading preview...</span>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border border-[#464647] rounded bg-white"
              title="WebContainer App Preview"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
            
            {/* Debug info overlay */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
              <div>WebContainer: {previewUrl}</div>
              <div>Device: {deviceType}</div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-[#252526] border-t border-[#464647] flex items-center justify-between px-3 text-xs">
        <div className="flex items-center gap-4 text-[#7d8590]">
          <span>URL: {previewUrl || 'No server'}</span>
          <span>Device: {deviceType}</span>
          <span className={`flex items-center gap-1 ${isServerReady ? 'text-green-400' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isServerReady ? 'bg-green-400' : 'bg-gray-400'}`}></div>
            {isServerReady ? 'Server Ready' : 'Waiting for server'}
          </span>
          {serverPorts.size > 0 && (
            <span className="text-[#4ec9b0]">
              Ports: {Array.from(serverPorts).join(', ')}
            </span>
          )}
        </div>
        <div className="text-[#7d8590]">
          {isLoading ? 'Loading...' : isServerReady ? 'Ready' : 'No server'}
        </div>
      </div>
    </div>
  );
};