import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Terminal, X, Maximize2, Minimize2, RotateCcw, Zap, Server, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DirectRealTerminalProps {
  projectPath?: string;
  onClose?: () => void;
  className?: string;
  onDevServerStart?: (url: string) => void;
  onDevServerStop?: () => void;
  projectFiles?: Record<string, string>;
}

interface TerminalMessage {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

export function DirectRealTerminal({ 
  projectPath = ".", 
  onClose, 
  className = "", 
  onDevServerStart,
  onDevServerStop,
  projectFiles = {}
}: DirectRealTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [sessionId, setSessionId] = useState<string>("");
  const [executionMode, setExecutionMode] = useState<'session' | 'direct' | 'failed'>('failed');
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Supabase configuration
  const SUPABASE_URL = 'https://eahpikunzsaacibikwtj.supabase.co';
  const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/terminal-executor`;

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

  // Initialize direct real terminal
  useEffect(() => {
    const initializeDirectRealTerminal = async () => {
      try {
        addMessage("🚀 Initializing DIRECT Real Terminal...", "system");
        addMessage("🔍 Testing Supabase function connection...", "system");
        
        // Test function health
        const healthResponse = await fetch(FUNCTION_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (healthResponse.ok) {
          const healthResult = await healthResponse.json();
          addMessage(`✅ Function connected: ${healthResult.message}`, "system");
          
          // Try to create a real session first
          const sessionId = `direct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          addMessage("🔧 Attempting to create REAL Linux session...", "system");
          
          const sessionResponse = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'create_session',
              sessionId: sessionId,
              projectPath: projectPath
            })
          });

          if (sessionResponse.ok) {
            const sessionResult = await sessionResponse.json();
            if (sessionResult.success) {
              setSessionId(sessionId);
              setExecutionMode('session');
              addMessage("✅ REAL Linux session created successfully!", "system");
              addMessage(`📁 Real working directory: ${sessionResult.workingDir}`, "system");
              addMessage("⚡ TRUE REAL EXECUTION MODE ACTIVE!", "system");
            } else {
              throw new Error('Session creation failed');
            }
          } else {
            throw new Error('Session API not available');
          }
          
        } else {
          throw new Error(`Function not accessible: ${healthResponse.status}`);
        }
        
        setIsConnected(true);
        addMessage("💡 Try: pwd, whoami, ls -la, echo 'REAL Linux!'", "system");
        
      } catch (error) {
        console.error('Session creation failed, trying direct mode:', error);
        addMessage(`⚠️ Session mode failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        
        // Try direct command execution
        try {
          addMessage("🔄 Trying direct command execution mode...", "system");
          
          const testResponse = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
   