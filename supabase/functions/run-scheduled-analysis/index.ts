/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface AnalysisRequest {
  userId: string;
  repositories: string[];
  projects?: string[];
}

interface AnalysisResult {
  repository: string;
  totalIssues: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  issues: Array<{
    file: string;
    line: number;
    message: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }>;
}

interface PRCreationResult {
  prUrl: string;
  prNumber: number;
  branchName: string;
}

console.info('run-scheduled-analysis function started');

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: corsHeaders }
      );
    }

    const analysisRequest: AnalysisRequest = await req.json();
    const { userId, repositories } = analysisRequest;

    console.log(`🚀 Starting scheduled analysis for user ${userId}`);
    console.log(`📦 Repositories: ${repositories.join(', ')}`);
    console.log(`📋 Request body:`, JSON.stringify(analysisRequest, null, 2));

    if (!userId || !repositories || repositories.length === 0) {
      console.error("❌ Validation failed - missing userId or repositories");
      return new Response(
        JSON.stringify({ error: "Missing userId or repositories" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user settings - use default if not found
    const { data: settings, error: settingsError } = await supabase
      .from("analysis_automation_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Log the error but don't fail - use defaults
    if (settingsError) {
      console.warn("⚠️ Warning fetching settings:", settingsError);
      console.log("ℹ️ Using default settings (table may not exist or no user settings)");
    }

    // Use settings if found, otherwise use defaults
    const userSettings = settings || {
      enable_email_notifications: false,
      user_email: null,
      auto_generate_improvements: false,
      auto_push_to_github: false,
    };

    console.log("✅ Settings loaded (or using defaults)");

    // Get GitHub token from user metadata
    console.log(`🔍 Fetching user metadata for user: ${userId}`);
    
    let githubToken = null;
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

      if (userError) {
        console.warn("⚠️ Error fetching user:", userError);
      } else if (user) {
        console.log("✅ User fetched successfully");
        console.log(`📋 User metadata:`, JSON.stringify(user.user_metadata, null, 2));
        githubToken = user.user_metadata?.github_token;
      }
    } catch (error) {
      console.error("❌ Exception fetching user:", error);
    }

    if (!githubToken) {
      console.warn("⚠️ GitHub token not found in user metadata");
      console.log("ℹ️ User must connect GitHub account first");
      console.log("ℹ️ Go to Settings → GitHub Integration and connect your GitHub account");
      throw new Error("GitHub token not found - please connect your GitHub account in settings");
    }

    console.log("✅ GitHub token retrieved");

    // Process each repository
    const results: AnalysisResult[] = [];
    const prResults: PRCreationResult[] = [];

    for (const repo of repositories) {
      try {
        console.log(`📊 Analyzing repository: ${repo}`);

        // Fetch code from GitHub
        const analysisResult = await analyzeRepository(repo, githubToken);
        results.push(analysisResult);

        console.log(`✅ Analysis complete: ${analysisResult.totalIssues} issues found`);

        // Create PR with results
        const prResult = await createPullRequest(repo, analysisResult, githubToken);
        prResults.push(prResult);

        console.log(`✅ PR created: ${prResult.prUrl}`);

        // Save report to database
        await saveAnalysisReport(supabase, userId, analysisResult, prResult);

        console.log(`✅ Report saved to database`);

      } catch (error) {
        console.error(`❌ Error analyzing ${repo}:`, error);
        // Continue with next repo on error
      }
    }

    // Send email notification if enabled
    if (userSettings.enable_email_notifications && userSettings.user_email) {
      try {
        await sendEmailNotification(
          userSettings.user_email,
          results,
          prResults,
          supabase,
          userId
        );
        console.log("✅ Email notification sent");
      } catch (error) {
        console.error("❌ Error sending email:", error);
        // Don't fail the whole operation if email fails
      }
    }

    console.log("✅ Scheduled analysis completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Analysis completed",
        analyzed: results.length,
        prsCreated: prResults.length,
        results: results,
        prs: prResults,
      }),
      { 
        status: 200,
        headers: corsHeaders 
      }
    );

  } catch (error) {
    console.error("❌ Error in run-scheduled-analysis:", error);
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
      { status: 500, headers: corsHeaders }
    );
  }
});

/**
 * Analyze a repository for code issues
 */
