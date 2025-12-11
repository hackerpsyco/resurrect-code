import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ConnectProjectDialog } from "@/components/dashboard/ConnectProjectDialog";
import { ProjectDetailPanel } from "@/components/dashboard/ProjectDetailPanel";
import { AgentWorkflowPanel } from "@/components/dashboard/AgentWorkflowPanel";
import { KestraConfigPanel } from "@/components/dashboard/KestraConfigPanel";
import { VSCodeLayout } from "@/components/dashboard/ide/VSCodeLayout";
import { PRPreviewDialog } from "@/components/dashboard/PRPreviewDialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Zap, GitPullRequest, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAIAgent } from "@/hooks/useAIAgent";
import { useVercel } from "@/hooks/useVercel";
import { supabase } from "@/integrations/supabase/client";

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
  const [prPreviewOpen, setPrPreviewOpen] = useState(false);
  const [currentFixContext, setCurrentFixContext] = useState<{ owner: string; repo: string; branch: string } | null>(null);
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [pendingPRInfo, setPendingPRInfo] = useState<{ title: string; description: string } | null>(null);
  
  const { 
    runAgent, 
    confirmAndCreatePR,
    isRunning: agentRunning, 
    steps: agentSteps, 
    currentStep,
  } = useAIAgent();
  const { fetchBuildLogs, fetchDeployments, extractErrors } = useVercel();

  const handleAutoFix = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.owner || !project.repo) {
      toast.error("Project repository information missing");
      return;
    }

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: "fixing" as const } : p))
    );
    
    toast.info("🤖 Auto-Fix Agent activated", {
      description: "Analyzing Vercel logs and generating fixes...",
    });

    try {
      // Call the new auto-fix agent
      const { data, error } = await supabase.functions.invoke("auto-fix-agent", {
        body: {
          owner: project.owner,
          repo: project.repo || project.name,
          branch: project.branch,
          vercelProjectId: project.vercelProjectId,
          deploymentId: project.latestDeploymentId,
        },
      });

      if (error) throw new Error(error.message);

      if (data.success && data.fix?.changes?.length > 0) {
        // Prepare diff data for preview
        const fileChanges = data.fix.changes.map((change: any) => ({
          path: change.path,
          oldContent: change.originalContent,
          newContent: change.newContent,
        }));

        setPendingChanges(fileChanges);
        setPendingPRInfo({
          title: data.fix.title,
          description: data.fix.description,
        });

        setCurrentFixContext({
          owner: project.owner,
          repo: project.repo || project.name,
          branch: project.branch,
        });

        setPrPreviewOpen(true);

        toast.success("🎯 Fix generated!", {
          description: `Found ${data.fix.changes.length} file(s) to fix. Confidence: ${data.fix.confidence}%`,
        });

      } else {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, status: "crashed" as const } : p))
        );
        
        toast.warning("🤔 No fixes found", {
          description: data.analysis?.rootCause || "Could not determine a fix for this error",
        });
      }

    } catch (error) {
      console.error("Auto-fix error:", error);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: "crashed" as const } : p))
      );
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes("429") || errorMessage.includes("quota")) {
        toast.error("🚫 Rate limit exceeded", {
          description: "Please wait a moment and try again, or configure a different AI provider",
        });
      } else {
        toast.error("❌ Auto-fix failed", {
          description: errorMessage,
        });
      }
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
          <div className="flex gap-2">
            <Button
              onClick={() => setConnectDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 shadow-[var(--glow-primary)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect Project
            </Button>
          </div>
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
        <VSCodeLayout
          project={ideProject}
          onClose={() => setIdeProject(null)}
        />
      )}

      {/* PR Preview Dialog */}
      {prPreviewOpen && pendingPRInfo && currentFixContext && (
        <PRPreviewDialog
          open={prPreviewOpen}
          onOpenChange={setPrPreviewOpen}
          changes={pendingChanges}
          prTitle={pendingPRInfo.title}
          prDescription={pendingPRInfo.description}
          onConfirm={async () => {
            const result = await confirmAndCreatePR(
              currentFixContext.owner,
              currentFixContext.repo,
              currentFixContext.branch
            );
            if (result.success) {
              // Update project status
              const projectId = selectedProject?.id;
              if (projectId) {
                setProjects((prev) =>
                  prev.map((p) =>
                    p.id === projectId
                      ? { ...p, status: "resurrected" as const, errorPreview: undefined }
                      : p
                  )
                );
              }
            }
          }}
          isCreating={agentRunning}
        />
      )}
    </div>
  );
}
