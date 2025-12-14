import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Settings, Loader2, Copy, Check } from "lucide-react";
// Toast removed for clean UI
import { AIService, AIMessage, getAIConfig } from "@/services/aiService";

interface WorkingAIChatPanelProps {
  onClose?: () => void;
}

export function WorkingAIChatPanel({ onClose }: WorkingAIChatPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: "system",
      content: "You are a helpful AI coding assistant. Help users with their code, provide suggestions, and answer programming questions. Be concise and practical."
    },
    {
      role: "assistant",
      content: "👋 Hi! I'm your AI coding assistant. I can help you with:\n\n• Code review and suggestions\n• Debugging issues\n• Writing new functions\n• Explaining code concepts\n• Best practices\n\nWhat would you like to work on today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize AI service
  useEffect(() => {
    const config = getAIConfig();
    if (config) {
      const service = new AIService(config.provider, config.apiKey, config.model);
      setAiService(service);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    if (!aiService) {
      // Silent error
      return;
    }

    const userMessage: AIMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Add assistant message placeholder
      const assistantMessage: AIMessage = { role: "assistant", content: "" };
      setMessages([...newMessages, assistantMessage]);

      let fullResponse = "";
      
      // Stream the response
      for await (const chunk of aiService.streamChat(newMessages)) {
        if (chunk.content) {
          fullResponse += chunk.content;
          setMessages([...newMessages, { role: "assistant", content: fullResponse }]);
        }
        
        if (chunk.done) {
          break;
        }
      }

      if (!fullResponse.trim()) {
        throw new Error("Empty response from AI");
      }

    } catch (error) {
      console.error("AI chat error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      setMessages([...newMessages, {
        role: "assistant",
        content: `❌ **Error**: ${errorMessage}\n\nPlease check your AI configuration in settings and try again.`
      }]);
      
      // Silent error
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      // Silent success
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      // Silent error
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "system",
        content: "You are a helpful AI coding assistant. Help users with their code, provide suggestions, and answer programming questions. Be concise and practical."
      },
      {
        role: "assistant",
        content: "👋 Hi! I'm your AI coding assistant. How can I help you today?"
      }
    ]);
  };

  const openSettings = () => {
    // This would open the AI settings panel
    // Silent info
  };

  return (
    <div className="flex flex-col h-full bg-[#252526]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#464647]">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#0078d4]" />
          <span className="text-sm font-medium text-white">AI Assistant</span>
          {!aiService && (
            <span className="text-xs text-yellow-400">(Not configured)</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
            title="Clear chat"
          >
            🗑️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={openSettings}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
            title="AI Settings"
          >
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-3">
        <div className="space-y-4">
          {messages.filter(m => m.role !== "system").map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-[#0078d4] flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-3 h-3 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-[#0078d4] text-white ml-auto"
                    : "bg-[#1e1e1e] text-[#cccccc] border border-[#464647]"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                
                {message.role === "assistant" && message.content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(message.content, index)}
                    className="h-5 w-5 p-0 mt-2 text-[#7d8590] hover:text-white"
                    title="Copy message"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                )}
              </div>

              {message.role === "user" && (
                <div className="w-6 h-6 rounded-full bg-[#238636] flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-6 h-6 rounded-full bg-[#0078d4] flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="bg-[#1e1e1e] text-[#cccccc] border border-[#464647] rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-[#464647]">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={aiService ? "Ask me anything about your code..." : "Configure AI in settings first"}
            disabled={isLoading || !aiService}
            className="flex-1 bg-[#1e1e1e] border-[#464647] text-white placeholder:text-[#7d8590] text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !aiService}
            size="sm"
            className="bg-[#0078d4] hover:bg-[#106ebe] text-white px-3"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {!aiService && (
          <p className="text-xs text-[#7d8590] mt-2">
            💡 Configure your AI provider (Gemini, OpenAI, Claude) in Settings → Integrations
          </p>
        )}
      </div>
    </div>
  );
}