async function analyzeRepository(
  repo: string,
  githubToken: string
): Promise<AnalysisResult> {
  const [owner, repoName] = repo.split('/');

  console.log(`📥 Fetching code from ${repo}...`);

  // Fetch repository tree
  const treeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/git/trees/main?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!treeResponse.ok) {
    throw new Error(`Failed to fetch repository tree: ${treeResponse.statusText}`);
  }

  const treeData = await treeResponse.json() as any;
  const files = treeData.tree.filter((item: any) =>
    item.type === "blob" && isCodeFile(item.path)
  );

  console.log(`📄 Found ${files.length} code files`);

  // Fetch file contents and analyze
  const issues: AnalysisResult['issues'] = [];
  let critical = 0;
  let high = 0;
  let medium = 0;
  let low = 0;

  for (const file of files.slice(0, 20)) { // Limit to first 20 files for performance
    try {
      const fileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3.raw",
          },
        }
      );

      if (!fileResponse.ok) continue;

      const content = await fileResponse.text();

      // Analyze file content for issues
      const fileIssues = analyzeFileContent(content, file.path);

      for (const issue of fileIssues) {
        issues.push(issue);
        if (issue.priority === 'critical') critical++;
        else if (issue.priority === 'high') high++;
        else if (issue.priority === 'medium') medium++;
        else low++;
      }

    } catch (error) {
      console.warn(`⚠️ Error analyzing file ${file.path}:`, error);
    }
  }

  return {
    repository: repo,
    totalIssues: issues.length,
    byPriority: { critical, high, medium, low },
    issues: issues.slice(0, 50), // Limit to 50 issues in report
  };
}

/**
 * Analyze file content for code issues
 */
function analyzeFileContent(
  content: string,
  filePath: string
): AnalysisResult['issues'] {
  const issues: AnalysisResult['issues'] = [];
  const lines = content.split('\n');

  // Check for common issues
  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for console.log (medium priority)
    if (line.includes('console.log') && !line.includes('//')) {
      issues.push({
        file: filePath,
        line: lineNum,
        message: 'Remove console.log statements from production code',
        priority: 'medium',
      });
    }

    // Check for TODO comments (low priority)
    if (line.includes('TODO') || line.includes('FIXME')) {
      issues.push({
        file: filePath,
        line: lineNum,
        message: 'Unresolved TODO/FIXME comment',
        priority: 'low',
      });
    }

    // Check for any (high priority)
    if (line.includes(': any') && !line.includes('//')) {
      issues.push({
        file: filePath,
        line: lineNum,
        message: 'Avoid using "any" type - use specific types instead',
        priority: 'high',
      });
    }

    // Check for empty catch blocks (critical priority)
    if (line.includes('catch') && line.includes('{}')) {
      issues.push({
        file: filePath,
        line: lineNum,
        message: 'Empty catch block - errors are being silently ignored',
        priority: 'critical',
      });
    }

    // Check for hardcoded credentials (critical priority)
    if (
      (line.includes('password') || line.includes('token') || line.includes('secret')) &&
      (line.includes('=') || line.includes(':')) &&
      !line.includes('//') &&
      !line.includes('PASSWORD') &&
      !line.includes('TOKEN')
    ) {
      issues.push({
        file: filePath,
        line: lineNum,
        message: 'Potential hardcoded credential detected',
        priority: 'critical',
      });
    }
  });

  return issues;
}

/**
 * Check if file is a code file
 */
function isCodeFile(path: string): boolean {
  const codeExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs',
    '.cpp', '.c', '.h', '.cs', '.rb', '.php', '.swift', '.kt',
    '.scala', '.clj', '.r', '.m', '.mm', '.swift', '.groovy',
  ];
  return codeExtensions.some(ext => path.endsWith(ext));
}

/**
 * Create a pull request with analysis results
 */
