/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Content-Type": "application/json",
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
}

console.info('analysis-settings function started');

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
      const { data, error } = await supabase
        .from("analysis_automation_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
        throw error;
      }

      if (!data) {
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
          { headers: corsHeaders }
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
      };

      console.log("✅ Settings retrieved successfully");
      return new Response(
        JSON.stringify({ success: true, data: settings }),
        { headers: corsHeaders }
      );
    }

    // Handle POST/PUT request - save settings
    if (req.method === "POST" || req.method === "PUT") {
      const settings: AnalysisSettings = await req.json();

      console.log("Saving settings:", JSON.stringify(settings, null, 2));

      // Check if settings exist
      const { data: existing } = await supabase
        .from("analysis_automation_settings")
        .select("id")
        .eq("user_id", userId)
        .single();

      let result;
      if (existing) {
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
          })
          .eq("user_id", userId)
          .select();
      } else {
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
          })
          .select();
      }

      if (result.error) {
        throw result.error;
      }

      console.log("✅ Settings saved successfully");
      return new Response(
        JSON.stringify({ success: true, data: result.data?.[0] }),
        { headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});
