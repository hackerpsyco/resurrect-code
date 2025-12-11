import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

interface GitHubRequest {
  action: "get_repo" | "get_file" | "get_tree" | "create_branch" | "update_file" | "create_pr";
  owner: string;
  repo: string;
  path?: string;
  branch?: string;
  content?: string;
  message?: string;
  sha?: string;
  baseBranch?: string;
  newBranch?: string;
  title?: string;
  body?: string;
}

const GITHUB_API = "https://api.github.com";

console.info('github-api function started');

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    if (!GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN is not configured");
    }

    const request: GitHubRequest = await req.json();
    const { action, owner, repo } = request;

    console.log(`GitHub API action: ${action} for ${owner}/${repo}`);

    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ResurrectCI-Agent",
    };

    let result;

    switch (action) {
      case "get_repo": {
        const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers });
        if (!response.ok) throw new Error(`Failed to get repo: ${response.statusText}`);
        result = await response.json();
        break;
      }

      case "get_file": {
        const { path, branch = "main" } = request;
        const response = await fetch(
          `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
          { headers }
        );
        if (!response.ok) throw new Error(`Failed to get file: ${response.statusText}`);
        const data = await response.json();
        // Decode base64 content
        if (data.content) {
          data.decodedContent = atob(data.content.replace(/\n/g, ""));
        }
        result = data;
        break;
      }

      case "get_tree": {
        const { branch = "main" } = request;
        // Get the branch reference
        const refResponse = await fetch(
          `${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${branch}`,
          { headers }
        );
        if (!refResponse.ok) throw new Error(`Failed to get branch ref: ${refResponse.statusText}`);
        const refData = await refResponse.json();
        
        // Get the tree
        const treeResponse = await fetch(
          `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${refData.object.sha}?recursive=1`,
          { headers }
        );
        if (!treeResponse.ok) throw new Error(`Failed to get tree: ${treeResponse.statusText}`);
        result = await treeResponse.json();
        break;
      }

      case "create_branch": {
        const { baseBranch = "main", newBranch } = request;
        if (!newBranch) throw new Error("newBranch is required");

        // Get the SHA of the base branch
        const refResponse = await fetch(
          `${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`,
          { headers }
        );
        if (!refResponse.ok) throw new Error(`Failed to get base branch: ${refResponse.statusText}`);
        const refData = await refResponse.json();

        // Create the new branch
        const createResponse = await fetch(
          `${GITHUB_API}/repos/${owner}/${repo}/git/refs`,
          {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({
              ref: `refs/heads/${newBranch}`,
              sha: refData.object.sha,
            }),
          }
        );
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          // Branch might already exist
          if (createResponse.status === 422) {
            console.log("Branch already exists, continuing...");
            result = { message: "Branch already exists", branch: newBranch };
          } else {
            throw new Error(`Failed to create branch: ${errorText}`);
          }
        } else {
          result = await createResponse.json();
        }
        break;
      }

      case "update_file": {
        const { path, content, message, sha, branch = "resurrect-fix" } = request;
        if (!path || !content || !message) {
          throw new Error("path, content, and message are required");
        }

        // Encode content to base64
        const encodedContent = btoa(content);

        const updateBody: Record<string, string> = {
          message,
          content: encodedContent,
          branch,
        };

        // If sha is provided, this is an update; otherwise, it's a create
        if (sha) {
          updateBody.sha = sha;
        }

        const response = await fetch(
          `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
          {
            method: "PUT",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify(updateBody),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update file: ${errorText}`);
        }
        result = await response.json();
        break;
      }

      case "create_pr": {
        const { title, body, baseBranch = "main", newBranch = "resurrect-fix" } = request;
        if (!title) throw new Error("title is required");

        const response = await fetch(
          `${GITHUB_API}/repos/${owner}/${repo}/pulls`,
          {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              body: body || "",
              head: newBranch,
              base: baseBranch,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          // PR might already exist
          if (response.status === 422 && errorText.includes("pull request already exists")) {
            // Get existing PR
            const existingResponse = await fetch(
              `${GITHUB_API}/repos/${owner}/${repo}/pulls?head=${owner}:${newBranch}&base=${baseBranch}`,
              { headers }
            );
            const existingPRs = await existingResponse.json();
            if (existingPRs.length > 0) {
              result = { ...existingPRs[0], message: "PR already exists" };
            } else {
              throw new Error(`Failed to create PR: ${errorText}`);
            }
          } else {
            throw new Error(`Failed to create PR: ${errorText}`);
          }
        } else {
          result = await response.json();
        }
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`GitHub API ${action} completed successfully`);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("GitHub API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});