async function createPullRequest(
  repo: string,
  analysisResult: AnalysisResult,
  githubToken: string
): Promise<PRCreationResult> {
  const [owner, repoName] = repo.split('/');
  const timestamp = new Date().toISOString().slice(0, 10);
  const branchName = `scheduled-analysis-${timestamp}-${Date.now()}`;

  console.log(`🌿 Creating branch: ${branchName}`);

  // Get main branch SHA
  const mainResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/main`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!mainResponse.ok) {
    throw new Error(`Failed to fetch main branch: ${mainResponse.statusText}`);
  }

  const mainData = await mainResponse.json() as any;
  const mainSha = mainData.object.sha;

  // Create new branch
  const branchResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/git/refs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: mainSha,
      }),
    }
  );

  if (!branchResponse.ok) {
    throw new Error(`Failed to create branch: ${branchResponse.statusText}`);
  }

  console.log(`✅ Branch created`);

  // Create analysis report file
  const reportContent = generateReportMarkdown(analysisResult);
  const reportPath = `analysis-reports/report-${timestamp}.md`;

  console.log(`📝 Creating report file: ${reportPath}`);

  // Create blob for report
  const blobResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/git/blobs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: reportContent,
        encoding: "utf-8",
      }),
    }
  );

  if (!blobResponse.ok) {
    throw new Error(`Failed to create blob: ${blobResponse.statusText}`);
  }

  const blobData = await blobResponse.json() as any;
  const blobSha = blobData.sha;

  // Create tree with report file
  const treeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/git/trees`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base_tree: mainSha,
        tree: [
          {
            path: reportPath,
            mode: "100644",
            type: "blob",
            sha: blobSha,
          },
        ],
      }),
    }
  );

  if (!treeResponse.ok) {
    throw new Error(`Failed to create tree: ${treeResponse.statusText}`);
  }

  const treeData = await treeResponse.json() as any;
  const treeSha = treeData.sha;

  // Create commit
  const commitResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/git/commits`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `📊 Scheduled Analysis Report - ${analysisResult.totalIssues} issues found`,
        tree: treeSha,
        parents: [mainSha],
      }),
    }
  );

  if (!commitResponse.ok) {
    throw new Error(`Failed to create commit: ${commitResponse.statusText}`);
  }

  const commitData = await commitResponse.json() as any;
  const commitSha = commitData.sha;

  // Update branch reference
  const updateRefResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branchName}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sha: commitSha,
        force: false,
      }),
    }
  );

  if (!updateRefResponse.ok) {
    throw new Error(`Failed to update branch: ${updateRefResponse.statusText}`);
  }

  console.log(`✅ Commit created`);

  // Create pull request
  const prResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `📊 Scheduled Analysis: ${analysisResult.totalIssues} issues found`,
        head: branchName,
        base: "main",
        body: generatePRDescription(analysisResult),
      }),
    }
  );

  if (!prResponse.ok) {
    throw new Error(`Failed to create PR: ${prResponse.statusText}`);
  }

  const prData = await prResponse.json() as any;

  console.log(`✅ PR created: ${prData.html_url}`);

  return {
    prUrl: prData.html_url,
    prNumber: prData.number,
    branchName: branchName,
  };
}

/**
 * Generate markdown report for analysis results
 */
function generateReportMarkdown(analysisResult: AnalysisResult): string {
  const { repository, totalIssues, byPriority, issues } = analysisResult;

  let markdown = `# Code Analysis Report\n\n`;
  markdown += `**Repository**: ${repository}\n`;
  markdown += `**Date**: ${new Date().toISOString()}\n\n`;

  markdown += `## Summary\n\n`;
  markdown += `- **Total Issues**: ${totalIssues}\n`;
  markdown += `- **Critical**: ${byPriority.critical}\n`;
  markdown += `- **High**: ${byPriority.high}\n`;
  markdown += `- **Medium**: ${byPriority.medium}\n`;
  markdown += `- **Low**: ${byPriority.low}\n\n`;

  markdown += `## Issues by Priority\n\n`;

  const critical = issues.filter(i => i.priority === 'critical');
  if (critical.length > 0) {
    markdown += `### 🔴 Critical (${critical.length})\n\n`;
    critical.forEach(issue => {
      markdown += `- **${issue.file}:${issue.line}** - ${issue.message}\n`;
    });
    markdown += `\n`;
  }

  const high = issues.filter(i => i.priority === 'high');
  if (high.length > 0) {
    markdown += `### 🟠 High (${high.length})\n\n`;
    high.forEach(issue => {
      markdown += `- **${issue.file}:${issue.line}** - ${issue.message}\n`;
    });
    markdown += `\n`;
  }

  const medium = issues.filter(i => i.priority === 'medium');
  if (medium.length > 0) {
    markdown += `### 🟡 Medium (${medium.length})\n\n`;
    medium.forEach(issue => {
      markdown += `- **${issue.file}:${issue.line}** - ${issue.message}\n`;
    });
    markdown += `\n`;
  }

  const low = issues.filter(i => i.priority === 'low');
  if (low.length > 0) {
    markdown += `### 🔵 Low (${low.length})\n\n`;
    low.forEach(issue => {
      markdown += `- **${issue.file}:${issue.line}** - ${issue.message}\n`;
    });
    markdown += `\n`;
  }

  return markdown;
}

