import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KestraRequest {
  instanceUrl: string;
  namespace: string;
  flowId: string;
  apiKey?: string;
  inputs?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instanceUrl, namespace, flowId, apiKey, inputs } = await req.json() as KestraRequest;

    if (!instanceUrl || !namespace || !flowId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the Kestra execution URL
    const triggerUrl = `${instanceUrl}/api/v1/executions/${namespace}/${flowId}`;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    console.log(`Triggering Kestra workflow: ${triggerUrl}`);
    
    const response = await fetch(triggerUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(inputs || {}),
    });

    const responseText = await response.text();
    console.log(`Kestra response: ${response.status} - ${responseText}`);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Kestra API error: ${response.status}`,
          details: responseText
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { raw: responseText };
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Kestra trigger error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
