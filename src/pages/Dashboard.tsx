import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AlertCircle, CheckCircle, Zap, GitPullRequest } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  branch: string;
  status: "crashed" | "resurrected" | "fixing" | "pending";
  lastCommit: string;
  timeAgo: string;
  errorPreview?: string;
}

const initialProjects: Project[] = [
  {
    id: "1",
    name: "frontend-app",
    branch: "main",
    status: "crashed",
    lastCommit: "feat: add user authentication flow",
    timeAgo: "5 minutes ago",
    errorPreview: "Error: Module not found: Can't resolve './components/Button'",
  },
  {
    id: "2",
    name: "api-service",
    branch: "develop",
    status: "resurrected",
    lastCommit: "fix: resolve database connection timeout",
    timeAgo: "2 hours ago",
  },
  {
    id: "3",
    name: "mobile-app",
    branch: "feature/payments",
    status: "pending",
    lastCommit: "chore: update dependencies",
    timeAgo: "1 day ago",
  },
  {
    id: "4",
    name: "landing-page",
    branch: "main",
    status: "resurrected",
    lastCommit: "style: update hero section animations",
    timeAgo: "3 days ago",
  },
];

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const handleAutoFix = (projectId: string) => {
    // Set project to "fixing" state
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: "fixing" as const } : p))
    );
    
    toast.info("AI Agent activated", {
      description: "Analyzing error logs and searching for solutions...",
    });

    // Simulate the fixing process
    setTimeout(() => {
      toast.success("Fix found!", {
        description: "Applying patch and creating fix branch...",
      });
    }, 2000);

    setTimeout(() => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, status: "resurrected" as const, errorPreview: undefined }
            : p
        )
      );
      toast.success("Build Resurrected!", {
        description: "Created branch 'resurrect-fix' with the solution.",
      });
    }, 4000);
  };

  const crashedCount = projects.filter((p) => p.status === "crashed").length;
  const resurrectedCount = projects.filter((p) => p.status === "resurrected").length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mission Control</h1>
          <p className="text-muted-foreground">
            Monitor your pipelines and let the AI agent handle failures.
          </p>
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Projects"
            value={projects.length}
            icon={GitPullRequest}
            variant="default"
          />
          <StatsCard
            title="Crashed Builds"
            value={crashedCount}
            icon={AlertCircle}
            variant="destructive"
          />
          <StatsCard
            title="Resurrected"
            value={resurrectedCount}
            icon={CheckCircle}
            trend="12% this week"
            trendUp
            variant="success"
          />
          <StatsCard
            title="Fixes Applied"
            value={47}
            icon={Zap}
            trend="8 today"
            trendUp
            variant="accent"
          />
        </div>
        
        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Projects list */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  {...project}
                  onAutoFix={() => handleAutoFix(project.id)}
                />
              ))}
            </div>
          </div>
          
          {/* Activity feed */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <ActivityFeed />
          </div>
        </div>
      </main>
    </div>
  );
}
