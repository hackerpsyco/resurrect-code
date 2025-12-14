import React, { useState, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { RealTerminal } from './RealTerminal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Editor } from '@monaco-editor/react';
import { 
  Github, 
  Terminal, 
  Globe, 
  FileCode, 
  Plus, 
  X, 
  Download,
  Play,
  ExternalLink,
  Folder,
  File,
  RefreshCw,
  Zap,
  Save,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

interface GitHubFile {
  path: string;
  content: string;
  sha: string;
  type: 'file' | 'dir';
}

interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  isModified: boolean;
}

export const GitHubRealIDE: React.FC = () => {
  // GitHub Integration
  const [githubUrl, setGithubUrl] = useState('https://github.com/vercel/next.js/tree/canary/examples/hello-world');
  const [isLoadingRepo, setIsLoadingRepo] = useState(false);
  const [repoFiles, setRepoFiles] = useState<GitHubFile[]>([]);
  const [repoInfo, setRepoInfo] = useState<{owner: string, repo: string, branch: string} | null>(null);
  
  // IDE State
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string>('');
  const [showTerminal, setShowTerminal] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // Real Terminal Integration
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({});

  // Parse GitHub URL
  const parseGitHubUrl = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/);
    if (!match) return null;
    
    return {
      owner: match[1],
      repo: match[2],
      branch: match[3] || 'main'
    };
  };

  // Load GitHub Repository
  const loadGitHubRepo = async () => {
    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      toast.error('Invalid GitHub URL');
      return;
    }

    setIsLoadingRepo(true);
    setRepoInfo(parsed);
    
    try {
      toast.info(`Loading ${parsed.owner}/${parsed.repo}...`);
      
      // Get repository tree
      const treeUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${parsed.branch}?recursive=1`;
      const treeResponse = await fetch(treeUrl);
      
      if (!treeResponse.ok) {
        throw new Error(`Failed to fetch repository: ${treeResponse.status}`);
      }
      
      const treeData = await treeResponse.json();
      
      // Filter and load important files
      const importantFiles = treeData.tree.filter((item: any) => 
        item.type === 'blob' && 
        !item.path.includes('node_modules') &&
        !item.path.includes('.git') &&
        !item.path.includes('dist') &&
        !item.path.includes('build') &&
        (
          item.path.endsWith('.js') ||
          item.path.endsWith('.jsx') ||
          item.path.endsWith('.ts') ||
          item.path.endsWith('.tsx') ||
          item.path.endsWith('.json') ||
          item.path.endsWith('.md') ||
          item.path.endsWith('.css') ||
          item.path.endsWith('.html') ||
          item.path === 'package.json' ||
          item.path === 'README.md' ||
          item.path === 'index.js' ||
          item.path === 'index.html' ||
          item.path.startsWith('src/') ||
          item.path.startsWith('pages/') ||
          item.path.startsWith('components/')
        )
      ).slice(0, 30); // Limit to first 30 files

      // Load file contents
      const files: GitHubFile[] = [];
      const projectFilesMap: Record<string, string> = {};
      
      for (const file of importantFiles) {
        try {
          const fileUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${file.path}?ref=${parsed.branch}`;
          const fileResponse = await fetch(fileUrl);
          
          if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            const content = atob(fileData.content);
            
            files.push({
              path: file.path,
              content,
              sha: file.sha,
              type: 'file'
            });
            
            // Add to project files for real terminal
            projectFilesMap[file.path] = content;
          }
        } catch (error) {
          console.warn(`Failed to load file ${file.path}:`, error);
        }
      }
      
      setRepoFiles(files);
      setProjectFiles(projectFilesMap);
      
      // Auto-open important files
      const packageJson = files.find(f => f.path === 'package.json');
      const mainFile = files.find(f => 
        f.path === 'index.js' || 
        f.path === 'index.html' || 
        f.path === 'src/index.js' ||
        f.path === 'src/App.js' ||
        f.path === 'src/App.tsx' ||
        f.path === 'pages/index.js' ||
        f.path === 'app/page.tsx'
      );
      
      const filesToOpen = [packageJson, mainFile].filter(Boolean) as GitHubFile[];
      
      const openFilesData: OpenFile[] = filesToOpen.map(file => ({
        path: file.path,
        content: file.content,
        originalContent: file.content,
        isModified: false
      }));
      
      setOpenFiles(openFilesData);
      setActiveFile(filesToOpen[0]?.path || '');
      
      toast.success(`✅ Loaded ${parsed.owner}/${parsed.repo} with ${files.length} files`);
      
    } catch (error) {
      console.error('Failed to load GitHub repo:', error);
      toast.error(`Failed to load repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingRepo(false);
    }
  };

  // Handle dev server start from REAL terminal
  const handleDevServerStart = (url: string) => {
    console.log('🚀 REAL Development server started:', url);
    setPreviewUrl(url);
    setShowPreview(true);
    
    toast.success(`🌐 REAL Server started at ${url}`, {
      description: 'This is a real Node.js server running your code!',
      action: {
        label: 'Open in new tab',
        onClick: () => window.open(url, '_blank')
      }
    });
  };

  const handleDevServerStop = () => {
    console.log('🛑 REAL Development server stopped');
    setShowPreview(false);
    toast.info('Real development server stopped');
  };

  // File management
  const handleFileContentChange = (content: string) => {
    if (!activeFile) return;
    
    setOpenFiles(prev => 
      prev.map(file => 
        file.path === activeFile 
          ? { ...file, content, isModified: content !== file.originalContent }
          : file
      )
    );
    
    // Update project files for real terminal
    setProjectFiles(prev => ({
      ...prev,
      [activeFile]: content
    }));
  };

  const handleFileSave = (content: string) => {
    if (!activeFile) return;
    
    // Update local state
    setOpenFiles(prev => 
      prev.map(file => 
        file.path === activeFile 
          ? { ...file, originalContent: content, isModified: false }
          : file
      )
    );
    
    // Update project files
    setProjectFiles(prev => ({
      ...prev,
      [activeFile]: content
    }));
    
    toast.success(`💾 Saved ${activeFile} - changes will be available in real terminal`);
  };

  const openFile = (filePath: string) => {
    const file = repoFiles.find(f => f.path === filePath);
    if (!file) return;
    
    const existing = openFiles.find(f => f.path === filePath);
    if (existing) {
      setActiveFile(filePath);
      return;
    }
    
    const newFile: OpenFile = {
      path: file.path,
      content: file.content,
      originalContent: file.content,
      isModified: false
    };
    
    setOpenFiles(prev => [...prev, newFile]);
    setActiveFile(filePath);
  };

  const closeFile = (filePath: string) => {
    const file = openFiles.find(f => f.path === filePath);
    if (file?.isModified) {
      if (!confirm(`Discard unsaved changes to ${filePath}?`)) return;
    }
    
    setOpenFiles(prev => prev.filter(f => f.path !== filePath));
    
    if (activeFile === filePath) {
      const remaining = openFiles.filter(f => f.path !== filePath);
      setActiveFile(remaining.length > 0 ? remaining[0].path : '');
    }
  };

  const createNewFile = () => {
    const fileName = prompt('Enter file name (e.g., app.js, styles.css):');
    if (!fileName) return;
    
    const newFile: OpenFile = {
      path: fileName,
      content: getTemplateContent(fileName),
      originalContent: '',
      isModified: true
    };
    
    setOpenFiles(prev => [...prev, newFile]);
    setActiveFile(fileName);
    
    // Add to project files
    setProjectFiles(prev => ({
      ...prev,
      [fileName]: newFile.content
    }));
    
    toast.success(`Created ${fileName}`);
  };

  const getTemplateContent = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'js':
        return `// ${fileName}
console.log('Hello from ${fileName}!');

export default function() {
  return 'Hello World';
}`;
      case 'jsx':
        return `// ${fileName}
import React from 'react';

export default function ${fileName.replace('.jsx', '')}() {
  return (
    <div>
      <h1>Hello from ${fileName}!</h1>
    </div>
  );
}`;
      case 'ts':
        return `// ${fileName}
console.log('Hello from ${fileName}!');

export default function(): string {
  return 'Hello World';
}`;
      case 'tsx':
        return `// ${fileName}
import React from 'react';

interface Props {}

export default function ${fileName.replace('.tsx', '')}({}: Props) {
  return (
    <div>
      <h1>Hello from ${fileName}!</h1>
    </div>
  );
}`;
      case 'css':
        return `/* ${fileName} */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}`;
      case 'html':
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName}</title>
</head>
<body>
  <h1>Hello from ${fileName}!</h1>
  <p>This file was created in the GitHub Real IDE.</p>
</body>
</html>`;
      case 'json':
        return `{
  "name": "github-real-ide-project",
  "version": "1.0.0",
  "description": "Project created in GitHub Real IDE",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js"
  },
  "dependencies": {}
}`;
      default:
        return `// ${fileName}
// File created in GitHub Real IDE
`;
    }
  };

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
      default: return 'plaintext';
    }
  };

  const currentFile = openFiles.find(f => f.path === activeFile);

  return (
    <div className="h-screen w-full bg-[#1e1e1e] flex flex-col">
      {/* Header */}
      <div className="h-14 bg-[#2d2d30] border-b border-[#464647] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Github className="w-6 h-6 text-white" />
            <h1 className="text-lg font-semibold text-white">GitHub Real IDE</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-96 h-8 bg-[#3c3c3c] border-[#464647] text-white text-sm"
            />
            <Button
              onClick={loadGitHubRepo}
              disabled={isLoadingRepo}
              className="h-8 px-3 bg-[#0078d4] hover:bg-[#106ebe] text-white"
            >
              {isLoadingRepo ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1" />
                  Load Repo
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-600/30 rounded">
            <Zap className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">Real Execution</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTerminal(!showTerminal)}
            className={`h-8 px-3 text-sm ${showTerminal ? 'text-[#569cd6]' : 'text-[#cccccc]'} hover:bg-[#464647]`}
          >
            <Terminal className="w-4 h-4 mr-1" />
            Terminal
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className={`h-8 px-3 text-sm ${showPreview ? 'text-[#569cd6]' : 'text-[#cccccc]'} hover:bg-[#464647]`}
          >
            <Globe className="w-4 h-4 mr-1" />
            Preview
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <PanelGroup direction="horizontal">
          {/* Left Panel - File Explorer */}
          <Panel defaultSize={20} minSize={15} maxSize={40}>
            <div className="h-full bg-[#252526] border-r border-[#464647] flex flex-col">
              <div className="p-3 border-b border-[#464647]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#cccccc]">FILES</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={createNewFile}
                    className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
                    title="New File"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                
                {repoInfo && (
                  <div className="text-xs text-[#7d8590] mb-2">
                    📁 {repoInfo.owner}/{repoInfo.repo} ({repoInfo.branch})
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-auto p-2">
                {repoFiles.map((file) => (
                  <div
                    key={file.path}
                    className={`flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-[#37373d] rounded ${
                      activeFile === file.path ? 'bg-[#37373d] text-white' : 'text-[#cccccc]'
                    }`}
                    onClick={() => openFile(file.path)}
                  >
                    <File className="w-4 h-4 text-[#519aba]" />
                    <span className="flex-1 truncate">{file.path}</span>
                  </div>
                ))}
                
                {repoFiles.length === 0 && !isLoadingRepo && (
                  <div className="text-center text-[#7d8590] py-8">
                    <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Load a GitHub repository to start</p>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-[#464647] hover:bg-[#569cd6] transition-colors" />

          {/* Center Panel - Code Editor */}
          <Panel defaultSize={showTerminal ? 50 : 80} minSize={30}>
            <div className="h-full flex flex-col">
              {/* File Tabs */}
              <div className="h-10 bg-[#252526] border-b border-[#464647] flex items-center overflow-x-auto">
                {openFiles.map((file) => (
                  <div
                    key={file.path}
                    className={`flex items-center gap-2 px-3 h-full border-r border-[#464647] cursor-pointer hover:bg-[#37373d] ${
                      activeFile === file.path ? "bg-[#1e1e1e] text-white" : "text-[#cccccc]"
                    }`}
                    onClick={() => setActiveFile(file.path)}
                  >
                    <FileCode className="w-4 h-4 text-[#519aba]" />
                    <span className="text-sm">{file.path.split('/').pop()}</span>
                    {file.isModified && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeFile(file.path);
                      }}
                      className="h-4 w-4 p-0 text-[#cccccc] hover:bg-[#464647] ml-1"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                
                {openFiles.length === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={createNewFile}
                    className="h-full px-3 text-[#cccccc] hover:bg-[#37373d]"
                    title="New File"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New File
                  </Button>
                )}
              </div>

              {/* Code Editor */}
              <div className="flex-1">
                {currentFile ? (
                  <div className="h-full flex flex-col">
                    <div className="flex-1">
                      <Editor
                        height="100%"
                        language={getLanguageFromPath(currentFile.path)}
                        value={currentFile.content}
                        onChange={(value) => handleFileContentChange(value || '')}
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
                          lineNumbers: 'on'
                        }}
                      />
                    </div>
                    
                    {/* File Status Bar */}
                    <div className="h-6 bg-[#252526] border-t border-[#464647] flex items-center justify-between px-3 text-xs">
                      <div className="flex items-center gap-4 text-[#7d8590]">
                        <span>Language: {getLanguageFromPath(currentFile.path)}</span>
                        <span>Encoding: UTF-8</span>
                        {currentFile.isModified && (
                          <span className="text-yellow-400">● Modified</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileSave(currentFile.content)}
                          disabled={!currentFile.isModified}
                          className="h-5 px-2 text-xs text-[#cccccc] hover:bg-[#464647] disabled:opacity-50"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save (Ctrl+S)
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                    <div className="text-center text-[#cccccc]">
                      <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">GitHub Real IDE</p>
                      <p className="text-sm text-[#969696] mb-4">Load a repository and select a file to start coding</p>
                      <div className="space-y-2">
                        <Button onClick={createNewFile} className="bg-[#0078d4] hover:bg-[#106ebe]">
                          <Plus className="w-4 h-4 mr-2" />
                          Create New File
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {/* Right Panel - Terminal */}
          {showTerminal && (
            <>
              <PanelResizeHandle className="w-2 bg-[#464647] hover:bg-[#569cd6] transition-colors" />
              <Panel defaultSize={30} minSize={20}>
                <RealTerminal
                  projectPath={repoInfo ? `${repoInfo.owner}/${repoInfo.repo}` : 'github-real-ide'}
                  onDevServerStart={handleDevServerStart}
                  onDevServerStop={handleDevServerStop}
                  projectFiles={projectFiles}
                />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Bottom Panel - Preview */}
      {showPreview && (
        <div className="h-80 border-t border-[#464647] bg-[#1e1e1e]">
          <div className="h-full flex flex-col">
            <div className="h-10 bg-[#2d2d30] border-b border-[#464647] flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#cccccc]" />
                <span className="text-sm font-medium text-[#cccccc]">Live Preview</span>
                {previewUrl && (
                  <span className="text-xs text-[#7d8590] font-mono">{previewUrl}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {previewUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="h-6 px-2 text-xs text-[#cccccc] hover:bg-[#464647]"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open in New Tab
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                  className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#464647]"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="Live Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-[#cccccc]">
                  <div className="text-center">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No Server Running</p>
                    <p className="text-sm text-[#969696]">
                      Run <code className="bg-[#464647] px-2 py-1 rounded">npm run dev</code> in the terminal to start your app
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="h-6 bg-[#0078d4] flex items-center justify-between px-4 text-xs text-white">
        <div className="flex items-center gap-4">
          <span>GitHub Real IDE</span>
          {repoInfo && (
            <span>{repoInfo.owner}/{repoInfo.repo}</span>
          )}
          {currentFile && (
            <>
              <span>File: {currentFile.path}</span>
              {currentFile.isModified && <span>● Modified</span>}
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Files: {openFiles.length}</span>
          <span>Real Terminal: {showTerminal ? 'Active' : 'Hidden'}</span>
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
};