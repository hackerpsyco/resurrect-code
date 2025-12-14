import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Github, 
  Globe, 
  CheckCircle, 
  ArrowRight, 
  Zap, 
  Settings,
  ExternalLink,
  Key,
  FolderOpen
} from 'lucide-react';

interface NewUserOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function NewUserOnboarding({ onComplete, onSkip }: NewUserOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const steps = [
    {
      id: 1,
      title: "Welcome to ResurrectCI! 🎉",
      description: "Your AI-powered development platform",
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-[#238636]/20 rounded-full flex items-center justify-center">
            <Zap className="w-8 h-8 text-[#238636]" />
          </div>
          <h3 className="text-xl font-semibold text-white">Ready to supercharge your development?</h3>
          <p className="text-[#7d8590]">
            ResurrectCI connects to your GitHub repositories and Vercel deployments, 
            providing AI-powered code analysis, automated error fixing, and seamless project management.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <Github className="w-6 h-6 text-[#238636] mb-2" />
              <h4 className="text-sm font-medium text-white">GitHub Integration</h4>
              <p className="text-xs text-[#7d8590]">Access and edit your repositories</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <Globe className="w-6 h-6 text-white mb-2" />
              <h4 className="text-sm font-medium text-white">Vercel Deployments</h4>
              <p className="text-xs text-[#7d8590]">Monitor and manage deployments</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Connect GitHub",
      description: "Access your repositories",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#238636]/20 rounded-lg flex items-center justify-center">
              <Github className="w-5 h-5 text-[#238636]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">GitHub Personal Access Token</h3>
              <p className="text-sm text-[#7d8590]">Required to access your repositories</p>
            </div>
          </div>
          
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-3">How to get your token:</h4>
            <ol className="text-sm text-[#7d8590] space-y-2">
              <li className="flex items-start gap-2">
                <span className="bg-[#238636] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5">1</span>
                <div>
                  Go to{' '}
                  <a 
                    href="https://github.com/settings/tokens/new?scopes=repo,user&description=ResurrectCI%20Dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#58a6ff] hover:underline inline-flex items-center gap-1"
                  >
                    GitHub Settings → Tokens
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#238636] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5">2</span>
                <span>Select scopes: <code className="bg-[#21262d] px-1 rounded">repo</code> and <code className="bg-[#21262d] px-1 rounded">user</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#238636] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5">3</span>
                <span>Generate token and copy it</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#238636] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5">4</span>
                <span>Come back and paste it in Settings → Integrations → GitHub</span>
              </li>
            </ol>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Security Note</span>
            </div>
            <p className="text-xs text-yellow-300">
              Your token is stored securely and only used to access your repositories. 
              You can revoke it anytime from GitHub settings.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Connect Vercel (Optional)",
      description: "Manage your deployments",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-black/20 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Vercel API Token</h3>
              <p className="text-sm text-[#7d8590]">Optional - for deployment management</p>
            </div>
          </div>
          
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-3">How to get your Vercel token:</h4>
            <ol className="text-sm text-[#7d8590] space-y-2">
              <li className="flex items-start gap-2">
                <span className="bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5">1</span>
                <div>
                  Go to{' '}
                  <a 
                    href="https://vercel.com/account/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#58a6ff] hover:underline inline-flex items-center gap-1"
                  >
                    Vercel Dashboard → Tokens
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5">2</span>
                <span>Create a new token with appropriate scope</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5">3</span>
                <span>Copy the token and paste it in Settings → Integrations → Vercel</span>
              </li>
            </ol>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FolderOpen className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">What you can do</span>
            </div>
            <ul className="text-xs text-blue-300 space-y-1">
              <li>• Monitor deployment status and logs</li>
              <li>• Trigger deployments directly from the IDE</li>
              <li>• Access deployment URLs and analytics</li>
              <li>• Manage environment variables</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps.find(step => step.id === currentStep);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-[#0d1117] border-[#30363d]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">{currentStepData?.title}</CardTitle>
              <CardDescription>{currentStepData?.description}</CardDescription>
            </div>
            <Badge variant="outline" className="text-[#7d8590]">
              {currentStep} of {totalSteps}
            </Badge>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-[#21262d] rounded-full h-2 mt-4">
            <div 
              className="bg-[#238636] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStepData?.content}
          
          <div className="flex items-center justify-between pt-4 border-t border-[#30363d]">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={onSkip}
                className="text-[#7d8590] hover:text-white"
              >
                Skip Setup
              </Button>
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="border-[#30363d] text-[#7d8590] hover:text-white"
                >
                  Previous
                </Button>
              )}
            </div>
            
            <Button
              onClick={handleNext}
              className="bg-[#238636] hover:bg-[#2ea043]"
            >
              {currentStep === totalSteps ? (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Open Settings
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}