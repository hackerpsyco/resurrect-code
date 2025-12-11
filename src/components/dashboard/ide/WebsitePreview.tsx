import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface WebsitePreviewProps {
  projectName?: string;
  defaultUrl?: string;
  vercelUrl?: string;
  localUrl?: string;
}

export function WebsitePreview({
  projectName,
  defaultUrl,
  vercelUrl,
  localUrl = "http://localhost:8080",
}: WebsitePreviewProps) {
  const [currentUrl, setCurrentUrl] = useState(defaultUrl || vercelUrl || localUrl);
  const [inputUrl, setInputUrl] = useState(currentUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    checkUrlStatus(currentUrl);
  }, [currentUrl]);

  const checkUrlStatus = async (url: string) => {
    try {
      setIsLoading(true);
      // Simple check - in real implementation, you'd ping the URL
      const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
      const isVercel = url.includes("vercel.app");
      
      // Simulate status check
      setTimeout(() => {
        setIsOnline(true);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setIsOnline(false);
      setIsLoading(false);
    }
  };

  const handleUrlChange = () => {
    if (inputUrl !== currentUrl) {
      setCurrentUrl(inputUrl);
      toast.info("Loading preview...");
    }
  };

  const refreshPreview = () => {
    setIsLoading(true);
    checkUrlStatus(currentUrl);
    // Force iframe reload
    const iframe = document.getElementById("preview-iframe") as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const openInNewTab = () => {
    window.open(currentUrl, "_blank");
  };

  const getViewportSize = () => {
    switch (viewMode) {
      case "mobile":
        return { width: "375px", height: "667px" };
      case "tablet":
        return { width: "768px", height: "1024px" };
      default:
        return { width: "100%", height: "100%" };
    }
  };

  const quickUrls = [
    { label: "Local Dev", url: localUrl, icon: "🏠", color: "bg-blue-500" },
    { label: "Vercel", url: vercelUrl, icon: "▲", color: "bg-black" },
    { label: "Production", url: defaultUrl, icon: "🌐", color: "bg-green-500" },
  ].filter(item => item.url);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Website Preview
            {projectName && <Badge variant="secondary">{projectName}</Badge>}
          </CardTitle>
          <div className="flex items-center gap-1">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            ) : (
              <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
            )}
            <span className="text-xs text-muted-foreground">
              {isLoading ? "Loading..." : isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* URL Input */}
        <div className="flex gap-2">
          <Input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter website URL..."
            className="text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleUrlChange()}
          />
          <Button size="sm" onClick={handleUrlChange}>
            Go
          </Button>
        </div>

        {/* Quick URLs */}
        {quickUrls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {quickUrls.map((item) => (
              <Button
                key={item.url}
                size="sm"
                variant="outline"
                className="shrink-0 text-xs"
                onClick={() => {
                  setInputUrl(item.url!);
                  setCurrentUrl(item.url!);
                }}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Button>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={viewMode === "desktop" ? "default" : "outline"}
              onClick={() => setViewMode("desktop")}
            >
              <Monitor className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "tablet" ? "default" : "outline"}
              onClick={() => setViewMode("tablet")}
            >
              <Tablet className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "mobile" ? "default" : "outline"}
              onClick={() => setViewMode("mobile")}
            >
              <Smartphone className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={refreshPreview}>
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={openInNewTab}>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          {currentUrl ? (
            <div
              className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden transition-all duration-300"
              style={getViewportSize()}
            >
              <iframe
                id="preview-iframe"
                src={currentUrl}
                className="w-full h-full border-0"
                title="Website Preview"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsOnline(false);
                  setIsLoading(false);
                  toast.error("Failed to load preview");
                }}
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No URL specified</p>
              <p className="text-sm mt-2">Enter a website URL to preview</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}