import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

interface VercelRequest {
  action: "list_projects" | "list_deployments" | "get_deployment" | "get_build_logs" | "get_events";
  projectId?: string;
  deploymentId?: string;
  teamId?: string;
}

const VERCEL_API = "https://api.vercel.com";

console.info('vercel-api function started');

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VERCEL_TOKEN = Deno.env.get("VERCEL_TOKEN");
    if (!VERCEL_TOKEN) {
      throw new Error("VERCEL_TOKEN is not configured");
    }

    const request: VercelRequest = await req.json();
    const { action, projectId, deploymentId, teamId } = request;

    console.log(`Vercel API action: ${action}`);

    const headers = {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    };

    const teamQuery = teamId ? `?teamId=${teamId}` : "";
    let result;

    switch (action) {
      case "list_projects": {
        const response = await fetch(`${VERCEL_API}/v9/projects${teamQuery}`, { headers });
        if (!response.ok) throw new Error(`Failed to list projects: ${response.statusText}`);
        result = await response.json();
        break;
      }

      case "list_deployments": {
        const projectQuery = projectId ? `&projectId=${projectId}` : "";
        const url = `${VERCEL_API}/v6/deployments${teamQuery ? teamQuery + projectQuery : "?" + projectQuery.slice(1)}`;
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`Failed to list deployments: ${response.statusText}`);
        result = await response.json();
        break;
      }

      case "get_deployment": {
        if (!deploymentId) throw new Error("deploymentId is required");
        const response = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}${teamQuery}`, { headers });
        if (!response.ok) throw new Error(`Failed to get deployment: ${response.statusText}`);
        result = await response.json();
        break;
      }

      case "get_build_logs": {
        if (!deploymentId) throw new Error("deploymentId is required");
        const response = await fetch(`${VERCEL_API}/v2/deployments/${deploymentId}/events${teamQuery}`, { headers });
        if (!response.ok) throw new Error(`Failed to get build logs: ${response.statusText}`);
        const text = await response.text();
        // Parse newline-delimited JSON
        const events = text
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        result = { events };
        break;
      }

      case "get_events": {
        if (!deploymentId) throw new Error("deploymentId is required");
        const response = await fetch(`${VERCEL_API}/v2/deployments/${deploymentId}/events${teamQuery}`, { headers });
        if (!response.ok) throw new Error(`Failed to get events: ${response.statusText}`);
        const text = await response.text();
        const events = text
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        result = { events };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Vercel API ${action} completed successfully`);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Vercel API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});
