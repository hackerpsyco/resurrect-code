import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action");

    if (!token || !action) {
      return new Response(
        JSON.stringify({ error: "Missing token or action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode token
    let replyId: string;
    try {
      const decoded = atob(token);
      [replyId] = decoded.split(":");
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📧 Email reply received: ${action} for ${replyId}`);

    // Store the reply action
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create or update email reply record
    const response = await fetch(`${supabaseUrl}/rest/v1/email_replies`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        reply_id: replyId,
        action: action,
        created_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error("Failed to store reply:", response.statusText);
      // Continue anyway - we'll handle it client-side
    }

    // If action is "approve", trigger GitHub push
    if (action === "approve") {
      console.log("🚀 Triggering GitHub auto-push...");

      // Call trigger-github-push function
      const pushResponse = await fetch(`${supabaseUrl}/functions/v1/trigger-github-push`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          replyId: replyId,
          action: "auto-push",
        }),
      });

      if (pushResponse.ok) {
        console.log("✅ GitHub push triggered successfully");
      } else {
        console.error("Failed to trigger GitHub push:", pushResponse.statusText);
      }
    }

    // Return success page
    const successHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ResurrectCI - Email Reply Confirmed</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
              color: #fff;
              margin: 0;
              padding: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .container {
              background: #161b22;
              border: 1px solid #30363d;
              border-radius: 8px;
              padding: 40px;
              max-width: 500px;
              text-align: center;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            h1 {
              color: #238636;
              margin: 0 0 10px 0;
            }
            p {
              color: #7d8590;
              margin: 10px 0;
            }
            .status {
              background: #238636;
              color: white;
              padding: 10px 20px;
              border-radius: 6px;
              display: inline-block;
              margin-top: 20px;
              font-weight: bold;
            }
            .status.rejected {
              background: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${action === "approve" ? `
              <div class="icon">✅</div>
              <h1>Analysis Approved!</h1>
              <p>Your code improvements will be pushed to GitHub automatically.</p>
              <p>A pull request will be created shortly.</p>
              <div class="status">Approved - PR Creating</div>
            ` : `
              <div class="icon">❌</div>
              <h1>Analysis Skipped</h1>
              <p>No pull request will be created.</p>
              <p>You can review the analysis report anytime in your dashboard.</p>
              <div class="status rejected">Rejected - No PR</div>
            `}
            <p style="margin-top: 30px; font-size: 12px;">
              You can close this window and return to your dashboard.
            </p>
          </div>
        </body>
      </html>
    `;

    return new Response(successHtml, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
