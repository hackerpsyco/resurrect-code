import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  codeBlocks?: Array<{ language: string; code: string; path?: string }>;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const parseCodeBlocks = (content: string) => {
    const codeBlockRegex = /```(\w+)?\s*(?:\/\/\s*(.+))?\n([\s\S]*?)```/g;
    const blocks: Array<{ language: string; code: string; path?: string }> = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || "plaintext",
        code: match[3].trim(),
        path: match[2],
      });
    }

    return blocks;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build context for the AI
      const context = [];
      if (currentFile && fileContent) {
        context.push(`Current file: ${currentFile}\n\`\`\`\n${fileContent}\n\`\`\``);
      }
      if (errorLogs.length > 0) {
        context.push(`Build errors:\n${errorLogs.join("\n")}`);
      }
      if (projectName) {
        context.push(`Project: ${projectName}`);
      }

      const systemPrompt = `You are Cline, an expert AI coding assistant integrated into ResurrectCI IDE. 
Your job is to help fix build errors and improve code quality.

When suggesting code fixes:
1. Always show the complete fixed code in a code block
2. Include the file path as a comment at the top of the code block: \`\`\`typescript // src/path/to/file.ts
3. Explain what changes were made and why
4. If multiple files need changes, show each one separately

Current context:
${context.join("\n\n")}`;

      const { data, error } = await supabase.functions.invoke("ai-agent", {
        body: {
          action: "full_analysis",
          error: {
            message: input,
            logs: errorLogs,
            file: currentFile,
            code: fileContent,
          },
        },
      });

      if (error) throw error;

      const assistantContent = data.result?.analysis || 
        data.result?.solution || 
        data.result?.fix ||
        "I couldn't generate a response. Please try again.";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
        codeBlocks: parseCodeBlocks(assistantContent),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Cline error:", error);
      toast.error("Failed to get AI response");
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCode = (block: { language: string; code: string; path?: string }) => {
    if (block.path && onApplyFix) {
      onApplyFix(block.path, block.code);
      toast.success(`Applied fix to ${block.path}`);
    } else {
      // Copy to clipboard if no path
      navigator.clipboard.writeText(block.code);
      toast.success("Code copied to clipboard");
    }
  };

  const quickActions = [
    {
      label: "Fix Error",
      icon: AlertCircle,
      prompt: "Analyze the current build error and suggest a fix",
      disabled: errorLogs.length === 0,
    },
    {
      label: "Explain Code",
      icon: FileCode,
      prompt: "Explain what this code does and how it works",
      disabled: !currentFile,
    },
    {
      label: "Create PR",
      icon: GitPullRequest,
      prompt: "Generate a pull request description for the current changes",
      disabled: !currentFile,
    },
  ];

  return (
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
              Coding Assistant
            </span>
          </div>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 px-4 py-2 border-b border-border overflow-x-auto">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="shrink-0 text-xs"
            disabled={action.disabled || isLoading}
            onClick={() => {
              setInput(action.prompt);
              sendMessage();
            }}
          >
            <action.icon className="w-3 h-3 mr-1" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div ref={scrollRef} className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Ask Cline to help fix errors</p>
              <p className="text-xs mt-1 opacity-70">
                or use the quick actions above
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Code blocks with apply button */}
                  {message.codeBlocks && message.codeBlocks.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.codeBlocks.map((block, i) => (
                        <div key={i} className="relative">
                          {block.path && (
                            <div className="text-xs text-muted-foreground mb-1">
                              {block.path}
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute top-1 right-1 h-6 text-xs"
                            onClick={() => handleApplyCode(block)}
                          >
                            {block.path ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Apply
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-3 h-3 text-primary" />
              </div>
              <div className="bg-secondary rounded-lg px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-100" />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-200" />
                </div>
              </div>
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
            placeholder="Ask Cline to fix errors, explain code, or improve your project..."
            className="min-h-[60px] resize-none text-sm"
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
            disabled={!input.trim() || isLoading}
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
  );
}
