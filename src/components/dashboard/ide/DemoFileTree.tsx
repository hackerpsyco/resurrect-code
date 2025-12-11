import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileCode, 
  Folder, 
  FolderOpen, 
  FileText,
  Braces,
  Palette,
  Database
} from "lucide-react";

interface DemoFileTreeProps {
  onFileClick: (path: string) => void;
}

const demoFiles = [
  {
    name: 'demo.py',
    icon: '🐍',
    description: 'Python file - Test Python extension features'
  },
  {
    name: 'demo.ts',
    icon: '📘',
    description: 'TypeScript file - Test Copilot and TypeScript features'
  },
  {
    name: 'demo.js',
    icon: '📄',
    description: 'JavaScript file - Test JavaScript features'
  },
  {
    name: 'demo.json',
    icon: '⚙️',
    description: 'JSON file - Test JSON language features'
  },
  {
    name: 'styles.css',
    icon: '🎨',
    description: 'CSS file - Test CSS features and formatting'
  }
];

export function DemoFileTree({ onFileClick }: DemoFileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['demo']));

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return <span className="text-lg">🐍</span>;
      case 'ts': case 'tsx': return <span className="text-lg">📘</span>;
      case 'js': case 'jsx': return <span className="text-lg">📄</span>;
      case 'json': return <span className="text-lg">⚙️</span>;
      case 'css': case 'scss': return <span className="text-lg">🎨</span>;
      case 'html': return <span className="text-lg">🌐</span>;
      case 'md': return <span className="text-lg">📝</span>;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        {/* Demo Files Folder */}
        <div className="mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start p-1 h-auto text-gray-300 hover:text-white hover:bg-gray-800"
            onClick={() => toggleFolder('demo')}
          >
            {expandedFolders.has('demo') ? (
              <FolderOpen className="w-4 h-4 mr-2 text-blue-400" />
            ) : (
              <Folder className="w-4 h-4 mr-2 text-blue-400" />
            )}
            <span className="text-sm">Demo Files</span>
          </Button>
        </div>

        {/* Demo Files List */}
        {expandedFolders.has('demo') && (
          <div className="ml-4 space-y-1">
            {demoFiles.map((file) => (
              <Button
                key={file.name}
                variant="ghost"
                size="sm"
                className="w-full justify-start p-1 h-auto text-gray-300 hover:text-white hover:bg-gray-800 group"
                onClick={() => onFileClick(file.name)}
              >
                <div className="flex items-center gap-2 w-full">
                  {getFileIcon(file.name)}
                  <div className="flex-1 text-left">
                    <div className="text-sm">{file.name}</div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-400">
                      {file.description}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            🚀 Test Extensions
          </h4>
          <div className="text-xs text-gray-400 space-y-1">
            <p>1. Install extensions from the terminal</p>
            <p>2. Open demo files to test features</p>
            <p>3. Try typing to see AI suggestions</p>
            <p>4. Use Ctrl+I for inline suggestions</p>
            <p>5. Use Alt+Shift+F to format code</p>
          </div>
        </div>

        {/* Extension Status */}
        <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
          <h4 className="text-sm font-medium text-blue-300 mb-2">
            💡 Extension Features
          </h4>
          <div className="text-xs text-blue-200 space-y-1">
            <p><strong>Copilot:</strong> AI code suggestions</p>
            <p><strong>Python:</strong> Enhanced Python support</p>
            <p><strong>Prettier:</strong> Code formatting</p>
            <p><strong>TypeScript:</strong> Type checking & IntelliSense</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}