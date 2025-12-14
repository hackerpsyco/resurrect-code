import React, { useEffect, useState, useRef } from 'react';
import { useWebContainer } from '../../contexts/WebContainerContext';
import { RefreshCw } from 'lucide-react';

interface PreviewProps {
  className?: string;
}

export const Preview: React.FC<PreviewProps> = ({ className = '' }) => {
  const { webContainer, isBooting } = useWebContainer();
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isServerReady, setIsServerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!webContainer || isBooting) return;

    let mounted = true;

    // Listen for server-ready event from WebContainer
    const setupServerListener = () => {
      // WebContainer emits 'server-ready' when a dev server starts
      webContainer.on('server-ready', (port, url) => {
        console.log(`🌐 Server ready on port ${port}: ${url}`);
        
        if (mounted) {
          setPreviewUrl(url);
          setIsServerReady(true);
          setIsLoading(false);
        }
      });

      // Also listen for port events (alternative approach)
      webContainer.on('port', (port, type, url) => {
        if (type === 'open') {
          console.log(`🔌 Port ${port} opened: ${url}`);
          
          if (mounted) {
            setPreviewUrl(url);
            setIsServerReady(true);
            setIsLoading(false);
          }
        }
      });
    };

    setupServerListener();

    return () => {
      mounted = false;
    };
  }, [webContainer, isBooting]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      // Force iframe reload
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    console.error('❌ Preview iframe failed to load');
  };

  if (isBooting) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
          <p>Booting WebContainer...</p>
        </div>
      </div>
    );
  }

  if (!isServerReady) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center text-gray-600 max-w-md">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium mb-2">No Server Running</h3>
          <p className="text-sm">
            Start a development server in the terminal to see your app preview.
          </p>
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-left">
            <code className="text-sm text-gray-800">npm run dev</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-white ${className}`}>
      {/* Preview Header with Refresh Button */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">Preview</span>
          {previewUrl && (
            <span className="text-xs text-gray-500 font-mono">
              {previewUrl}
            </span>
          )}
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Refresh preview"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="w-full h-full border-0"
          title="App Preview"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
};