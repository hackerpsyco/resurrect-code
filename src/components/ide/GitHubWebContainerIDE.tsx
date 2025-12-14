import React, { useState, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { WebContainerProvider, useWebContainer } from '../../contexts/WebContainerContext';
import { WebContainerTerminal } from './WebContainerTerminal';
import { WebContainerPreview } from './WebContainerPreview';
import { WebContainerCodeEditor } from './WebContainerCodeEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Zap
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

const GitHubWebContainerIDEContent: React.FC = () => {
  const { webContainer, writeFile, isBooting } = useWebContainer();
  
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
  
  // Deployment
  const [deploymentUrl, setDeploymentUrl] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);

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
          item.path === 'index.html'
        )
      ).slice(0, 20); // Limit to first 20 files

      // Load file contents
      const files: GitHubFile[] = [];
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
          }
        } catch (error) {
          console.warn(`Failed to load file ${file.path}:`, error);
        }
      }
      
      setRepoFiles(files);
      
      // Auto-open package.json and main file
      const packageJson = files.find(f => f.path === 'package.json');
      const mainFile = files.find(f => 
        f.path === 'index.js' || 
        f.path === 'index.html' || 
        f.path === 'src/index.js' ||
        f.path === 'src/App.js' ||
        f.path === 'pages/index.js'
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
      
      // Write files to WebContainer
      if (webContainer) {
        for (const file of files) {
          await writeFile(file.path, file.content);
        }
        toast.success(`Loaded ${files.length} files into WebContainer`);
      }
      
      toast.success(`✅ Loaded ${parsed.owner}/${parsed.repo} with ${files.length} files`);
      
    } catch (error) {
      console.error('Failed to load GitHub repo:', error);
      toast.error(`Failed to load repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingRepo(false);
    }
  };

  // Handle dev server start
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
  };

  const handleFileSave = async (content: string) => {
    if (!activeFile || !webContainer) return;
    
    // Save to WebContainer
    await writeFile(activeFile, content);
    
    // Update local state
    setOpenFiles(prev => 
      prev.map(file => 
        file.path === activeFile 
          ? { ...file, originalContent: content, isModified: false }
          : file
      )
    );
    
    toast.success(`Saved ${activeFile} to WebContainer`);
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

  // Quick actions
  const runInstall = () => {
    // This will be handled by the terminal component
    toast.info('Run "npm install" in the terminal to install dependencies');
  };

  const runDev = () => {
    toast.info('Run "npm run dev" or "npm start" in the terminal to start the development server');
  };

  // Deploy to hosting service (simulated)
  const deployToHosting = async () => {
    if (!repoInfo) {
      toast.error('No repository loaded');
      return;
    }

    setIsDeploying(true);
    
    try {
      // Simulate deployment process
      toast.info('🚀 Starting deployment...');
      
      // In a real implementation, this would:
      // 1. Bundle the code from WebContainer
      // 2. Deploy to Vercel/Netlify/etc.
      // 3. Return the deployment URL
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockDeployUrl = `https://${repoInfo.repo}-${Date.now().toString(36)}.vercel.app`;
      setDeploymentUrl(mockDeployUrl);
      
      toast.success(`🎉 Deployed successfully!`, {
        description: `Your app is live at ${mockDe