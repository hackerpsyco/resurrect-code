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

      // Fetch real deployment logs from Vercel API
      const response = await fetch(
        `https://api.vercel.com/v2/deployments/${deploymentId}/events${teamId ? `?teamId=${teamId}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      const text = await response.text();
      
      // Parse newline-delimited JSON from Vercel
      const logs = text
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean) as BuildEvent[];

      setBuildLogs(logs);
      console.log(`✅ Loaded ${logs.length} real build logs`);
      return logs;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch build logs";
      console.error('❌ Error fetching build logs:', message);
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
