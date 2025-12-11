import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Package, Check, AlertCircle, Power, Settings } from "lucide-react";
import { extensionService } from "@/services/extensionService";
import { Extension } from "@/types/extensions";

interface ExtensionsStatusProps {
  onOpenManager: () => void;
}

export function ExtensionsStatus({ onOpenManager }: ExtensionsStatusProps) {
  const [installedExtensions, setInstalledExtensions] = useState<Extension[]>([]);
  const [enabledExtensions, setEnabledExtensions] = useState<Extension[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadExtensionsStatus = async () => {
    setIsLoading(true);
    try {
      const [installed, enabled] = await Promise.all([
        extensionService.getInstalledExtensions(),
        extensionService.getEnabledExtensions()
      ]);
      setInstalledExtensions(installed);
      setEnabledExtensions(enabled);
    } catch (error) {
      console.error('Failed to load extensions status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExtensionsStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(loadExtensionsStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const disabledCount = installedExtensions.length - enabledExtensions.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-gray-300 hover:text-white relative"
        >
          <Package className="w-4 h-4" />
          {enabledExtensions.length > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {enabledExtensions.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Extensions</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenManager}
              className="text-xs"
            >
              <Settings className="w-3 h-3 mr-1" />
              Manage
            </Button>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground">
              Loading extensions...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Installed</span>
                <Badge variant="secondary">{installedExtensions.length}</Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Power className="w-3 h-3 text-green-500" />
                  Enabled
                </span>
                <Badge variant="default">{enabledExtensions.length}</Badge>
              </div>
              
              {disabledCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-yellow-500" />
                    Disabled
                  </span>
                  <Badge variant="outline">{disabledCount}</Badge>
                </div>
              )}
              
              {enabledExtensions.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">
                    Recently Active
                  </h4>
                  <div className="space-y-2">
                    {enabledExtensions.slice(0, 3).map((ext) => (
                      <div key={ext.id} className="flex items-center gap-2 text-sm">
                        <span className="text-lg">{ext.icon || '📦'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{ext.displayName}</div>
                          <div className="text-xs text-muted-foreground">
                            by {ext.author}
                          </div>
                        </div>
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                    ))}
                    {enabledExtensions.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center pt-2">
                        +{enabledExtensions.length - 3} more extensions
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {installedExtensions.length === 0 && (
                <div className="text-center py-4">
                  <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No extensions installed
                  </p>
                  <Button
                    size="sm"
                    onClick={onOpenManager}
                    className="mt-2"
                  >
                    Browse Extensions
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}