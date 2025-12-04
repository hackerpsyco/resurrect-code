import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const callVercelAPI = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("vercel-api", { body });
    if (error) throw new Error(error.message);
    if (!data.success) throw new Error(data.error);
    return data.data;
  };

  const fetchProjects = useCallback(async (teamId?: string) => {
    setIsLoading(true);
    try {
      const data = await callVercelAPI({ action: "list_projects", teamId });
      const projectList = data.projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        framework: p.framework || "unknown",
        updatedAt: p.updatedAt,
      }));
      setProjects(projectList);
      return projectList;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch projects";
      toast.error(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDeployments = useCallback(async (projectId?: string, teamId?: string) => {
    setIsLoading(true);
    try {
      const data = await callVercelAPI({ action: "list_deployments", projectId, teamId });
      const deploymentList = data.deployments.map((d: any) => ({
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
      toast.error(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBuildLogs = useCallback(async (deploymentId: string, teamId?: string) => {
    setIsLoading(true);
    try {
      const data = await callVercelAPI({ action: "get_build_logs", deploymentId, teamId });
      setBuildLogs(data.events || []);
      return data.events || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch build logs";
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
    fetchProjects,
    fetchDeployments,
    fetchBuildLogs,
    extractErrors,
  };
}
