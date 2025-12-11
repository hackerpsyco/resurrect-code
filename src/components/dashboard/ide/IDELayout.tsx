import { useState, useCallback } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FolderTree,
  Terminal,
  Bot,
  GitBranch,
  AlertTriangle,
  X,
  Maximize2,
  Minimize2,
  FileCode,
  Loader2,
  Save,
  GitPullRequest,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { CodeEditor } from "./CodeEditor";
import { ClinePanel } from "./ClinePanel";
import { ProjectFileTree } from "../ProjectFileTree";
import { BuildLogViewer } from "../BuildLogViewer";
import { TerminalPanel } from "./TerminalPanel";
import { WebsitePreview } from "./WebsitePreview";
import { useGitHub } from "@/hooks/useGitHub";

interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  sha: string;
  isModified: boolean;
}

interface IDELayoutProps {
  project: {
    id: string;
    name: string;
    owner?: string;
    repo?: string;
    branch?: string;
    status: "crashed" | "resurrected" | "fixing" | "pending";
    errorPreview?: string;
    latestDeploymentId?: string;
  };
  onClose: () => void;
}

export function IDELayout({ project, onClose }: IDELayoutProps) {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [bottomPanel, setBottomPanel] = useState<"logs" | "terminal" | "preview">("logs");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { fetchFile, updateFile, createBranch, createPR, isLoading } = useGitHub();

  const handleFileClick = useCallback(async (path: string) => {
    // Check if file is already open
    const existing = openFiles.find((f) => f.path === path);
    if (existing) {
      setActiveFile(path);
      return;
    }

    if (!project.owner || !project.repo) {
      toast.error("Repository not connected");
      return;
    }

    const file = await fetchFile(project.owner, project.repo, path, project.branch);
    if (file) {
      const newFile: OpenFile = {
        path: file.path,
        content: file.content,
        originalContent: file.content,
        sha: file.sha,
        isModified: false,
      };
      setOpenFiles((prev) => [...prev, newFile]);
      setActiveFile(file.path);
    }
  }, [project, openFiles, fetchFile]);

  const handleContentChange = useCallback((path: string, content: string) => {
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.path === path
          ? { ...f, content, isModified: content !== f.originalContent }
          : f
      )
    );
  }, []);

  const handleSaveFile = useCallback(async (path: string) => {
    const file = openFiles.find((f) => f.path === path);
    if (!file || !project.owner || !project.repo) return;

    setIsSaving(true);
    try {
      const success = await updateFile(
        project.owner,
        project.repo,
        path,
        file.content,
        `fix: Update ${path} via ResurrectCI`,
        file.sha,
        project.branch
      );

      if (success) {
        setOpenFiles((prev) =>
          prev.map((f) =>
            f.path === path
              ? { ...f, originalContent: file.content, isModified: false }
              : f
          )
        );
        toast.success(`Saved ${path}`);
      }
    } finally {
      setIsSaving(false);
    }
  }, [openFiles, project, updateFile]);

  const handleCloseFile = useCallback((path: string) => {
    const file = openFiles.find((f) => f.path === path);
    if (file?.isModified) {
      if (!confirm("Discard unsaved changes?")) return;
    }
    
    setOpenFiles((prev) => prev.filter((f) => f.path !== path));
    if (activeFile === path) {
      const remaining = openFiles.filter((f) => f.path !== path);
      setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
  }, [openFiles, activeFile]);

  const handleApplyFix = useCallback((path: string, content: string) => {
    const existing = openFiles.find((f) => f.path === path);
    if (existing) {
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.path === path ? { ...f, content, isModified: true } : f
        )
      );
      setActiveFile(path);
    } else {
      // Open new file with the fix
      const newFile: OpenFile = {
        path,
        content,
        originalContent: "",
        sha: "",
        isModified: true,
      };
      setOpenFiles((prev) => [...prev, newFile]);
      setActiveFile(path);
    }
  }, [openFiles]);

  const handleCreatePR = useCallback(async () => {
    if (!project.owner || !project.repo) {
      toast.error("Repository not connected");
      return;
    }

    const modifiedFiles = openFiles.filter((f) => f.isModified);
    if (modifiedFiles.length === 0) {
      toast.error("No modified files to commit");
      return;
    }

    const fixBranch = `resurrect-fix-${Date.now()}`;
    
    // Create branch
    const branchCreated = await createBranch(
      project.owner,
      project.repo,
      project.branch || "main",
      fixBranch
    );

    if (!branchCreated) return;

    // Save all modified files to the new branch
    for (const file of modifiedFiles) {
      await updateFile(
        project.owner,
        project.repo,
        file.path,
        file.content,
        `fix: Update ${file.path} via ResurrectCI`,
        file.sha,
        fixBranch
      );
    }

    // Create PR
    const pr = await createPR(
      project.owner,
      project.repo,
      `🔧 ResurrectCI: Fix build errors`,
      `## Changes\n\nThis PR was created by ResurrectCI AI Agent to fix build errors.\n\n### Modified files:\n${modifiedFiles.map((f) => `- \`${f.path}\``).join("\n")}`,
      project.branch || "main",
      fixBranch
    );

    if (pr) {
      toast.success("Pull request created!", {
        description: `PR #${pr.number} ready for review`,
        action: {
          label: "View PR",
          onClick: () => window.open(pr.html_url, "_blank"),
        },
      });
    }
  }, [project, openFiles, createBranch, updateFile, createPR]);

  const handleErrorsDetected = useCallback((errors: string[]) => {
    setErrorLogs(errors);
  }, []);

  const currentFile = openFiles.find((f) => f.path === activeFile);
  const hasModifiedFiles = openFiles.some((f) => f.isModified);

  return (
    <div
      className={`fixed inset-0 z-50 bg-background flex flex-col ${
        isFullscreen ? "" : "top-16"
      }`}
    >
      {/* IDE Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-primary" />
            <span className="font-semibold">{project.name}</span>
            {project.branch && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                <GitBranch className="w-3 h-3" />
                {project.branch}
              </span>
            )}
          </div>
          {project.status === "crashed" && (
            <span className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" />
              Build Failed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasModifiedFiles && (
            <Button
              variant="default"
              size="sm"
              onClick={handleCreatePR}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <GitPullRequest className="w-4 h-4 mr-2" />
              )}
              Create PR
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main IDE Area */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* File Explorer */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
          <div className="h-full p-2 overflow-hidden">
            <ProjectFileTree
              projectName={project.name}
              owner={project.owner}
              repo={project.repo}
              branch={project.branch}
              errorFiles={errorLogs.map((e) => {
                const match = e.match(/\.\/?(src\/[^\s:]+)/);
                return match ? match[1] : "";
              }).filter(Boolean)}
              onFileClick={handleFileClick}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Editor + Bottom Panel */}
        <ResizablePanel defaultSize={55} minSize={40}>
          <ResizablePanelGroup direction="vertical">
            {/* Editor Area */}
            <ResizablePanel defaultSize={65} minSize={30}>
              <div className="h-full flex flex-col">
                {/* Tabs for open files */}
                {openFiles.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-secondary/30 overflow-x-auto">
                    {openFiles.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => setActiveFile(file.path)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-t transition-colors ${
                          activeFile === file.path
                            ? "bg-background text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        }`}
                      >
                        <FileCode className="w-3 h-3" />
                        <span className="max-w-[120px] truncate">
                          {file.path.split("/").pop()}
                        </span>
                        {file.isModified && (
                          <span className="w-1.5 h-1.5 rounded-full bg-chart-4" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseFile(file.path);
                          }}
                          className="ml-1 hover:bg-secondary rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </button>
                    ))}
                  </div>
                )}

                {/* Editor */}
                <div className="flex-1 min-h-0 p-2">
                  <CodeEditor
                    filePath={activeFile}
                    content={currentFile?.content || ""}
                    originalContent={currentFile?.originalContent}
                    isLoading={isLoading}
                    isModified={currentFile?.isModified}
                    onSave={(content) => activeFile && handleSaveFile(activeFile)}
                    onClose={() => activeFile && handleCloseFile(activeFile)}
                    onContentChange={(content) =>
                      activeFile && handleContentChange(activeFile, content)
                    }
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Bottom Panel (Logs / Cline) */}
            <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-2 px-2 py-1 border-b border-border">
                  <Button
                    variant={bottomPanel === "logs" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setBottomPanel("logs")}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Build Logs
                  </Button>
                  <Button
                    variant={bottomPanel === "terminal" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setBottomPanel("terminal")}
                  >
                    <Terminal className="w-4 h-4 mr-1" />
                    Terminal
                  </Button>
                  <Button
                    variant={bottomPanel === "preview" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setBottomPanel("preview")}
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                </div>
                <div className="flex-1 min-h-0 p-2">
                  {bottomPanel === "logs" ? (
                    <BuildLogViewer
                      projectName={project.name}
                      status={project.status}
                      deploymentId={project.latestDeploymentId}
                      onErrorsDetected={handleErrorsDetected}
                    />
                  ) : bottomPanel === "terminal" ? (
                    <TerminalPanel
                      projectPath={`${project.owner}/${project.repo}`}
                      onCommandRun={(command) => {
                        console.log("Command executed:", command);
                        if (command.includes("npm run dev")) {
                          toast.success("Development server started!");
                        }
                      }}
                    />
                  ) : (
                    <WebsitePreview
                      projectName={project.name}
                      vercelUrl={`https://${project.name}.vercel.app`}
                      localUrl="http://localhost:8080"
                    />
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Cline when not in bottom */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="h-full p-2">
            <ClinePanel
              currentFile={activeFile || undefined}
              fileContent={currentFile?.content}
              errorLogs={errorLogs}
              projectName={project.name}
              onApplyFix={handleApplyFix}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
