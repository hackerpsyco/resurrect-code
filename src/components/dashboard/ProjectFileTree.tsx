import { useState } from "react";
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
} from "lucide-react";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  hasError?: boolean;
}

const sampleFileTree: FileNode[] = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "components",
        type: "folder",
        children: [
          { name: "Button.tsx", type: "file", hasError: true },
          { name: "Card.tsx", type: "file" },
          { name: "Header.tsx", type: "file" },
        ],
      },
      {
        name: "pages",
        type: "folder",
        children: [
          { name: "index.tsx", type: "file" },
          { name: "dashboard.tsx", type: "file" },
        ],
      },
      { name: "App.tsx", type: "file" },
      { name: "main.tsx", type: "file" },
    ],
  },
  {
    name: "public",
    type: "folder",
    children: [
      { name: "favicon.ico", type: "file" },
      { name: "robots.txt", type: "file" },
    ],
  },
  { name: "package.json", type: "file" },
  { name: "tsconfig.json", type: "file" },
  { name: "vite.config.ts", type: "file" },
];

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  onFileClick?: (fileName: string) => void;
}

function FileTreeItem({ node, depth, onFileClick }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);

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
            onFileClick?.(node.name);
          }
        }}
        className={`w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-secondary/50 transition-colors text-left ${
          node.hasError ? "text-destructive" : "text-foreground"
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
              : node.hasError
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        />
        <span className="text-sm truncate">{node.name}</span>
        {node.hasError && (
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProjectFileTreeProps {
  projectName: string;
  onFileClick?: (fileName: string) => void;
}

export function ProjectFileTree({ projectName, onFileClick }: ProjectFileTreeProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
  };

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
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {sampleFileTree.map((node, i) => (
          <FileTreeItem key={i} node={node} depth={0} onFileClick={onFileClick} />
        ))}
      </div>
    </Card>
  );
}
