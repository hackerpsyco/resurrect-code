import React, { useEffect, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { useWebContainer } from '../../contexts/WebContainerContext';
import { Button } from '@/components/ui/button';
import { Save, FileCode, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WebContainerCodeEditorProps {
  filePath: string;
  content: string;
  originalContent: string;
  isLoading?: boolean;
  isModified?: boolean;
  onSave?: (content: string) => void;
  onClose?: () => void;
  onContentChange?: (content: string) => void;
  className?: string;
}

export const WebContainerCodeEditor: React.FC<WebContainerCodeEditorProps> = ({
  filePath,
  content,
  originalContent,
  isLoading = false,
  isModified = false,
  onSave,
  onClose,
  onContentChange,
  className = ""
}) => {
  const { webContainer, writeFile, isBooting } = useWebContainer();
  const [editorContent, setEditorContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Update editor content when prop changes
  useEffect(() => {
    setEditorContent(content);
  }, [content]);

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || '';
    setEditorContent(newContent);
    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  const handleSave = async () => {
    if (!webContainer || isBooting) {
      toast.error('WebContainer not ready');
      return;
    }

    setIsSaving(true);
    try {
      // Write file to WebContainer virtual file system
      await writeFile(filePath, editorContent);
      
      // Call parent save handler if provided
      if (onSave) {
        onSave(editorContent);
      }
      
      setLastSaved(new Date());
      toast.success(`Saved ${filePath} to WebContainer`);
    } catch (error) {
      console.error('Failed to save file to WebContainer:', error);
      toast.error(`Failed to save ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save to WebContainer when content changes (debounced)
  useEffect(() => {
    if (!webContainer || isBooting || !isModified) return;

    const autoSaveTimer = setTimeout(async () => {
      try {
        await writeFile(filePath, editorContent);
        console.log(`Auto-saved ${filePath} to WebContainer`);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [editorContent, webContainer, isBooting, isModified, filePath, writeFile]);

  const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js': return 'javascript';
      case 'jsx': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'py': return 'python';
      case 'css': return 'css';
      case 'scss': case 'sass': return 'scss';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'yml': case 'yaml': return 'yaml';
      case 'xml': return 'xml';
      case 'sql': return 'sql';
      case 'sh': return 'shell';
      case 'dockerfile': return 'dockerfile';
      default: return 'plaintext';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  if (isBooting) {
    return (
      <div className={`flex items-center justify-center h-full bg-[#1e1e1e] ${className}`}>
        <div className="text-center text-[#cccccc]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#569cd6] mx-auto mb-2"></div>
          <p>Booting WebContainer...</p>
          <p className="text-xs text-[#7d8590] mt-1">Preparing code editor environment</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-[#1e1e1e] ${className}`} onKeyDown={handleKeyDown}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#464647] bg-[#2d2d30]">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#cccccc]" />
          <span className="text-sm font-medium text-[#cccccc]">{filePath}</span>
          {isModified && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-white" title="Modified"></div>
              <span className="text-xs text-[#7d8590]">Modified</span>
            </div>
          )}
          {!isBooting && webContainer && (
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">WebContainer Ready</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-[#7d8590]">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !isModified || isBooting}
            className="h-6 px-2 text-xs text-[#cccccc] hover:bg-[#464647] disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 border border-[#cccccc] border-t-transparent rounded-full animate-spin mr-1"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3 h-3 mr-1" />
                Save (Ctrl+S)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[#cccccc]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#569cd6] mx-auto mb-2"></div>
              <p className="text-sm">Loading {filePath}...</p>
            </div>
          </div>
        ) : (
          <Editor
            height="100%"
            language={getLanguageFromPath(filePath)}
            value={editorContent}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: 'Menlo, Monaco, "Courier New", monospace',
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              },
              suggest: {
                showKeywords: true,
                showSnippets: true
              },
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true
              },
              parameterHints: { enabled: true },
              hover: { enabled: true },
              contextmenu: true,
              mouseWheelZoom: true,
              cursorBlinking: 'blink',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              folding: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'always'
            }}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-[#252526] border-t border-[#464647] flex items-center justify-between px-3 text-xs">
        <div className="flex items-center gap-4 text-[#7d8590]">
          <span>Language: {getLanguageFromPath(filePath)}</span>
          <span>Encoding: UTF-8</span>
          {isModified && (
            <span className="flex items-center gap-1 text-yellow-400">
              <AlertCircle className="w-3 h-3" />
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[#7d8590]">
          {webContainer && !isBooting && (
            <span className="flex items-center gap-1 text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              WebContainer Active
            </span>
          )}
          <span>Lines: {editorContent.split('\n').length}</span>
          <span>Characters: {editorContent.length}</span>
        </div>
      </div>
    </div>
  );
};