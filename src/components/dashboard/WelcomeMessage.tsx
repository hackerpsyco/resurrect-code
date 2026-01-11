import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Github, Cloud, Workflow, ArrowRight } from "lucide-react";

interface WelcomeMessageProps {
  onOpenSettings?: () => void;
  onConnectGitHub?: () => void;
}

export function WelcomeMessage({ onOpenSettings, onConnectGitHub }: WelcomeMessageProps) {
  return (
    <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30 p-6 sm:p-8 mb-8 animate-slide-down">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold">Welcome to ResurrectCI!</h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            Let's get you set up with your first project. Connect your GitHub and Vercel accounts to get started.
          </p>
          
          {/* Quick setup steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Github className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Connect GitHub</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Cloud className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Link Vercel</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Workflow className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Setup DevOps</span>
            </div>
          </div>
        </div>

        <Button
          onClick={onConnectGitHub || onOpenSettings}
          className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          Get Started
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
}
