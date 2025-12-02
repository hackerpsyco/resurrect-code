import { Button } from "@/components/ui/button";
import { Cpu, Plus, Settings, Bell } from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
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
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Connect Repo
          </Button>
        </div>
      </div>
    </header>
  );
}
