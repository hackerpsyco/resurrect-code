import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, ExternalLink, Key, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface AISetupGuideProps {
  onComplete: () => void;
}

export function AISetupGuide({ onComplete }: AISetupGuideProps) {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupGemini = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter your Gemini API key");
      return;
    }

    setIsLoading(true);
    
    try {
      // Save the configuration
      const config = {
        provider: "gemini" as const,
        apiKey: apiKey.trim(),
        model: "gemini-2.0-flash-exp"
      };
      
      localStorage.setItem('ai_config', JSON.stringify(config));
      
      toast.success("Gemini AI configured successfully!");
      onComplete();
    } catch (error) {
      toast.error("Failed to configure AI");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSetup = () => {
    // Use the provided API key for quick setup
    const quickApiKey = "AIzaSyDRSAYQSZjL-qmIVpuZKShfYxdo8MBliL0";
    setApiKey(quickApiKey);
    
    const config = {
      provider: "gemini" as const,
      apiKey: quickApiKey,
      model: "gemini-2.0-flash-exp"
    };
    
    localStorage.setItem('ai_config', JSON.stringify(config));
    toast.success("Quick setup complete! Gemini AI is ready to use.");
    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Setup AI Assistant (Cline)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Setup */}
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-green-400">Quick Setup</h3>
                <p className="text-sm text-green-300/80">Use pre-configured Gemini API</p>
              </div>
              <Badge className="bg-green-500/20 text-green-400">Recommended</Badge>
            </div>
            <Button 
              onClick={handleQuickSetup}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Enable AI Assistant (1-Click Setup)
            </Button>
          </div>

          {/* Manual Setup */}
          <div className="space-y-4">
            <h3 className="font-medium">Manual Setup</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="apiKey">Gemini API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your Gemini API key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleSetupGemini}
                disabled={!apiKey.trim() || isLoading}
                className="w-full"
              >
                <Key className="w-4 h-4 mr-2" />
                {isLoading ? "Configuring..." : "Configure Gemini AI"}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3 text-sm text-muted-foreground">
            <h4 className="font-medium text-foreground">How to get Gemini API Key:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Visit Google AI Studio</li>
              <li>Sign in with your Google account</li>
              <li>Create a new API key</li>
              <li>Copy and paste it above</li>
            </ol>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://makersuite.google.com/app/apikey", "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Get Gemini API Key
            </Button>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <h4 className="font-medium">AI Assistant Features:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Code generation and completion</li>
              <li>• Error detection and fixing</li>
              <li>• Code explanation and documentation</li>
              <li>• Refactoring suggestions</li>
              <li>• Real-time chat assistance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}