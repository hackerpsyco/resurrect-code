import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  Brain,
  GitPullRequest,
  Clock,
  Shield,
  Webhook,
} from "lucide-react";

const features = [
  {
    icon: AlertTriangle,
    title: "Instant Detection",
    description: "Monitors GitHub webhooks to catch build failures the moment they happen.",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Uses GPT-powered agents to understand error context and find solutions.",
  },
  {
    icon: GitPullRequest,
    title: "Auto PR Creation",
    description: "Creates 'resurrect-fix' branches with proper commits and PRs.",
  },
  {
    icon: Clock,
    title: "Zero Wait Time",
    description: "No more waiting for a developer to be available to fix issues.",
  },
  {
    icon: Shield,
    title: "Safe Fixes",
    description: "Tests fixes in isolated environments before proposing changes.",
  },
  {
    icon: Webhook,
    title: "Slack/Email Alerts",
    description: "Get notified when builds fail and when they're resurrected.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to <span className="text-primary">Ship Faster</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A complete autonomous system that handles the tedious parts of CI/CD
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <Card
              key={i}
              className="bg-card border-border p-6 hover:border-primary/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
