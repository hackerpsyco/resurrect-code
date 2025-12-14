import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { WebContainerProvider } from '../../contexts/WebContainerContext';
import { WebContainerTerminal } from './WebContainerTerminal';
import { WebContainerPreview } from './WebContainerPreview';
import { WebContainerCodeEditor } from './WebContainerCodeEditor';
import { Button } from '@/components/ui/button';
import { Terminal, Globe, Code, FileCode, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  isModified: boolean;
}

export const WebContainerDemo: React.FC = () => {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([
    {
      path: 'index.js',
      content: `import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(\`
    <html>
      <head><title>WebContainer Demo</title></head>
      <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
        <h1 style="color: #4CAF50;">🚀 WebContainer is Working!</h1>
        <p>This is a real Node.js server running in your browser.</p>
        <p>Edit the code and see changes instantly!</p>
        <div style="margin: 20px 0;">
          <button onclick="fetch('/api/test').then(r=>r.text()).then(alert)">
            Test API
          </button>
        </div>
      </body>
    </html>
  \`);
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Hello from WebContainer API!', 
    timestamp: new Date().toISOString(),
    nodeVersion: process.version 
  });
});

app.listen(port, () => {
  console.log(\`🌐 Server running at http://localhost:\${port}\`);
});`,
      originalContent: '',
      isModified: true
    }
  ]);
  const [activeFile, setActiveFile] = useState<string>('index.js');
  const [showTerminal, setShowTerminal] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleDevServerStart = (url: string) => {
    console.log('🚀 Development server started:', url);
    setPreviewUrl(url);
    setShowPreview(true);
    
    toast.success(`🌐 Server started at ${url}`, {
      description: 'Preview panel opened automatically',
      action: {
        label: 'Open in new tab',
        onClick: () => window.open(url, '_blank')
      }
    });
  };

  const handleDevServerStop = () => {
    console.log('🛑 Development server stopped');
    toast.info('Development server stopped');
  };

  const handleFileContentChange = (content: string) => {
    if (!activeFile) return;
    
    setOpenFiles(prev => 
      prev.map(file => 
        file.path === activeFile 
          ? { ...file, content, isModified: content !== file.originalContent }
          : file
      )
    );
  };

  const handleFileSave = (content: string) => {
    if (!activeFile) return;
    
    setOpenFiles(prev => 
      prev.map(file => 
        file.path === activeFile 
          ? { ...file, originalContent: content, isModified: false }
          : file
      )
    );
    
    toast.success(`Saved ${activeFile} to WebContainer`);
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
  <p>This is a WebContainer demo.</p>
</body>
</html>`;
      case 'json':
        return `{
  "name": "webcontainer-demo",
  "version": "1.0.0",
  "description": "WebContainer demo project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}`;
      default:
        return `// ${fileName}
// WebContainer demo file
`;
    }
  };

  const closeFile = (path: string) => {
    const file = openFiles.find(f => f.path === path);
    if (file?.isModified) {
      if (!confirm(`Discard unsaved changes to ${path}?`)) return;
    }
    
    setOpenFiles(prev => prev.filter(f => f.path !== path));
    
    if (activeFile === path) {
      const remaining = openFiles.filter(f => f.path !== path);
      setActiveFile(remaining.length > 0 ? remaining[0].path : '');
    }
  };

  const currentFile = openFiles.find(f => f.path === activeFile);

  return (
    <WebContainerProvider>
      <div className="h-screen w-full bg-[#1e1e1e] flex flex-col">
        {/* Header */}
        <div className="h-12 bg-[#2d2d30] border-b border-[#464647] flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">WebContainer IDE Demo</h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-sm text-green-400">Real Node.js Runtime</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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
            {/* Left Panel - File Explorer & Editor */}
            <Panel defaultSize={showTerminal ? 60 : 100} minSize={30}>
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
                      <span className="text-sm">{file.path}</span>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={createNewFile}
                    className="h-full px-3 text-[#cccccc] hover:bg-[#37373d]"
                    title="New File"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Code Editor */}
                <div className="flex-1">
                  {currentFile ? (
                    <WebContainerCodeEditor
                      filePath={currentFile.path}
                      content={currentFile.content}
                      originalContent={currentFile.originalContent}
                      isModified={currentFile.isModified}
                      onContentChange={handleFileContentChange}
                      onSave={handleFileSave}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                      <div className="text-center text-[#cccccc]">
                        <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">WebContainer IDE Demo</p>
                        <p className="text-sm text-[#969696] mb-4">Create or select a file to start coding</p>
                        <Button onClick={createNewFile} className="bg-[#0078d4] hover:bg-[#106ebe]">
                          <Plus className="w-4 h-4 mr-2" />
                          Create New File
                        </Button>
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
                <Panel defaultSize={40} minSize={20}>
                  <WebContainerTerminal
                    projectPath="webcontainer-demo"
                    onDevServerStart={handleDevServerStart}
                    onDevServerStop={handleDevServerStop}
                  />
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>

        {/* Bottom Panel - Preview */}
        {showPreview && (
          <div className="h-80 border-t border-[#464647]">
            <WebContainerPreview
              url={previewUrl}
              onClose={() => setShowPreview(false)}
            />
          </div>
        )}

        {/* Status Bar */}
        <div className="h-6 bg-[#0078d4] flex items-center justify-between px-4 text-xs text-white">
          <div className="flex items-center gap-4">
            <span>WebContainer Demo</span>
            {currentFile && (
              <>
                <span>File: {currentFile.path}</span>
                {currentFile.isModified && <span>● Modified</span>}
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>Files: {openFiles.length}</span>
            <span>Ready</span>
          </div>
        </div>
      </div>
    </WebContainerProvider>
  );
};