import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileCode, GitCompare, Save, X, Loader2, Zap, Bot } from "lucide-react";
import Editor from "@monaco-editor/react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import * as monaco from "monaco-editor";
import { extensionRuntime } from "@/services/extensionRuntime";
import { extensionService } from "@/services/extensionService";
import { Extension } from "@/types/extensions";

interface CodeEditorProps {
  filePath: string | null;
  content: string;
  originalContent?: string;
  isLoading?: boolean;
  isModified?: boolean;
  onSave: (content: string) => void;
  onClose: () => void;
  onContentChange: (content: string) => void;
}

export function CodeEditor({
  filePath,
  content,
  originalContent,
  isLoading,
  isModified,
  onSave,
  onClose,
  onContentChange,
}: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "diff">("edit");
  const [enabledExtensions, setEnabledExtensions] = useState<Extension[]>([]);
  const [activeFeatures, setActiveFeatures] = useState<string[]>([]);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const modelRef = useRef<monaco.editor.ITextModel | null>(null);

  // Load enabled extensions and activate them
  useEffect(() => {
    const loadExtensions = async () => {
      try {
        const enabled = await extensionService.getEnabledExtensions();
        setEnabledExtensions(enabled);
      } catch (error) {
        console.error('Failed to load enabled extensions:', error);
      }
    };
    
    loadExtensions();
  }, []);

  // Activate extensions when editor is ready
  useEffect(() => {
    if (!editorRef.current || !modelRef.current || !filePath) return;

    const language = filePath.split(".").pop() || "plaintext";
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
    };

    const mappedLanguage = languageMap[language] || "plaintext";
    const context = {
      editor: editorRef.current,
      model: modelRef.current,
      language: mappedLanguage,
      filePath
    };

    const features: string[] = [];

    // Activate enabled extensions
    enabledExtensions.forEach(extension => {
      try {
        extensionRuntime.activateExtension(extension, context);
        const extensionFeatures = extensionRuntime.getActiveFeatures(extension.id);
        features.push(...extensionFeatures.map(f => f.name));
      } catch (error) {
        console.error(`Failed to activate extension ${extension.displayName}:`, error);
      }
    });

    setActiveFeatures(features);

    // Cleanup function
    return () => {
      enabledExtensions.forEach(extension => {
        extensionRuntime.deactivateExtension(extension.id, context);
      });
    };
  }, [enabledExtensions, filePath, editorRef.current, modelRef.current]);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
    editorRef.current = editor;
    modelRef.current = editor.getModel();

    // Configure editor for better extension support
    editor.updateOptions({
      suggest: {
        showInlineDetails: true,
        showStatusBar: true,
      },
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: "on",
      tabCompletion: "on",
      wordBasedSuggestions: "matchingDocuments",
      // Enable inline suggestions (ghost text)
      inlineSuggest: {
        enabled: true
      }
    });

    // Add keyboard shortcuts for extension features
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      // Trigger inline suggestions manually
      editor.trigger('keyboard', 'editor.action.inlineSuggest.trigger', {});
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      // Format document
      editor.trigger('keyboard', 'editor.action.formatDocument', {});
    });
  };

  const diffStyles = {
    variables: {
      dark: {
        diffViewerBackground: "#1e1e1e",
        diffViewerColor: "#d4d4d4",
        addedBackground: "#044B53",
        addedColor: "#d4d4d4",
        removedBackground: "#632F34",
        removedColor: "#d4d4d4",
        wordAddedBackground: "#055d67",
        wordRemovedBackground: "#7d383f",
        addedGutterBackground: "#034148",
        removedGutterBackground: "#4b1818",
        gutterBackground: "#2d2d2d",
        gutterBackgroundDark: "#262626",
        highlightBackground: "#2a2a2a",
        highlightGutterBackground: "#2d2d2d",
      },
    },
  };

  // Early return after all hooks
  if (!filePath) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No file selected</p>
          <p className="text-sm mt-2">Select a file from the explorer to start editing</p>
        </CardContent>
      </Card>
    );
  }

  const language = filePath.split(".").pop() || "plaintext";
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
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            {filePath}
            {isModified && <span className="w-2 h-2 rounded-full bg-chart-4" />}
          </CardTitle>
          
          {/* Active Extensions Indicator */}
          {activeFeatures.length > 0 && (
            <div className="flex items-center gap-1">
              {enabledExtensions.some(e => e.id === 'github.copilot') && (
                <Badge variant="secondary" className="text-xs bg-blue-900 text-blue-300">
                  <Bot className="w-3 h-3 mr-1" />
                  Copilot
                </Badge>
              )}
              {enabledExtensions.some(e => e.id === 'esbenp.prettier-vscode') && (
                <Badge variant="secondary" className="text-xs bg-purple-900 text-purple-300">
                  <Zap className="w-3 h-3 mr-1" />
                  Prettier
                </Badge>
              )}
              {enabledExtensions.some(e => e.id === 'ms-python.python') && filePath?.endsWith('.py') && (
                <Badge variant="secondary" className="text-xs bg-green-900 text-green-300">
                  🐍 Python
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {originalContent && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "diff")}>
              <TabsList className="h-8">
                <TabsTrigger value="edit" className="text-xs">
                  <FileCode className="w-3 h-3 mr-1" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="diff" className="text-xs">
                  <GitCompare className="w-3 h-3 mr-1" />
                  Diff
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Button
            size="sm"
            onClick={() => onSave(content)}
            disabled={!isModified || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {activeTab === "edit" ? (
          <Editor
            height="100%"
            language={languageMap[language] || language}
            value={content}
            onChange={(value) => onContentChange(value || "")}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: "on",
              suggest: {
                showInlineDetails: true,
                showStatusBar: true,
              },
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true
              },
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: "on",
              tabCompletion: "on",
              wordBasedSuggestions: "matchingDocuments",
              inlineSuggest: {
                enabled: true
              }
            }}
          />
        ) : (
          <div className="h-full overflow-auto">
            <ReactDiffViewer
              oldValue={originalContent || ""}
              newValue={content}
              splitView={true}
              compareMethod={DiffMethod.WORDS}
              useDarkTheme={true}
              styles={diffStyles}
              leftTitle="Original"
              rightTitle="Modified"
              showDiffOnly={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
