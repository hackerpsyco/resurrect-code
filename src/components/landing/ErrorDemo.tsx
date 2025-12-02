import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, Search, FileCode, CheckCircle, Terminal } from "lucide-react";

const errorLines = [
  { type: "error", text: "ERROR in ./src/components/Button.tsx" },
  { type: "error", text: "Module not found: Can't resolve './styles.css'" },
  { type: "location", text: "  at line 3:1" },
  { type: "info", text: "" },
  { type: "error", text: "Build failed with 1 error" },
];

const fixingSteps = [
  { icon: AlertCircle, text: "Analyzing error logs...", color: "text-destructive" },
  { icon: Search, text: "Searching StackOverflow & GitHub...", color: "text-chart-3" },
  { icon: FileCode, text: "Found solution: Create missing styles.css", color: "text-accent-foreground" },
  { icon: FileCode, text: "Applying patch to Button.tsx...", color: "text-accent-foreground" },
  { icon: CheckCircle, text: "Build successful! Creating PR...", color: "text-primary" },
];

export function ErrorDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showFix, setShowFix] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!showFix) {
        setShowFix(true);
        setCurrentStep(0);
      } else {
        setCurrentStep((prev) => {
          if (prev >= fixingSteps.length - 1) {
            setTimeout(() => {
              setShowFix(false);
              setCurrentStep(0);
            }, 2000);
            return prev;
          }
          return prev + 1;
        });
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [showFix]);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Watch the <span className="text-primary">Magic</span> Happen
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See how ResurrectCI automatically detects and fixes build errors in real-time
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Terminal with error */}
          <Card className="bg-card border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-background border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <div className="w-3 h-3 rounded-full bg-chart-4" />
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
              <span className="text-sm text-muted-foreground font-mono ml-2">
                <Terminal className="w-4 h-4 inline mr-2" />
                build-output.log
              </span>
            </div>
            <div className="p-4 font-mono text-sm space-y-1 min-h-[200px]">
              {errorLines.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.type === "error"
                      ? "text-destructive"
                      : line.type === "location"
                      ? "text-muted-foreground"
                      : ""
                  }
                >
                  {line.text}
                </div>
              ))}
            </div>
          </Card>
          
          {/* AI Agent fixing */}
          <Card className="bg-card border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-background border-b border-border">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground font-mono ml-2">
                ResurrectCI Agent
              </span>
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                Active
              </span>
            </div>
            <div className="p-4 space-y-3 min-h-[200px]">
              {fixingSteps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                    showFix && i <= currentStep
                      ? "bg-background border border-border opacity-100"
                      : "opacity-30"
                  }`}
                >
                  <step.icon className={`w-5 h-5 ${step.color}`} />
                  <span className="text-sm">{step.text}</span>
                  {showFix && i === currentStep && i < fixingSteps.length - 1 && (
                    <div className="ml-auto w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  {showFix && i <= currentStep && i === fixingSteps.length - 1 && (
                    <CheckCircle className="ml-auto w-4 h-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
