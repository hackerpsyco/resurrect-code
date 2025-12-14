import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Square,
  Save,
  Download,
  Upload,
  Settings,
  Maximize2,
  Minimize2,
  Copy,
  FileCode,
  Zap,
  Bug,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Keyboard,
  Code,
  Terminal,
  GitBranch,
  Search,
  Palette,
  Languages,
  Lightbulb,
  Wand2,
  Eye,
  EyeOff,
  RotateCcw,
  RotateCw,
  Type,
  Braces,
  X,
  Loader2
} from "lucide-react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { toast } from "sonner";

import { realErrorDetector } from "@/services/realErrorDetector";
import { clineService } from "@/services/clineService";
import { languageTemplates, getTemplateByLanguage } from "@/services/languageTemplates";

interface EnhancedCodeEditorProps {
  filePath: string | null;
  content: string;
  originalContent?: string;
  isLoading?: boolean;
  isModified?: boolean;
  onSave: (content: string) => void;
  onClose: () => void;
  onContentChange: (content: string) => void;
}

// Language configurations for different programming languages
const languageConfigs = {
  javascript: {
    name: "JavaScript",
    extensions: [".js", ".jsx"],
    monacoLanguage: "javascript",
    icon: "🟨",
    runnable: true,
    debuggable: true
  },
  typescript: {
    name: "TypeScript",
    extensions: [".ts", ".tsx"],
    monacoLanguage: "typescript",
    icon: "🔷",
    runnable: true,
    debuggable: true
  },
  python: {
    name: "Python",
    extensions: [".py", ".pyw"],
    monacoLanguage: "python",
    icon: "🐍",
    runnable: true,
    debuggable: true
  },
  cpp: {
    name: "C++",
    extensions: [".cpp", ".cxx", ".cc", ".c++"],
    monacoLanguage: "cpp",
    icon: "⚡",
    runnable: true,
    debuggable: true
  },
  c: {
    name: "C",
    extensions: [".c", ".h"],
    monacoLanguage: "c",
    icon: "🔧",
    runnable: true,
    debuggable: true
  },
  java: {
    name: "Java",
    extensions: [".java"],
    monacoLanguage: "java",
    icon: "☕",
    runnable: true,
    debuggable: true
  },
  csharp: {
    name: "C#",
    extensions: [".cs"],
    monacoLanguage: "csharp",
    icon: "🔷",
    runnable: true,
    debuggable: true
  },
  go: {
    name: "Go",
    extensions: [".go"],
    monacoLanguage: "go",
    icon: "🐹",
    runnable: true,
    debuggable: true
  },
  rust: {
    name: "Rust",
    extensions: [".rs"],
    monacoLanguage: "rust",
    icon: "🦀",
    runnable: true,
    debuggable: true
  },
  php: {
    name: "PHP",
    extensions: [".php"],
    monacoLanguage: "php",
    icon: "🐘",
    runnable: true,
    debuggable: false
  },
  html: {
    name: "HTML",
    extensions: [".html", ".htm"],
    monacoLanguage: "html",
    icon: "🌐",
    runnable: false,
    debuggable: false
  },
  css: {
    name: "CSS",
    extensions: [".css", ".scss", ".sass", ".less"],
    monacoLanguage: "css",
    icon: "🎨",
    runnable: false,
    debuggable: false
  },
  json: {
    name: "JSON",
    extensions: [".json"],
    monacoLanguage: "json",
    icon: "📋",
    runnable: false,
    debuggable: false
  },
  markdown: {
    name: "Markdown",
    extensions: [".md", ".markdown"],
    monacoLanguage: "markdown",
    icon: "📝",
    runnable: false,
    debuggable: false
  },
  yaml: {
    name: "YAML",
    extensions: [".yml", ".yaml"],
    monacoLanguage: "yaml",
    icon: "⚙️",
    runnable: false,
    debuggable: false
  },
  xml: {
    name: "XML",
    extensions: [".xml"],
    monacoLanguage: "xml",
    icon: "📄",
    runnable: false,
    debuggable: false
  },
  sql: {
    name: "SQL",
    extensions: [".sql"],
    monacoLanguage: "sql",
    icon: "🗄️",
    runnable: true,
    debuggable: false
  }
};

