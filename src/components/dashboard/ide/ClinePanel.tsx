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
  Sparkles,
  FileCode,
  GitPullRequest,
  AlertCircle,
  CheckCircle,
  Copy,
  Settings,
  Zap,
  Bug,
  TestTube,
  BookOpen,
  RefreshCw,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { getAIConfig } from "@/services/aiService";
import { useCline } from "@/hooks/useCline";
import { ClineTask, ClineContext } from "@/services/clineApi";
import { testClineSetup, debugClineIssue } from "@/services/clineTestService";
import { testGeminiAPI, setupGeminiForCline } from "@/services/geminiTestService";
import { AIProviderSelector, AIProvider } from "./AIProviderSelector";
import { realErrorDetector, RealError } from "@/services/realErrorDetector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClinePanelProps {
  currentFile?: string;
  fileContent?: string;
  errorLogs?: string[];
  projectName?: string;
  onApplyFix?: (path: string, content: string) => void;
}

export function ClinePanel({
  currentFile,
  fileContent,
  errorLogs = [],
  projectName,
  onApplyFix,
}: ClinePanelProps) {
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const [selectedTask, setSelectedTask] = useState<ClineTask | null>(null);
  const [currentFileErrors, setCurrentFileErrors] = useState<RealError[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const {
    currentTask,
    isLoading,
    error,
    tasks,
    streamContent,
    streamTask,
    fixError,
    explainCode,
    generateCode,
    refactorCode,
    optimizeCode,
    generateTests,
    generateDocs,
    clearTasks
  } = useCline();

  const aiConfig = getAIConfig();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [tasks, streamContent]);

  useEffect(() => {
    // Analyze current file for real errors
    if (currentFile && fileContent) {
      const errors = realErrorDetector.getCurrentFileErrors(currentFile, fileContent);
      setCurrentFileErrors(errors.slice(0, 5)); // Show top 5 errors
    } else {
      setCurrentFileErrors([]);
    }
  }, [currentFile, fileContent]);



  const createContext = (): ClineContext => ({
    currentFile,
    fileContent,
    errorLogs,
    projectName,
    language: currentFile?.split('.').pop() || 'unknown'
  });

  const handleConfigSave = (config: { provider: AIProvider; apiKey: string; model: string }) => {
    localStorage.setItem('ai_config', JSON.stringify(config));
    setShowSettings(false);
    toast.success("AI provider configured - restart required");
  };

  const handleTestSetup = async () => {
    toast.info("Testing Cline setup...");
    const result = await testClineSetup();
    
    if (result.success) {
      toast.success(result.message);
      console.log('Cline test details:', result.details);
    } else {
      toast.error(result.message);
      console.error('Cline test failed:', result.details);
    }
  };

  const handleQuickGeminiSetup = async () => {
    const apiKey = 'AIzaSyDRSAYQSZjL-qmIVpuZKShfYxdo8MBliL0';
    
    toast.info("Setting up Gemini 2.5 Flash (Free Tier)...", {
      description: "Testing API connection with rate limiting..."
    });
    
    try {
      await setupGeminiForCline(apiKey);
      toast.success("Gemini 2.5 Flash configured successfully!", {
        description: "You can now use Cline with Gemini API. Rate limiting is active to prevent quota issues."
      });
      
      // Force a re-render to show the new config
      window.location.reload();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMsg.includes('rate limit')) {
        toast.error("Rate limit reached", {
          description: "Please wait a few minutes before testing again. Free tier has strict limits."
        });
      } else if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        toast.error("API quota exceeded", {
          description: "Gemini free tier limits reached. Please wait 5-10 minutes and try again."
        });
      } else {
        toast.error(`Gemini setup failed: ${errorMsg}`);
      }
    }
  };

  const executeTask = async (taskType: ClineTask['type'], instruction: string) => {
    if (!aiConfig) {
      toast.error("Please configure AI provider first");
      setShowSettings(true);
      return;
    }

    console.log('🚀 Executing task:', { taskType, instruction, aiConfig });
    const context = createContext();
    
    try {
      // Use streaming for better UX
      let chunkCount = 0;
      for await (const chunk of streamTask(taskType, instruction, context)) {
        chunkCount++;
        console.log(`📝 Chunk ${chunkCount}:`, chunk);
        
        // The hook handles state updates
        if (chunk.done && chunk.task.status === 'completed') {
          console.log('✅ Task completed successfully:', chunk.task);
          toast.success(`Task completed: ${chunk.task.type}`);
        } else if (chunk.done && chunk.task.status === 'failed') {
          console.log('❌ Task failed:', chunk.task);
          toast.error(`Task failed: ${chunk.task.type}`);
        }
      }
      console.log(`📊 Total chunks received: ${chunkCount}`);
    } catch (error) {
      console.error('❌ Task execution failed:', error);
      toast.error(`Task execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const instruction = input.trim();
    setInput("");
    
    await executeTask('generate_code', instruction);
  };

  const handleApplyCode = (task: ClineTask) => {
    if (task.output?.code && task.input.filePath && onApplyFix) {
      onApplyFix(task.input.filePath, task.output.code);
      toast.success(`Applied fix to ${task.input.filePath}`);
    } else if (task.output?.code) {
      navigator.clipboard.writeText(task.output.code);
      toast.success("Code copied to clipboard");
    }
  };

  const getTaskIcon = (type: ClineTask['type']) => {
    switch (type) {
      case 'fix_error': return Bug;
      case 'explain_code': return BookOpen;
      case 'generate_code': return FileCode;
      case 'refactor': return RefreshCw;
      case 'optimize': return Zap;
      case 'test': return TestTube;
      case 'document': return BookOpen;
      default: return Bot;
    }
  };

  const getStatusColor = (status: ClineTask['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const quickActions = [
    {
      label: "Fix Errors",
      icon: Bug,
      type: 'fix_error' as const,
      action: () => executeTask('fix_error', `Fix these errors: ${errorLogs.join(', ')}`),
      disabled: errorLogs.length === 0,
    },
    {
      label: "Explain Code",
      icon: BookOpen,
      type: 'explain_code' as const,
      action: () => executeTask('explain_code', 'Explain how this code works'),
      disabled: !fileContent,
    },
    {
      label: "Refactor",
      icon: RefreshCw,
      type: 'refactor' as const,
      action: () => executeTask('refactor', 'Refactor this code to improve quality'),
      disabled: !fileContent,
    },
    {
      label: "Optimize",
      icon: Zap,
      type: 'optimize' as const,
      action: () => executeTask('optimize', 'Optimize this code for better performance'),
      disabled: !fileContent,
    },
    {
      label: "Generate Tests",
      icon: TestTube,
      type: 'test' as const,
      action: () => executeTask('test', 'Generate comprehensive tests for this code'),
      disabled: !fileContent,
    },
    {
      label: "Add Docs",
      icon: BookOpen,
      type: 'document' as const,
      action: () => executeTask('document', 'Generate documentation for this code'),
      disabled: !fileContent,
    },
  ];

  return (
    <>
      <Card className="h-full bg-card border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="text-sm font-semibold">Cline AI</span>
              <span className="text-xs text-muted-foreground block">
                {aiConfig ? aiConfig.provider : "Not configured"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                {currentTask?.type || 'Processing'}...
              </div>
            )}
            <Badge variant="secondary" className="text-xs">
              {tasks.length} tasks
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearTasks}
              disabled={tasks.length === 0}
            >
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTestSetup}
              title="Test AI Setup"
            >
              🔍
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleQuickGeminiSetup}
              title="Quick Gemini Setup"
              className="text-xs"
            >
              🤖
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => executeTask('generate_code', 'Create a simple JavaScript function that adds two numbers')}
              title="Test Basic Code Generation"
              className="text-xs"
              disabled={!aiConfig || isLoading}
            >
              ➕
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('🔍 Debug Info:');
                console.log('AI Config:', aiConfig);
                console.log('Current Tasks:', tasks);
                console.log('Current Task:', currentTask);
                console.log('Stream Content:', streamContent);
                console.log('Is Loading:', isLoading);
                console.log('Error:', error);
                toast.info('Debug info logged to console');
              }}
              title="Debug Info"
              className="text-xs"
            >
              🐛
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 px-4 py-2 border-b border-border overflow-x-auto">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="shrink-0 text-xs"
              disabled={action.disabled || isLoading || !aiConfig}
              onClick={action.action}
            >
              <action.icon className="w-3 h-3 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>

        {/* Current File Errors Alert */}
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
                onClick={() => executeTask('fix_error', `Fix these errors in ${currentFile}: ${currentFileErrors.map(e => `Line ${e.line}: ${e.message}`).join(', ')}`)}
                disabled={!aiConfig || isLoading}
              >
                <Zap className="w-3 h-3 mr-1" />
                Fix Issues
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

        {/* Tasks */}
        <ScrollArea className="flex-1 min-h-0">
          <div ref={scrollRef} className="p-4 space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Ask Cline to help with your code</p>
                <p className="text-xs mt-1 opacity-70">
                  {aiConfig ? "Use quick actions or type your request" : "Configure AI provider first"}
                </p>
              </div>
            ) : (
              <>
                {/* Current streaming task */}
                {currentTask && isLoading && (
                  <div className="bg-secondary/50 rounded-lg p-4 border-l-4 border-primary">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm font-medium capitalize">
                        {currentTask.type.replace('_', ' ')}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Running
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {currentTask.input.instruction}
                    </p>
                    {streamContent && (
                      <div className="bg-background/50 rounded p-3 text-sm">
                        <div className="whitespace-pre-wrap">
                          {streamContent}
                          <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Gemini API responding...
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Completed tasks */}
                {tasks.filter(task => task.status !== 'running').map((task) => {
                  const TaskIcon = getTaskIcon(task.type);
                  return (
                    <div key={task.id} className="bg-secondary/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TaskIcon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium capitalize">
                            {task.type.replace('_', ' ')}
                          </span>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {task.completedAt ? 
                            new Date(task.completedAt).toLocaleTimeString() : 
                            new Date(task.createdAt).toLocaleTimeString()
                          }
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {task.input.instruction}
                      </p>

                      {task.status === 'failed' && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded p-2 mb-3">
                          <p className="text-sm text-red-400">Task failed to complete</p>
                        </div>
                      )}

                      {task.output && (
                        <div className="space-y-3">
                          {task.output.explanation && (
                            <div className="bg-background/50 rounded p-3 text-sm">
                              <div className="whitespace-pre-wrap">
                                {task.output.explanation}
                              </div>
                            </div>
                          )}

                          {task.output.code && (
                            <div className="bg-background/50 rounded p-3">
                              {task.input.filePath && (
                                <div className="text-xs text-muted-foreground mb-2 font-mono">
                                  📄 {task.input.filePath}
                                </div>
                              )}
                              <pre className="text-xs overflow-x-auto mb-3">
                                <code>{task.output.code}</code>
                              </pre>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-xs"
                                onClick={() => handleApplyCode(task)}
                              >
                                {task.input.filePath ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Apply to {task.input.filePath.split("/").pop()}
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy Code
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          {task.output.suggestions && task.output.suggestions.length > 0 && (
                            <div className="bg-background/50 rounded p-3">
                              <h4 className="text-xs font-medium mb-2">Suggestions:</h4>
                              <ul className="text-xs space-y-1">
                                {task.output.suggestions.map((suggestion, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {task.output.confidence && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Confidence:</span>
                              <div className="flex-1 bg-background/50 rounded-full h-2">
                                <div 
                                  className="bg-primary rounded-full h-2 transition-all"
                                  style={{ width: `${task.output.confidence * 100}%` }}
                                />
                              </div>
                              <span>{Math.round(task.output.confidence * 100)}%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={aiConfig ? "Ask Cline to generate code, fix errors, or explain concepts..." : "Configure AI provider first..."}
              className="min-h-[60px] resize-none text-sm"
              disabled={!aiConfig}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              size="sm"
              className="h-auto px-3"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || !aiConfig}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* AI Provider Settings Dialog */}
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
