import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

interface DeploymentPayload {
  type: string;
  deployment?: {
    id: string;
    name: string;
    url: string;
    state: string;
    meta?: {
      githubCommitRef?: string;
      githubCommitMessage?: string;
      githubCommitRepo?: string;
    };
  };
  error?: {
    message: string;
    logs?: string[];
  };
}

console.info('webhook-handler function started');

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: DeploymentPayload = await req.json();
    
    console.log("Webhook received:", JSON.stringify(payload, null, 2));

    // Check if this is a deployment failure
    const isFailure = 
      payload.type === "deployment.error" || 
      payload.deployment?.state === "ERROR" ||
      payload.error;

    if (!isFailure) {
      console.log("Not a failure event, skipping");
      return new Response(
        JSON.stringify({ status: "ignored", message: "Not a failure event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract error information
    const errorInfo = {
      deploymentId: payload.deployment?.id || "unknown",
      projectName: payload.deployment?.name || payload.deployment?.meta?.githubCommitRepo || "unknown",
      branch: payload.deployment?.meta?.githubCommitRef || "main",
      commitMessage: payload.deployment?.meta?.githubCommitMessage || "",
      errorMessage: payload.error?.message || "Build failed",
      errorLogs: payload.error?.logs || [],
      timestamp: new Date().toISOString(),
    };

    console.log("Processing failure:", errorInfo);

    // Trigger the AI agent to analyze and fix
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Call the AI agent function
    const agentResponse = await fetch(`${supabaseUrl}/functions/v1/ai-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        action: "analyze_error",
        errorInfo,
      }),
    });

    const agentResult = await agentResponse.json();
    
    console.log("AI Agent response:", agentResult);

    return new Response(
      JSON.stringify({
        status: "processing",
        message: "Failure detected, AI agent triggered",
        errorInfo,
        agentResult,
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("Webhook handler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});
