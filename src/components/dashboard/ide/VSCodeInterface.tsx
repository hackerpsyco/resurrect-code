import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderTree,
  FileCode,
  Search,
  GitBranch,
  Bug,
  Settings,
  Terminal,
  Bot,
  X,
  Plus,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  RotateCcw,
  RefreshCw
} from "lucide-react";
import { EnhancedCodeEditor } from "./EnhancedCodeEditor";
import { ClineLikePanel } from "./ClineLikePanel";
import { TerminalPanel } from "./TerminalPanel";
import { IDEMenuBar } from "./IDEMenuBar";
import { toast } from "sonner";
import { useGitHub } from "@/hooks/useGitHub";
import { getDemoFile } from "@/demo/test-files";
import { createGitOperations } from "@/services/gitOperations";

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

interface VSCodeInterfaceProps {
  project: {
    id: string;
    name: string;
    owner?: string;
    repo?: string;
    branch?: string;
    status: "crashed" | "resurrected" | "fixing" | "pending" | "deployed" | "building" | "failed" | "offline";
    errorPreview?: string;
    latestDeploymentId?: string;
  };
  onClose: () => void;
}

// Demo files fallback for when GitHub is not available
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
    ]},
    { name: "styles", type: "folder", children: [
      { name: "main.css", type: "file", path: "styles.css" }
    ]}
  ]},
  { name: "public", type: "folder", children: [
    { name: "index.html", type: "file", path: "demo.js" }
  ]},
  { name: "demo.py", type: "file", path: "demo.py" },
  { name: "demo.ts", type: "file", path: "demo.ts" },
  { name: "demo.js", type: "file", path: "demo.js" },
  { name: "package.json", type: "file", path: "demo.json" },
  { name: "styles.css", type: "file", path: "styles.css" },
  { name: "README.md", type: "file", path: "demo.js" }
];

