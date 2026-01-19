import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Key, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { geminiKeyService } from '@/services/geminiKeyService';

interface GeminiIntegrationProps {
  onClose?: () => void;
}

export function GeminiIntegration({ onClose }: GeminiIntegrationProps) {
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Check if already connected
    if (geminiKeyService.isAuthenticated()) {
      setIsConnected(true);
      setApiKey(geminiKeyService.getKey() || '');
    }
  }, []);

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your Gemini API key');
      return;
    }

    setIsValidating(true);
    try {
      // Validate key by making a test request using the correct endpoint format
      // Use gemini-2.0-flash which is available on free tier
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'test'
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
        throw new Error(`Invalid Gemini API key: ${errorMsg}`);
      }

      // Save the key
      geminiKeyService.setKey(apiKey);
      setIsConnected(true);
      
      toast.success('✅ Connected to Gemini API!');
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('gemini-settings-updated'));
      
    } catch (error) {
      console.error('Gemini connection failed:', error);
      toast.error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDisconnect = () => {
    geminiKeyService.clearKey();
    setIsConnected(false);
    setApiKey('');
    toast.success('Disconnected from Gemini API');
    
    // Notify other components
    window.dispatchEvent(new CustomEvent('gemini-settings-updated'));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gemini Integration</h2>
          <p className="text-[#7d8590] mt-1">
            Connect your Gemini API key for AI-powered code analysis
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose} className="text-[#7d8590]">
            ✕
          </Button>
        )}
      </div>

      {/* Connection Status */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">Connected to Gemini</p>
                  <p className="text-[#7d8590] text-sm">
                    Ready for code analysis
                  </p>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-auto">
                  Connected
                </Badge>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-[#7d8590]" />
                <div>
                  <p className="text-white font-medium">Not Connected</p>
                  <p className="text-[#7d8590] text-sm">
                    Enter your Gemini API key to connect
                  </p>
                </div>
                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 ml-auto">
                  Disconnected
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Key Configuration */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Key className="w-5 h-5" />
            API Key
          </CardTitle>
          <CardDescription>
            Get your key from{' '}
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Google AI Studio → Get API Key
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Gemini API Key</label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter your Gemini API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isConnected}
                className="bg-[#0d1117] border-[#30363d] text-white"
              />
              {isConnected ? (
                <Button 
                  onClick={handleDisconnect}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  Disconnect
                </Button>
              ) : (
                <Button 
                  onClick={handleConnect}
                  disabled={isValidating || !apiKey.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isValidating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Connect'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="text-white">Available Features</CardTitle>
          <CardDescription>
            What you can do with Gemini integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-white">✅ Available Now</h4>
              <ul className="text-sm text-[#7d8590] space-y-1">
                <li>• Connect your Gemini API key</li>
                <li>• Analyze GitHub project code</li>
                <li>• Get AI improvement suggestions</li>
                <li>• Generate improved code</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-white">🚧 Coming Soon</h4>
              <ul className="text-sm text-[#7d8590] space-y-1">
                <li>• Automatic code improvements</li>
                <li>• GitHub push automation</li>
                <li>• Pull request creation</li>
                <li>• Scheduled analysis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
