/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface AnalysisSettings {
  enableEmailNotifications: boolean;
  userEmail: string;
  autoGenerateImprovements: boolean;
  autoPushToGitHub: boolean;
  analysisSchedule: 'manual' | 'on-push' | 'daily' | 'weekly';
  shortReportFormat: boolean;
  scheduledTime?: string;
  selectedRepositories?: string[];
  selectedProjects?: string[];
  githubToken?: string;
  githubLogin?: string;
}

console.info('analysis-settings function started');

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = user.id;
    console.log(`User authenticated: ${userId}`);

    // Handle GET request - retrieve settings
    if (req.method === "GET") {
      console.log(`📖 GET request for user: ${userId}`);
      
      const { data, error } = await supabase
        .from("analysis_automation_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.warn(`⚠️ Error fetching settings (${error.code}):`, error.message);
        
        // If table doesn't exist or no rows found, return defaults
        if (error.code === "PGRST116" || error.code === "42P01") {
          console.log("ℹ️ Returning default settings (table may not exist or no user settings)");
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                enableEmailNotifications: false,
                userEmail: "",
                autoGenerateImprovements: false,
                autoPushToGitHub: false,
                analysisSchedule: "manual",
                shortReportFormat: true,
                scheduledTime: "02:00",
                selectedRepositories: [],
                selectedProjects: [],
              },
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // For other errors, throw
        throw error;
      }

      if (!data) {
        console.log("ℹ️ No settings found for user, returning defaults");
        // Return default settings if none exist
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              enableEmailNotifications: false,
              userEmail: "",
              autoGenerateImprovements: false,
              autoPushToGitHub: false,
              analysisSchedule: "manual",
              shortReportFormat: true,
              scheduledTime: "02:00",
              selectedRepositories: [],
              selectedProjects: [],
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Transform database format to client format
      const settings: AnalysisSettings = {
        enableEmailNotifications: data.enable_email_notifications,
        userEmail: data.user_email || "",
        autoGenerateImprovements: data.auto_generate_improvements,
        autoPushToGitHub: data.auto_push_to_github,
        analysisSchedule: data.analysis_schedule,
        shortReportFormat: data.short_report_format,
        scheduledTime: data.scheduled_time,
        selectedRepositories: data.selected_repositories || [],
        selectedProjects: data.selected_projects || [],
        githubToken: data.github_token,
        githubLogin: data.github_login,
      };

      console.log("✅ Settings retrieved successfully");
      return new Response(
        JSON.stringify({ success: true, data: settings }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle POST/PUT request - save settings
    if (req.method === "POST" || req.method === "PUT") {
      const settings: AnalysisSettings = await req.json();

      console.log("💾 Saving settings:", JSON.stringify(settings, null, 2));

      // Check if settings exist
      const { data: existing, error: checkError } = await supabase
        .from("analysis_automation_settings")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (checkError && checkError.code !== "PGRST116" && checkError.code !== "42P01") {
        console.error("❌ Error checking existing settings:", checkError);
        throw checkError;
      }

      let result;
      if (existing) {
        console.log("📝 Updating existing settings");
        // Update existing settings
        result = await supabase
          .from("analysis_automation_settings")
          .update({
            enable_email_notifications: settings.enableEmailNotifications,
            user_email: settings.userEmail,
            auto_generate_improvements: settings.autoGenerateImprovements,
            auto_push_to_github: settings.autoPushToGitHub,
            analysis_schedule: settings.analysisSchedule,
            short_report_format: settings.shortReportFormat,
            scheduled_time: settings.scheduledTime,
            selected_repositories: settings.selectedRepositories || [],
            selected_projects: settings.selectedProjects || [],
            github_token: settings.githubToken,
            github_login: settings.githubLogin,
          })
          .eq("user_id", userId)
          .select();
      } else {
        console.log("✨ Creating new settings");
        // Insert new settings
        result = await supabase
          .from("analysis_automation_settings")
          .insert({
            user_id: userId,
            enable_email_notifications: settings.enableEmailNotifications,
            user_email: settings.userEmail,
            auto_generate_improvements: settings.autoGenerateImprovements,
            auto_push_to_github: settings.autoPushToGitHub,
            analysis_schedule: settings.analysisSchedule,
            short_report_format: settings.shortReportFormat,
            scheduled_time: settings.scheduledTime,
            selected_repositories: settings.selectedRepositories || [],
            selected_projects: settings.selectedProjects || [],
            github_token: settings.githubToken,
            github_login: settings.githubLogin,
          })
          .select();
      }

      if (result.error) {
        console.error("❌ Error saving settings:", result.error);
        throw result.error;
      }

      console.log("✅ Settings saved successfully");
      return new Response(
        JSON.stringify({ success: true, data: result.data?.[0] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );

  } catch (error) {
    console.error("❌ Error in analysis-settings:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";
    
    console.error("❌ Error message:", errorMessage);
    console.error("❌ Error stack:", errorStack);
    console.error("❌ Full error object:", JSON.stringify(error, null, 2));
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: errorStack
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