/**
 * Generate PR description
 */
function generatePRDescription(analysisResult: AnalysisResult): string {
  const { totalIssues, byPriority } = analysisResult;

  return `## 📊 Scheduled Code Analysis Results\n\n` +
    `This PR contains the results of the scheduled code analysis.\n\n` +
    `### Summary\n` +
    `- **Total Issues Found**: ${totalIssues}\n` +
    `- **Critical**: ${byPriority.critical}\n` +
    `- **High**: ${byPriority.high}\n` +
    `- **Medium**: ${byPriority.medium}\n` +
    `- **Low**: ${byPriority.low}\n\n` +
    `### Details\n` +
    `See the attached analysis report for detailed findings.\n\n` +
    `### Next Steps\n` +
    `1. Review the analysis results\n` +
    `2. Address critical and high priority issues\n` +
    `3. Merge when ready\n`;
}

/**
 * Save analysis report to database
 */
async function saveAnalysisReport(
  supabase: any,
  userId: string,
  analysisResult: AnalysisResult,
  prResult: PRCreationResult
): Promise<void> {
  const reportId = `report-${Date.now()}`;

  const { error } = await supabase
    .from("analysis_reports")
    .insert({
      user_id: userId,
      report_id: reportId,
      timestamp: new Date().toISOString(),
      repository: analysisResult.repository,
      total_issues: analysisResult.totalIssues,
      critical_issues: analysisResult.byPriority.critical,
      high_issues: analysisResult.byPriority.high,
      medium_issues: analysisResult.byPriority.medium,
      low_issues: analysisResult.byPriority.low,
      short_summary: `${analysisResult.totalIssues} issues found`,
      full_report: JSON.stringify(analysisResult),
      pr_url: prResult.prUrl,
      pr_number: prResult.prNumber,
      branch_name: prResult.branchName,
      email_sent: false,
    });

  if (error) {
    throw error;
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  email: string,
  results: AnalysisResult[],
  prResults: PRCreationResult[],
  supabase: any,
  userId: string
): Promise<void> {
  const totalIssues = results.reduce((sum, r) => sum + r.totalIssues, 0);
  const totalCritical = results.reduce((sum, r) => sum + r.byPriority.critical, 0);

  let emailBody = `<h2>📊 Scheduled Analysis Complete</h2>\n`;
  emailBody += `<p>Your scheduled code analysis has completed. Here are the results:</p>\n`;
  emailBody += `<h3>Summary</h3>\n`;
  emailBody += `<ul>\n`;
  emailBody += `<li><strong>Total Issues:</strong> ${totalIssues}</li>\n`;
  emailBody += `<li><strong>Critical:</strong> ${totalCritical}</li>\n`;
  emailBody += `<li><strong>Repositories Analyzed:</strong> ${results.length}</li>\n`;
  emailBody += `<li><strong>PRs Created:</strong> ${prResults.length}</li>\n`;
  emailBody += `</ul>\n`;

  emailBody += `<h3>Pull Requests</h3>\n`;
  emailBody += `<ul>\n`;
  prResults.forEach((pr, index) => {
    emailBody += `<li><a href="${pr.prUrl}">View PR #${pr.prNumber}</a> - ${results[index]?.repository}</li>\n`;
  });
  emailBody += `</ul>\n`;

  emailBody += `<p><a href="https://github.com">Review on GitHub</a></p>\n`;

  // Call send-analysis-email function
  const response = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-analysis-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        to: email,
        subject: `📊 Code Analysis Complete - ${totalIssues} issues found`,
        html: emailBody,
        userId: userId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.statusText}`);
  }
}
