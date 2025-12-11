import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

interface ErrorInfo {
  deploymentId: string;
  projectName: string;
  branch: string;
  commitMessage: string;
  errorMessage: string;
  errorLogs: string[];
  timestamp: string;
  owner?: string;
  repo?: string;
}

interface AgentRequest {
  action: "analyze_error" | "search_solution" | "generate_fix" | "full_analysis";
  errorInfo?: ErrorInfo;
  errorAnalysis?: string;
  searchResults?: string;
  fileContents?: Record<string, string>;
}

const SYSTEM_PROMPT = `You are ResurrectCI, an expert AI agent specialized in analyzing CI/CD build failures and generating fixes.

Your expertise includes:
- React/Vite/TypeScript build errors
- npm/yarn dependency issues
- ESLint/TypeScript compilation errors
- Module resolution problems
- Environment variable issues
- Deployment configuration errors

When analyzing errors:
1. Parse the full error stack trace
2. Identify the exact file, line, and column
3. Determine error category: MODULE_NOT_FOUND, SYNTAX_ERROR, TYPE_ERROR, BUILD_ERROR, CONFIG_ERROR
4. Extract the specific module/symbol causing the issue
5. Consider common patterns: missing deps, wrong imports, typos

When generating fixes:
1. Provide the exact file path
2. Show the specific line changes needed
3. Include both the problem code and fixed code
4. Explain why the fix works

IMPORTANT: Always respond in valid JSON format.`;

async function callGeminiAPI(prompt: string): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

