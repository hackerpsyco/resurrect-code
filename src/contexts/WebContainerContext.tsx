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

export function WebContainerProvider({ children }: WebContainerProviderProps) {
  const [webContainer, setWebContainer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeWebContainer = async () => {
      try {
        console.log('🚀 Initializing shared WebContainer...');
        
        // Import WebContainer
        const { WebContainer } = await import('@webcontainer/api');
        
        // Boot WebContainer (only once per page)
        const containerInstance = await WebContainer.boot();
        
        console.log('✅ WebContainer booted successfully');
        setWebContainer(containerInstance);
        setIsReady(true);
        setError(null);
        
      } catch (err) {
        console.error('❌ WebContainer initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
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