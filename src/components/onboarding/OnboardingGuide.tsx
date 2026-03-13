import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Github,
  Zap,
  Settings,
  CheckCircle2,
  ArrowRight,
  X,
  Code2,
  Cloud,
  Workflow,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  action?: {
    label: string;
    href: string;
  };
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to ResurrectCI",
    description: "Let's set up your account and get you started",
    icon: <Zap className="w-8 h-8" />,
    details: [
      "Connect your GitHub account",
      "Set up Vercel integration",
      "Configure DevOps workflows",
      "Start automating your CI/CD",
    ],
  },
  {
    id: "github",
    title: "Connect GitHub",
    description: "Link your GitHub account to access your repositories",
    icon: <Github className="w-8 h-8" />,
    details: [
      "Authorize ResurrectCI to access your repositories",
      "Select which repositories to monitor",
      "Enable automatic deployments",
      "Set up branch protection rules",
    ],
    action: {
      label: "Connect GitHub",
      href: "/settings/integrations/github",
    },
  },
  {
    id: "vercel",
    title: "Set Up Vercel",
    description: "Deploy your applications to Vercel with one click",
    icon: <Cloud className="w-8 h-8" />,
    details: [
      "Connect your Vercel account",
      "Link projects to your repositories",
      "Configure deployment settings",
      "Enable preview deployments",
    ],
    action: {
      label: "Configure Vercel",
      href: "/settings/integrations/vercel",
    },
  },
  {
    id: "devops",
    title: "Configure DevOps",
    description: "Set up automated workflows for your projects",
    icon: <Workflow className="w-8 h-8" />,
    details: [
      "Set up automation triggers",
      "Create deployment workflows",
      "Set up monitoring and alerts",
      "Configure rollback procedures",
    ],
    action: {
      label: "Setup DevOps",
      href: "/settings/devops",
    },
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "Start using ResurrectCI to automate your workflows",
    icon: <CheckCircle2 className="w-8 h-8" />,
    details: [
      "Create your first workflow",
      "Monitor your deployments",
      "Collaborate with your team",
      "Explore advanced features",
    ],
  },
];

interface OnboardingGuideProps {
  onClose?: () => void;
  onComplete?: () => void;
}

export function OnboardingGuide({ onClose, onComplete }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleStepComplete = () => {
    if (!completedSteps.includes(step.id)) {
      setCompletedSteps([...completedSteps, step.id]);
    }
    handleNext();
  };

  const handleSkip = () => {
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className="w-full max-w-2xl bg-card border-border p-6 sm:p-8 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </h3>
            <span className="text-sm font-medium text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step content */}
        <div className="mb-8 animate-slide-down">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary animate-pulse-glow">
              {step.icon}
            </div>
          </div>

          {/* Title and description */}
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">
            {step.title}
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            {step.description}
          </p>

          {/* Details list */}
          <div className="space-y-3 mb-8">
            {step.details.map((detail, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                style={{
                  animation: `slide-up 0.6s ease-out ${index * 100}ms both`,
                }}
              >
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {step.action && (
            <Button
              onClick={handleStepComplete}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
            >
              {step.action.label}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {currentStep === ONBOARDING_STEPS.length - 1 ? (
            <Button
              onClick={onComplete}
              variant="outline"
              className="flex-1 transition-all duration-300 hover:shadow-lg"
            >
              Get Started
            </Button>
          ) : (
            <>
              <Button
                onClick={handleNext}
                variant="outline"
                className="flex-1 transition-all duration-300 hover:shadow-lg"
              >
                Skip for now
              </Button>
              {!step.action && (
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Step indicators */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {ONBOARDING_STEPS.map((s, index) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "bg-primary w-8"
                  : completedSteps.includes(s.id)
                    ? "bg-primary/60"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
