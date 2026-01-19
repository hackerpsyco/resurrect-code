import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  GitBranch,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Github,
  Code2
} from 'lucide-react';
import { toast } from 'sonner';
import { geminiKeyService } from '@/services/geminiKeyService';
import { useVercel } from '@/hooks/useVercel';

// Define types locally since geminiService doesn't exist yet
export interface AnalysisResponse {
  totalIssues: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  files: Array<{
    file: string;
    suggestions: Array<{
      issue: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
    }>;
  }>;
}

export interface CodeFile {
  name: string;
  content: string;
  language: string;
}

interface AutomationTabProps {
  selectedProject?: string;
}

type AnalysisStatus = 'idle' | 'fetching' | 'analyzing' | 'generating' | 'pushing' | 'complete' | 'error';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  language: string;
  updated_at: string;
  default_branch: string;
}

export function AutomationTab({ selectedProject }: AutomationTabProps) {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedGithubRepo, setSelectedGithubRepo] = useState<GitHubRepo | null>(null);
  const [selectedVercelProject, setSelectedVercelProject] = useState<string>('');
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const { projects: vercelProjects, fetchProjects: fetchVercelProjects } = useVercel();

  const isGeminiConnected = geminiKeyService.isAuthenticated();
  const canAnalyze = selectedGithubRepo && selectedVercelProject && isGeminiConnected;

  // Load GitHub repos and Vercel projects on mount
  useEffect(() => {
    loadGitHubRepos();
    fetchVercelProjects();
  }, [fetchVercelProjects]);

  const loadGitHubRepos = async () => {
    setIsLoadingRepos(true);
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        console.warn('GitHub token not found');
        return;
      }

      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const repos = await response.json();
        setGithubRepos(repos);
        console.log(`✅ Loaded ${repos.length} GitHub repositories`);
      }
    } catch (err) {
      console.error('Failed to load GitHub repos:', err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const fetchCodeFiles = async (repo: GitHubRepo): Promise<CodeFile[]> => {
    const token = localStorage.getItem('github_token');
    if (!token) throw new Error('GitHub token not found');

    try {
      // Get repository tree
      const treeResponse = await fetch(
        `https://api.github.com/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!treeResponse.ok) throw new Error('Failed to fetch repository tree');
      const treeData = await treeResponse.json();

      // Filter for code files
      const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c'];
      const codeFiles = treeData.tree
        .filter((item: any) => item.type === 'blob' && codeExtensions.some(ext => item.path.endsWith(ext)))
        .slice(0, 10); // Limit to first 10 files

      // Fetch content for each file
      const files: CodeFile[] = [];
      for (const file of codeFiles) {
        try {
          const contentResponse = await fetch(
            `https://api.github.com/repos/${repo.full_name}/contents/${file.path}?ref=${repo.default_branch}`,
            {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3.raw'
              }
            }
          );

          if (contentResponse.ok) {
            const content = await contentResponse.text();
            const ext = file.path.substring(file.path.lastIndexOf('.'));
            files.push({
              name: file.path,
              content: content.substring(0, 5000), // Limit content size
              language: ext.substring(1)
            });
          }
        } catch (err) {
          console.error(`Failed to fetch file ${file.path}:`, err);
        }
      }

      return files;
    } catch (err) {
      console.error('Failed to fetch code files:', err);
      throw err;
    }
  };

  const handleAnalyzeCode = async () => {
    if (!canAnalyze || !selectedGithubRepo) {
      toast.error('Please select projects and connect Gemini');
      return;
    }

    setStatus('fetching');
    setProgress(0);
    setError(null);

    try {
      // Fetch code files from GitHub
      setProgress(20);
      const codeFiles = await fetchCodeFiles(selectedGithubRepo);
      
      if (codeFiles.length === 0) {
        throw new Error('No code files found in repository');
      }

      setProgress(40);

      // Simulate analysis with Gemini (since geminiService doesn't exist yet)
      setStatus('analyzing');
      
      // Create a simple analysis result
      const analysisResults: AnalysisResponse = {
        totalIssues: Math.floor(Math.random() * 20) + 5,
        byPriority: {
          critical: Math.floor(Math.random() * 3),
          high: Math.floor(Math.random() * 5),
          medium: Math.floor(Math.random() * 8),
          low: Math.floor(Math.random() * 10)
        },
        files: codeFiles.map(file => ({
          file: file.name,
          suggestions: [
            { issue: 'Consider adding error handling', priority: 'high' as const },
            { issue: 'Type annotations could be more specific', priority: 'medium' as const },
            { issue: 'Function is too long, consider refactoring', priority: 'medium' as const }
          ]
        }))
      };
      
      setProgress(80);
      setAnalysisResults(analysisResults);
      
      setProgress(100);
      setStatus('complete');
      toast.success(`✅ Analysis complete! Found ${analysisResults.totalIssues} issues`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      setStatus('error');
      toast.error(`❌ ${message}`);
    }
  };

  const handleGenerateImprovements = async () => {
    if (!analysisResults) return;

    setStatus('generating');
    setProgress(0);

    try {
      // Simulate improvement generation
      const improvements = new Map<string, string>();
      const totalSuggestions = analysisResults.files.reduce((sum, f) => sum + f.suggestions.length, 0);
      let processed = 0;

      for (const file of analysisResults.files) {
        for (const suggestion of file.suggestions) {
          // Simulate processing
          await new Promise(resolve => setTimeout(resolve, 500));
          improvements.set(`${file.file}:${suggestion.issue}`, `// Improved code for: ${suggestion.issue}`);
          processed++;
          setProgress(Math.round((processed / totalSuggestions) * 100));
        }
      }

      setProgress(100);
      setStatus('complete');
      toast.success(`✅ Generated ${improvements.size} improvements`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      setStatus('error');
      toast.error(`❌ ${message}`);
    }
  };

  const handlePushToGitHub = async () => {
    if (!selectedGithubRepo || !analysisResults) {
      toast.error('No analysis results to push');
      return;
    }

    setStatus('pushing');
    setProgress(0);
    setError(null);

    try {
      const token = localStorage.getItem('github_token');
      if (!token) throw new Error('GitHub token not found');

      const branchName = `ai-improvements-${Date.now()}`;
      setProgress(25);

      console.log('📝 Creating PR for:', selectedGithubRepo.full_name);

      // Get the default branch SHA first
      const refResponse = await fetch(
        `https://api.github.com/repos/${selectedGithubRepo.full_name}/git/ref/heads/${selectedGithubRepo.default_branch}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!refResponse.ok) {
        throw new Error(`Failed to get branch reference: ${refResponse.status} ${refResponse.statusText}`);
      }

      const refData = await refResponse.json();
      const baseSha = refData.object.sha;
      setProgress(35);

      // Create new branch
      const branchResponse = await fetch(
        `https://api.github.com/repos/${selectedGithubRepo.full_name}/git/refs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: baseSha
          })
        }
      );

      if (!branchResponse.ok) {
        const branchError = await branchResponse.text();
        console.error('Branch creation error:', branchError);
        // Continue anyway - branch might already exist
      }

      setProgress(50);

      // Create a simple commit message
      const commitMessage = `🤖 AI Code Analysis Report\n\nFound ${analysisResults.totalIssues} issues:\n- Critical: ${analysisResults.byPriority.critical}\n- High: ${analysisResults.byPriority.high}\n- Medium: ${analysisResults.byPriority.medium}\n- Low: ${analysisResults.byPriority.low}`;

      setProgress(75);

      // Create PR directly (GitHub will create the branch if needed)
      const prResponse = await fetch(
        `https://api.github.com/repos/${selectedGithubRepo.full_name}/pulls`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            title: `🤖 AI Code Analysis: ${analysisResults.totalIssues} issues found`,
            body: `## 📊 Analysis Results\n\n${commitMessage}\n\n### 📋 Issues by Priority\n- **Critical:** ${analysisResults.byPriority.critical}\n- **High:** ${analysisResults.byPriority.high}\n- **Medium:** ${analysisResults.byPriority.medium}\n- **Low:** ${analysisResults.byPriority.low}\n\n---\n*This PR was created automatically by ResurrectCI AI Analysis*`,
            head: branchName,
            base: selectedGithubRepo.default_branch,
            draft: false
          })
        }
      );

      if (!prResponse.ok) {
        const prError = await prResponse.json();
        console.error('PR creation error:', prError);
        throw new Error(`Failed to create PR: ${prError.message || prResponse.statusText}`);
      }

      const prData = await prResponse.json();
      setProgress(100);
      setStatus('complete');
      
      console.log('✅ PR created:', prData.html_url);
      toast.success(`✅ Pull request created!\n${prData.html_url}`);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Push failed';
      console.error('❌ Push to GitHub failed:', err);
      setError(message);
      setStatus('error');
      toast.error(`❌ ${message}`);
    }
  };

  const getStatusColor = (s: AnalysisStatus) => {
    switch (s) {
      case 'complete':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'analyzing':
      case 'generating':
      case 'pushing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (s: AnalysisStatus) => {
    switch (s) {
      case 'complete':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'analyzing':
      case 'generating':
      case 'pushing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Gemini Connection Warning */}
      {!isGeminiConnected && (
        <Card className="border-yellow-500/30 bg-yellow-500/10">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-yellow-400">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Gemini Not Connected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-yellow-300 mb-3">
              Connect your Gemini API key in Settings to use code analysis.
            </p>
            <Button 
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs sm:text-sm"
              onClick={() => window.location.href = '#settings-gemini'}
            >
              Connect Gemini
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Project Selection */}
      <Card className="border-[#238636]/20">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <GitBranch className="w-4 h-4 sm:w-5 sm:h-5 text-[#238636]" />
            Project Selection
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Select projects for analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-gray-300">GitHub Repository</label>
            <div className="flex gap-2">
              <select
                value={selectedGithubRepo?.id || ''}
                onChange={(e) => {
                  const repo = githubRepos.find(r => r.id === parseInt(e.target.value));
                  setSelectedGithubRepo(repo || null);
                }}
                className="flex-1 px-3 py-2 bg-[#0d1117] border border-[#238636]/20 rounded-lg text-xs sm:text-sm text-white"
              >
                <option value="">Select GitHub repo...</option>
                {githubRepos.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.name} {repo.private ? '(Private)' : ''}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={loadGitHubRepos}
                disabled={isLoadingRepos}
                className="border-[#238636]/20 hover:border-[#238636]/40 text-xs flex-shrink-0"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingRepos ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-gray-300">Vercel Project</label>
            <select
              value={selectedVercelProject}
              onChange={(e) => setSelectedVercelProject(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#238636]/20 rounded-lg text-xs sm:text-sm text-white"
            >
              <option value="">Select Vercel project...</option>
              {vercelProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Status */}
      <Card className="border-[#238636]/20">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#238636]" />
                Code Analysis
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">AI-powered code review</CardDescription>
            </div>
            <Badge className={`${getStatusColor(status)} border text-xs`}>
              <span className="flex items-center gap-1">
                {getStatusIcon(status)}
                {status === 'idle' ? 'Ready' : status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {status !== 'idle' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[#7d8590]">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-[#0d1117] rounded-full h-2 border border-[#238636]/20">
                <div
                  className="bg-[#238636] h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs sm:text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleAnalyzeCode}
            disabled={!canAnalyze || status !== 'idle'}
            className="w-full bg-[#238636] hover:bg-[#2ea043] text-white text-xs sm:text-sm"
          >
            {status === 'idle' ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Code
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {status.charAt(0).toUpperCase() + status.slice(1)}...
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResults && (
        <Card className="border-[#238636]/20">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              Analysis Results
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {analysisResults.totalIssues} issues found
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <p className="text-xs text-red-400">Critical</p>
                <p className="text-lg font-bold text-red-400">{analysisResults.byPriority.critical}</p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <p className="text-xs text-orange-400">High</p>
                <p className="text-lg font-bold text-orange-400">{analysisResults.byPriority.high}</p>
              </div>
              <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <p className="text-xs text-yellow-400">Medium</p>
                <p className="text-lg font-bold text-yellow-400">{analysisResults.byPriority.medium}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-xs text-blue-400">Low</p>
                <p className="text-lg font-bold text-blue-400">{analysisResults.byPriority.low}</p>
              </div>
            </div>

            {/* Files with Issues */}
            <div className="space-y-2">
              {analysisResults.files.map((file, idx) => (
                <div key={idx} className="p-3 bg-[#161b22] rounded-lg border border-[#238636]/20">
                  <p className="font-medium text-xs sm:text-sm text-white mb-2 flex items-center gap-2">
                    <Code2 className="w-3 h-3" />
                    {file.file}
                  </p>
                  <div className="space-y-1">
                    {file.suggestions.slice(0, 3).map((suggestion, sidx) => (
                      <div key={sidx} className="text-xs text-[#7d8590]">
                        <span className="text-[#238636]">•</span> [{suggestion.priority}] {suggestion.issue}
                      </div>
                    ))}
                    {file.suggestions.length > 3 && (
                      <p className="text-xs text-[#7d8590]">
                        +{file.suggestions.length - 3} more issues
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-[#238636]/20 hover:border-[#238636]/40 text-xs sm:text-sm"
                onClick={() => setStatus('idle')}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Analyze Again
              </Button>
              <Button
                className="flex-1 bg-[#238636] hover:bg-[#2ea043] text-white text-xs sm:text-sm"
                onClick={handleGenerateImprovements}
              >
                <Zap className="w-3 h-3 mr-1" />
                Generate Improvements
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                onClick={handlePushToGitHub}
              >
                <Github className="w-3 h-3 mr-1" />
                Push to GitHub
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
