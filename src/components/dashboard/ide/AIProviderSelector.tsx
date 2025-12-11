import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, Key, Save } from "lucide-react";
import { toast } from "sonner";

export type AIProvider = "gemini" | "openai" | "claude" | "lovable";

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

interface AIProviderSelectorProps {
  onConfigSave: (config: AIConfig) => void;
  currentConfig?: AIConfig;
}

const providerModels = {
  gemini: [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-exp", 
    "gemini-1.5-pro",
  ],
  openai: [
    "gpt-4-turbo-preview",
    "gpt-4",
    "gpt-3.5-turbo",
  ],
  claude: [
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
  ],
  lovable: [
    "google/gemini-2.5-flash",
    "anthropic/claude-3.5-sonnet",
  ],

};

export function AIProviderSelector({ onConfigSave, currentConfig }: AIProviderSelectorProps) {
  const [provider, setProvider] = useState<AIProvider>(currentConfig?.provider || "gemini");
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || "");
  const [model, setModel] = useState(currentConfig?.model || providerModels.gemini[0]);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setModel(providerModels[newProvider][0]);
  };

  const handleSave = () => {
    if (!apiKey && provider !== "lovable") {
      toast.error("API key is required");
      return;
    }

    const config: AIConfig = { provider, apiKey, model };
    localStorage.setItem("ai_config", JSON.stringify(config));
    onConfigSave(config);
    toast.success("AI configuration saved");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Provider Configuration
        </CardTitle>
        <CardDescription>
          Choose your AI provider and configure API access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>AI Provider</Label>
          <Select value={provider} onValueChange={(v) => handleProviderChange(v as AIProvider)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>

              <SelectItem value="gemini">Google Gemini</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="claude">Anthropic Claude</SelectItem>
              <SelectItem value="lovable">Lovable AI Gateway</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providerModels[provider].map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                  {provider === "gemini" && m === "gemini-2.5-flash" && " (Free Tier - Latest)"}
                  {provider === "gemini" && m === "gemini-1.5-flash" && " (Free Tier - Stable)"}
                  {provider === "gemini" && m === "gemini-2.0-flash-exp" && " (Free Tier - Experimental)"}
                  {provider === "gemini" && m === "gemini-1.5-pro" && " (Paid Tier)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {provider === "gemini" && (
            <p className="text-xs text-muted-foreground">
              💡 Use gemini-2.5-flash (latest) or gemini-1.5-flash for free tier access
            </p>
          )}
        </div>

        {provider !== "lovable" && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Key
            </Label>
            <Input
              type="password"
              placeholder={`Enter your ${provider} API key`}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally and never sent to our servers
            </p>
          </div>
        )}

        <Button onClick={handleSave} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
}
