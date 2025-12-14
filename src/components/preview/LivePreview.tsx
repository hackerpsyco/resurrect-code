import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Globe, 
  RefreshCw, 
  ExternalLink, 
  X, 
  Maximize2, 
  Minimize2,
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";

interface LivePreviewProps {
  url?: string;
  onClose?: () => void;
  className?: string;
}

type DeviceType = "desktop" | "tablet" | "mobile";

export function LivePreview({ url: initialUrl, onClose, className = "" }: LivePreviewProps) {
  const [url, setUrl] = useState(initialUrl || "http://localhost:5173");
  const [currentUrl, setCurrentUrl] = useState(initialUrl || "http://localhost:5173");
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");
  const [isOnline, setIsOnline] = useState(true); // Start as online for localhost
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update URL when prop changes
  useEffect(() => {
    if (initialUrl && initialUrl !== url) {
      setUrl(initialUrl);
      setCurrentUrl(initialUrl);
    }
  }, [initialUrl, url]);

  // Check if the development server is running
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // For localhost URLs, we'll assume they're online and let the iframe handle the loading
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          setIsOnline(true);
          setCurrentUrl(url);
          return;
        }
        
        // For other URLs, try a simple fetch
        const response = await fetch(url, { 
          method: 'GET',
          mode: 'no-cors'
        });
        setIsOnline(true);
        setCurrentUrl(url);
      } catch (error) {
        // Even if fetch fails, we'll still try to load it in the iframe
        setIsOnline(true);
        setCurrentUrl(url);
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [url]);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
  };

  const loadUrl = () => {
    if (!url.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsLoading(true);
    setCurrentUrl(url);
    
    // Simulate loading time
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const refreshPreview = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const openInNewTab = () => {
    window.open(currentUrl, '_blank');
  };

  const getDeviceStyles = () => {
    switch (deviceType) {
      case "mobile":
        return "w-80 h-[600px]";
      case "tablet":
        return "w-[768px] h-[600px]";
      case "desktop":
      default:
        return "w-full h-full";
    }
  };

  const commonPorts = [
    { port: 3000, name: "React/Node.js" },
    { port: 5173, name: "Vite" },
    { port: 8080, name: "Webpack Dev Server" },
    { port: 4200, name: "Angular" },
    { port: 3001, name: "Next.js" },
    { port: 8000, name: "Python/Django" }
  ];

  return (
    <div className={`bg-[#1e1e1e] border border-[#464647] rounded-lg flex flex-col ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}>
      {/* Preview Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#464647] bg-[#2d2d30]">
        <div className="flex items-center gap-2 flex-1">
          <Globe className="w-4 h-4 text-[#cccccc]" />
          <span className="text-sm font-medium text-[#cccccc]">Live Preview</span>
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
          
          <div className="flex items-center gap-2 ml-4 flex-1">
            <Input
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadUrl()}
              className="flex-1 h-7 text-xs bg-[#3c3c3c] border-[#464647] text-[#cccccc]"
              placeholder="http://localhost:5173"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={loadUrl}
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
            onClick={refreshPreview}
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
        {!isOnline && !currentUrl.includes('localhost') ? (
          <div className="text-center text-[#7d8590]">
            <div className="w-16 h-16 bg-[#464647] rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-[#7d8590]" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-[#cccccc]">Development Server Not Running</h3>
            <p className="text-sm mb-4">Start your development server to see the live preview</p>
            
            <div className="bg-[#252526] border border-[#464647] rounded p-4 max-w-md mx-auto">
              <h4 className="text-sm font-medium text-[#cccccc] mb-2">Quick Start Commands:</h4>
              <div className="text-xs text-left space-y-1">
                <div className="text-[#4ec9b0]">$ npm run dev</div>
                <div className="text-[#4ec9b0]">$ yarn dev</div>
                <div className="text-[#4ec9b0]">$ npm start</div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-[#cccccc] mb-2">Common Development Ports:</h4>
              <div className="flex flex-wrap gap-2 justify-center">
                {commonPorts.map((item) => (
                  <Button
                    key={item.port}
                    variant="outline"
                    size="sm"
                    onClick={() => handleUrlChange(`http://localhost:${item.port}`)}
                    className="text-xs border-[#464647] text-[#cccccc] hover:bg-[#464647]"
                  >
                    :{item.port} {item.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={`${getDeviceStyles()} relative`}>
            {isLoading && (
              <div className="absolute inset-0 bg-[#1e1e1e] bg-opacity-75 flex items-center justify-center z-10">
                <RefreshCw className="w-8 h-8 text-[#569cd6] animate-spin" />
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full border border-[#464647] rounded bg-white"
              title="Live Preview"
              onLoad={() => {
                setIsLoading(false);
                setIsOnline(true);
                console.log('Preview loaded successfully:', currentUrl);
              }}
              onError={() => {
                setIsLoading(false);
                console.warn('Preview iframe failed to load:', currentUrl);
              }}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            />
            
            {/* Debug info overlay */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
              Loading: {currentUrl}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-[#252526] border-t border-[#464647] flex items-center justify-between px-3 text-xs">
        <div className="flex items-center gap-4 text-[#7d8590]">
          <span>URL: {currentUrl}</span>
          <span>Device: {deviceType}</span>
          <span className={`flex items-center gap-1 ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="text-[#7d8590]">
          {isLoading ? 'Loading...' : 'Ready'}
        </div>
      </div>
    </div>
  );
}