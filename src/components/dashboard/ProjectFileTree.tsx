import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
  FileJson,
  FileText,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useGitHub } from "@/hooks/useGitHub";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  hasError?: boolean;
}

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  onFileClick?: (path: string) => void;
  errorFiles?: string[];
}

function buildTree(files: { path: string; type: string }[]): FileNode[] {
  const root: FileNode[] = [];
  const map = new Map<string, FileNode>();

  // Sort files so folders come first
  const sorted = [...files].sort((a, b) => {
    const aDepth = a.path.split("/").length;
    const bDepth = b.path.split("/").length;
    return aDepth - bDepth;
  });

  for (const file of sorted) {
    const parts = file.path.split("/");
    const fileName = parts[parts.length - 1];
    const isFile = file.type === "blob";

    const node: FileNode = {
      name: fileName,
      path: file.path,
      type: isFile ? "file" : "folder",
      children: isFile ? undefined : [],
    };

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join("/");
      const parent = map.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(node);
      }
    }

    map.set(file.path, node);
  }

  return root;
}

function FileTreeItem({ node, depth, onFileClick, errorFiles = [] }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const hasError = errorFiles.includes(node.path);

  const getFileIcon = (name: string) => {
    if (name.endsWith(".json")) return FileJson;
    if (name.endsWith(".md") || name.endsWith(".txt")) return FileText;
    return FileCode;
  };

  const Icon =
    node.type === "folder"
      ? isOpen
        ? FolderOpen
        : Folder
      : getFileIcon(node.name);

  return (
    <div>
      <button
        onClick={() => {
          if (node.type === "folder") {
            setIsOpen(!isOpen);
          } else {
            onFileClick?.(node.path);
          }
        }}
        className={`w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-secondary/50 transition-colors text-left ${
          hasError ? "text-destructive" : "text-foreground"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.type === "folder" && (
          <span className="text-muted-foreground">
            {isOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </span>
        )}
        <Icon
          className={`w-4 h-4 ${
            node.type === "folder"
              ? "text-chart-4"
              : hasError
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        />
        <span className="text-sm truncate">{node.name}</span>
        {hasError && (
          <span className="ml-auto text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">
            Error
          </span>
        )}
      </button>
      {node.type === "folder" && isOpen && node.children && (
        <div>
          {node.children.map((child, i) => (
            <FileTreeItem
              key={i}
              node={child}
              depth={depth + 1}
              onFileClick={onFileClick}
              errorFiles={errorFiles}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProjectFileTreeProps {
  projectName: string;
  owner?: string;
  repo?: string;
  branch?: string;
  errorFiles?: string[];
  onFileClick?: (path: string) => void;
}

export function ProjectFileTree({
  projectName,
  owner,
  repo,
  branch = "main",
  errorFiles = [],
  onFileClick,
}: ProjectFileTreeProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const { fetchFileTree, isLoading } = useGitHub();

  const loadFiles = async () => {
    if (!owner || !repo) return;
    
    const files = await fetchFileTree(owner, repo, branch);
    if (files.length > 0) {
      const tree = buildTree(files);
      setFileTree(tree);
    }
  };

  useEffect(() => {
    if (owner && repo) {
      loadFiles();
    }
  }, [owner, repo, branch]);

  return (
    <Card className="bg-card border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{projectName}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadFiles}
          disabled={isLoading || !owner || !repo}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : fileTree.length > 0 ? (
          fileTree.map((node, i) => (
            <FileTreeItem
              key={i}
              node={node}
              depth={0}
              onFileClick={onFileClick}
              errorFiles={errorFiles}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {owner && repo ? "No files found" : "Connect a repository to view files"}
          </div>
        )}
      </div>
    </Card>
  );
}
