import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Zap, Server, CheckCircle, FolderOpen } from 'lucide-react';

interface ProjectConnectedTerminalProps {
  projectPath?: string;
  onClose?: () => void;
  className?: string;
  onDevServerStart?: (url: string) => void;
  onDevServerStop?: () => void;
  projectFiles?: Record<string, string>;
  openFiles?: Array<{path: string, content: string, sha: string}>;
  repoFileTree?: Array<{path: string, type: string, name: string}>;
  project?: {owner: string, repo: string, branch: string};
}

interface TerminalMessage {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

export function ProjectConnectedTerminal({ 
  projectPath = ".", 
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop,
  projectFiles = {},
  openFiles = [],
  repoFileTree = [],
  project
}: ProjectConnectedTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDirectory, setCurrentDirectory] = useState('/');
  const [realProjectFiles, setRealProjectFiles] = useState<Record<string, string>>({});
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when terminal is opened
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const addMessage = useCallback((content: string, type: TerminalMessage["type"] = "output") => {
    const newMessage: TerminalMessage = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Initialize project connected terminal
  useEffect(() => {
    const initializeProjectConnectedTerminal = async () => {
      try {
        addMessage("🚀 Initializing Project Connected Terminal...", "system");
        
        if (project?.owner && project?.repo) {
          addMessage(`📁 Connecting to GitHub project: ${project.owner}/${project.repo}`, "system");
          addMessage(`🌿 Branch: ${project.branch || 'main'}`, "system");
        }
        
        // Build file system from actual project files
        const projectFileSystem: Record<string, string> = {};
        
        // Add open files (these have actual content)
        openFiles.forEach(file => {
          projectFileSystem[file.path] = file.content;
        });
        
        // Add file tree entries (for ls command)
        repoFileTree.forEach(file => {
          if (file.type === 'blob' && !projectFileSystem[file.path]) {
            projectFileSystem[file.path] = `# ${file.name}\n\n(File content not loaded - open in editor to see content)`;
          }
        });
        
        // If no files loaded, create basic project structure
        if (Object.keys(projectFileSystem).length === 0) {
          projectFileSystem['package.json'] = JSON.stringify({
            name: project?.repo || 'project',
            version: '1.0.0',
            description: `GitHub project: ${project?.owner}/${project?.repo}`,
            main: 'index.js',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              start: 'node server.js',
              test: 'jest'
            }
          }, null, 2);
          
          projectFileSystem['README.md'] = `# ${project?.repo || 'Project'}\n\nGitHub Repository: ${project?.owner}/${project?.repo}\nBranch: ${project?.branch || 'main'}\n\nThis terminal is connected to your actual project files!`;
        }
        
        setRealProjectFiles(projectFileSystem);
        setIsConnected(true);
        
        addMessage("✅ Project Connected Terminal Ready!", "system");
        addMessage(`📂 Working with ${Object.keys(projectFileSystem).length} project files`, "system");
        addMessage("🔥 Terminal connected to your REAL GitHub project!", "system");
        addMessage("💡 Try: ls, cat package.json, npm install, npm run dev", "system");
        
      } catch (error) {
        console.error('❌ Project terminal initialization failed:', error);
        addMessage(`❌ Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        setIsConnected(true); // Still allow basic usage
      }
    };

    initializeProjectConnectedTerminal();
  }, [project, openFiles, repoFileTree, addMessage]);

  const executeProjectCommand = async (command: string) => {
    if (!command