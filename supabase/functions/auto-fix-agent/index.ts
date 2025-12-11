import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

interface AutoFixRequest {
  owner: string;
  repo: string;
  branch: string;
  vercelProjectId?: string;
  deploymentId?: string;
}

console.info('auto-fix-agent function started');

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { owner, repo, branch, vercelProjectId, deploymentId }: AutoFixRequest = await req.json();
    
    console.log(`Auto-fixing ${owner}/${repo} on ${branch}`);

    // Step 1: Get Vercel build logs
    let errorLogs: string[] = [];
    let errorMessage = "Build failed";

    if (deploymentId) {
      console.log("Fetching Vercel logs...");
      const logsResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/vercel-api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          action: "get_build_logs",
          deploymentId,
        }),
      });

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        errorLogs = logsData.data?.events?.map((e: any) => e.payload?.text || "").filter(Boolean) || [];
        
        // Extract error message from logs
        const errorLines = errorLogs.filter(log => 
          log.includes("Error:") || 
          log.includes("Failed to compile") ||
          log.includes("Module not found") ||
          log.includes("Cannot resolve")
        );
        
        if (errorLines.length > 0) {
          errorMessage = errorLines[0];
        }
      }
    }

    // Step 2: Analyze error with AI
    console.log("Analyzing error with AI...");
    const analysisResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        action: "full_analysis",
        errorInfo: {
          deploymentId: deploymentId || "unknown",
          projectName: `${owner}/${repo}`,
          branch,
          commitMessage: "Auto-fix triggered",
          errorMessage,
          errorLogs: errorLogs.slice(0, 50), // Limit logs
          owner,
          repo,
        },
      }),
    });

    if (!analysisResponse.ok) {
      throw new Error("Failed to analyze error");
    }

    const analysisData = await analysisResponse.json();
    const analysis = analysisData.result;

    if (!analysis?.fix?.changes) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No fixes generated",
          analysis: analysis?.analysis,
        }),
        { headers: corsHeaders }
      );
    }

    // Step 3: Fetch original files and prepare diffs
    console.log("Preparing file diffs...");
    const fileChanges = [];

    for (const change of analysis.fix.changes) {
      try {
        const fileResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/github-api`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            action: "get_file",
            owner,
            repo,
            path: change.file,
            branch,
          }),
        });

        let originalContent = "";
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          originalContent = fileData.data?.decodedContent || "";
        }

        fileChanges.push({
          path: change.file,
          originalContent,
          newContent: change.content,
          action: change.action,
        });
      } catch (error) {
        console.warn(`Could not fetch ${change.file}:`, error);
        fileChanges.push({
          path: change.file,
          originalContent: "",
          newContent: change.content,
          action: change.action,
        });
      }
    }

    // Step 4: Return analysis and diffs for review
    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysis.analysis,
        fix: {
          title: analysis.pr?.title || `[ResurrectCI] Auto-fix build error`,
          description: analysis.pr?.body || `Automated fix for build error in ${branch}`,
          changes: fileChanges,
          confidence: analysis.confidence || 75,
        },
        explanation: analysis.explanation,
        timestamp: new Date().toISOString(),
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("Auto-fix agent error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});