console.info('ai-agent function started');

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, errorInfo, errorAnalysis, searchResults, fileContents }: AgentRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`AI Agent action: ${action}`);
    console.log(`Error info:`, JSON.stringify(errorInfo, null, 2));

    let prompt = "";

    switch (action) {
      case "analyze_error":
        // Enhanced error analysis with detailed log parsing
        prompt = `Analyze this Vercel/Vite build error and identify the root cause:

PROJECT: ${errorInfo?.projectName}
BRANCH: ${errorInfo?.branch}
COMMIT: ${errorInfo?.commitMessage}

ERROR MESSAGE:
${errorInfo?.errorMessage}

BUILD LOGS (Recent):
\`\`\`
${errorInfo?.errorLogs?.slice(-50).join("\n") || "No detailed logs available"}
\`\`\`

Analyze the logs carefully. Look for:
- "Module not found" or "Cannot resolve" errors
- TypeScript errors (TS####)
- Syntax errors with line/column numbers
- Missing dependency warnings
- Environment variable issues

Respond with this exact JSON structure:
{
  "errorType": "MODULE_NOT_FOUND | SYNTAX_ERROR | TYPE_ERROR | BUILD_ERROR | CONFIG_ERROR | DEPENDENCY_ERROR",
  "rootCause": "Clear explanation of what's causing the error",
  "affectedFile": "src/path/to/file.tsx or null if unknown",
  "affectedLine": null,
  "missingModule": "module-name if applicable, null otherwise",
  "severity": "low | medium | high | critical",
  "searchQuery": "specific search query to find solution online",
  "quickFix": "Brief description of likely fix"
}`;
        break;

      case "search_solution":
        // Use AI to synthesize common solutions
        prompt = `Based on this error analysis, provide solutions:

ERROR ANALYSIS:
${errorAnalysis}

${fileContents ? `RELEVANT FILE CONTENTS:\n${JSON.stringify(fileContents, null, 2)}` : ""}

Think through common solutions for this error type:
1. What are the typical causes?
2. What fixes have worked for similar issues?
3. Are there any npm packages that need to be installed?

Respond with this exact JSON structure:
{
  "solutions": [
    {
      "description": "Clear description of the fix",
      "confidence": 85,
      "steps": ["Step 1", "Step 2"],
      "codeChanges": [
        {
          "file": "src/path/to/file.tsx",
          "action": "modify",
          "searchPattern": "code to find",
          "replaceWith": "fixed code"
        }
      ],
      "npmInstall": ["package-name"] 
    }
  ],
  "recommendedSolution": 0,
  "reasoning": "Why this solution is recommended"
}`;
        break;

      case "generate_fix":
        // Generate actual code patches
        prompt = `Generate the exact code fix for this error:

ERROR ANALYSIS:
${errorAnalysis}

SELECTED SOLUTION:
${searchResults}

${fileContents ? `CURRENT FILE CONTENTS:\n${JSON.stringify(fileContents, null, 2)}` : ""}

Generate precise, working code fixes. Be specific about:
- Exact file paths
- Line-by-line changes
- Import statements to add/modify

Respond with this exact JSON structure:
{
  "branchName": "resurrect-fix",
  "commitMessage": "fix: [concise description of fix]",
  "changes": [
    {
      "file": "src/path/to/file.tsx",
      "action": "modify | create | delete",
      "content": "Full file content after fix OR patch description"
    }
  ],
  "npmCommands": ["npm install package-name"],
  "prTitle": "[ResurrectCI] Fix: description",
  "prDescription": "## Problem\\n...\\n## Solution\\n...\\n## Changes\\n- file1\\n- file2"
}`;
        break;

      case "full_analysis":
        // Combined analysis for Kestra workflow - single call that does everything
        prompt = `You are running a full CI/CD error analysis and fix generation.

PROJECT: ${errorInfo?.projectName}
BRANCH: ${errorInfo?.branch}
OWNER: ${errorInfo?.owner}
REPO: ${errorInfo?.repo}

ERROR MESSAGE:
${errorInfo?.errorMessage}

BUILD LOGS:
\`\`\`
${errorInfo?.errorLogs?.join("\n") || "No logs"}
\`\`\`

${fileContents ? `FILE CONTENTS:\n${JSON.stringify(fileContents, null, 2)}` : ""}

Perform a COMPLETE analysis and fix generation in ONE response:

1. ANALYZE: Identify the exact error and root cause
2. DIAGNOSE: Determine what file(s) need to change
3. FIX: Generate the exact code changes needed
4. DOCUMENT: Create PR title and description

Respond with this JSON structure:
{
  "analysis": {
    "errorType": "MODULE_NOT_FOUND | SYNTAX_ERROR | TYPE_ERROR | BUILD_ERROR",
    "rootCause": "explanation",
    "affectedFiles": ["file1.tsx", "file2.ts"],
    "severity": "critical"
  },
  "fix": {
    "branchName": "resurrect-fix",
    "commitMessage": "fix: description",
    "changes": [
      {
        "file": "src/file.tsx",
        "action": "modify",
        "content": "// Full fixed file content"
      }
    ],
    "npmCommands": []
  },
  "pr": {
    "title": "[ResurrectCI] Fix: description",
    "body": "## Problem\\nDescription...\\n## Solution\\n...\\n## Testing\\n..."
  },
  "confidence": 85,
  "explanation": "Human readable explanation of what was wrong and how it was fixed"
}`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log("Calling Gemini API directly...");

    // Call Gemini API directly
    const content = await callGeminiAPI(prompt);

    console.log("AI Response received, length:", content?.length);

    // Parse JSON from response
    let parsedResponse;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                        content.match(/```\n?([\s\S]*?)\n?```/) ||
                        [null, content];
      const jsonStr = (jsonMatch[1] || content).trim();
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Return raw response if JSON parsing fails
      parsedResponse = { 
        rawResponse: content,
        parseError: true,
        analysis: {
          errorType: "UNKNOWN",
          rootCause: content.substring(0, 500),
          affectedFiles: [],
          severity: "medium"
        }
      };
    }

    console.log("AI Agent completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        action,
        result: parsedResponse,
        timestamp: new Date().toISOString(),
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("AI Agent error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});
