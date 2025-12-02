import { Button } from "@/components/ui/button";
import { Cpu, Github } from "lucide-react";
import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold">
            Resurrect<span className="text-primary">CI</span>
          </span>
        </Link>
        
        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Github className="w-5 h-5" />
          </Button>
          <Link to="/dashboard">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
