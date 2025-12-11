import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Star, 
  ExternalLink, 
  Trash2, 
  Power, 
  PowerOff,
  Loader2,
  Check,
  AlertCircle
} from "lucide-react";
import { Extension } from "@/types/extensions";
import { extensionService } from "@/services/extensionService";
import { toast } from "sonner";

interface ExtensionCardProps {
  extension: Extension;
  onUpdate?: () => void;
}

export function ExtensionCard({ extension, onUpdate }: ExtensionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<'install' | 'uninstall' | 'enable' | 'disable' | null>(null);

  const handleInstall = async () => {
    setIsLoading(true);
    setActionType('install');
    
    try {
      const result = await extensionService.installExtension(extension.id);
      if (result.success) {
        toast.success(result.message);
        onUpdate?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to install extension');
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const handleUninstall = async () => {
    setIsLoading(true);
    setActionType('uninstall');
    
    try {
      const result = await extensionService.uninstallExtension(extension.id);
      if (result.success) {
        toast.success(result.message);
        onUpdate?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to uninstall extension');
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const handleToggleEnable = async () => {
    setIsLoading(true);
    setActionType(extension.isEnabled ? 'disable' : 'enable');
    
    try {
      const result = extension.isEnabled 
        ? await extensionService.disableExtension(extension.id)
        : await extensionService.enableExtension(extension.id);
        
      if (result.success) {
        toast.success(result.message);
        onUpdate?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(`Failed to ${extension.isEnabled ? 'disable' : 'enable'} extension`);
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const formatDownloads = (downloads: number): string => {
    if (downloads >= 1000000) {
      return `${(downloads / 1000000).toFixed(1)}M`;
    } else if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(1)}K`;
    }
    return downloads.toString();
  };

  const getCategoryColor = (category: string): string => {
    const colors = {
      productivity: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      themes: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      languages: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      debuggers: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      formatters: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      snippets: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{extension.icon || '📦'}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{extension.displayName}</h3>
              <p className="text-xs text-muted-foreground">by {extension.author}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {extension.isInstalled && (
              <Badge variant={extension.isEnabled ? "default" : "secondary"} className="text-xs">
                {extension.isEnabled ? (
                  <><Check className="w-3 h-3 mr-1" />Enabled</>
                ) : (
                  <><AlertCircle className="w-3 h-3 mr-1" />Disabled</>
                )}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {extension.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {formatDownloads(extension.downloads)}
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {extension.rating}
          </div>
          <Badge className={`text-xs ${getCategoryColor(extension.category)}`}>
            {extension.category}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>v{extension.version}</span>
          <span>{extension.size}</span>
        </div>

        <div className="flex gap-2 pt-2">
          {!extension.isInstalled ? (
            <Button
              size="sm"
              onClick={handleInstall}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading && actionType === 'install' ? (
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              ) : (
                <Download className="w-3 h-3 mr-2" />
              )}
              Install
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant={extension.isEnabled ? "secondary" : "default"}
                onClick={handleToggleEnable}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && (actionType === 'enable' || actionType === 'disable') ? (
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                ) : extension.isEnabled ? (
                  <PowerOff className="w-3 h-3 mr-2" />
                ) : (
                  <Power className="w-3 h-3 mr-2" />
                )}
                {extension.isEnabled ? 'Disable' : 'Enable'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleUninstall}
                disabled={isLoading}
              >
                {isLoading && actionType === 'uninstall' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </Button>
            </>
          )}
        </div>

        {extension.homepage && (
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-xs"
            onClick={() => window.open(extension.homepage, '_blank')}
          >
            <ExternalLink className="w-3 h-3 mr-2" />
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}