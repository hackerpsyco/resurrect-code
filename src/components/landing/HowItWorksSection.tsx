import { Search, FileCode, GitPullRequest, Rocket } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Detect & Analyze",
    description: "Monitors your CI/CD pipeline. When a build fails, it instantly captures error logs and stack traces.",
    color: "text-destructive",
  },
  {
    icon: FileCode,
    title: "Research & Patch",
    description: "AI agent searches StackOverflow, GitHub issues, and documentation to find the exact fix.",
    color: "text-accent-foreground",
  },
  {
    icon: GitPullRequest,
    title: "Create Fix Branch",
    description: "Automatically applies the patch and creates a 'resurrect-fix' branch with the solution.",
    color: "text-primary",
  },
  {
    icon: Rocket,
    title: "Deploy & Notify",
    description: "Deploys a preview and notifies your team. One click to merge the fix to production.",
    color: "text-chart-4",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How <span className="text-primary">ResurrectCI</span> Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A fully autonomous loop that diagnoses, fixes, and deploys — no manual debugging required.
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-px bg-gradient-to-r from-border to-border/0" />
              )}
              
              <div className="relative z-10 text-center">
                {/* Icon container */}
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-card border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                  <step.icon className={`w-10 h-10 ${step.color}`} />
                </div>
                
                {/* Step number */}
                <div className="absolute top-0 right-1/4 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
                  <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
                </div>
                
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
