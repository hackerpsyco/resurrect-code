import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface WebContainerContextType {
  webContainer: any | null;
  isLoading: boolean;
  error: string | null;
  isReady: boolean;
}

const WebContainerContext = createContext<WebContainerContextType>({
  webContainer: null,
  isLoading: true,
  error: null,
  isReady: false,
});

export const useWebContainer = () => {
  const context = useContext(WebContainerContext);
  if (!context) {
    throw new Error('useWebContainer must be used within a WebContainerProvider');
  }
  return context;
};

interface WebContainerProviderProps {
  children: ReactNode;
}

// Global singleton to prevent multiple WebContainer instances
let globalWebContainer: any = null;
let isBooting = false;

export function WebContainerProvider({ children }: WebContainerProviderProps) {
  const [webContainer, setWebContainer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeWebContainer = async () => {
      try {
        // Check if WebContainer is already booted globally
        if (globalWebContainer) {
          console.log('✅ Using existing WebContainer instance');
          setWebContainer(globalWebContainer);
          setIsReady(true);
          setIsLoading(false);
          return;
        }

        // Check if another instance is currently booting
        if (isBooting) {
          console.log('⏳ WebContainer is already booting, waiting...');
          // Wait for the other instance to finish booting
          const checkInterval = setInterval(() => {
            if (globalWebContainer) {
              console.log('✅ WebContainer boot completed by another instance');
              setWebContainer(globalWebContainer);
              setIsReady(true);
              setIsLoading(false);
              clearInterval(checkInterval);
            }
          }, 100);
          return;
        }

        console.log('🚀 Initializing shared WebContainer...');
        isBooting = true;
        
        // Import WebContainer
        console.log('📦 Importing @webcontainer/api...');
        const { WebContainer } = await import('@webcontainer/api');
        console.log('✅ WebContainer API imported');
        
        // Boot WebContainer (only once per page)
        // The fetch.worker.js warning is harmless - it's a preload optimization
        console.log('🚀 Booting WebContainer...');
        const containerInstance = await WebContainer.boot({
          // Suppress fetch worker warnings (it's optional and used for fetch API polyfill)
          // The warning appears because the worker is preloaded but not always needed
        });
        console.log('✅ WebContainer booted successfully');
        
        // Store globally to prevent multiple instances
        globalWebContainer = containerInstance;
        
        setWebContainer(containerInstance);
        setIsReady(true);
        setError(null);
        isBooting = false;
        
      } catch (err) {
        console.error('❌ WebContainer initialization failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error details:', {
          message: errorMessage,
          stack: err instanceof Error ? err.stack : undefined,
          error: err
        });
        setError(`Failed to initialize WebContainer: ${errorMessage}. Check browser console for details.`);
        setIsReady(false);
        isBooting = false;
      } finally {
        setIsLoading(false);
      }
    };

    initializeWebContainer();
  }, []);

  return (
    <WebContainerContext.Provider value={{ webContainer, isLoading, error, isReady }}>
      {children}
    </WebContainerContext.Provider>
  );
}