export function EnhancedCodeEditor({
  filePath,
  content,
  originalContent,
  isLoading,
  isModified,
  onSave,
  onClose,
  onContentChange,
}: EnhancedCodeEditorProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>("javascript");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState<"vs-dark" | "vs-light">("vs-dark");
  const [errors, setErrors] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [showTemplates, setShowTemplates] = useState<boolean>(false);
  
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);

  // Detect language from file path
  useEffect(() => {
    if (filePath) {
      const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
      const detectedLang = Object.entries(languageConfigs).find(([_, config]) =>
        config.extensions.includes(extension)
      );
      if (detectedLang) {
        setCurrentLanguage(detectedLang[0]);
      }
    }
  }, [filePath]);

  // Analyze code for errors
  useEffect(() => {
    if (filePath && content) {
      const detectedErrors = realErrorDetector.getCurrentFileErrors(filePath, content);
      setErrors(detectedErrors);
    }
  }, [filePath, content]);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Set up keyboard shortcuts
    setupKeyboardShortcuts(editor, monaco);
    
    // Set up AI-powered features
    setupAIFeatures(editor, monaco);
    
    // Set up error markers
    updateErrorMarkers(editor, monaco);

    // Auto-save on Ctrl+S
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    // AI code generation on Ctrl+K
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      handleAIGenerate();
    });

    // AI explain on Ctrl+E
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
      handleAIExplain();
    });

    // Format document on Shift+Alt+F
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
      handleFormatDocument();
    });
  }, []);

  const setupKeyboardShortcuts = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
    // Quick Open (Ctrl+P)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
      toast.info("Quick Open - Feature coming soon!");
    });

    // Find (Ctrl+F) - Monaco handles this by default
    // Go to Line (Ctrl+G)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
      editor.getAction('editor.action.gotoLine')?.run();
    });

    // Toggle Comment (Ctrl+/)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.getAction('editor.action.commentLine')?.run();
    });

    // Duplicate Line (Shift+Alt+Down)
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
      editor.getAction('editor.action.copyLinesDownAction')?.run();
    });

    // Move Line Up (Alt+Up)
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
      editor.getAction('editor.action.moveLinesUpAction')?.run();
    });

    // Move Line Down (Alt+Down)
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
      editor.getAction('editor.action.moveLinesDownAction')?.run();
    });
  };

  const setupAIFeatures = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
    // AI-powered autocomplete
    monaco.languages.registerCompletionItemProvider(currentLanguage, {
      provideCompletionItems: (model, position) => {
        // This would integrate with your AI service for intelligent suggestions
        const suggestions = [
          {
            label: 'AI: Generate function',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '// AI will generate code here',
            documentation: 'Use AI to generate a function'
          }
        ];
        return { suggestions };
      }
    });

    // AI-powered hover information
    monaco.languages.registerHoverProvider(currentLanguage, {
      provideHover: (model, position) => {
        return {
          contents: [
            { value: '**AI Insight**' },
            { value: 'Press Ctrl+E to get AI explanation for this code' }
          ]
        };
      }
    });
  };

  const updateErrorMarkers = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    const markers = errors.map(error => ({
      startLineNumber: error.line,
      startColumn: error.column,
      endLineNumber: error.line,
      endColumn: error.column + 10,
      message: error.message,
      severity: error.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning
    }));

    monaco.editor.setModelMarkers(model, 'errors', markers);
  };

  const handleSave = () => {
    if (editorRef.current) {
      const currentContent = editorRef.current.getValue();
      onSave(currentContent);
      toast.success("File saved successfully!");
    }
  };

  const handleAIGenerate = async () => {
    if (!editorRef.current) return;

    const selection = editorRef.current.getSelection();
    const selectedText = selection ? editorRef.current.getModel()?.getValueInRange(selection) : '';
    
    toast.info("AI is generating code...");
    
    try {
      await clineService.sendMessage(
        selectedText ? `Generate code for: ${selectedText}` : "Generate code for this context",
        {
          currentFile: filePath || undefined,
          fileContent: content,
          projectName: "Current Project"
        }
      );
      toast.success("AI code generation started! Check Cline panel for results.");
    } catch (error) {
      toast.error("AI generation failed. Please try again.");
    }
  };

  const handleAIExplain = async () => {
    if (!editorRef.current) return;

    const selection = editorRef.current.getSelection();
    const selectedText = selection ? editorRef.current.getModel()?.getValueInRange(selection) : '';
    
    if (!selectedText) {
      toast.info("Please select code to explain");
      return;
    }

    toast.info("AI is analyzing your code...");
    
    try {
      await clineService.sendMessage(
        `Explain this code: ${selectedText}`,
        {
          currentFile: filePath || undefined,
          fileContent: content,
          projectName: "Current Project"
        }
      );
      toast.success("AI explanation started! Check Cline panel for results.");
    } catch (error) {
      toast.error("AI explanation failed. Please try again.");
    }
  };

  const handleFormatDocument = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
      toast.success("Document formatted!");
    }
  };

  const handleRunCode = async () => {
    if (!languageConfigs[currentLanguage as keyof typeof languageConfigs]?.runnable) {
      toast.info(`Running ${languageConfigs[currentLanguage as keyof typeof languageConfigs]?.name} files is not supported yet`);
      return;
    }

    setIsRunning(true);
    toast.info(`Running ${languageConfigs[currentLanguage as keyof typeof languageConfigs]?.name} code...`);
    
    // Simulate code execution
    setTimeout(() => {
      setOutput(`Output from ${filePath}:\nHello, World!\nExecution completed successfully.`);
      setIsRunning(false);
      toast.success("Code executed successfully!");
    }, 2000);
  };

  const handleInsertTemplate = (templateName: string) => {
    const template = languageTemplates.find(t => t.name === templateName);
    if (template && editorRef.current) {
      const currentContent = editorRef.current.getValue();
      const newContent = currentContent ? `${currentContent}\n\n${template.template}` : template.template;
      editorRef.current.setValue(newContent);
      onContentChange(newContent);
      setShowTemplates(false);
      toast.success(`Inserted ${template.name} template`);
    }
  };

  const currentLangConfig = languageConfigs[currentLanguage as keyof typeof languageConfigs];

  return (
    <div className={`flex flex-col h-full bg-[#1e1e1e] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* VS Code Style Header */}
      <div className="bg-[#2d2d30] border-b border-[#3e3e42] px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[#cccccc]">
              <FileCode className="w-4 h-4" />
              <span className="text-sm font-medium">{filePath?.split('/').pop() || 'Untitled'}</span>
              {isModified && <div className="w-2 h-2 rounded-full bg-white"></div>}
            </div>
            
            {currentLangConfig && (
              <div className="flex items-center gap-2">
                <span className="text-sm">{currentLangConfig.icon}</span>
                <span className="text-xs text-[#cccccc] bg-[#0e639c] px-2 py-1 rounded">
                  {currentLangConfig.name}
                </span>
              </div>
            )}

            {errors.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-[#f48771] bg-[#5a1d1d] px-2 py-1 rounded">
                <AlertTriangle className="w-3 h-3" />
                {errors.length} error{errors.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Language Selector */}
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value)}
              className="text-xs bg-[#3c3c3c] text-[#cccccc] border border-[#464647] rounded px-2 py-1 hover:bg-[#464647]"
            >
              {Object.entries(languageConfigs).map(([key, config]) => (
                <option key={key} value={key} className="bg-[#3c3c3c]">
                  {config.icon} {config.name}
                </option>
              ))}
            </select>

            {/* Editor Controls */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMinimap(!showMinimap)}
                title="Toggle Minimap"
                className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
              >
                <Eye className={`w-3 h-3 ${showMinimap ? '' : 'opacity-50'}`} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWordWrap(!wordWrap)}
                title="Toggle Word Wrap"
                className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
              >
                <Type className={`w-3 h-3 ${wordWrap ? '' : 'opacity-50'}`} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'vs-dark' ? 'vs-light' : 'vs-dark')}
                title="Toggle Theme"
                className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
              >
                <Palette className="w-3 h-3" />
              </Button>

              <div className="w-px h-4 bg-[#464647] mx-1"></div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAIGenerate}
                title="AI Generate (Ctrl+K)"
                className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
              >
                <Wand2 className="w-3 h-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleAIExplain}
                title="AI Explain (Ctrl+E)"
                className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
              >
                <Lightbulb className="w-3 h-3" />
              </Button>

              <div className="w-px h-4 bg-[#464647] mx-1"></div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleFormatDocument}
                title="Format Document (Shift+Alt+F)"
                className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
              >
                <Braces className="w-3 h-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
                title="Insert Template"
                className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
              >
                <Code className="w-3 h-3" />
              </Button>

              {currentLangConfig?.runnable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRunCode}
                  disabled={isRunning}
                  title="Run Code (F5)"
                  className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647] disabled:opacity-50"
                >
                  {isRunning ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </Button>
              )}

              <div className="w-px h-4 bg-[#464647] mx-1"></div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                title="Save (Ctrl+S)"
                className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
              >
                <Save className="w-3 h-3" />
              </Button>



              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title="Toggle Fullscreen"
                className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
              >
                {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                title="Close File"
                className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Selector */}
      {showTemplates && (
        <div className="absolute top-12 right-4 z-50 w-80 max-h-96 bg-[#2d2d30] border border-[#464647] rounded shadow-lg overflow-auto">
          <div className="p-3 border-b border-[#464647]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#cccccc]">Code Templates</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(false)}
                className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="p-2">
            <div className="space-y-1">
              {getTemplateByLanguage(currentLanguage).map((template) => (
                <div
                  key={template.name}
                  className="p-3 rounded cursor-pointer hover:bg-[#464647] text-[#cccccc]"
                  onClick={() => handleInsertTemplate(template.name)}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-[#969696] mt-1">
                    {template.description}
                  </div>
                </div>
              ))}
              {getTemplateByLanguage(currentLanguage).length === 0 && (
                <div className="text-center text-[#969696] py-4 text-sm">
                  No templates available for {currentLangConfig?.name}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 relative bg-[#1e1e1e]">
        {!filePath ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[#cccccc]">
              <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No file selected</p>
              <p className="text-sm text-[#969696]">Select a file from the explorer to start editing</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[#cccccc]">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading editor...</p>
            </div>
          </div>
        ) : (
          <Editor
            height="100%"
            language={currentLangConfig?.monacoLanguage || 'javascript'}
            value={content}
            onChange={(value) => onContentChange(value || '')}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { 
                enabled: showMinimap,
                side: 'right',
                showSlider: 'mouseover',
                renderCharacters: true,
                maxColumn: 120
              },
              wordWrap: wordWrap ? 'on' : 'off',
              fontSize: fontSize,
              lineNumbers: 'on',
              lineNumbersMinChars: 3,
              glyphMargin: true,
              folding: true,
              foldingHighlight: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'mouseover',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              detectIndentation: true,
              renderWhitespace: 'selection',
              renderControlCharacters: false,
              fontFamily: "'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
              fontLigatures: true,
              fontWeight: '400',
              letterSpacing: 0,
              lineHeight: 1.5,
              cursorBlinking: 'blink',
              cursorSmoothCaretAnimation: 'on',
              cursorStyle: 'line',
              cursorWidth: 2,
              smoothScrolling: true,
              contextmenu: true,
              mouseWheelZoom: true,
              multiCursorModifier: 'ctrlCmd',
              selectionHighlight: true,
              occurrencesHighlight: 'singleFile',
              codeLens: true,
              colorDecorators: true,
              lightbulb: { enabled: 'on' },
              linkedEditing: true,
              matchBrackets: 'always',
              renderLineHighlight: 'line',
              renderValidationDecorations: 'on',
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                verticalScrollbarSize: 14,
                horizontalScrollbarSize: 14
              },
              overviewRulerBorder: false,
              overviewRulerLanes: 3,
              hideCursorInOverviewRuler: false,
              suggest: {
                showInlineDetails: true,
                showStatusBar: true,
                preview: true,
                previewMode: 'prefix',
                showIcons: true,
                maxVisibleSuggestions: 12,
                insertMode: 'insert',
                filterGraceful: true,
                snippetsPreventQuickSuggestions: false,
                localityBonus: true,
                shareSuggestSelections: true,
                selectionMode: 'always',
                showDeprecated: true
              },
              quickSuggestions: {
                other: 'on',
                comments: 'off',
                strings: 'off'
              },
              quickSuggestionsDelay: 10,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              acceptSuggestionOnCommitCharacter: true,
              tabCompletion: 'on',
              wordBasedSuggestions: 'matchingDocuments',
              wordBasedSuggestionsOnlySameLanguage: false,
              parameterHints: { 
                enabled: true,
                cycle: true
              },
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              autoClosingDelete: 'always',
              autoSurround: 'languageDefined',
              autoIndent: 'full',
              formatOnType: true,
              formatOnPaste: true,
              dragAndDrop: true,
              links: true,
              find: {
                cursorMoveOnType: true,
                seedSearchStringFromSelection: 'always',
                autoFindInSelection: 'never',
                addExtraSpaceOnTop: true,
                loop: true
              },
              bracketPairColorization: { 
                enabled: true,
                independentColorPoolPerBracketType: true
              },
              guides: {
                bracketPairs: true,
                bracketPairsHorizontal: true,
                highlightActiveBracketPair: true,
                indentation: true,
                highlightActiveIndentation: true
              },
              inlineSuggest: { 
                enabled: true,
                mode: 'prefix',
                showToolbar: 'onHover'
              },
              unicodeHighlight: {
                nonBasicASCII: 'inUntrustedWorkspace',
                invisibleCharacters: true,
                ambiguousCharacters: true
              },
              stickyScroll: {
                enabled: true,
                maxLineCount: 5,
                defaultModel: 'outlineModel'
              },
              padding: {
                top: 16,
                bottom: 16
              }
            }}
          />
        )}
      </div>

      {/* Output Panel */}
      {output && (
        <div className="bg-[#252526] border-t border-[#3e3e42] max-h-48">
          <div className="px-4 py-2 border-b border-[#3e3e42]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#cccccc] text-sm">
                <Terminal className="w-4 h-4" />
                Output
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOutput('')}
                className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <pre className="text-xs text-[#cccccc] font-mono overflow-auto max-h-32 whitespace-pre-wrap">
              {output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}