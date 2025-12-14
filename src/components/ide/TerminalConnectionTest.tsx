import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RealTerminalService } from '../../services/realTerminalService';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Terminal } from 'lucide-react';
import { toast } from 'sonner';

export const TerminalConnectionTest: React.FC = () => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string>('');

  const terminalService = new RealTerminalService();

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('testing');
    setTestResults([]);
    
    try {
      addTestResult('🔍 Starting connection test...');
      
      // Test 1: Basic connection
      addTestResult('📡 Testing basic connection to Supabase function...');
      const connectionOk = await terminalService.testConnection();
      
      if (!connectionOk) {
        throw new Error('Basic connection test failed');
      }
      
      addTestResult('✅ Basic connection successful');
      
      // Test 2: Create session
      addTestResult('🚀 Creating real terminal session...');
      const newSessionId = await terminalService.createSession('test-project');
      setSessionId(newSessionId);
      addTestResult(`✅ Session created: ${newSessionId}`);
      
      // Test 3: Execute simple command
      addTestResult('⚡ Executing test command...');
      const result = await terminalService.executeCommand(newSessionId, 'echo "Hello Real Terminal!"');
      addTestResult(`✅ Command executed - Exit code: ${result.exitCode}`);
      addTestResult(`📝 Output: ${result.output}`);
      
      // Test 4: Execute system info commands
      addTestResult('🔍 Getting system information...');
      const pwdResult = await terminalService.executeCommand(newSessionId, 'pwd');
      addTestResult(`📁 Working directory: ${pwdResult.output.trim()}`);
      
      const nodeResult = await terminalService.executeCommand(newSessionId, 'node --version');
      if (nodeResult.exitCode === 0) {
        addTestResult(`🟢 Node.js version: ${nodeResult.output.trim()}`);
      } else {
        addTestResult(`🔴 Node.js not available: ${nodeResult.error}`);
      }
      
      const npmResult = await terminalService.executeCommand(newSessionId, 'npm --version');
      if (npmResult.exitCode === 0) {
        addTestResult(`📦 npm version: ${npmResult.output.trim()}`);
      } else {
        addTestResult(`🔴 npm not available: ${npmResult.error}`);
      }
      
      // Test 5: File operations
      addTestResult('📝 Testing file operations...');
      const fileResult = await terminalService.executeCommand(newSessionId, 'echo "Test file content" > test.txt && cat test.txt');
      if (fileResult.exitCode === 0) {
        addTestResult(`✅ File operations working: ${fileResult.output.trim()}`);
      } else {
        addTestResult(`❌ File operations failed: ${fileResult.error}`);
      }
      
      setConnectionStatus('success');
      addTestResult('🎉 All tests passed! Real terminal is working!');
      toast.success('Real terminal connection successful!');
      
    } catch (error) {
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addTestResult(`❌ Test failed: ${errorMessage}`);
      toast.error(`Connection test failed: ${errorMessage}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const cleanupSession = async () => {
    if (sessionId) {
      try {
        await terminalService.destroySession(sessionId);
        addTestResult(`🗑️ Session ${sessionId} destroyed`);
        setSessionId('');
        toast.success('Session cleaned up');
      } catch (error) {
        addTestResult(`❌ Failed to cleanup session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Terminal className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'testing':
        return 'border-blue-500 bg-blue-50';
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className={`border-2 rounded-lg p-6 ${getStatusColor()}`}>
          <div className="flex items-center gap-3 mb-4">
            {getStatusIcon()}
            <h1 className="text-xl font-semibold text-gray-800">
              Real Terminal Connection Test
            </h1>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">This will test the connection to your real terminal backend:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Basic connection to Supabase function</li>
                <li>Terminal session creation</li>
                <li>Real command execution</li>
                <li>System information retrieval</li>
                <li>File operations</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={testConnection}
                disabled={isTestingConnection}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Terminal className="w-4 h-4 mr-2" />
                    Test Real Terminal
                  </>
                )}
              </Button>
              
              {sessionId && (
                <Button 
                  onClick={cleanupSession}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Cleanup Session
                </Button>
              )}
            </div>

            {testResults.length > 0 && (
              <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
                <div className="text-white mb-2">Test Results:</div>
                {testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))}
              </div>
            )}

            {connectionStatus === 'success' && (
              <div className="bg-green-100 border border-green-300 rounded p-4">
                <div className="text-green-800 font-medium mb-2">✅ Real Terminal Ready!</div>
                <p className="text-green-700 text-sm mb-2">
                  Your real terminal is working perfectly. You can now:
                </p>
                <ul className="text-green-700 text-sm list-disc ml-4">
                  <li>Execute real Linux commands</li>
                  <li>Install actual npm packages</li>
                  <li>Run real development servers</li>
                  <li>Perform file operations</li>
                </ul>
                <div className="mt-3">
                  <Button 
                    onClick={() => window.location.href = '/github-real-ide'}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Go to Real IDE
                  </Button>
                </div>
              </div>
            )}

            {connectionStatus === 'error' && (
              <div className="bg-red-100 border border-red-300 rounded p-4">
                <div className="text-red-800 font-medium mb-2">❌ Connection Failed</div>
                <p className="text-red-700 text-sm mb-2">
                  The real terminal connection failed. Common issues:
                </p>
                <ul className="text-red-700 text-sm list-disc ml-4 mb-3">
                  <li>Supabase function authentication issues</li>
                  <li>Network connectivity problems</li>
                  <li>Function deployment issues</li>
                  <li>Environment variable configuration</li>
                </ul>
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded font-mono">
                  Check browser console for detailed error messages
                </div>
              </div>
            )}

            <div className="text-xs text-gray-400 space-y-1">
              <p>Environment: {import.meta.env.MODE}</p>
              <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL}</p>
              <p>Function URL: https://eahpikunzsaacibikwtj.supabase.co/functions/v1/terminal-executor</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};