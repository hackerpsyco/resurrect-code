import { useState, useEffect } from 'react';
import { Extension, ExtensionCategory, ExtensionSearchFilters } from '@/types/extensions';
import { extensionService } from '@/services/extensionService';

export function useExtensions() {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [categories, setCategories] = useState<ExtensionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchExtensions = async (query: string = '', filters: ExtensionSearchFilters = { sortBy: 'relevance' }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await extensionService.searchExtensions(query, filters);
      setExtensions(results);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search extensions';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await extensionService.getCategories();
      setCategories(categoriesData);
      return categoriesData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
      setError(errorMessage);
      throw err;
    }
  };

  const installExtension = async (id: string) => {
    setIsLoading(true);
    try {
      const result = await extensionService.installExtension(id);
      if (result.success) {
        // Update the extension in the local state
        setExtensions(prev => 
          prev.map(ext => 
            ext.id === id 
              ? { ...ext, isInstalled: true, isEnabled: true }
              : ext
          )
        );
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to install extension';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const uninstallExtension = async (id: string) => {
    setIsLoading(true);
    try {
      const result = await extensionService.uninstallExtension(id);
      if (result.success) {
        // Update the extension in the local state
        setExtensions(prev => 
          prev.map(ext => 
            ext.id === id 
              ? { ...ext, isInstalled: false, isEnabled: false }
              : ext
          )
        );
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to uninstall extension';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const enableExtension = async (id: string) => {
    setIsLoading(true);
    try {
      const result = await extensionService.enableExtension(id);
      if (result.success) {
        // Update the extension in the local state
        setExtensions(prev => 
          prev.map(ext => 
            ext.id === id 
              ? { ...ext, isEnabled: true }
              : ext
          )
        );
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable extension';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disableExtension = async (id: string) => {
    setIsLoading(true);
    try {
      const result = await extensionService.disableExtension(id);
      if (result.success) {
        // Update the extension in the local state
        setExtensions(prev => 
          prev.map(ext => 
            ext.id === id 
              ? { ...ext, isEnabled: false }
              : ext
          )
        );
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disable extension';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getInstalledExtensions = async () => {
    try {
      const installed = await extensionService.getInstalledExtensions();
      return installed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get installed extensions';
      setError(errorMessage);
      throw err;
    }
  };

  const getEnabledExtensions = async () => {
    try {
      const enabled = await extensionService.getEnabledExtensions();
      return enabled;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get enabled extensions';
      setError(errorMessage);
      throw err;
    }
  };

  const refreshExtensions = async () => {
    await searchExtensions();
    await loadCategories();
  };

  // Load initial data
  useEffect(() => {
    refreshExtensions();
  }, []);

  return {
    extensions,
    categories,
    isLoading,
    error,
    searchExtensions,
    loadCategories,
    installExtension,
    uninstallExtension,
    enableExtension,
    disableExtension,
    getInstalledExtensions,
    getEnabledExtensions,
    refreshExtensions,
  };
}