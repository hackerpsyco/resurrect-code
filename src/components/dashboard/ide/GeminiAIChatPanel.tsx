import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { AIService } from '@/services/aiService';
import { geminiKeyService } from '@/services/geminiKeyService';
import { toast } from 'sonner';

interface GeminiAIChatPanelProps {
  selectedCode?: string;
  currentFile?: string;
  currentError?: string;
  onCodeInsert?: (code: string, filePath: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlocks?: CodeBlock[];
}

interface CodeBlock {
  language: string;
  code: string;
  filePath?: string;
}

export function GeminiAIChatPanel({
  selectedCode,
  currentFile,
  currentError,
  onCodeInsert,
}: GeminiAIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize AI Service
  useEffect(() => {
    const initializeAI = async () => {
      const apiKey = geminiKeyService.getApiKey();
      const model = geminiKeyService.getModel();

      if (!apiKey) {
        console.warn('⚠️ Gemini API key not configured');
        return;
      }

      try {
        const service = new AIService('gemini', apiKey, model);
        setAiService(service);
        console.log('✅ Gemini AI initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini AI:', error);
        toast.error('Failed to initialize AI', {
          description: 'Check your API key in settings',
        });
      }
    };

    initializeAI();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const buildContext = (): string => {
    let context = '';

    if (currentFile) {
      context += `Current file: ${currentFile}\n`;
    }

    if (selectedCode) {
      context += `Selected code:\n\`\`\`\n${selectedCode}\n\`\`\`\n`;
    }

    if (currentError) {
      context += `Current error:\n${currentError}\n`;
    }

    return context;
  };

  const parseCodeBlocks = (content: string): CodeBlock[] => {
    const codeBlocks: CodeBlock[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2].trim(),
      });
    }

    return codeBlocks;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !aiService) {
      if (!aiService) {
        toast.error('AI not configured', {
          description: 'Please add your Gemini API key in settings',
        });
      }
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = buildContext();
      const fullMessage = context ? `${context}\n\nUser question: ${input}` : input;

      let assistantContent = '';
      const messageId = `msg-${Date.now()}-ai`;

      // Stream response from Gemini
      for await (const chunk of aiService.streamChat([
        {
          role: 'system',
          content:
            'You are a helpful code assistant. Provide clear, concise answers with code examples when relevant. Format code blocks with language identifiers.',
        },
        {
          role: 'user',
          content: fullMessage,
        },
      ])) {
        assistantContent += chunk.content;

        // Update message in real-time
        setMessages((prev) => {
          const existing = prev.find((m) => m.id === messageId);
          if (existing) {
            return prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    content: assistantContent,
                    codeBlocks: parseCodeBlocks(assistantContent),
                  }
                : m
            );
          } else {
            return [
              ...prev,
              {
                id: messageId,
                role: 'assistant',
                content: assistantContent,
                timestamp: new Date(),
                codeBlocks: parseCodeBlocks(assistantContent),
              },
            ];
          }
        });
      }

      console.log('✅ AI response received');
    } catch (error) {
      console.error('❌ Error sending message:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
        toast.error('Rate limit exceeded', {
          description: 'Please wait a few minutes before trying again',
        });
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('403')) {
        toast.error('Invalid API key', {
          description: 'Please check your Gemini API key in settings',
        });
      } else {
        toast.error('Failed to get AI response', {
          description: errorMessage,
        });
      }

      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: `❌ Error: ${errorMessage}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (code: string, blockId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(blockId);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const insertCode = (code: string, filePath?: string) => {
    if (onCodeInsert) {
      onCodeInsert(code, filePath || currentFile || 'index.ts');
      toast.success('Code inserted into editor');
    }
  };

  if (!aiService) {
    return (
      <div className="w-full h-full bg-[#0d1117] flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-8 h-8 text-[#7d8590] mb-3" />
        <p className="text-sm text-[#7d8590] text-center mb-4">
          Gemini AI is not configured
        </p>
        <Button
          size="sm"
          className="bg-[#238636] hover:bg-[#2ea043]"
          onClick={() => {
            toast.info('Go to Settings → Integrations to add your Gemini API key');
          }}
        >
          Configure API Key
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0d1117] flex flex-col">
      {/* Header */}
      <div className="h-12 bg-[#161b22] border-b border-[#30363d] flex items-center px-4 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">Gemini AI Assistant</h3>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-[#7d8590] mb-2">
                Ask me anything about your code!
              </p>
              <p className="text-xs text-[#7d8590]">
                I can help with debugging, suggestions, and explanations.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-[#238636] text-white'
                    : 'bg-[#161b22] text-[#e6edf3] border border-[#30363d]'
                }`}
              >
                <p className="text-xs whitespace-pre-wrap break-words">
                  {message.content}
                </p>

                {/* Code Blocks */}
                {message.codeBlocks && message.codeBlocks.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.codeBlocks.map((block, idx) => (
                      <div
                        key={idx}
                        className="bg-[#0d1117] rounded border border-[#30363d] overflow-hidden"
                      >
                        <div className="flex items-center justify-between bg-[#161b22] px-3 py-1">
                          <span className="text-xs text-[#7d8590]">
                            {block.language}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(block.code, `${message.id}-${idx}`)
                              }
                              className="h-6 w-6 p-0 text-[#7d8590] hover:text-white"
                            >
                              {copiedId === `${message.id}-${idx}` ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                            {onCodeInsert && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => insertCode(block.code, block.filePath)}
                                className="h-6 w-6 p-0 text-[#7d8590] hover:text-[#238636] text-xs"
                              >
                                Insert
                              </Button>
                            )}
                          </div>
                        </div>
                        <pre className="p-2 text-xs overflow-x-auto text-[#e6edf3]">
                          <code>{block.code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-[#7d8590] mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#161b22] text-[#e6edf3] border border-[#30363d] px-3 py-2 rounded-lg flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="h-16 bg-[#161b22] border-t border-[#30363d] p-3 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask me anything..."
            className="flex-1 bg-[#0d1117] border-[#30363d] text-white placeholder:text-[#7d8590] text-xs"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-[#238636] hover:bg-[#2ea043] text-white h-8 w-8 p-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
