import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FolderTree,
  FileCode,
  Globe,
  Terminal,
  Bot,
  X,
  Maximize2,
  Minimize2,
  GitBranch,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { ProjectFileTree } from "../ProjectFileTree";
import { DemoFileTree } from "./DemoFileTree";
import { CodeEditor } from "./CodeEditor";
import { TerminalPanel } from "./TerminalPanel";
import { WebsitePreview } from "./WebsitePreview";
import { ClineLikePanel } from "./ClineLikePanel";
import { ExtensionsStatus } from "./ExtensionsStatus";
import { ExtensionsManager } from "./ExtensionsManager";

import { useGitHub } from "@/hooks/useGitHub";
import { getDemoFile } from "@/demo/test-files";
import { toast } from "sonner";

interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  sha: string;
  isModified: boolean;
}

interface VSCodeLayoutProps {
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

export function VSCodeLayout({ project, onClose }: VSCodeLayoutProps) {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"code" | "preview" | "terminal" | "cline" | "extensions">("code");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExtensionsManager, setShowExtensionsManager] = useState(false);

  const { fetchFile, updateFile, isLoading } = useGitHub();

  const handleFileClick = useCallback(async (path: string) => {
    const existing = openFiles.find((f) => f.path === path);
    if (existing) {
      setActiveFile(path);
      setCurrentView("code");
      return;
    }

    // Check if it's a demo file
    const demoContent = getDemoFile(path);
    if (demoContent) {
      const newFile: OpenFile = {
        path: path,
        content: demoContent,
        originalContent: demoContent,
        sha: 'demo',
        isModified: false,
      };
      setOpenFiles((prev) => [...prev, newFile]);
      setActiveFile(path);
      setCurrentView("code");
      toast.success(`Opened demo file: ${path}`);
      return;
    }

    if (!project.owner || !project.repo) {
      toast.error("Repository not connected - try demo files instead");
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
      setCurrentView("code");
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

    const success = await updateFile(
      project.owner,
      project.repo,
      path,
      file.content,
      `Update ${path} via ResurrectCI`,
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
      setCurrentView("code");
      toast.success(`Applied fix to ${path}`);
    } else {
      // Create new file
      const newFile: OpenFile = {
        path,
        content,
        originalContent: "",
        sha: "",
        isModified: true,
      };
      setOpenFiles((prev) => [...prev, newFile]);
      setActiveFile(path);
      setCurrentView("code");
      toast.success(`Created ${path} with AI fix`);
    }
  }, [openFiles]);

  const currentFile = openFiles.find((f) => f.path === activeFile);
  const hasModifiedFiles = openFiles.some((f) => f.isModified);

  return (
    <div className={`fixed inset-0 z-50 bg-background flex ${isFullscreen ? "" : "top-16"}`}>
      {/* VS Code Header */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSidebar(!showSidebar)}
            className="text-gray-300 hover:text-white"
          >
            <FolderTree className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 text-gray-300">
            <FileCode className="w-4 h-4" />
            <span className="font-semibold">{project.name}</span>
            {project.branch && (
              <span className="flex items-center gap-1 text-xs bg-blue-600 px-2 py-0.5 rounded">
                <GitBranch className="w-3 h-3" />
                {project.branch}
              </span>
            )}
          </div>
          {project.status === "crashed" && (
            <span className="flex items-center gap-1 text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" />
              Build Failed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasModifiedFiles && (
            <span className="text-xs text-yellow-400">● Unsaved changes</span>
          )}
          <ExtensionsStatus onOpenManager={() => setShowExtensionsManager(true)} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-gray-300 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex w-full pt-12">
        {/* Left Sidebar - File Explorer */}
        {showSidebar && (
          <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Explorer
              </h3>
            </div>
            <div className="flex-1 overflow-auto">
              {project.owner && project.repo ? (
                <ProjectFileTree
                  projectName={project.name}
                  owner={project.owner}
                  repo={project.repo}
                  branch={project.branch}
                  errorFiles={[]}
                  onFileClick={handleFileClick}
                />
              ) : (
                <DemoFileTree onFileClick={handleFileClick} />
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Tabs */}
          <div className="bg-gray-800 border-b border-gray-700">
            <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as any)}>
              <TabsList className="bg-transparent border-none h-10 w-full justify-start rounded-none">
                <TabsTrigger
                  value="code"
                  className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white"
                >
                  <FileCode className="w-4 h-4 mr-2" />
                  Code Editor
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger
                  value="terminal"
                  className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white"
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  Terminal
                </TabsTrigger>
                <TabsTrigger
                  value="cline"
                  className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Cline AI
                </TabsTrigger>

              </TabsList>
            </Tabs>
          </div>

          {/* Open File Tabs (only show in code view) */}
          {currentView === "code" && openFiles.length > 0 && (
            <div className="bg-gray-800 border-b border-gray-700 flex items-center overflow-x-auto">
              {openFiles.map((file) => (
                <div
                  key={file.path}
                  className={`flex items-center gap-2 px-4 py-2 text-sm border-r border-gray-700 hover:bg-gray-700 cursor-pointer ${
                    activeFile === file.path
                      ? "bg-gray-700 text-white"
                      : "text-gray-300"
                  }`}
                  onClick={() => setActiveFile(file.path)}
                >
                  <FileCode className="w-3 h-3" />
                  <span className="max-w-[120px] truncate">
                    {file.path.split("/").pop()}
                  </span>
                  {file.isModified && (
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseFile(file.path);
                    }}
                    className="ml-1 hover:bg-gray-600 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {currentView === "code" && (
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
            )}

            {currentView === "preview" && (
              <WebsitePreview
                projectName={project.name}
                vercelUrl={`https://${project.name}.vercel.app`}
                localUrl="http://localhost:8080"
              />
            )}

            {currentView === "terminal" && (
              <TerminalPanel
                projectPath={`${project.owner}/${project.repo}`}
                onCommandRun={(command) => {
                  console.log("Command executed:", command);
                  if (command.includes("npm run dev")) {
                    toast.success("Development server started!");
                  }
                }}
              />
            )}

            {currentView === "cline" && (
              <ClineLikePanel
                currentFile={activeFile || undefined}
                fileContent={currentFile?.content}
                errorLogs={project.errorPreview ? [project.errorPreview] : []}
                projectName={project.name}
                onApplyFix={handleApplyFix}
              />
            )}


          </div>
        </div>
      </div>

      {/* Extensions Manager Overlay */}
      {showExtensionsManager && (
        <ExtensionsManager onClose={() => setShowExtensionsManager(false)} />
      )}
    </div>
  );
}