export function VSCodeInterface({ project, onClose }: VSCodeInterfaceProps) {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<"explorer" | "search" | "git" | "debug" | "extensions">("explorer");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [panelView, setPanelView] = useState<"terminal" | "output" | "debug" | "ai">("terminal");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src"]));
  const [repoFileTree, setRepoFileTree] = useState<FileTreeNode[]>([]);
  const [isLoadingFileTree, setIsLoadingFileTree] = useState(false);

  const { fetchFile, updateFile, isLoading, createBranch, createPR, fetchFileTree } = useGitHub();
  
  // Initialize Git operations
  const gitOps = project.owner && project.repo 
    ? createGitOperations(project.owner, project.repo, project.branch || "main")
    : null;

  // Function to load file tree from GitHub
  const loadFileTree = useCallback(async (showToast = true) => {
    if (!project.owner || !project.repo || project.owner === "demo") {
      return;
    }

    setIsLoadingFileTree(true);
    try {
      if (showToast) {
        toast.info(`Loading files from ${project.owner}/${project.repo}...`);
      }
      
      const files = await fetchFileTree(project.owner, project.repo, project.branch);
      if (files && files.length > 0) {
        // Filter out unwanted files/folders
        const filteredFiles = files.filter(file => 
          !file.path.includes('node_modules') && 
          !file.path.includes('.git/') &&
          !file.path.startsWith('.') ||
          file.path === '.env' ||
          file.path === '.gitignore' ||
          file.path === '.github'
        );

        // Convert flat file list to hierarchical tree structure
        const tree = buildFileTree(filteredFiles);
        setRepoFileTree(tree);
        
        if (showToast) {
          toast.success(`Loaded ${filteredFiles.length} files from ${project.owner}/${project.repo}`);
        }
        
        // Auto-expand common folders
        setExpandedFolders(new Set(['src', 'components', 'pages', 'app', 'lib', 'utils']));
      } else {
        if (showToast) {
          toast.warning("No files found in repository");
        }
      }
    } catch (error) {
      console.error("Failed to load file tree:", error);
      if (showToast) {
        toast.error(`Failed to load repository files: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsLoadingFileTree(false);
    }
  }, [project.owner, project.repo, project.branch, fetchFileTree]);

  // Fetch real GitHub file tree on component mount
  useEffect(() => {
    loadFileTree(true);
  }, [loadFileTree]);

  // Build hierarchical file tree from flat file list
  const buildFileTree = (files: any[]): FileTreeNode[] => {
    const tree: FileTreeNode[] = [];
    const folderMap = new Map<string, FileTreeNode>();

    // First, create all folders
    const folders = new Set<string>();
    files.forEach(file => {
      const pathParts = file.path.split('/');
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderPath = pathParts.slice(0, i + 1).join('/');
        folders.add(folderPath);
      }
    });

    // Create folder nodes
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

    // Add files to their respective folders
    files.forEach(file => {
      // Handle both "blob" and undefined type (from direct API)
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
          // Root level file
          tree.push(fileNode);
        } else {
          // File in a folder
          const parentPath = pathParts.slice(0, -1).join('/');
          const parent = folderMap.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(fileNode);
          }
        }
      }
    });

    // Sort each level: folders first, then files, both alphabetically
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+` - Toggle Terminal
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setShowPanel(true);
        setPanelView('terminal');
      }
      
      // Ctrl+Shift+` - New Terminal
      if (e.ctrlKey && e.shiftKey && e.key === '`') {
        e.preventDefault();
        setShowPanel(true);
        setPanelView('terminal');
        toast.info("New terminal session");
      }
      
      // Ctrl+J - Toggle Panel
      if (e.ctrlKey && e.key === 'j') {
        e.preventDefault();
        setShowPanel(!showPanel);
      }
      
      // Ctrl+L - Open AI Chat
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        setShowPanel(true);
        setPanelView('ai');
      }
      
      // Ctrl+S - Save current file
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (activeFile) {
          handleSaveFile(activeFile);
        } else {
          toast.info("No active file to save");
        }
      }
      
      // Ctrl+Shift+S - Save all files
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        const modifiedFiles = openFiles.filter(f => f.isModified);
        if (modifiedFiles.length === 0) {
          toast.info("No files to save");
          return;
        }
        modifiedFiles.forEach(file => handleSaveFile(file.path));
        toast.success(`Saving ${modifiedFiles.length} files...`);
      }
      
      // F5 - Run
      if (e.key === 'F5') {
        e.preventDefault();
        setShowPanel(true);
        setPanelView('terminal');
        toast.success("Running project...");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPanel]);

  const handleFileClick = useCallback(async (path: string, isFolder = false) => {
    // Don't open folders, just toggle them
    if (isFolder) {
      toggleFolder(path);
      return;
    }

    const existing = openFiles.find((f) => f.path === path);
    if (existing) {
      setActiveFile(path);
      return;
    }

    // For real GitHub repositories, fetch the actual file
    if (project.owner && project.repo && project.owner !== "demo") {
      try {
        toast.info(`Loading ${path} from GitHub...`);
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
          toast.success(`Opened ${path} from GitHub`);
          return;
        }
      } catch (error) {
        console.error("Failed to fetch file from GitHub:", error);
        toast.error(`Failed to load ${path} from GitHub`);
        return;
      }
    }

    // For demo mode, check if it's a demo file first
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
      toast.success(`Opened ${path} (demo)`);
      return;
    }

    // Fallback: create a new empty file with template content
    const extension = path.split('.').pop()?.toLowerCase();
    let fallbackContent = "";
    
    switch (extension) {
      case 'js':
        fallbackContent = getDemoFile('demo.js');
        break;
      case 'ts':
      case 'tsx':
        fallbackContent = getDemoFile('demo.ts');
        break;
      case 'py':
        fallbackContent = getDemoFile('demo.py');
        break;
      case 'css':
        fallbackContent = getDemoFile('styles.css');
        break;
      case 'json':
        fallbackContent = getDemoFile('demo.json');
        break;
      default:
        fallbackContent = `// ${path}\n// This is a new file created in the IDE\n\n`;
    }

    const newFile: OpenFile = {
      path: path,
      content: fallbackContent,
      originalContent: fallbackContent,
      sha: 'new',
      isModified: false,
    };
    setOpenFiles((prev) => [...prev, newFile]);
    setActiveFile(path);
    toast.success(`Created ${path} with template content`);
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
    if (!file) {
      toast.error("File not found");
      return;
    }

    // For demo mode, just mark as saved locally
    if (!project.owner || !project.repo || project.owner === "demo") {
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.path === path
            ? { ...f, originalContent: file.content, isModified: false }
            : f
        )
      );
      toast.success(`Saved ${path} locally (demo mode)`);
      return;
    }

    try {
      toast.info(`Saving ${path} to GitHub...`);
      
      const success = await updateFile(
        project.owner,
        project.repo,
        path,
        file.content,
        `Update ${path} via ResurrectCI IDE`,
        file.sha !== 'new' ? file.sha : undefined,
        project.branch
      );

      if (success) {
        // Refresh the file to get the new SHA
        const updatedFile = await fetchFile(project.owner, project.repo, path, project.branch);
        
        setOpenFiles((prev) =>
          prev.map((f) =>
            f.path === path
              ? { 
                  ...f, 
                  originalContent: file.content, 
                  isModified: false,
                  sha: updatedFile?.sha || f.sha
                }
              : f
          )
        );
        toast.success(`Saved ${path} to GitHub`);
      }
    } catch (error) {
      console.error("Failed to save file:", error);
      toast.error(`Failed to save ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [openFiles, project, updateFile, fetchFile]);

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
      toast.success(`Applied AI fix to ${path}`);
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
      toast.success(`Created ${path} with AI fix`);
    }
  }, [openFiles]);

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

  // Get file icon color based on file extension
  const getFileIconColor = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': case 'jsx': return 'text-yellow-400';
      case 'ts': case 'tsx': return 'text-blue-400';
      case 'py': return 'text-green-400';
      case 'css': case 'scss': case 'sass': return 'text-pink-400';
      case 'html': return 'text-orange-400';
      case 'json': return 'text-yellow-300';
      case 'md': return 'text-gray-300';
      case 'env': return 'text-purple-400';
      case 'yml': case 'yaml': return 'text-red-400';
      default: return 'text-[#519aba]';
    }
  };

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
              className="flex items-center gap-1 px-2 py-1 text-sm text-[#cccccc] hover:bg-[#2a2d2e] cursor-pointer"
              onClick={() => handleFileClick(fullPath, true)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Folder className={`w-4 h-4 ${isExpanded ? 'text-[#dcb67a]' : 'text-[#dcb67a]'}`} />
              <span>{itemName}</span>
              {item.children && (
                <span className="text-xs text-[#969696] ml-auto">
                  {item.children.length}
                </span>
              )}
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
            className={`flex items-center gap-1 px-2 py-1 text-sm cursor-pointer ml-5 ${
              isActive 
                ? 'bg-[#37373d] text-white' 
                : 'text-[#cccccc] hover:bg-[#2a2d2e]'
            }`}
            onClick={() => handleFileClick(filePath, false)}
          >
            <File className={`w-4 h-4 ${getFileIconColor(itemName)}`} />
            <span className="flex-1">{itemName}</span>
            {isModified && (
              <div className="w-2 h-2 rounded-full bg-white" title="Modified"></div>
            )}
          </div>
        );
      }
    });
  };

  const currentFile = openFiles.find((f) => f.path === activeFile);
  const hasModifiedFiles = openFiles.some((f) => f.isModified);

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
            onClick={onClose}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* IDE Menu Bar */}
      <IDEMenuBar
        projectName={project.name}
        activeFile={activeFile || undefined}
        onNewFile={() => {
          const fileName = prompt("Enter file name (e.g., newfile.js):");
          if (fileName) {
            const newFile: OpenFile = {
              path: fileName,
              content: "",
              originalContent: "",
              sha: "",
              isModified: true,
            };
            setOpenFiles((prev) => [...prev, newFile]);
            setActiveFile(fileName);
            toast.success(`Created ${fileName}`);
          }
        }}
        onOpenFile={() => {
          const fileName = prompt("Enter file path to open:");
          if (fileName) {
            handleFileClick(fileName);
          }
        }}
        onSaveFile={() => {
          if (activeFile) {
            handleSaveFile(activeFile);
          } else {
            toast.info("No active file to save");
          }
        }}
        onSaveAll={() => {
          const modifiedFiles = openFiles.filter(f => f.isModified);
          if (modifiedFiles.length === 0) {
            toast.info("No files to save");
            return;
          }
          modifiedFiles.forEach(file => handleSaveFile(file.path));
          toast.success(`Saved ${modifiedFiles.length} files`);
        }}
        onCloseFile={() => {
          if (activeFile) {
            handleCloseFile(activeFile);
          } else {
            toast.info("No active file to close");
          }
        }}
        onUndo={() => {
          // Monaco editor handles undo internally
          toast.info("Undo - Use Ctrl+Z in editor");
        }}
        onRedo={() => {
          // Monaco editor handles redo internally
          toast.info("Redo - Use Ctrl+Y in editor");
        }}
        onCopy={() => {
          // Monaco editor handles copy internally
          toast.info("Copy - Use Ctrl+C in editor");
        }}
        onPaste={() => {
          // Monaco editor handles paste internally
          toast.info("Paste - Use Ctrl+V in editor");
        }}
        onCut={() => {
          // Monaco editor handles cut internally
          toast.info("Cut - Use Ctrl+X in editor");
        }}
        onFind={() => {
          // Monaco editor handles find internally
          toast.info("Find - Use Ctrl+F in editor");
        }}
        onReplace={() => {
          // Monaco editor handles replace internally
          toast.info("Replace - Use Ctrl+H in editor");
        }}
        onTogglePanel={() => {
          setShowPanel(!showPanel);
        }}
        onToggleSidebar={() => {
          setShowSidebar(!showSidebar);
        }}
        onRunCode={() => {
          setShowPanel(true);
          setPanelView('terminal');
          toast.success("Running project...");
        }}
        onDebugCode={() => {
          setShowPanel(true);
          setPanelView('debug');
          toast.info("Debug mode activated");
        }}
        onGitCommit={async () => {
          if (!gitOps || !project.owner || project.owner === "demo") {
            toast.info("Git operations - Demo mode (changes saved locally)");
            // In demo mode, just mark files as saved
            const modifiedFiles = openFiles.filter(f => f.isModified);
            if (modifiedFiles.length === 0) {
              toast.info("No changes to commit");
              return;
            }
            setOpenFiles(prev => prev.map(f => 
              modifiedFiles.some(mf => mf.path === f.path) 
                ? { ...f, isModified: false, originalContent: f.content }
                : f
            ));
            toast.success(`Committed ${modifiedFiles.length} files locally`);
            return;
          }
          
          const modifiedFiles = openFiles.filter(f => f.isModified);
          if (modifiedFiles.length === 0) {
            toast.info("No changes to commit");
            return;
          }

          const message = prompt("Enter commit message:");
          if (!message) return;

          const files = modifiedFiles.map(f => ({
            path: f.path,
            content: f.content,
            sha: f.sha
          }));

          const result = await gitOps.commitChanges(message, files);
          if (result.success) {
            // Mark files as saved
            setOpenFiles(prev => prev.map(f => 
              modifiedFiles.some(mf => mf.path === f.path) 
                ? { ...f, isModified: false, originalContent: f.content }
                : f
            ));
          }
        }}
        onGitPush={async () => {
          if (!gitOps || !project.owner || project.owner === "demo") {
            toast.info("Git push - Demo mode (no remote repository)");
            return;
          }
          await gitOps.pushChanges();
        }}
        onGitPull={async () => {
          if (!gitOps || !project.owner || project.owner === "demo") {
            toast.info("Git pull - Demo mode (using local files)");
            return;
          }
          await gitOps.pullChanges();
        }}
        onOpenTerminal={() => {
          setShowPanel(true);
          setPanelView('terminal');
        }}
        onOpenSettings={() => {
          toast.info("Settings panel - Feature coming soon!");
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <div className="w-12 bg-[#333333] border-r border-[#464647] flex flex-col">
          <div className="flex flex-col">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarView("explorer")}
              className={`h-12 w-12 p-0 rounded-none border-l-2 ${
                sidebarView === "explorer" 
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
              onClick={() => setSidebarView("search")}
              className={`h-12 w-12 p-0 rounded-none border-l-2 ${
                sidebarView === "search" 
                  ? "bg-[#37373d] border-l-[#0078d4] text-white" 
                  : "border-l-transparent text-[#cccccc] hover:text-white"
              }`}
              title="Search"
            >
              <Search className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarView("git")}
              className={`h-12 w-12 p-0 rounded-none border-l-2 ${
                sidebarView === "git" 
                  ? "bg-[#37373d] border-l-[#0078d4] text-white" 
                  : "border-l-transparent text-[#cccccc] hover:text-white"
              }`}
              title="Source Control"
            >
              <GitBranch className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarView("debug")}
              className={`h-12 w-12 p-0 rounded-none border-l-2 ${
                sidebarView === "debug" 
                  ? "bg-[#37373d] border-l-[#0078d4] text-white" 
                  : "border-l-transparent text-[#cccccc] hover:text-white"
              }`}
              title="Run and Debug"
            >
              <Bug className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarView("extensions")}
              className={`h-12 w-12 p-0 rounded-none border-l-2 ${
                sidebarView === "extensions" 
                  ? "bg-[#37373d] border-l-[#0078d4] text-white" 
                  : "border-l-transparent text-[#cccccc] hover:text-white"
              }`}
              title="Extensions"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-64 bg-[#252526] border-r border-[#464647] flex flex-col">
            {/* Sidebar Header */}
            <div className="h-9 px-3 flex items-center justify-between border-b border-[#464647]">
              <span className="text-sm text-[#cccccc] font-medium uppercase tracking-wide">
                {sidebarView === "explorer" && "Explorer"}
                {sidebarView === "search" && "Search"}
                {sidebarView === "git" && "Source Control"}
                {sidebarView === "debug" && "Run and Debug"}
                {sidebarView === "extensions" && "Extensions"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-auto">
              {sidebarView === "explorer" && (
                <div>
                  {/* Open Editors */}
                  {openFiles.length > 0 && (
                    <div className="border-b border-[#464647]">
                      <div className="px-3 py-2 text-xs text-[#cccccc] font-medium uppercase tracking-wide">
                        Open Editors
                      </div>
                      {openFiles.map((file) => (
                        <div
                          key={file.path}
                          className={`flex items-center gap-2 px-3 py-1 text-sm cursor-pointer hover:bg-[#2a2d2e] ${
                            activeFile === file.path ? "bg-[#37373d]" : ""
                          }`}
                          onClick={() => setActiveFile(file.path)}
                        >
                          <File className="w-4 h-4 text-[#519aba]" />
                          <span className="flex-1 text-[#cccccc]">{file.path.split('/').pop()}</span>
                          {file.isModified && <div className="w-2 h-2 rounded-full bg-white"></div>}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseFile(file.path);
                            }}
                            className="h-4 w-4 p-0 text-[#cccccc] hover:bg-[#464647] opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* File Tree */}
                  <div>
                    <div className="px-3 py-2 text-xs text-[#cccccc] font-medium uppercase tracking-wide flex items-center justify-between">
                      <span>{project.name}</span>
                      <div className="flex items-center gap-1">
                        {project.owner && project.repo && project.owner !== "demo" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadFileTree(true)}
                            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
                            title="Refresh File Tree"
                            disabled={isLoadingFileTree}
                          >
                            <RefreshCw className={`w-3 h-3 ${isLoadingFileTree ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const fileName = prompt("Enter file name (e.g., newfile.js):");
                            if (fileName) {
                              const newFile: OpenFile = {
                                path: fileName,
                                content: "",
                                originalContent: "",
                                sha: "",
                                isModified: true,
                              };
                              setOpenFiles((prev) => [...prev, newFile]);
                              setActiveFile(fileName);
                              toast.success(`Created ${fileName}`);
                            }
                          }}
                          className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
                          title="New File"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {isLoadingFileTree ? (
                      <div className="px-3 py-4 text-sm text-[#969696] flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading repository files...
                      </div>
                    ) : repoFileTree.length > 0 ? (
                      <div>
                        <div className="max-h-96 overflow-y-auto">
                          {renderFileTree(repoFileTree, "", true)}
                        </div>
                        <div className="px-3 py-2 text-xs text-[#969696] border-t border-[#464647] mt-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <span>Connected: {project.owner}/{project.repo}</span>
                          </div>
                          <div className="mt-1 text-[#666]">
                            Branch: {project.branch || 'main'} • {repoFileTree.length} items
                          </div>
                        </div>
                      </div>
                    ) : project.owner && project.repo && project.owner !== "demo" ? (
                      <div className="px-3 py-4 text-sm text-[#969696] text-center">
                        <div className="mb-2">⚠️ Repository files not loaded</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadFileTree(true)}
                          className="text-xs"
                          disabled={isLoadingFileTree}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry Loading
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="max-h-96 overflow-y-auto">
                          {renderFileTree(demoFiles)}
                        </div>
                        <div className="px-3 py-2 text-xs text-[#969696] border-t border-[#464647] mt-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                            <span>Demo Mode</span>
                          </div>
                          <div className="mt-1 text-[#666]">
                            Connect a GitHub repository for real files
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sidebarView === "search" && (
                <div className="p-3">
                  <Input
                    placeholder="Search"
                    className="mb-3 bg-[#3c3c3c] border-[#464647] text-[#cccccc]"
                  />
                  <Input
                    placeholder="Files to include"
                    className="mb-3 bg-[#3c3c3c] border-[#464647] text-[#cccccc]"
                  />
                  <div className="text-sm text-[#969696]">No results found</div>
                </div>
              )}

              {sidebarView === "git" && (
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <GitBranch className="w-4 h-4 text-[#cccccc]" />
                    <span className="text-sm text-[#cccccc]">{project.branch || "main"}</span>
                  </div>
                  <div className="text-sm text-[#969696]">No changes</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="h-9 bg-[#2d2d30] border-b border-[#464647] flex items-center overflow-x-auto">
            {openFiles.map((file) => (
              <div
                key={file.path}
                className={`flex items-center gap-2 px-3 h-full border-r border-[#464647] cursor-pointer hover:bg-[#37373d] ${
                  activeFile === file.path ? "bg-[#1e1e1e] text-white" : "text-[#cccccc]"
                }`}
                onClick={() => setActiveFile(file.path)}
              >
                <File className="w-4 h-4 text-[#519aba]" />
                <span className="text-sm">{file.path.split('/').pop()}</span>
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

          {/* Editor Area */}
          <div className="flex-1 relative">
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
                  <p className="text-lg mb-2">Welcome to VS Code IDE</p>
                  <p className="text-sm text-[#969696] mb-4">Select a file from the explorer to start editing</p>
                  <div className="text-xs text-[#969696] max-w-md mx-auto">
                    <p className="mb-2">🚀 <strong>Quick Start:</strong></p>
                    {repoFileTree.length > 0 ? (
                      <>
                        <p className="mb-1">• Click on repository files in the explorer (left panel)</p>
                        <p className="mb-1">• Files are loaded directly from GitHub</p>
                        <p className="mb-1">• Use Ctrl+S to save changes back to repository</p>
                      </>
                    ) : (
                      <>
                        <p className="mb-1">• Click on demo files in the explorer (left panel)</p>
                        <p className="mb-1">• Demo files show IDE functionality</p>
                      </>
                    )}
                    <p className="mb-1">• Use Ctrl+N to create a new file</p>
                    <p className="mb-1">• Press Ctrl+` to open terminal</p>
                    <p className="mb-1">• Press Ctrl+L to open AI assistant</p>
                    
                    {project.owner === "demo" ? (
                      <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded">
                        <p className="text-yellow-400 text-sm">
                          📝 Demo Mode: Using sample files for demonstration
                        </p>
                        <p className="text-yellow-300 text-xs mt-1">
                          Connect a real GitHub repository for full functionality
                        </p>
                      </div>
                    ) : repoFileTree.length > 0 ? (
                      <div className="mt-3 p-3 bg-green-900/20 border border-green-600/30 rounded">
                        <p className="text-green-400 text-sm">
                          🔗 Connected to {project.owner}/{project.repo}
                        </p>
                        <p className="text-green-300 text-xs mt-1">
                          Real GitHub files loaded • Branch: {project.branch || 'main'}
                        </p>
                      </div>
                    ) : isLoadingFileTree ? (
                      <div className="mt-3 p-3 bg-blue-900/20 border border-blue-600/30 rounded">
                        <p className="text-blue-400 text-sm flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Loading repository files from {project.owner}/{project.repo}...
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-orange-900/20 border border-orange-600/30 rounded">
                        <p className="text-orange-400 text-sm">
                          ⚠️ Failed to load repository files
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadFileTree(true)}
                          className="mt-2 text-xs"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry Loading
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel */}
      {showPanel && (
        <div className="h-64 bg-[#252526] border-t border-[#464647] flex flex-col">
          {/* Panel Tabs */}
          <div className="h-9 bg-[#2d2d30] border-b border-[#464647] flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPanelView("terminal")}
              className={`h-full px-3 rounded-none text-sm ${
                panelView === "terminal" 
                  ? "bg-[#252526] text-white border-t-2 border-t-[#0078d4]" 
                  : "text-[#cccccc] hover:text-white"
              }`}
            >
              <Terminal className="w-4 h-4 mr-2" />
              Terminal
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPanelView("output")}
              className={`h-full px-3 rounded-none text-sm ${
                panelView === "output" 
                  ? "bg-[#252526] text-white border-t-2 border-t-[#0078d4]" 
                  : "text-[#cccccc] hover:text-white"
              }`}
            >
              Output
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPanelView("debug")}
              className={`h-full px-3 rounded-none text-sm ${
                panelView === "debug" 
                  ? "bg-[#252526] text-white border-t-2 border-t-[#0078d4]" 
                  : "text-[#cccccc] hover:text-white"
              }`}
            >
              Debug Console
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPanelView("ai")}
              className={`h-full px-3 rounded-none text-sm ${
                panelView === "ai" 
                  ? "bg-[#252526] text-white border-t-2 border-t-[#0078d4]" 
                  : "text-[#cccccc] hover:text-white"
              }`}
            >
              <Bot className="w-4 h-4 mr-2" />
              Cline AI
            </Button>
            <div className="flex-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPanel(false)}
              className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647] mr-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-auto">
            {panelView === "terminal" && (
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
            {panelView === "output" && (
              <div className="p-4 font-mono text-sm text-[#cccccc]">
                <div>Build completed successfully</div>
                <div>No errors found</div>
                <div>Ready for deployment</div>
              </div>
            )}
            {panelView === "debug" && (
              <div className="p-4 font-mono text-sm text-[#cccccc]">
                <div>Debug console ready</div>
                <div>No active debugging session</div>
              </div>
            )}
            {panelView === "ai" && (
              <ClineLikePanel
                currentFile={activeFile || undefined}
                fileContent={openFiles.find(f => f.path === activeFile)?.content}
                errorLogs={project.errorPreview ? [project.errorPreview] : []}
                projectName={project.name}
                onApplyFix={handleApplyFix}
              />
            )}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="h-6 bg-[#0078d4] flex items-center justify-between px-4 text-xs text-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            <span>{project.branch || "main"}</span>
          </div>
          <div className="flex items-center gap-1">
            <RotateCcw className="w-3 h-3" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <X className="w-3 h-3" />
            <span>0</span>
          </div>
          {currentFile && (
            <>
              <span>Ln 34, Col 34</span>
              <span>UTF-8</span>
              <span>TypeScript React</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {hasModifiedFiles && (
            <span>● {openFiles.filter(f => f.isModified).length} unsaved</span>
          )}
          <span>Prettier</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPanel(!showPanel)}
            className="h-4 px-2 text-white hover:bg-[#106ebe] text-xs"
          >
            <Terminal className="w-3 h-3 mr-1" />
            Toggle Panel
          </Button>
        </div>
      </div>
    </div>
  );
}