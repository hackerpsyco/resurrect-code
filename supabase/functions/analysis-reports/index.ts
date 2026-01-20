/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Content-Type": "application/json",
};

interface AnalysisReport {
  id?: string;
  reportId: string;
  timestamp: string;
  repository: string;
  totalIssues: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  shortSummary: string;
  fullReport: string;
  prUrl?: string;
  prNumber?: number;
  branchName?: string;
  emailSent: boolean;
  emailSentAt?: string;
  userApproved?: boolean;
  userApprovedAt?: string;
}

console.info('analysis-reports function started');

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

    // Handle GET request - retrieve reports
    if (req.method === "GET") {
      const url = new URL(req.url);
      const repository = url.searchParams.get("repository");
      const limit = parseInt(url.searchParams.get("limit") || "50");

      let query = supabase
        .from("analysis_reports")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (repository) {
        query = query.eq("repository", repository);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform database format to client format
      const reports: AnalysisReport[] = (data || []).map((row: any) => ({
        id: row.id,
        reportId: row.report_id,
        timestamp: row.timestamp,
        repository: row.repository,
        totalIssues: row.total_issues,
        byPriority: {
          critical: row.critical_issues,
          high: row.high_issues,
          medium: row.medium_issues,
          low: row.low_issues,
        },
        shortSummary: row.short_summary,
        fullReport: row.full_report,
        prUrl: row.pr_url,
        prNumber: row.pr_number,
        branchName: row.branch_name,
        emailSent: row.email_sent,
        emailSentAt: row.email_sent_at,
        userApproved: row.user_approved,
        userApprovedAt: row.user_approved_at,
      }));

      console.log(`✅ Retrieved ${reports.length} reports`);
      return new Response(
        JSON.stringify({ success: true, data: reports }),
        { headers: corsHeaders }
      );
    }

    // Handle POST request - save new report
    if (req.method === "POST") {
      const report: AnalysisReport = await req.json();

      console.log("Saving report:", report.reportId);

      const result = await supabase
        .from("analysis_reports")
        .insert({
          user_id: userId,
          report_id: report.reportId,
          timestamp: report.timestamp,
          repository: report.repository,
          total_issues: report.totalIssues,
          critical_issues: report.byPriority.critical,
          high_issues: report.byPriority.high,
          medium_issues: report.byPriority.medium,
          low_issues: report.byPriority.low,
          short_summary: report.shortSummary,
          full_report: report.fullReport,
          pr_url: report.prUrl,
          pr_number: report.prNumber,
          branch_name: report.branchName,
          email_sent: report.emailSent,
          email_sent_at: report.emailSentAt,
          user_approved: report.userApproved,
          user_approved_at: report.userApprovedAt,
        })
        .select();

      if (result.error) {
        throw result.error;
      }

      console.log("✅ Report saved successfully");
      return new Response(
        JSON.stringify({ success: true, data: result.data?.[0] }),
        { headers: corsHeaders }
      );
    }

    // Handle PUT request - update report
    if (req.method === "PUT") {
      const report: AnalysisReport = await req.json();

      if (!report.id) {
        return new Response(
          JSON.stringify({ error: "Report ID is required for updates" }),
          { status: 400, headers: corsHeaders }
        );
      }

      console.log("Updating report:", report.id);

      const result = await supabase
        .from("analysis_reports")
        .update({
          pr_url: report.prUrl,
          pr_number: report.prNumber,
          branch_name: report.branchName,
          email_sent: report.emailSent,
          email_sent_at: report.emailSentAt,
          user_approved: report.userApproved,
          user_approved_at: report.userApprovedAt,
        })
        .eq("id", report.id)
        .eq("user_id", userId)
        .select();

      if (result.error) {
        throw result.error;
      }

      console.log("✅ Report updated successfully");
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
