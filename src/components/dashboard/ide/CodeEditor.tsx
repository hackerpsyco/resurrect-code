import { useState, useRef, useEffect } from "react";
import Editor, { Monaco, OnMount } from "@monaco-editor/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Save, 
  GitBranch, 
  Loader2, 
  X, 
  FileCode,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";

interface CodeEditorProps {
  filePath: string | null;
  content: string;
  originalContent?: string;
  language?: string;
  isLoading?: boolean;
  isModified?: boolean;
  onSave?: (content: string) => void;
  onClose?: () => void;
  onContentChange?: (content: string) => void;
}

const getLanguageFromPath = (path: string): string => {
  const ext = path.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "scss",
    html: "html",
    yml: "yaml",
    yaml: "yaml",
    py: "python",
    go: "go",
    rs: "rust",
    toml: "toml",
  };
  return languageMap[ext || ""] || "plaintext";
};

export function CodeEditor({
  filePath,
  content,
  originalContent,
  language,
  isLoading,
  isModified,
  onSave,
  onClose,
  onContentChange,
}: CodeEditorProps) {
  const [editorContent, setEditorContent] = useState(content);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setEditorContent(content);
  }, [content]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure dark theme
    monaco.editor.defineTheme("resurrect-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955" },
        { token: "keyword", foreground: "C586C0" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "type", foreground: "4EC9B0" },
      ],
      colors: {
        "editor.background": "#0a0a0a",
        "editor.foreground": "#D4D4D4",
        "editor.lineHighlightBackground": "#1a1a2e",
        "editorCursor.foreground": "#a855f7",
        "editor.selectionBackground": "#a855f733",
        "editor.inactiveSelectionBackground": "#a855f722",
        "editorLineNumber.foreground": "#4a4a6a",
        "editorLineNumber.activeForeground": "#a855f7",
      },
    });
    monaco.editor.setTheme("resurrect-dark");

    // Add keyboard shortcut for save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  const handleContentChange = (value: string | undefined) => {
    const newContent = value || "";
    setEditorContent(newContent);
    onContentChange?.(newContent);
  };

  const handleSave = () => {
    if (onSave && editorContent) {
      onSave(editorContent);
    }
  };

  const handleRevert = () => {
    if (originalContent) {
      setEditorContent(originalContent);
      onContentChange?.(originalContent);
      toast.info("Reverted changes");
    }
  };

  if (!filePath) {
    return (
      <Card className="h-full bg-card border-border flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Select a file to edit</p>
          <p className="text-xs mt-2 opacity-70">
            Click on any file in the tree to open it
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-card border-border flex flex-col overflow-hidden">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/80">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium truncate">{filePath}</span>
          {isModified && (
            <span className="w-2 h-2 rounded-full bg-chart-4 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {isModified && originalContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRevert}
              title="Revert changes"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!isModified || isLoading}
            title="Save (Ctrl+S)"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            title="Close file"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Editor
            height="100%"
            language={language || getLanguageFromPath(filePath)}
            value={editorContent}
            onChange={handleContentChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              minimap: { enabled: true, scale: 1 },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
              tabSize: 2,
              cursorBlinking: "smooth",
              smoothScrolling: true,
              renderLineHighlight: "all",
              bracketPairColorization: { enabled: true },
              padding: { top: 12 },
            }}
          />
        )}
      </div>
    </Card>
  );
}
