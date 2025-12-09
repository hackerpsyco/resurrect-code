import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ConnectProjectDialog } from "@/components/dashboard/ConnectProjectDialog";
import { ProjectDetailPanel } from "@/components/dashboard/ProjectDetailPanel";
import { AgentWorkflowPanel } from "@/components/dashboard/AgentWorkflowPanel";
import { KestraConfigPanel } from "@/components/dashboard/KestraConfigPanel";
import { IDELayout } from "@/components/dashboard/ide/IDELayout";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Zap, GitPullRequest, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAIAgent } from "@/hooks/useAIAgent";
import { useVercel } from "@/hooks/useVercel";

interface Project {
  id: string;
  name: string;
  branch: string;
  status: "crashed" | "resurrected" | "fixing" | "pending";
  lastCommit: string;
  timeAgo: string;
  errorPreview?: string;
  owner?: string;
  repo?: string;
  vercelProjectId?: string;
  latestDeploymentId?: string;
}

const initialProjects: Project[] = [
  {
    id: "1",
    name: "frontend-app",
    branch: "main",
    status: "crashed",
    lastCommit: "feat: add user authentication flow",
    timeAgo: "5 minutes ago",
    errorPreview: "Error: Module not found: Can't resolve './styles.css'\n  at ./src/components/Button.tsx\n  at ./src/App.tsx",
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
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [ideProject, setIdeProject] = useState<Project | null>(null);
  
  const { runAgent, isRunning: agentRunning, steps: agentSteps, currentStep } = useAIAgent();
  const { fetchBuildLogs, fetchDeployments, extractErrors } = useVercel();

  const handleAutoFix = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: "fixing" as const } : p))
    );
    
    toast.info("AI Agent activated", {
      description: "Fetching Vercel build logs and analyzing errors...",
    });

    try {
      // Fetch real Vercel deployment logs if we have a Vercel project
      let errorLogs: string[] = [];
      let errorMessage = project.errorPreview || "Build failed";
      
      if (project.vercelProjectId || project.latestDeploymentId) {
        // Get latest deployment
        if (project.vercelProjectId && !project.latestDeploymentId) {
          const deployments = await fetchDeployments(project.vercelProjectId);
          if (deployments.length > 0) {
            project.latestDeploymentId = deployments[0].uid;
          }
        }
        
        if (project.latestDeploymentId) {
          const logs = await fetchBuildLogs(project.latestDeploymentId);
          errorLogs = logs.map((e: { payload?: { text?: string } }) => e.payload?.text || "").filter(Boolean);
          const extractedErrors = extractErrors(logs);
          if (extractedErrors.length > 0) {
            errorMessage = extractedErrors.join("\n");
          }
        }
      }

      // Run the AI agent with real error data
      const result = await runAgent({
        deploymentId: project.latestDeploymentId || project.id,
        projectName: project.name,
        branch: project.branch,
        commitMessage: project.lastCommit,
        errorMessage,
        errorLogs: errorLogs.length > 0 ? errorLogs : [project.errorPreview || "Unknown error"],
        owner: project.owner,
        repo: project.repo || project.name,
      });

      if (result.success) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, status: "resurrected" as const, errorPreview: undefined }
              : p
          )
        );
        if (selectedProject?.id === projectId) {
          setSelectedProject((prev) =>
            prev ? { ...prev, status: "resurrected" as const, errorPreview: undefined } : null
          );
        }
      } else {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, status: "crashed" as const } : p))
        );
        toast.error("Agent could not fix the error", {
          description: result.error || "Please check the logs for details",
        });
      }
    } catch (error) {
      console.error("Auto-fix error:", error);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: "crashed" as const } : p))
      );
      toast.error("Auto-fix failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleProjectConnected = (newProject: {
    name: string;
    repo: string;
    branch: string;
    owner: string;
    vercelProjectId?: string;
  }) => {
    const project: Project = {
      id: String(projects.length + 1),
      name: newProject.name,
      branch: newProject.branch,
      status: "pending",
      lastCommit: "Initial connection",
      timeAgo: "Just now",
      owner: newProject.owner,
      repo: newProject.name,
      vercelProjectId: newProject.vercelProjectId,
    };
    setProjects((prev) => [project, ...prev]);
    toast.success(`${newProject.name} connected!`, {
      description: "Monitoring for deployment failures...",
    });
  };

  const crashedCount = projects.filter((p) => p.status === "crashed").length;
  const resurrectedCount = projects.filter((p) => p.status === "resurrected").length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-6 py-8">
        {/* Page header with action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mission Control</h1>
            <p className="text-muted-foreground">
              Monitor your pipelines and let the AI agent handle failures.
            </p>
          </div>
          <Button
            onClick={() => setConnectDialogOpen(true)}
            className="bg-primary hover:bg-primary/90 shadow-[var(--glow-primary)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Project
          </Button>
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
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="cursor-pointer"
                >
                  <ProjectCard
                    {...project}
                    onAutoFix={() => {
                      handleAutoFix(project.id);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Activity feed and Agent panel */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Kestra Workflow</h2>
              <KestraConfigPanel
                projectData={
                  selectedProject?.status === "crashed"
                    ? {
                        deploymentId: selectedProject.latestDeploymentId || selectedProject.id,
                        projectName: selectedProject.name,
                        branch: selectedProject.branch,
                        errorMessage: selectedProject.errorPreview || "Build failed",
                        errorLogs: [selectedProject.errorPreview || "Unknown error"],
                      }
                    : undefined
                }
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">AI Agent Status</h2>
              <AgentWorkflowPanel
                steps={agentSteps}
                isRunning={agentRunning}
                currentStep={currentStep}
                projectName={selectedProject?.name}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <ActivityFeed />
            </div>
          </div>
        </div>
      </main>

      {/* Connect Project Dialog */}
      <ConnectProjectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        onProjectConnected={handleProjectConnected}
      />

      {/* Project Detail Panel */}
      {selectedProject && !ideProject && (
        <ProjectDetailPanel
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onAutoFix={() => handleAutoFix(selectedProject.id)}
          onOpenIDE={() => {
            setIdeProject(selectedProject);
            setSelectedProject(null);
          }}
        />
      )}

      {/* Full IDE View */}
      {ideProject && (
        <IDELayout
          project={ideProject}
          onClose={() => setIdeProject(null)}
        />
      )}
    </div>
  );
}
