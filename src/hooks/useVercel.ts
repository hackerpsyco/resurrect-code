import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { vercelService } from "@/services/vercelService";

interface VercelProject {
  id: string;
  name: string;
  framework: string;
  updatedAt: number;
}

interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: "BUILDING" | "ERROR" | "INITIALIZING" | "QUEUED" | "READY" | "CANCELED";
  created: number;
  buildingAt?: number;
  ready?: number;
  meta?: {
    githubCommitMessage?: string;
    githubCommitRef?: string;
  };
}

interface BuildEvent {
  type: string;
  created: number;
  payload: {
    text?: string;
    deploymentId?: string;
    info?: { type: string; name: string };
  };
}

export function useVercel() {
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [deployments, setDeployments] = useState<VercelDeployment[]>([]);
  const [buildLogs, setBuildLogs] = useState<BuildEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Vercel service with token from localStorage
  useEffect(() => {
    const token = localStorage.getItem('vercel_token');
    if (token && !vercelService.isAuthenticated()) {
      vercelService.setToken(token);
    }
    setIsInitialized(true);
  }, []);

  const fetchProjects = useCallback(async (teamId?: string) => {
    setIsLoading(true);
    try {
      // Check if Vercel is connected
      const token = localStorage.getItem('vercel_token');
      if (!token) {
        console.warn('⚠️ Vercel token not found - user needs to connect Vercel account');
        setProjects([]);
        return [];
      }

      // Use vercelService directly
      if (!vercelService.isAuthenticated()) {
        vercelService.setToken(token);
      }

      const data = await vercelService.getProjects({ teamId, limit: 50 });
      const projectList = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        framework: p.framework || "unknown",
        updatedAt: p.updatedAt,
      }));
      setProjects(projectList);
      console.log(`✅ Loaded ${projectList.length} Vercel projects`);
      return projectList;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch projects";
      console.error('❌ Error fetching projects:', message);
      toast.error(message);
      setProjects([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDeployments = useCallback(async (projectId?: string, teamId?: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('vercel_token');
      if (!token) {
        throw new Error('Vercel token not found');
      }

      if (!vercelService.isAuthenticated()) {
        vercelService.setToken(token);
      }

      const data = await vercelService.getDeployments({ projectId, teamId, limit: 50 });
      const deploymentList = data.map((d: any) => ({
        uid: d.uid,
        name: d.name,
        url: d.url,
        state: d.state,
        created: d.created,
        buildingAt: d.buildingAt,
        ready: d.ready,
        meta: d.meta,
      }));
      setDeployments(deploymentList);
      return deploymentList;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch deployments";
      console.error('❌ Error fetching deployments:', message);
      toast.error(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBuildLogs = useCallback(async (deploymentId: string, teamId?: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('vercel_token');
      if (!token) {
        throw new Error('Vercel token not found');
      }

      if (!vercelService.isAuthenticated()) {
        vercelService.setToken(token);
      }

      // Fetch deployment details directly from Vercel API
      const deployment = await vercelService.getDeployment(deploymentId, teamId);
      
      // Create mock build logs from deployment metadata
      const mockLogs: BuildEvent[] = [
        {
          type: 'info',
          created: deployment.created,
          payload: {
            text: `Deployment started for ${deployment.name}`
          }
        },
        {
          type: 'info',
          created: deployment.created + 1000,
          payload: {
            text: `Status: ${deployment.state}`
          }
        },
        {
          type: 'info',
          created: deployment.created + 2000,
          payload: {
            text: `URL: ${deployment.url}`
          }
        }
      ];

      if (deployment.meta?.githubCommitMessage) {
        mockLogs.push({
          type: 'info',
          created: deployment.created + 3000,
          payload: {
            text: `Commit: ${deployment.meta.githubCommitMessage}`
          }
        });
      }

      setBuildLogs(mockLogs);
      return mockLogs;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch deployment details";
      console.error('❌ Error fetching deployment details:', message);
      toast.error(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const extractErrors = useCallback((events: BuildEvent[]) => {
    const errorEvents = events.filter(
      (e) =>
        e.type === "error" ||
        (e.payload.text && e.payload.text.toLowerCase().includes("error"))
    );
    return errorEvents.map((e) => e.payload.text || "Unknown error").filter(Boolean);
  }, []);

  return {
    isLoading,
    projects,
    deployments,
    buildLogs,
    isInitialized,
    fetchProjects,
    fetchDeployments,
    fetchBuildLogs,
    extractErrors,
  };
}
