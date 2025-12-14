import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  FolderTree,
  FileCode,
  Bot,
  X,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  RefreshCw,
  Terminal,
  Globe,
  Settings,
  Search,
  GitBranch,
  Maximize2,
  Minimize2,
  Square,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move
} from "lucide-react";
import { EnhancedCodeEditor } from "./EnhancedCodeEditor";
import { RealWebContainerTerminal } from "./RealWebContainerTerminal";
import { PreviewWithURLChange } from "./PreviewWithURLChange";
import { WorkingAIChatPanel } from "./WorkingAIChatPanel";
// Toast removed for clean UI
import { useGitHub } from "@/hooks/useGitHub";
import { useGitHubAuth } from "@/hooks/useGitHubAuth";
import { getDemoFile } from "@/demo/test-files";
import { projectCache } from "@/services/projectCache";

interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  sha: string;
  isModified: boolean;
}

interface FileTreeNode {
  path: string;
  type: "blob" | "tree";
  sha: string;
  name: string;
  children?: FileTreeNode[];
}

interface ProfessionalVSCodeInterfaceProps {
  project: {
    id: string;
    name: string;
    owner?: string;
    repo?: string;
    branch?: string;
    status: string;
    errorPreview?: string;
    latestDeploymentId?: string;
  };
  onClose: () => void;
}

// Demo files for when no GitHub repo is loaded
const demoFiles = [
  { name: "src", type: "folder", children: [
    { name: "App.tsx", type: "file", path: "demo.ts" },
    { name: "components", type: "folder", children: [
      { name: "Header.tsx", type: "file", path: "demo.ts" },
      { name: "Button.tsx", type: "file", path: "demo.ts" }
    ]},
    { name: "hooks", type: "folder", children: [
      { name: "useAuth.ts", type: "file", path: "demo.ts" }
    ]},
    { name: "utils", type: "folder", children: [
      { name: "helpers.ts", type: "file", path: "demo.ts" }
    ]}
  ]},
  { name: "public", type: "folder", children: [
    { name: "index.html", type: "file", path: "demo.js" }
  ]},
  { name: "package.json", type: "file", path: "demo.json" },
  { name: "README.md", type: "file", path: "demo.js" }
];

