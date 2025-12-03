import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ErrorInfo {
  deploymentId: string;
  projectName: string;
  branch: string;
  commitMessage: string;
  errorMessage: string;
  errorLogs: string[];
  timestamp: string;
}

interface AgentRequest {
  action: "analyze_error" | "search_solution" | "generate_fix";
  errorInfo?: ErrorInfo;
  errorAnalysis?: string;
  searchResults?: string;
}

const SYSTEM_PROMPT = `You are ResurrectCI, an expert AI agent that analyzes build errors and provides fixes.

Your capabilities:
1. Analyze error logs to identify root causes
2. Search for solutions based on error patterns
3. Generate code patches to fix issues
4. Create clear explanations for developers

When analyzing errors:
- Identify the exact file and line causing the issue
- Determine the error type (missing module, syntax error, type error, etc.)
- Provide a concise root cause analysis

When suggesting fixes:
- Provide specific, actionable code changes
- Include the exact file path and changes needed
- Explain why the fix works

Always respond in a structured JSON format.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, errorInfo, errorAnalysis, searchResults }: AgentRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`AI Agent action: ${action}`);

    let prompt = "";
    let responseFormat = {};

    switch (action) {
      case "analyze_error":
        prompt = `Analyze this build error and identify the root cause:

Project: ${errorInfo?.projectName}
Branch: ${errorInfo?.branch}
Error Message: ${errorInfo?.errorMessage}
Error Logs:
${errorInfo?.errorLogs?.join("\n") || "No detailed logs available"}

Provide a JSON response with:
{
  "errorType": "string (e.g., 'missing_module', 'syntax_error', 'type_error')",
  "rootCause": "string explaining the root cause",
  "affectedFile": "string with file path",
  "affectedLine": "number or null",
  "severity": "low | medium | high | critical",
  "suggestedSearchQuery": "string for searching solutions"
}`;
        break;

      case "search_solution":
        prompt = `Based on this error analysis, suggest the best fix:

Error Analysis: ${errorAnalysis}

Search the web mentally for common solutions to this type of error.

Provide a JSON response with:
{
  "solutions": [
    {
      "description": "string describing the solution",
      "confidence": "number 0-100",
      "steps": ["array of steps to implement"],
      "codeChanges": [
        {
          "file": "string file path",
          "action": "create | modify | delete",
          "content": "string with new/modified content"
        }
      ]
    }
  ],
  "recommendedSolution": "number index of best solution"
}`;
        break;

      case "generate_fix":
        prompt = `Generate the actual code fix based on this solution:

Error Analysis: ${errorAnalysis}
Selected Solution: ${searchResults}

Provide a JSON response with:
{
  "branchName": "resurrect-fix",
  "commitMessage": "string describing the fix",
  "changes": [
    {
      "file": "string file path",
      "action": "create | modify | delete",
      "beforeContent": "string (for modify)",
      "afterContent": "string with fixed content"
    }
  ],
  "prTitle": "string for PR title",
  "prDescription": "string explaining the fix"
}`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    console.log("AI Response:", content);

    // Try to parse as JSON
    let parsedResponse;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                        content.match(/```\n?([\s\S]*?)\n?```/) ||
                        [null, content];
      parsedResponse = JSON.parse(jsonMatch[1] || content);
    } catch {
      parsedResponse = { rawResponse: content };
    }

    return new Response(
      JSON.stringify({
        action,
        result: parsedResponse,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Agent error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
