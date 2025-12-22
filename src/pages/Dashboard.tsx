import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VSCodeLayout } from "@/components/dashboard/ide/VSCodeLayout";
import { ConnectProjectDialog } from "@/components/dashboard/ConnectProjectDialog";
import { GitHubRepositoryBrowser } from "@/components/dashboard/GitHubRepositoryBrowser";
import { GitHubDashboard } from "@/components/dashboard/GitHubDashboard";
import { useGitHubAuth } from "@/hooks/useGitHubAuth";
// ExtensionsManager removed - not needed
import { PlatformSettings } from "@/components/settings/PlatformSettings";
import { DevOpsPanel } from "@/components/dashboard/DevOpsPanel";
import { githubService, GitHubRepository, GitHubUser } from "@/services/githubService";
import { vercelService, VercelProject, VercelUser } from "@/services/vercelService";
import {
  LayoutDashboard,
  Code,
  Puzzle,
  Bug,
  Settings,
  Search,
  Plus,
  Download,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  GitBranch,
  ExternalLink,
  Bell,
  HelpCircle,
  Zap,
  Activity,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Github,
  Globe
} from "lucide-react";
// Toast removed for clean UI
import { useGitHub } from "@/hooks/useGitHub";
import { useVercel } from "@/hooks/useVercel";
import { useAuth } from "@/hooks/useAuth";
import { projectCache } from "@/services/projectCache";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { NewUserOnboarding } from "@/components/onboarding/NewUserOnboarding";
import { WelcomeMessage } from "@/components/dashboard/WelcomeMessage";
import { userStorageService } from "@/services/userStorageService";

interface Project {
  id: string;
  name: string;
  branch: string;
  status: "deployed" | "building" | "failed" | "offline";
  lastCommit: string;
  timeAgo: string;
  errorPreview?: string;
  owner?: string;
  repo?: string;
  vercelProjectId?: string;
  latestDeploymentId?: string;
  language: string;
  framework: string;
}

// Helper function to detect language from repository
const detectLanguage = (repoName: string, description?: string): string => {
  const name = repoName.toLowerCase();
  const desc = description?.toLowerCase() || "";
  
  if (name.includes("api") || desc.includes("api")) return "TS";
  if (name.includes("pipeline") || desc.includes("python")) return "PY";
  if (name.includes("dashboard") || desc.includes("react")) return "JS";
  if (name.includes("core") || desc.includes("rust")) return "RS";
  if (desc.includes("typescript") || name.includes("ts")) return "TS";
  if (desc.includes("javascript") || name.includes("js")) return "JS";
  if (desc.includes("python") || name.includes("py")) return "PY";
  
  return "JS"; // Default
};

// Helper function to detect framework
const detectFramework = (repoName: string, description?: string): string => {
  const name = repoName.toLowerCase();
  const desc = description?.toLowerCase() || "";
  
  if (desc.includes("next") || name.includes("next")) return "Next.js";
  if (desc.includes("react") || name.includes("react")) return "React";
  if (desc.includes("fastapi") || name.includes("fastapi")) return "FastAPI";
  if (desc.includes("rust") || name.includes("rust")) return "Rust";
  if (desc.includes("vue") || name.includes("vue")) return "Vue.js";
  if (desc.includes("angular") || name.includes("angular")) return "Angular";
  if (desc.includes("express") || name.includes("express")) return "Express";
  
  return "Web App"; // Default
};

// Remove demo data - everything should be user-specific
const automatedFixes: any[] = []; // Empty - will be populated from user's actual data

const activityLog: any[] = []; // Empty - will be populated from user's actual activity

