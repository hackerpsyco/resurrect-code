import React, { useState } from 'react';
import { RealTerminal } from './RealTerminal';
import { WebTerminal } from '@/components/terminal/WebTerminal';
import { Button } from '@/components/ui/button';
import { Terminal, Zap, Play } from 'lucide-react';

export const TerminalTest: React.FC = () => {
  const [useRealTerminal, setUseRealTerminal] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleDevServerStart = (url: string) => {
    setPreviewUrl(url);
    setShowPreview(true);
    console.log('🚀 Server started:', url);
  };

  const handleDevServerStop = () => {
    setShowPreview(false);
    console.log('🛑 Server stopped');
  };

  const testFiles = {
    'package.json': JSON.stringify({
      name: 'terminal-test',
      version: '1.0.0',
      scripts: {
        start: 'node server.js',
        dev: 'node server.js'
      },
      dependencies: {
        express: '^4.18.2'
      }
    }, null, 2),
    'server.js': `const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('<h1>Real Terminal Test Server!</h1><p>This server is running from REAL terminal execution!</p>');
});

app.listen(port, () => {
  console.log(\`🚀 Real server running at http://localhost:\${port}\`);
});`,
    'test.js': `console.log('Hello from REAL terminal!');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());`
  };

  return (
    <div className="h-screen w-full bg-[#1e1e1e] flex flex-col">
      {/* Header */}
      <div className="h-14 bg-[#2d2d30] border-b border-[#464647] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Terminal className="w-6 h-6 text-white" />
          <h1 className="text-lg font-semibold text-white">Terminal Test - Real vs Fake</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setUseRealTerminal(!useRealTerminal)}
            className={`px-4 py-2 ${
              useRealTerminal 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {useRealTerminal ? (
              <>
                <Zap className="w-4 h-4 mr-2" />
                REAL Terminal
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                FAKE Terminal
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-[#252526] border-b border-[#464647]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-white mb-2">
            {useRealTerminal ? '⚡ REAL Terminal Mode' : '🎭 FAKE Terminal Mode'}
          </h2>
          <p className="text-[#cccccc] mb-3">
            {useRealTerminal 
              ? 'This terminal executes REAL commands on a Linux server. Try the commands below to see actual exe