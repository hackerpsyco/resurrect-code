import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export const WebContainerTest: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'supported' | 'not-supported' | 'error'>('checking');
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    const checkWebContainerSupport = async () => {
      try {
        // Check if SharedArrayBuffer is available
        if (typeof SharedArrayBuffer === 'undefined') {
          setStatus('not-supported');
          setDetails('SharedArrayBuffer is not available. Cross-origin isolation headers may be missing.');
          return;
        }

        // Check if cross-origin isolated
        if (!crossOriginIsolated) {
          setStatus('not-supported');
          setDetails('Cross-origin isolation is not enabled. Add COOP and COEP headers to your server.');
          return;
        }

        // Try to import WebContainer
        const { WebContainer } = await import('@webcontainer/api');
        
        // Try to boot WebContainer
        console.log('🚀 Attempting to boot WebContainer...');
        const webContainer = await WebContainer.boot();
        console.log('✅ WebContainer booted successfully!');
        
        setStatus('supported');
        setDetails('WebContainer is fully supported and ready to use!');
        
        // Clean up
        // webContainer.teardown();
        
      } catch (error) {
        console.error('❌ WebContainer test failed:', error);
        setStatus('error');
        setDetails(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    checkWebContainerSupport();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />;
      case 'supported':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'not-supported':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'border-blue-500 bg-blue-50';
      case 'supported':
        return 'border-green-500 bg-green-50';
      case 'not-supported':
        return 'border-red-500 bg-red-50';
      case 'error':
        return 'border-yellow-500 bg-yellow-50';
    }
  };

  const retryTest = () => {
    setStatus('checking');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className={`border-2 rounded-lg p-6 ${getStatusColor()}`}>
          <div className="flex items-center gap-3 mb-4">
            {getStatusIcon()}
            <h1 className="text-xl font-semibold text-gray-800">
              WebContainer Support Test
            </h1>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Status: {status.replace('-', ' ').toUpperCase()}</p>
              <p>{details}</p>
            </div>

            {status === 'checking' && (
              <div className="text-sm text-gray-500">
                Testing WebContainer compatibility...
              </div>
            )}

            {status === 'supported' && (
              <div className="space-y-2">
                <div className="text-sm text-green-700 bg-green-100 p-3 rounded">
                  ✅ WebContainer is ready! You can now:
                  <ul className="mt-2 ml-4 list-disc">
                    <li>Run real Node.js in the browser</li>
                    <li>Install npm packages</li>
                    <li>Start development servers</li>
                    <li>Use the full terminal experience</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => window.location.href = '/webcontainer-demo'}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Go to WebContainer Demo
                </Button>
              </div>
            )}

            {(status === 'not-supported' || status === 'error') && (
              <div className="space-y-3">
                <div className="text-sm text-red-700 bg-red-100 p-3 rounded">
                  <p className="font-medium mb-2">To fix this issue:</p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Ensure your Vite config has the required headers</li>
                    <li>Restart your development server</li>
                    <li>Use a modern browser (Chrome, Firefox, Safari)</li>
                    <li>Check that you're on localhost or HTTPS</li>
                  </ol>
                </div>
                
                <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded font-mono">
                  <p className="font-medium mb-1">Required Vite config:</p>
                  <pre>{`server: {
  headers: {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
  }
}`}</pre>
                </div>

                <Button 
                  onClick={retryTest}
                  variant="outline"
                  className="w-full"
                >
                  Retry Test
                </Button>
              </div>
            )}

            <div className="text-xs text-gray-400 space-y-1">
              <p>Browser: {navigator.userAgent.split(' ').pop()}</p>
              <p>SharedArrayBuffer: {typeof SharedArrayBuffer !== 'undefined' ? '✅' : '❌'}</p>
              <p>Cross-Origin Isolated: {crossOriginIsolated ? '✅' : '❌'}</p>
              <p>HTTPS/Localhost: {location.protocol === 'https:' || location.hostname === 'localhost' ? '✅' : '❌'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};