import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  Loader2,
  User,
  FileCode,
  Terminal,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Copy,
  Trash2,
  Settings,
  AlertCircle,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { clineService, ClineMessage, ClineTask } from "@/services/clineService";
import { getAIConfig } from "@/services/aiService";
import { realErrorDetector, RealError } from "@/services/realErrorDetector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AIProviderSelector, AIProvider } from "./AIProviderSelector";
import { AISetupGuide } from "./AISetupGuide";

interface ClineLikePanelProps {
  currentFile?: string;
  fileContent?: string;
  errorLogs?: string[];
  projectName?: string;
  onApplyFix?: (path: string, content: string) => void;
}

export function ClineLikePanel({
  currentFile,
  fileContent,
  errorLogs = [],
  projectName,
  onApplyFix,
}: ClineLikePanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ClineMessage[]>([]);
  const [pendingTasks, setPendingTasks] = useState<ClineTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [currentFileErrors, setCurrentFileErrors] = useState<RealError[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const aiConfig = getAIConfig();

  useEffect(() => {
    // Load initial messages
    setMessages(clineService.getMessages());
    setPendingTasks(clineService.getPendingTasks());
    
    // Show setup guide if no AI config
    if (!aiConfig) {
      setShowSetupGuide(true);
    }
  }, [aiConfig]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Analyze current file for errors
    if (currentFile && fileContent) {
      const errors = realErrorDetector.getCurrentFileErrors(currentFile, fileContent);
      setCurrentFileErrors(errors.slice(0, 5));
    } else {
      setCurrentFileErrors([]);
    }
  }, [currentFile, fileContent]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    if (!aiConfig) {
      toast.error("Please configure AI provider first");
      setShowSettings(true);
      return;
    }

    const message = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      await clineService.sendMessage(message, {
        currentFile,
        fileContent,
        errorLogs,
        projectName
      });

      // Update UI
      setMessages(clineService.getMessages());
      setPendingTasks(clineService.getPendingTasks());

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteTask = async (taskId: string) => {
    const success = await clineService.executeTask(taskId, onApplyFix);
    if (success) {
      setPendingTasks(clineService.getPendingTasks());
    }
  };

  const handleClearSession = () => {
    clineService.clearSession();
    setMessages([]);
    setPendingTasks([]);
    toast.info("Session cleared");
  };

  const handleConfigSave = (config: { provider: AIProvider; apiKey: string; model: string }) => {
    localStorage.setItem('ai_config', JSON.stringify(config));
    setShowSettings(false);
    toast.success("AI provider configured");
    window.location.reload(); // Refresh to load new config
  };

  const handleSetupComplete = () => {
    setShowSetupGuide(false);
    window.location.reload(); // Refresh to load new config
  };

  const handleQuickFix = () => {
    if (currentFileErrors.length === 0) {
      toast.info("No errors found in current file");
      return;
    }

    const errorSummary = currentFileErrors.map(e => `Line ${e.line}: ${e.message}`).join('\n');
    const message = `Please fix these errors in ${currentFile}:\n\n${errorSummary}`;
    
    setInput(message);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = (type: ClineMessage['type']) => {
    switch (type) {
      case 'user': return <User className="w-4 h-4 text-blue-500" />;
      case 'assistant': return <Bot className="w-4 h-4 text-green-500" />;
      case 'system': return <Settings className="w-4 h-4 text-gray-500" />;
      case 'tool': return <Terminal className="w-4 h-4 text-purple-500" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  const getTaskIcon = (type: ClineTask['type']) => {
    switch (type) {
      case 'edit_file': return <FileCode className="w-4 h-4" />;
      case 'run_command': return <Terminal className="w-4 h-4" />;
      case 'create_file': return <FileCode className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getTaskStatusIcon = (status: ClineTask['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <>
      <Card className="h-full bg-card border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold">Cline Assistant</span>
              <span className="text-xs text-muted-foreground block">
                {aiConfig ? `${aiConfig.provider} • ${aiConfig.model}` : "Not configured"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing...
              </div>
            )}
            
            <Badge variant="secondary" className="text-xs">
              {messages.length} messages
            </Badge>
            
            {pendingTasks.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {pendingTasks.length} tasks
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSession}
              disabled={messages.length === 0}
              title="Clear session"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Current File Errors */}
        {currentFileErrors.length > 0 && currentFile && (
          <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-400">
                  {currentFileErrors.length} Issues in {currentFile.split('/').pop()}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs"
                onClick={handleQuickFix}
                disabled={!aiConfig || isLoading}
              >
                <Zap className="w-3 h-3 mr-1" />
                Quick Fix
              </Button>
            </div>
            <div className="space-y-1">
              {currentFileErrors.slice(0, 3).map((error, index) => (
                <div key={`${error.file}-${error.line}-${index}`} className="text-xs text-red-300 flex items-center gap-2">
                  <span className={`w-1 h-1 rounded-full ${error.severity === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <span className="font-mono">Line {error.line}</span>
                  <span>{error.message}</span>
                </div>
              ))}
              {currentFileErrors.length > 3 && (
                <div className="text-xs text-red-400">
                  +{currentFileErrors.length - 3} more issues...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div className="mx-4 mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-400">
                Pending Tasks ({pendingTasks.length})
              </span>
            </div>
            <div className="space-y-2">
              {pendingTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between bg-background/50 rounded p-2">
                  <div className="flex items-center gap-2">
                    {getTaskIcon(task.type)}
                    <span className="text-xs">{task.description}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs"
                    onClick={() => handleExecuteTask(task.id)}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Execute
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div ref={scrollRef} className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Welcome to Cline Assistant</p>
                <p className="text-xs mt-1 opacity-70">
                  {aiConfig ? "Ask me anything about your code!" : "Configure AI provider to get started"}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getMessageIcon(message.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium capitalize">
                        {message.type === 'assistant' ? 'Cline' : message.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap bg-secondary/30 rounded-lg p-3">
                      {message.content}
                    </div>
                    {message.toolUse && (
                      <div className="mt-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded text-xs">
                        <div className="font-medium">Tool: {message.toolUse.tool}</div>
                        {message.toolUse.output && (
                          <div className="mt-1 text-muted-foreground">
                            Output: {JSON.stringify(message.toolUse.output)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={aiConfig ? "Ask Cline to help with your code..." : "Configure AI provider first..."}
              className="min-h-[60px] resize-none text-sm"
              disabled={!aiConfig || isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              size="sm"
              className="h-auto px-3"
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || !aiConfig}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {!aiConfig && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              <Button
                variant="link"
                size="sm"
                className="text-xs p-0 h-auto"
                onClick={() => setShowSettings(true)}
              >
                Configure AI provider to start using Cline
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Setup Guide Dialog */}
      <Dialog open={showSetupGuide} onOpenChange={setShowSetupGuide}>
        <DialogContent className="max-w-3xl">
          <AISetupGuide onComplete={handleSetupComplete} />
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure AI Provider</DialogTitle>
          </DialogHeader>
          <AIProviderSelector
            onConfigSave={handleConfigSave}
            currentConfig={aiConfig || undefined}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}