import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Github, Globe, Settings, Zap, ArrowRight } from 'lucide-react';

interface WelcomeMessageProps {
  onOpenSettings: () => void;
}

export function WelcomeMessage({ onOpenSettings }: WelcomeMessageProps) {
  return (
    <Card className="bg-gradient-to-br from-[#238636]/10 to-[#2ea043]/5 border-[#238636]/30">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#238636]/20 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#238636]" />
            </div>
            <h2 className="text-xl font-semibold text-white">Welcome to ResurrectCI! 🎉</h2>
          </div>
          
          <p className="text-[#7d8590] max-w-md mx-auto">
            Your AI-powered development platform is ready. Connect your GitHub and Vercel accounts 
            to start managing your projects with automated error fixing and intelligent deployments.
          </p>
          
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mt-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
              <Github className="w-6 h-6 text-[#238636] mx-auto mb-2" />
              <h4 className="text-sm font-medium text-white">GitHub</h4>
              <p className="text-xs text-[#7d8590]">Access repositories</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
              <Globe className="w-6 h-6 text-white mx-auto mb-2" />
              <h4 className="text-sm font-medium text-white">Vercel</h4>
              <p className="text-xs text-[#7d8590]">Manage deployments</p>
            </div>
          </div>
          
          <Button 
            onClick={onOpenSettings}
            className="bg-[#238636] hover:bg-[#2ea043] mt-6"
            size="lg"
          >
            <Settings className="w-4 h-4 mr-2" />
            Connect Your Accounts
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <p className="text-xs text-[#7d8590] mt-3">
            Don't worry - we'll guide you through each step! 🚀
          </p>
        </div>
      </CardContent>
    </Card>
  );
}