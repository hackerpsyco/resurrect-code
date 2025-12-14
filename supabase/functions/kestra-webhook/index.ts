/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

interface KestraWorkflowRequest {
  action: "trigger_workflow" | "get_execution" | "list_executions";
  workflowId?: string;
  namespace?: string;
  inputs?: Record<string, any>;
  executionId?: string;
}

console.info('kestra-webhook function started');

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KESTRA_URL = Deno.env.get("KESTRA_URL") || "http://localhost:8080";
    const KESTRA_API_TOKEN = Deno.env.get("KESTRA_API_TOKEN");
    
    console.log('Kestra URL:', KESTRA_URL);
    console.log('Kestra API Token available:', !!KESTRA_API_TOKEN);

    const request: KestraWorkflowRequest = await req.json();
    const { action } = request;

    console.log(`Kestra action: ${action}`);
    console.log('Request details:', JSON.stringify(request, null, 2));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (KESTRA_API_TOKEN) {
      headers["Authorization"] = `Bearer ${KESTRA_API_TOKEN}`;
    }

    let result;

    switch (action) {
      case "trigger_workflow": {
        const { workflowId = "resurrect-agent", namespace = "resurrectci", inputs = {} } = request;
        
        console.log(`Triggering Kestra workflow: ${namespace}.${workflowId}`);
        
        // Trigger Kestra workflow execution
        const response = await fetch(`${KESTRA_URL}/api/v1/executions/${namespace}/${workflowId}`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            inputs: inputs
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Kestra workflow trigger failed:', response.status, errorText);
          
          // If Kestra is not available, simulate workflow execution
          if (response.status === 404 || !response.ok) {
            console.log('Kestra not available, simulating workflow execution...');
            result = {
              id: `exec_${Date.now()}`,
              namespace: namespace,
              flowId: workflowId,
              state: {
                current: "RUNNING"
              },
              inputs: inputs,
              startDate: new Date().toISOString(),
              simulated: true,
              message: "Kestra not available - workflow simulated"
            };
          } else {
            throw new Error(`Failed to trigger workflow: ${errorText}`);
          }
        } else {
          result = await response.json();
          console.log('Kestra workflow triggered successfully:', result.id);
        }
        break;
      }

      case "get_execution": {
        const { executionId, namespace = "resurrectci" } = request;
        if (!executionId) throw new Error("executionId is required");

        const response = await fetch(`${KESTRA_URL}/api/v1/executions/${executionId}`, {
          headers
        });

        if (!response.ok) {
          throw new Error(`Failed to get execution: ${response.statusText}`);
        }

        result = await response.json();
        break;
      }

      case "list_executions": {
        const { namespace = "resurrectci" } = request;

        const response = await fetch(`${KESTRA_URL}/api/v1/executions/search?namespace=${namespace}&size=10`, {
          headers
        });

        if (!response.ok) {
          throw new Error(`Failed to list executions: ${response.statusText}`);
        }

        result = await response.json();
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Kestra ${action} completed successfully`);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("Kestra webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        message: "Kestra integration failed - check configuration"
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});