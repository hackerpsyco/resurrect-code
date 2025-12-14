import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  X, 
  RefreshCw, 
  ArrowLeft, 
  ArrowRight, 
  Home, 
  ExternalLink,
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw
} from "lucide-react";
// Toast removed for clean UI

interface PreviewWithURLChangeProps {
  initialUrl?: string;
  onClose: () => void;
}

type DeviceType = "desktop" | "tablet" | "mobile";

const deviceSizes = {
  desktop: { width: "100%", height: "100%" },
  tablet: { width: "768px", height: "1024px" },
  mobile: { width: "375px", height: "667px" }
};

export function PreviewWithURLChange({ 
  initialUrl = "http://localhost:3000", 
  onClose 
}: PreviewWithURLChangeProps) {
  const [url, setUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");
  const [isError, setIsError] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update input URL when initial URL changes
  useEffect(() => {
    setUrl(initialUrl);
    setInputUrl(initialUrl);
  }, [initialUrl]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let newUrl = inputUrl.trim();
    
    if (!newUrl) return;
    
    // Add protocol if missing
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      newUrl = `http://${newUrl}`;
    }
    
    setUrl(newUrl);
    setIsLoading(true);
    setIsError(false);
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      setIsError(false);
      iframeRef.current.src = url;
    }
  };

  const handleGoBack = () => {
    if (iframeRef.current && canGoBack) {
      try {
        iframeRef.current.contentWindow?.history.back();
      } catch (error) {
        // Silent error
      }
    }
  };

  const handleGoForward = () => {
    if (iframeRef.current && canGoForward) {
      try {
        iframeRef.current.contentWindow?.history.forward();
      } catch (error) {
        // Silent error
      }
    }
  };

  const handleHome = () => {
    setInputUrl(initialUrl);
    setUrl(initialUrl);
    setIsLoading(true);
    setIsError(false);
  };

  const openInNewTab = () => {
    window.open(url, '_blank');
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setIsError(false);
    
    // Try to update navigation state
    try {
      if (iframeRef.current?.contentWindow) {
        const iframe = iframeRef.current;
        setCanGoBack(iframe.contentWindow.history.length > 1);
        // Note: We can't reliably detect forward navigation state due to security restrictions
      }
    } catch (error) {
      // Ignore security errors when accessing iframe content
    }
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setIsError(true);
    // Silent error
  };

  const getDeviceIcon = (device: DeviceType) => {
    switch (device) {
      case "desktop": return <Monitor className="w-4 h-4" />;
      case "tablet": return <Tablet className="w-4 h-4" />;
      case "mobile": return <Smartphone className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-l border-[#464647]">
      {/* Preview Header */}
      <div className="flex items-center gap-2 bg-[#2d2d30] border-b border-[#464647] p-2">
        {/* Navigation Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            disabled={!canGoBack}
            className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647] disabled:opacity-50"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoForward}
            disabled={!canGoForward}
            className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647] disabled:opacity-50"
            title="Go Forward"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHome}
            className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
            title="Home"
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>

        {/* URL Bar */}
        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#1e1e1e] border border-[#464647] rounded px-2 py-1 flex-1">
            <Globe className="w-4 h-4 text-[#7d8590]" />
            <Input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Enter URL (e.g., http://localhost:3000)"
              className="flex-1 bg-transparent border-none p-0 text-[#cccccc] text-sm focus:ring-0 focus:outline-none"
            />
          </div>
        </form>

        {/* Device Type Selector */}
        <div className="flex items-center gap-1 bg-[#1e1e1e] border border-[#464647] rounded">
          {(["desktop", "tablet", "mobile"] as DeviceType[]).map((device) => (
            <Button
              key={device}
              variant="ghost"
              size="sm"
              onClick={() => setDeviceType(device)}
              className={`h-7 w-7 p-0 ${
                deviceType === device 
                  ? "bg-[#0078d4] text-white" 
                  : "text-[#cccccc] hover:bg-[#464647]"
              }`}
              title={`${device.charAt(0).toUpperCase() + device.slice(1)} View`}
            >
              {getDeviceIcon(device)}
            </Button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={openInNewTab}
            className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
            title="Open in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
            title="Close Preview"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] p-4">
        {isError ? (
          <div className="text-center text-[#cccccc]">
            <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Preview</h3>
            <p className="text-sm text-[#7d8590] mb-4">
              Unable to load {url}
            </p>
            <div className="space-y-2">
              <Button onClick={handleRefresh} className="bg-[#0078d4] hover:bg-[#106ebe]">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <p className="text-xs text-[#7d8590]">
                Make sure your development server is running
              </p>
            </div>
          </div>
        ) : (
          <div 
            className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
            style={{
              width: deviceSizes[deviceType].width,
              height: deviceSizes[deviceType].height,
              maxWidth: "100%",
              maxHeight: "100%"
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-[#1e1e1e] flex items-center justify-center z-10">
                <div className="text-center text-[#cccccc]">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Loading preview...</p>
                </div>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              src={url}
              className="w-full h-full border-none"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title="Preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-[#007acc] text-white px-3 py-1 text-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Preview: {deviceType}</span>
          <span>{url}</span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <span>Loading...</span>}
          {isError && <span className="text-red-200">Error</span>}
          {!isLoading && !isError && <span className="text-green-200">Ready</span>}
        </div>
      </div>
    </div>
  );
}