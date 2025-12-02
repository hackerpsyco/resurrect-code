import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, GitBranch, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse delay-1000" />
      
      <div className="relative z-10 container mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-primary/30 bg-primary/10">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">AI-Powered CI/CD Recovery</span>
        </div>
        
        {/* Main heading */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          <span className="text-foreground">Build Failed?</span>
          <br />
          <span className="bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
            We Resurrect It.
          </span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12">
          ResurrectCI detects failures, analyzes errors, searches for solutions, 
          patches your code autonomously, and redeploys — all without human intervention.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link to="/dashboard">
            <Button size="lg" className="group bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold shadow-[var(--glow-primary)]">
              Open Dashboard
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-border hover:bg-secondary">
            View Demo
          </Button>
        </div>
        
        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { icon: GitBranch, text: "Auto-creates fix branches" },
            { icon: Shield, text: "Zero downtime recovery" },
            { icon: Zap, text: "AI-powered debugging" },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border"
            >
              <feature.icon className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