export default function Dashboard() {
  const { user, signOut, loading } = useAuth();
  
  // While auth status is being determined, show a loader
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // 🔒 SECURITY: Redirect to auth if not logged in (after loading is done)
  if (!user) {
    console.log('🔐 Unauthorized access to dashboard - redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // 🔒 SECURITY: Clear any cached data from previous users on mount
  useEffect(() => {
    const initializeUserData = async () => {
      const currentUserEmail = user?.email;
      const lastUserEmail = localStorage.getItem('last_user_email');
      
      // If different user, clear all cached data
      if (lastUserEmail && lastUserEmail !== currentUserEmail) {
        console.log('🧹 Different user detected, clearing previous user data');
        
        // Clear GitHub data
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_user');
        localStorage.removeItem('github_selected_repos');
        
        // Clear Vercel data
        localStorage.removeItem('vercel_token');
        localStorage.removeItem('vercel_user');
        localStorage.removeItem('vercel_teams');
        localStorage.removeItem('vercel_selected_projects');
        
        // Clear other cached data
        localStorage.removeItem('gemini_api_key');
        localStorage.removeItem('is_new_user');
        
        // Clear service instances
        githubService.clearToken();
        vercelService.clearToken();
        
        console.log('✅ Previous user data cleared');
      }
      
      // Store current user email
      if (currentUserEmail) {
        localStorage.setItem('last_user_email', currentUserEmail);
        
        // Load current user's data from database to localStorage
        try {
          await userStorageService.loadUserDataToLocalStorage();
          console.log('✅ User data loaded from database');
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      }
    };
    
    if (user) {
      initializeUserData();
    }
  }, [user?.email]);

  // Check if this is a new user (first time accessing dashboard)
  const [isNewUser, setIsNewUser] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    const isNewUserFlag = localStorage.getItem('is_new_user') === 'true';
    const hasConnectedBefore = localStorage.getItem('github_token') || localStorage.getItem('vercel_token') || 
                               githubService.isAuthenticated() || vercelService.isAuthenticated();
    
    if (isNewUserFlag || !hasConnectedBefore) {
      setIsNewUser(true);
      
      // Show onboarding for new users
      if (isNewUserFlag) {
        setShowOnboarding(true);
        // Clear the new user flag
        localStorage.removeItem('is_new_user');
      }
    }
  }, []);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [ideProject, setIdeProject] = useState<Project | null>(null);
  const [activeView, setActiveView] = useState<"dashboard" | "editor" | "extensions" | "issues" | "devops" | "settings">("dashboard");
  const [projects, setProjects] = useState<Project[]>([]);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [githubBrowserOpen, setGithubBrowserOpen] = useState(false);
  const [showGitHubDashboard, setShowGitHubDashboard] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<
    'general' | 'editor' | 'terminal' | 'appearance' | 'notifications' | 'keybindings' | 'integrations'
  >('general');
  const [settingsInitialIntegration, setSettingsInitialIntegration] = useState<'github' | 'vercel'>('github');
  const [hasSelectedGithubRepos, setHasSelectedGithubRepos] = useState(false);
  
  const { isAuthenticated, repositories } = useGitHubAuth();
  const [extensionsOpen, setExtensionsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [vercelStatus, setVercelStatus] = useState<"connected" | "disconnected" | "checking">("checking");
  const [githubStatus, setGithubStatus] = useState<"connected" | "disconnected" | "checking">("checking");

  const { fetchRepo, fetchFileTree, isLoading: githubLoading } = useGitHub();
  const { fetchProjects: fetchVercelProjects, fetchDeployments, isLoading: vercelLoading } = useVercel();

  // Load real projects from GitHub and Vercel - ONLY user's own projects
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      console.log('🔄 Loading projects for authenticated user only...');
      
      try {
        let userProjects: Project[] = [];
        
        // Check GitHub authentication - STRICT user isolation
        setGithubStatus("checking");
        
        if (githubService.isAuthenticated()) {
          try {
            // Verify token is valid and get user info
            const githubUser = await githubService.getUser();
            setGithubStatus("connected");
            console.log(`✅ GitHub connected as: ${githubUser.login}`);
            
            // Get ONLY selected repositories from THIS user's settings
            const selectedRepoIds = githubService.getSelectedRepositories();
            setHasSelectedGithubRepos(selectedRepoIds.length > 0);
            
            if (selectedRepoIds.length > 0) {
              console.log(`📂 Loading ${selectedRepoIds.length} selected repositories...`);
              
              // Get user's repositories
              const allRepos = await githubService.getRepositories({
                sort: 'updated',
                direction: 'desc',
                per_page: 100
              });
              
              // Filter to ONLY selected repositories
              const selectedRepos = allRepos.filter(repo => selectedRepoIds.includes(repo.id));
              
              if (selectedRepos.length > 0) {
                const githubProjects: Project[] = selectedRepos.map((repo: GitHubRepository) => ({
                  id: `github-${repo.id}`,
                  name: repo.name,
                  branch: repo.default_branch || "main",
                  status: "deployed" as const,
                  lastCommit: `Latest from ${repo.owner.login}/${repo.name}`,
                  timeAgo: `Updated ${new Date(repo.updated_at).toLocaleDateString()}`,
                  language: repo.language?.substring(0, 2).toUpperCase() || "JS",
                  framework: detectFramework(repo.name, repo.description),
                  owner: repo.owner.login,
                  repo: repo.name
                }));
                
                userProjects = [...userProjects, ...githubProjects];
                console.log(`✅ Added ${githubProjects.length} GitHub repositories`);
                
                // Preload projects for instant access
                githubProjects.forEach(project => {
                  if (project.owner && project.repo) {
                    projectCache.preload(project.owner, project.repo, project.branch, fetchFileTree);
                  }
                });
              } else {
                console.log("⚠️ No selected repositories found - user needs to select repos in settings");
              }
            } else {
              console.log("⚠️ No repositories selected - user needs to configure GitHub integration");
            }
          } catch (error) {
            console.error("❌ GitHub authentication failed:", error);
            setGithubStatus("disconnected");
          }
        } else {
          setGithubStatus("disconnected");
          console.log("⚠️ GitHub not connected");
        }

        // Check Vercel connection - STRICT user isolation
        setVercelStatus("checking");
        
        if (vercelService.isAuthenticated()) {
          try {
            // Verify token is valid and get user info
            const vercelUser = await vercelService.getUser();
            setVercelStatus("connected");
            console.log(`✅ Vercel connected as: ${vercelUser.username}`);
            
            // Get ONLY selected projects from THIS user's settings
            const selectedProjectIds = JSON.parse(localStorage.getItem('vercel_selected_projects') || '[]');
            
            if (selectedProjectIds.length > 0) {
              console.log(`📂 Loading ${selectedProjectIds.length} selected Vercel projects...`);
              
              const vercelProjects = await vercelService.getProjects({ limit: 50 });
              const selectedVercelProjects = vercelProjects.filter(project => selectedProjectIds.includes(project.id));
              
              if (selectedVercelProjects.length > 0) {
                const vercelDashboardProjects: Project[] = selectedVercelProjects.map((project: VercelProject) => ({
                  id: `vercel-${project.id}`,
                  name: project.name,
                  branch: project.link?.repo ? 'main' : 'vercel',
                  status: "deployed" as const,
                  lastCommit: `Vercel deployment`,
                  timeAgo: `Updated ${new Date(project.updatedAt).toLocaleDateString()}`,
                  language: project.framework?.substring(0, 2).toUpperCase() || "JS",
                  framework: project.framework || "Web App",
                  owner: vercelUser.username,
                  repo: project.name,
                  vercelProjectId: project.id
                }));
                
                userProjects = [...userProjects, ...vercelDashboardProjects];
                console.log(`✅ Added ${vercelDashboardProjects.length} Vercel projects`);
              } else {
                console.log("⚠️ No selected Vercel projects found - user needs to select projects in settings");
              }
            } else {
              console.log("⚠️ No Vercel projects selected - user needs to configure Vercel integration");
            }
          } catch (error) {
            console.error("❌ Vercel authentication failed:", error);
            setVercelStatus("disconnected");
          }
        } else {
          setVercelStatus("disconnected");
          console.log("⚠️ Vercel not connected");
        }

        // Set ONLY user's projects - NEVER show demo/default data
        setProjects(userProjects);
        
        if (userProjects.length === 0) {
          console.log("📭 No projects to display - user needs to connect and configure integrations");
        } else {
          console.log(`📊 Dashboard loaded with ${userProjects.length} user projects`);
        }

      } catch (error) {
        console.error("❌ Error loading user projects:", error);
        setGithubStatus("disconnected");
        setVercelStatus("disconnected");
        setProjects([]); // Ensure no projects are shown on error
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();

    // Listen for settings updates
    const handleGitHubSettingsUpdate = () => {
      console.log("🔄 GitHub settings updated, reloading projects...");
      loadProjects();
    };

    const handleVercelSettingsUpdate = () => {
      console.log("🔄 Vercel settings updated, reloading projects...");
      loadProjects();
    };

    window.addEventListener('github-settings-updated', handleGitHubSettingsUpdate);
    window.addEventListener('vercel-settings-updated', handleVercelSettingsUpdate);
    
    return () => {
      window.removeEventListener('github-settings-updated', handleGitHubSettingsUpdate);
      window.removeEventListener('vercel-settings-updated', handleVercelSettingsUpdate);
    };
  }, []);

  const handleNewProject = () => {
    console.log('🔍 Checking user integrations before opening New Project dialog...');
    
    // Strict authentication check
    const hasGitHubToken = githubService.getToken();
    const hasVercelToken = vercelService.getToken();
    const isGitHubAuth = githubService.isAuthenticated();
    const isVercelAuth = vercelService.isAuthenticated();
    
    console.log('Integration status:', {
      hasGitHubToken: !!hasGitHubToken,
      hasVercelToken: !!hasVercelToken,
      isGitHubAuth,
      isVercelAuth
    });
    
    if (!isGitHubAuth && !isVercelAuth) {
      console.log('❌ No integrations connected');
      toast.error("🔐 Please connect your GitHub or Vercel account first to add projects.", {
        duration: 5000,
        action: {
          label: "Connect Now",
          onClick: () => {
            setSettingsInitialSection('integrations');
            setSettingsInitialIntegration('github');
            setActiveView("settings");
          }
        }
      });
      setSettingsInitialSection('integrations');
      setSettingsInitialIntegration('github');
      setActiveView("settings");
      return;
    }
    
    // Check if user has selected repositories/projects
    if (isGitHubAuth) {
      const selectedRepos = githubService.getSelectedRepositories();
      if (selectedRepos.length === 0) {
        console.log('❌ GitHub connected but no repositories selected');
        toast.error("Please select repositories in Settings → GitHub Integration first.", {
          duration: 5000,
          action: {
            label: "Select Repos",
            onClick: () => {
              setSettingsInitialSection('integrations');
              setSettingsInitialIntegration('github');
              setActiveView("settings");
            }
          }
        });
        setSettingsInitialSection('integrations');
        setSettingsInitialIntegration('github');
        setActiveView("settings");
        return;
      }
    }
    
    if (isVercelAuth) {
      const selectedProjects = JSON.parse(localStorage.getItem('vercel_selected_projects') || '[]');
      if (selectedProjects.length === 0) {
        console.log('❌ Vercel connected but no projects selected');
        toast.error("Please select projects in Settings → Vercel Integration first.", {
          duration: 5000,
          action: {
            label: "Select Projects",
            onClick: () => {
              setSettingsInitialSection('integrations');
              setSettingsInitialIntegration('vercel');
              setActiveView("settings");
            }
          }
        });
        setSettingsInitialSection('integrations');
        setSettingsInitialIntegration('vercel');
        setActiveView("settings");
        return;
      }
    }
    
    console.log('✅ User has proper integrations, opening New Project dialog');
    setConnectDialogOpen(true);
  };

  const handleImportFromGitHub = () => {
    if (githubService.isAuthenticated()) {
      // Check if user has selected repositories
      const selectedRepos = githubService.getSelectedRepositories();
      if (selectedRepos.length === 0) {
        toast.error("Please select repositories in Settings → Integrations → GitHub first.");
        setSettingsInitialSection('integrations');
        setSettingsInitialIntegration('github');
        setActiveView("settings");
        return;
      }
      setShowGitHubDashboard(true);
    } else {
      toast.error("Please connect your GitHub account first in Settings → Integrations.");
      setSettingsInitialSection('integrations');
      setSettingsInitialIntegration('github');
      setActiveView("settings");
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
      id: String(Date.now()),
      name: newProject.name,
      branch: newProject.branch,
      status: "offline",
      lastCommit: "Initial connection",
      timeAgo: "Just now",
      owner: newProject.owner,
      repo: newProject.repo,
      vercelProjectId: newProject.vercelProjectId,
      language: detectLanguage(newProject.name),
      framework: detectFramework(newProject.name)
    };
    setProjects((prev) => [project, ...prev]);
    // Silent success - no popup
  };

  const handleGitHubRepositorySelect = (repo: { owner: string; repo: string; name: string; branch: string }) => {
    const project: Project = {
      id: `github-${Date.now()}`,
      name: repo.name,
      branch: repo.branch,
      status: "deployed",
      lastCommit: "Connected from GitHub",
      timeAgo: "Just now",
      owner: repo.owner,
      repo: repo.repo,
      language: detectLanguage(repo.name),
      framework: detectFramework(repo.name)
    };
    setProjects((prev) => [project, ...prev]);
    // Silent success - no popup
  };

  const handleRefreshProjects = () => {
    window.location.reload(); // Simple refresh for now
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.owner?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed": return "text-green-400";
      case "building": return "text-yellow-400";
      case "failed": return "text-red-400";
      case "offline": return "text-gray-400";
      default: return "text-gray-400";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "deployed": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Deployed</Badge>;
      case "building": return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Building</Badge>;
      case "failed": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      case "offline": return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Offline</Badge>;
      default: return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unknown</Badge>;
    }
  };

  const handleProjectClick = (project: Project) => {
    setIdeProject(project);
  };

  const handleExternalLink = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.vercelProjectId) {
      window.open(`https://vercel.com/${project.owner}/${project.name}`, '_blank');
    } else {
      window.open(`https://github.com/${project.owner}/${project.repo}`, '_blank');
    }
  };

  const renderContent = () => {
    if (activeView === "extensions") {
      return (
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Extensions</h1>
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Extensions Coming Soon</h2>
              <p className="text-[#7d8590]">Extension management will be available in a future update.</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeView === "devops") {
      return (
        <DevOpsPanel onClose={() => setActiveView("dashboard")} />
      );
    }

    if (activeView === "settings") {
      return (
      <PlatformSettings 
        onClose={() => setActiveView("dashboard")}
        initialSection={settingsInitialSection}
        initialIntegration={settingsInitialIntegration}
      />
      );
    }

    if (activeView === "issues") {
      const failedProjects = projects.filter(p => p.status === "failed");
      return (
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Issues</h1>
            {failedProjects.length > 0 ? (
              <div className="space-y-4">
                {failedProjects.map((project) => (
                  <div key={project.id} className="bg-[#161b22] border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{project.name}</h3>
                        <p className="text-sm text-[#7d8590] mt-1">{project.errorPreview || "Build failed"}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button size="sm" onClick={() => handleProjectClick(project)}>
                            Open in IDE
                          </Button>
                          <Button size="sm" variant="outline" onClick={(e) => handleExternalLink(project, e)}>
                            View Logs
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Issues Found</h2>
                <p className="text-[#7d8590]">All your projects are running smoothly!</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Default dashboard view
    return (
      <div className="flex-1 p-6 overflow-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          {isNewUser && projects.length === 0 ? (
            <WelcomeMessage onOpenSettings={() => setActiveView("settings")} />
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.email?.split('@')[0] || 'Developer'}</h1>
              <p className="text-[#7d8590] mb-6">
                You have {projects.filter(p => p.status === "deployed").length} active deployments and {projects.filter(p => p.status === "building").length} building projects.
              </p>
            </>
          )}
          
          <div className="flex gap-3">
           
            <Button 
              variant="outline"
              className="border-[#30363d] text-white hover:bg-[#21262d]"
              onClick={handleNewProject}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
            <Button 
              variant="outline" 
              className="border-[#30363d] text-white hover:bg-[#21262d]"
              onClick={handleImportFromGitHub}
            >
              <Download className="w-4 h-4 mr-2" />
              {!githubService.isAuthenticated()
                ? "Connect GitHub"
                : hasSelectedGithubRepos
                  ? "Browse GitHub Repos"
                  : "Select GitHub Repos"}
            </Button>
            <Button 
              variant="outline" 
              className="border-[#30363d] text-white hover:bg-[#21262d]"
              onClick={handleRefreshProjects}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
           
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Projects</h2>
              <Button 
                variant="ghost" 
                className="text-[#238636] hover:text-[#2ea043] text-sm"
                onClick={() => setActiveView("dashboard")}
              >
                View all →
              </Button>
            </div>
            
            {isLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 animate-pulse">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#21262d] rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-[#21262d] rounded mb-2"></div>
                        <div className="h-3 bg-[#21262d] rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#7d8590] transition-colors cursor-pointer"
                    onClick={() => handleProjectClick(project)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#21262d] rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-[#238636]">{project.language}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{project.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-[#7d8590]">
                            <GitBranch className="w-3 h-3" />
                            <span>{project.branch}</span>
                            <span>•</span>
                            <span>{project.timeAgo}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[#7d8590] hover:text-white"
                        onClick={(e) => handleExternalLink(project, e)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-3 h-3 text-[#7d8590]" />
                        <span className="text-xs text-[#7d8590]">{project.framework}</span>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && filteredProjects.length === 0 && (
              <div className="text-center py-12">
                {githubService.isAuthenticated() || vercelService.isAuthenticated() ? (
                  // Connected but no projects selected
                  <>
                    <FolderOpen className="w-12 h-12 text-[#7d8590] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Projects Selected</h3>
                    <p className="text-[#7d8590] mb-4">
                      You're connected to {githubService.isAuthenticated() && vercelService.isAuthenticated() ? 'GitHub and Vercel' : githubService.isAuthenticated() ? 'GitHub' : 'Vercel'}, but haven't selected any projects to show in your dashboard.
                    </p>
                    <div className="space-y-3">
                      <Button onClick={() => setActiveView("settings")} className="bg-[#238636] hover:bg-[#2ea043]">
                        <Settings className="w-4 h-4 mr-2" />
                        Select Projects in Settings
                      </Button>
                      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 text-left max-w-md mx-auto">
                        <h4 className="text-sm font-medium text-white mb-2">Quick Setup:</h4>
                        <ol className="text-xs text-[#7d8590] space-y-1">
                          <li>1. Go to Settings → Integrations</li>
                          <li>2. Select repositories from your connected accounts</li>
                          <li>3. Save settings to see projects here</li>
                        </ol>
                      </div>
                    </div>
                  </>
                ) : (
                  // Not connected to any service - New user flow
                  <>
                    <div className="max-w-md mx-auto">
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-lg bg-[#238636]/20 border border-[#238636]/30 flex items-center justify-center">
                          <Github className="w-6 h-6 text-[#238636]" />
                        </div>
                        <Plus className="w-4 h-4 text-[#7d8590]" />
                        <div className="w-12 h-12 rounded-lg bg-black/20 border border-gray-600/30 flex items-center justify-center">
                          <Globe className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      
                      {isNewUser ? (
                        <>
                          <h3 className="text-xl font-semibold mb-2">👋 Welcome to ResurrectCI!</h3>
                          <p className="text-[#7d8590] mb-6">
                            Let's connect your GitHub and Vercel accounts to get started with your projects.
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold mb-2">Connect Your Accounts</h3>
                          <p className="text-[#7d8590] mb-6">
                            Connect GitHub to access your repositories and Vercel to manage deployments.
                          </p>
                        </>
                      )}
                      
                      <div className="space-y-3">
                        <Button 
                          onClick={() => setActiveView("settings")} 
                          className="w-full bg-[#238636] hover:bg-[#2ea043]"
                          size="lg"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Connect GitHub & Vercel
                        </Button>
                        
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 text-left">
                          <h4 className="text-sm font-medium text-white mb-2">What you'll need:</h4>
                          <ul className="text-xs text-[#7d8590] space-y-1">
                            <li>• GitHub Personal Access Token (from github.com/settings/tokens)</li>
                            <li>• Vercel API Token (from vercel.com/account/tokens)</li>
                            <li>• Select which repositories to show in your dashboard</li>
                          </ul>
                        </div>
                        
                        {isNewUser && (
                          <p className="text-xs text-[#7d8590]">
                            Don't worry - we'll guide you through each step! 🚀
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Automated Fixes - Only show if user has actual fixes */}
            {automatedFixes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Automated Fixes</h3>
                  <Button variant="ghost" className="text-[#238636] hover:text-[#2ea043] text-sm">
                    Beta
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {automatedFixes.map((fix) => (
                    <div key={fix.id} className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white">{fix.title}</h4>
                          <p className="text-xs text-[#7d8590] mt-1">{fix.description}</p>
                          <span className="text-xs text-[#7d8590]">{fix.timeAgo}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Log - Only show if user has actual activity */}
            {activityLog.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Activity Log</h3>
                
                <div className="space-y-3">
                  {activityLog.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                        activity.type === "deployment" ? "bg-purple-500/20" :
                        activity.type === "pr" ? "bg-green-500/20" : "bg-red-500/20"
                      }`}>
                        {activity.type === "deployment" && <Zap className="w-3 h-3 text-purple-400" />}
                        {activity.type === "pr" && <ArrowUpRight className="w-3 h-3 text-green-400" />}
                        {activity.type === "error" && <AlertTriangle className="w-3 h-3 text-red-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white">{activity.title}</h4>
                        <p className="text-xs text-[#7d8590]">{activity.description}</p>
                        <span className="text-xs text-[#7d8590]">{activity.timeAgo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show message when no activity yet */}
            {automatedFixes.length === 0 && activityLog.length === 0 && projects.length > 0 && (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-[#7d8590] mx-auto mb-2" />
                <h3 className="text-sm font-medium text-white mb-1">No Activity Yet</h3>
                <p className="text-xs text-[#7d8590]">
                  Activity will appear here as you use ResurrectCI features
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (showGitHubDashboard) {
    return (
      <GitHubDashboard
        onRepositorySelect={(repo) => {
          const project: Project = {
            id: repo.id,
            name: repo.name,
            branch: repo.branch,
            status: repo.status,
            lastCommit: "Connected from GitHub",
            timeAgo: "Just now",
            owner: repo.owner,
            repo: repo.repo,
            language: repo.language,
            framework: repo.framework
          };
          setIdeProject(project);
          setShowGitHubDashboard(false);
        }}
      />
    );
  }

  if (ideProject) {
    return (
      <VSCodeLayout
        project={ideProject}
        onClose={() => setIdeProject(null)}
      />
    );
  }

  return (
    <>
      {/* New User Onboarding */}
      {showOnboarding && (
        <NewUserOnboarding
          onComplete={() => {
            setShowOnboarding(false);
            setActiveView("settings");
          }}
          onSkip={() => {
            setShowOnboarding(false);
          }}
        />
      )}
      
      <div className="min-h-screen bg-[#0d1117] text-white flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-[#30363d]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#238636] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-semibold text-lg">DevStudio</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-10 ${
                activeView === "dashboard" 
                  ? "bg-[#238636]/20 text-[#238636] border-l-2 border-[#238636]" 
                  : "text-[#7d8590] hover:text-white hover:bg-[#21262d]"
              }`}
              onClick={() => setActiveView("dashboard")}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-10 ${
                activeView === "editor" 
                  ? "bg-[#238636]/20 text-[#238636] border-l-2 border-[#238636]" 
                  : "text-[#7d8590] hover:text-white hover:bg-[#21262d]"
              }`}
              onClick={() => setActiveView("editor")}
            >
              <Code className="w-5 h-5" />
              Editor
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-10 ${
                activeView === "extensions" 
                  ? "bg-[#238636]/20 text-[#238636] border-l-2 border-[#238636]" 
                  : "text-[#7d8590] hover:text-white hover:bg-[#21262d]"
              }`}
              onClick={() => setActiveView("extensions")}
            >
              <Puzzle className="w-5 h-5" />
              Extensions
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-10 ${
                activeView === "issues" 
                  ? "bg-[#238636]/20 text-[#238636] border-l-2 border-[#238636]" 
                  : "text-[#7d8590] hover:text-white hover:bg-[#21262d]"
              }`}
              onClick={() => setActiveView("issues")}
            >
              <Bug className="w-5 h-5" />
              Issues
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-10 ${
                activeView === "devops" 
                  ? "bg-[#238636]/20 text-[#238636] border-l-2 border-[#238636]" 
                  : "text-[#7d8590] hover:text-white hover:bg-[#21262d]"
              }`}
              onClick={() => setActiveView("devops")}
            >
              <Zap className="w-5 h-5" />
              DevOps
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-10 ${
                activeView === "settings" 
                  ? "bg-[#238636]/20 text-[#238636] border-l-2 border-[#238636]" 
                  : "text-[#7d8590] hover:text-white hover:bg-[#21262d]"
              }`}
              onClick={() => setActiveView("settings")}
            >
              <Settings className="w-5 h-5" />
              Settings
            </Button>
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-[#30363d]">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="bg-[#238636] text-white">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{user?.email?.split('@')[0] || 'User'}</div>
              <div className="text-xs text-[#7d8590]">
                {user?.email ? user.email.substring(0, 20) + (user.email.length > 20 ? '...' : '') : 'Authenticated'}
              </div>
            </div>
          </div>
          
          {/* 🔐 LOGOUT BUTTON */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={async () => {
              try {
                console.log('🔐 Logging out user and clearing all data...');
                
                // Clear all cached data before signing out
                localStorage.removeItem('github_token');
                localStorage.removeItem('github_user');
                localStorage.removeItem('github_selected_repos');
                localStorage.removeItem('vercel_token');
                localStorage.removeItem('vercel_user');
                localStorage.removeItem('vercel_teams');
                localStorage.removeItem('vercel_selected_projects');
                localStorage.removeItem('is_new_user');
                localStorage.removeItem('last_user_email');
                
                // Clear service instances
                githubService.clearToken();
                vercelService.clearToken();
                
                // Sign out from Supabase
                await signOut();
                
                console.log('✅ User logged out and all data cleared');
                toast.success('👋 Logged out successfully');
                // Navigation will happen automatically due to auth state change
              } catch (error) {
                console.error('Logout failed:', error);
                toast.error('❌ Logout failed');
              }
            }}
          >
            <ArrowUpRight className="w-4 h-4 rotate-45" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="h-14 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search files, projects, or commands..."
              className="w-96 bg-[#0d1117] border-[#30363d] text-white placeholder:text-[#7d8590]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <kbd className="px-2 py-1 text-xs bg-[#21262d] border border-[#30363d] rounded">⌘K</kbd>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                vercelStatus === "connected" ? "bg-green-400" : 
                vercelStatus === "checking" ? "bg-yellow-400" : "bg-red-400"
              }`}></div>
              <span className="text-[#7d8590]">
                Vercel: {vercelStatus === "checking" ? "Checking..." : vercelStatus}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                githubStatus === "connected" ? "bg-green-400" : 
                githubStatus === "checking" ? "bg-yellow-400" : "bg-red-400"
              }`}></div>
              <span className="text-[#7d8590]">
                GitHub: {githubStatus === "checking" ? "Checking..." : githubStatus}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[#7d8590] hover:text-white"
              onClick={() => {}}
            >
              <Bell className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[#7d8590] hover:text-white"
              onClick={() => window.open("https://github.com/hackerpsyco/resurrect-code", "_blank")}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dynamic Content */}
        {renderContent()}
      </div>

      {/* Connect Project Dialog */}
      <ConnectProjectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        onProjectConnected={handleProjectConnected}
      />

      {/* GitHub Repository Browser */}
      {githubBrowserOpen && (
        <GitHubRepositoryBrowser
          onRepositorySelect={handleGitHubRepositorySelect}
          onClose={() => setGithubBrowserOpen(false)}
        />
      )}
      </div>
    </>
  );
}