export function ProfessionalVSCodeInterface({ project, onClose }: ProfessionalVSCodeInterfaceProps) {
  // Core state
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [repoFileTree, setRepoFileTree] = useState<FileTreeNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src"]));
  
  // UI state
  const [showExplorer, setShowExplorer] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("http://localhost:3000");
  
  // Panel size and control states
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [terminalHeight, setTerminalHeight] = useState(320);
  const [previewWidth, setPreviewWidth] = useState(50); // percentage
  const [terminalMaximized, setTerminalMaximized] = useState(false);
  const [previewMaximized, setPreviewMaximized] = useState(false);
  const [sidebarMaximized, setSidebarMaximized] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [terminalFontSize, setTerminalFontSize] = useState(14);

  // GitHub integration
  const { fetchFile, updateFile, isLoading, fetchFileTree } = useGitHub();
  const { isAuthenticated, updateFile: authUpdateFile, getFileContent } = useGitHubAuth();

  // Load files instantly from cache or fetch if needed
  useEffect(() => {
    const loadProjectFiles = async () => {
      if (!project.owner || !project.repo || project.owner === "demo") {
        console.log('🎭 Using demo files');
        return;
      }

      // Try to get from cache first
      const cached = projectCache.get(project.owner, project.repo, project.branch || 'main');
      
      if (cached) {
        // Instant load from cache
        console.log('⚡ Loading files from cache');
        setRepoFileTree(cached.fileTree);
        setExpandedFolders(new Set(['src', 'components', 'pages', 'app']));
        return;
      }

      // If not cached, load in background without UI indicators
      try {
        console.log('🔄 Loading files in background');
        const files = await fetchFileTree(project.owner, project.repo, project.branch);
        
        if (files && files.length > 0) {
          const filteredFiles = files.filter(file => 
            !file.path.includes('node_modules') && 
            !file.path.includes('.git/') &&
            (!file.path.startsWith('.') || 
             file.path === '.env' ||
             file.path === '.gitignore')
          );

          const tree = buildFileTree(filteredFiles);
          
          // Cache for next time
          projectCache.set(project.owner, project.repo, project.branch || 'main', filteredFiles, tree);
          
          // Update UI
          setRepoFileTree(tree);
          setExpandedFolders(new Set(['src', 'components', 'pages', 'app']));
        }
      } catch (error) {
        console.error("Failed to load file tree:", error);
        // Silent failure - just use demo files
      }
    };

    loadProjectFiles();
  }, [project.owner, project.repo, project.branch, fetchFileTree]);

  // Build hierarchical file tree
  const buildFileTree = (files: any[]): FileTreeNode[] => {
    const tree: FileTreeNode[] = [];
    const folderMap = new Map<string, FileTreeNode>();

    // Create folders
    const folders = new Set<string>();
    files.forEach(file => {
      const pathParts = file.path.split('/');
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderPath = pathParts.slice(0, i + 1).join('/');
        folders.add(folderPath);
      }
    });

    // Build folder structure
    Array.from(folders).sort().forEach(folderPath => {
      const pathParts = folderPath.split('/');
      const folderName = pathParts[pathParts.length - 1];
      
      const folderNode: FileTreeNode = {
        path: folderPath,
        type: "tree",
        sha: "",
        name: folderName,
        children: []
      };

      folderMap.set(folderPath, folderNode);

      if (pathParts.length === 1) {
        tree.push(folderNode);
      } else {
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = folderMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(folderNode);
        }
      }
    });

    // Add files
    files.forEach(file => {
      if (file.type === "blob" || !file.type) {
        const pathParts = file.path.split('/');
        const fileName = pathParts[pathParts.length - 1];
        
        const fileNode: FileTreeNode = {
          path: file.path,
          type: "blob",
          sha: file.sha || "",
          name: fileName
        };

        if (pathParts.length === 1) {
          tree.push(fileNode);
        } else {
          const parentPath = pathParts.slice(0, -1).join('/');
          const parent = folderMap.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(fileNode);
          }
        }
      }
    });

    // Sort: folders first, then files
    const sortTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
      return nodes.sort((a, b) => {
        if (a.type === "tree" && b.type === "blob") return -1;
        if (a.type === "blob" && b.type === "tree") return 1;
        return a.name.localeCompare(b.name);
      }).map(node => ({
        ...node,
        children: node.children ? sortTree(node.children) : undefined
      }));
    };

    return sortTree(tree);
  };

  // File operations
  const handleFileClick = useCallback(async (path: string, isFolder = false) => {
    if (isFolder) {
      toggleFolder(path);
      return;
    }

    const existing = openFiles.find((f) => f.path === path);
    if (existing) {
      setActiveFile(path);
      return;
    }

    // Load file content
    if (project.owner && project.repo && project.owner !== "demo") {
      try {
        // Silent loading
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
          // Silent success
          return;
        }
      } catch (error) {
        console.error("Failed to fetch file:", error);
        // Silent error
        return;
      }
    }

    // Demo file fallback
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
      // Silent success
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
    if (!file) return;

    if (!project.owner || !project.repo || project.owner === "demo") {
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.path === path
            ? { ...f, originalContent: file.content, isModified: false }
            : f
        )
      );
      // Silent success
      return;
    }

    try {
      // Silent saving
      const success = await updateFile(
        project.owner,
        project.repo,
        path,
        file.content,
        `Update ${path}`,
        file.sha !== 'new' ? file.sha : undefined,
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
        // Silent success
      }
    } catch (error) {
      // Silent error
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

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  // Get file icon color
  const getFileIconColor = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': case 'jsx': return 'text-yellow-400';
      case 'ts': case 'tsx': return 'text-blue-400';
      case 'py': return 'text-green-400';
      case 'css': case 'scss': return 'text-pink-400';
      case 'html': return 'text-orange-400';
      case 'json': return 'text-yellow-300';
      case 'md': return 'text-gray-300';
      default: return 'text-blue-300';
    }
  };

  // Render file tree
  const renderFileTree = (files: any[], parentPath = "", isRealRepo = false) => {
    if (!files || files.length === 0) return null;

    return files.map((item) => {
      const fullPath = isRealRepo ? item.path : (parentPath ? `${parentPath}/${item.name}` : item.name);
      const itemName = item.name;
      const isFolder = item.type === "folder" || item.type === "tree";
      
      if (isFolder) {
        const isExpanded = expandedFolders.has(fullPath);
        return (
          <div key={fullPath}>
            <div
              className="flex items-center gap-2 px-3 py-1 text-sm text-[#cccccc] hover:bg-[#2a2d2e] cursor-pointer rounded-sm"
              onClick={() => handleFileClick(fullPath, true)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-[#cccccc]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#cccccc]" />
              )}
              <Folder className="w-4 h-4 text-[#dcb67a]" />
              <span className="select-none">{itemName}</span>
            </div>
            {isExpanded && item.children && item.children.length > 0 && (
              <div className="ml-4">
                {renderFileTree(item.children, fullPath, isRealRepo)}
              </div>
            )}
          </div>
        );
      } else {
        const filePath = isRealRepo ? item.path : (item.path || fullPath);
        const isActive = activeFile === filePath;
        const isModified = openFiles.some(f => f.path === filePath && f.isModified);
        
        return (
          <div
            key={filePath}
            className={`flex items-center gap-2 px-3 py-1 text-sm cursor-pointer rounded-sm ml-6 ${
              isActive 
                ? 'bg-[#37373d] text-white' 
                : 'text-[#cccccc] hover:bg-[#2a2d2e]'
            }`}
            onClick={() => handleFileClick(filePath, false)}
          >
            <File className={`w-4 h-4 ${getFileIconColor(itemName)}`} />
            <span className="flex-1 select-none">{itemName}</span>
            {isModified && (
              <div className="w-2 h-2 rounded-full bg-white" title="Modified"></div>
            )}
          </div>
        );
      }
    });
  };

  const currentFile = openFiles.find((f) => f.path === activeFile);

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1e1e] flex flex-col">
      {/* Top Menu Bar */}
      <div className="h-8 bg-[#323233] border-b border-[#464647] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#28ca42]"></div>
          </div>
          <span className="text-sm text-[#cccccc] font-medium">{project.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className={`h-6 px-2 text-xs ${showPreview ? 'bg-[#464647] text-white' : 'text-[#cccccc]'} hover:bg-[#464647]`}
          >
            <Globe className="w-3 h-3 mr-1" />
            Preview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <div className="w-12 bg-[#333333] border-r border-[#464647] flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (showExplorer) {
                setShowExplorer(false);
              } else {
                setShowExplorer(true);
                setShowAIChat(false);
              }
            }}
            className={`h-12 w-12 p-0 rounded-none border-l-2 ${
              showExplorer && !showAIChat
                ? "bg-[#37373d] border-l-[#0078d4] text-white" 
                : "border-l-transparent text-[#cccccc] hover:text-white"
            }`}
            title="Explorer"
          >
            <FolderTree className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (showAIChat) {
                setShowAIChat(false);
              } else {
                setShowAIChat(true);
                setShowExplorer(false);
              }
            }}
            className={`h-12 w-12 p-0 rounded-none border-l-2 ${
              showAIChat 
                ? "bg-[#37373d] border-l-[#0078d4] text-white" 
                : "border-l-transparent text-[#cccccc] hover:text-white"
            }`}
            title="AI Assistant"
          >
            <Bot className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTerminal(!showTerminal)}
            className={`h-12 w-12 p-0 rounded-none border-l-2 ${
              showTerminal 
                ? "bg-[#37373d] border-l-[#0078d4] text-white" 
                : "border-l-transparent text-[#cccccc] hover:text-white"
            }`}
            title="Terminal"
          >
            <Terminal className="w-6 h-6" />
          </Button>
        </div>

        {/* Left Sidebar */}
        {(showExplorer || showAIChat) && (
          <div 
            className={`bg-[#252526] border-r border-[#464647] flex flex-col relative ${
              sidebarMaximized ? 'w-full' : ''
            }`}
            style={{ 
              width: sidebarMaximized ? '100%' : `${sidebarWidth}px`,
              minWidth: '200px',
              maxWidth: sidebarMaximized ? '100%' : '600px'
            }}
          >
            {showExplorer && !showAIChat && (
              <div className="flex-1 flex flex-col">
                {/* Explorer Header */}
                <div className="h-9 px-4 flex items-center border-b border-[#464647]">
                  <span className="text-sm text-[#cccccc] font-medium uppercase tracking-wide">
                    Explorer
                  </span>
                </div>

                {/* File Tree */}
                <div className="flex-1 overflow-auto p-2" style={{ fontSize: `${fontSize}px` }}>
                  <div className="mb-2">
                    <div className="text-xs text-[#cccccc] font-medium uppercase tracking-wide mb-2 px-2">
                      {project.name}
                    </div>
                    
                    {repoFileTree.length > 0 ? (
                      <div className="space-y-1">
                        {renderFileTree(repoFileTree, "", true)}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {renderFileTree(demoFiles)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {showAIChat && (
              <div className="flex-1 flex flex-col">
                {/* AI Chat Content */}
                <div className="flex-1">
                  <WorkingAIChatPanel />
                </div>
              </div>
            )}
            
            {/* Sidebar Controls */}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#1e1e1e] rounded border border-[#464647] p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarMaximized(!sidebarMaximized)}
                className="h-5 w-5 p-0 text-[#cccccc] hover:bg-[#464647]"
                title={sidebarMaximized ? "Restore" : "Maximize"}
              >
                {sidebarMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFontSize(prev => Math.min(prev + 1, 20))}
                className="h-5 w-5 p-0 text-[#cccccc] hover:bg-[#464647]"
                title="Increase Font Size"
              >
                <ZoomIn className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFontSize(prev => Math.max(prev - 1, 10))}
                className="h-5 w-5 p-0 text-[#cccccc] hover:bg-[#464647]"
                title="Decrease Font Size"
              >
                <ZoomOut className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSidebarWidth(320);
                  setFontSize(14);
                }}
                className="h-5 w-5 p-0 text-[#cccccc] hover:bg-[#464647]"
                title="Reset Size"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>

            {/* Resize Handle */}
            {!sidebarMaximized && (
              <div
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-[#0078d4] transition-colors"
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startWidth = sidebarWidth;
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    const newWidth = startWidth + (e.clientX - startX);
                    setSidebarWidth(Math.max(200, Math.min(600, newWidth)));
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
            )}
          </div>
        )}

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="h-9 bg-[#2d2d30] border-b border-[#464647] flex items-center overflow-x-auto">
            {openFiles.map((file) => (
              <div
                key={file.path}
                className={`flex items-center gap-2 px-4 h-full border-r border-[#464647] cursor-pointer hover:bg-[#37373d] ${
                  activeFile === file.path ? "bg-[#1e1e1e] text-white" : "text-[#cccccc]"
                }`}
                onClick={() => setActiveFile(file.path)}
              >
                <File className="w-4 h-4 text-[#519aba]" />
                <span className="text-sm select-none">{file.path.split('/').pop()}</span>
                {file.isModified && <div className="w-2 h-2 rounded-full bg-white"></div>}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseFile(file.path);
                  }}
                  className="h-4 w-4 p-0 text-[#cccccc] hover:bg-[#464647] ml-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1">
            {activeFile && currentFile ? (
              <EnhancedCodeEditor
                filePath={activeFile}
                content={currentFile.content}
                originalContent={currentFile.originalContent}
                isLoading={isLoading}
                isModified={currentFile.isModified}
                onSave={(content) => handleSaveFile(activeFile)}
                onClose={() => handleCloseFile(activeFile)}
                onContentChange={(content) => handleContentChange(activeFile, content)}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                <div className="text-center text-[#cccccc]">
                  <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Welcome to VS Code</p>
                  <p className="text-sm text-[#969696] mb-4">Select a file from the explorer to start editing</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Terminal Panel */}
      {showTerminal && (
        <div 
          className={`border-t border-[#464647] relative ${
            terminalMaximized ? 'flex-1' : ''
          }`}
          style={{ 
            height: terminalMaximized ? '100%' : `${terminalHeight}px`,
            minHeight: '200px',
            maxHeight: terminalMaximized ? '100%' : '600px'
          }}
        >
          <RealWebContainerTerminal
            onClose={() => setShowTerminal(false)}
            onDevServerStart={(url) => {
              setPreviewUrl(url);
              setShowPreview(true);
              // Silent success
            }}
            onDevServerStop={() => {
              setShowPreview(false);
              // Silent info
            }}
            projectFiles={
              openFiles.reduce((acc, file) => {
                acc[file.path] = file.content;
                return acc;
              }, {} as Record<string, string>)
            }
            fontSize={terminalFontSize}
            project={project}
          />
          
          {/* Terminal Controls */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#1e1e1e] rounded border border-[#464647] p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTerminalMaximized(!terminalMaximized)}
              className="h-5 w-5 p-0 text-[#cccccc] hover:bg-[#464647]"
              title={terminalMaximized ? "Restore Terminal" : "Maximize Terminal"}
            >
              {terminalMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTerminalFontSize(prev => Math.min(prev + 1, 20))}
              className="h-5 w-5 p-0 text-[#cccccc] hover:bg-[#464647]"
              title="Increase Terminal Font Size"
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTerminalFontSize(prev => Math.max(prev - 1, 10))}
              className="h-5 w-5 p-0 text-[#cccccc] hover:bg-[#464647]"
              title="Decrease Terminal Font Size"
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTerminalHeight(320);
                setTerminalFontSize(14);
              }}
              className="h-5 w-5 p-0 text-[#cccccc] hover:bg-[#464647]"
              title="Reset Terminal Size"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>

          {/* Terminal Resize Handle */}
          {!terminalMaximized && (
            <div
              className="absolute top-0 left-0 right-0 h-1 cursor-row-resize bg-transparent hover:bg-[#0078d4] transition-colors"
              onMouseDown={(e) => {
                const startY = e.clientY;
                const startHeight = terminalHeight;
                
                const handleMouseMove = (e: MouseEvent) => {
                  const newHeight = startHeight - (e.clientY - startY);
                  setTerminalHeight(Math.max(200, Math.min(600, newHeight)));
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
          )}
        </div>
      )}

      {/* Preview Panel */}
      {showPreview && (
        <div 
          className={`fixed top-8 right-0 bottom-0 z-40 ${
            previewMaximized ? 'left-0' : ''
          }`}
          style={{ 
            width: previewMaximized ? '100%' : `${previewWidth}%`,
            minWidth: '300px'
          }}
        >
          <div className="relative h-full">
            <PreviewWithURLChange 
              initialUrl={previewUrl}
              onClose={() => setShowPreview(false)}
            />
            
            {/* Preview Controls */}
            <div className="absolute top-12 right-2 flex items-center gap-1 bg-[#1e1e1e] rounded border border-[#464647] p-1 z-50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMaximized(!previewMaximized)}
                className="h-5 w-5 p-0 text-[#cccccc] hover:bg-[#464647]"
                title={previewMaximized ? "Restore Preview" : "Maximize Preview"}
              >
                {previewMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewWidth(prev => Math.min(prev + 10, 90))}
                className="h-5 w-5 p-0 text-[#cccccc] hover:bg-[#464647]"
                title="Increase Preview Width"
              >
                <ZoomIn className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewWidth(prev => Math.max(prev - 10, 30))}
                className="h-5 w-5 p-0 text-[#cccccc] hover:bg-[#464647]"
                title="Decrease Preview Width"
              >
                <ZoomOut className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewWidth(50)}
                className="h-5 w-5 p-0 text-[#cccccc] hover:bg-[#464647]"
                title="Reset Preview Width"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>

            {/* Preview Resize Handle */}
            {!previewMaximized && (
              <div
                className="absolute top-0 left-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-[#0078d4] transition-colors z-50"
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startWidth = previewWidth;
                  const windowWidth = window.innerWidth;
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    const deltaX = startX - e.clientX;
                    const deltaPercent = (deltaX / windowWidth) * 100;
                    const newWidth = startWidth + deltaPercent;
                    setPreviewWidth(Math.max(30, Math.min(90, newWidth)));
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}