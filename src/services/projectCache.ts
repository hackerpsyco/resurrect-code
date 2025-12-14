// Project file caching service
interface CachedProject {
  id: string;
  owner: string;
  repo: string;
  branch: string;
  files: any[];
  fileTree: any[];
  lastUpdated: number;
  expiresAt: number;
}

class ProjectCacheService {
  private cache = new Map<string, CachedProject>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 10; // Maximum 10 projects cached

  private getCacheKey(owner: string, repo: string, branch: string = 'main'): string {
    return `${owner}/${repo}@${branch}`;
  }

  // Get cached project data
  get(owner: string, repo: string, branch: string = 'main'): CachedProject | null {
    const key = this.getCacheKey(owner, repo, branch);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`📦 Cache HIT for ${key}`);
    return cached;
  }

  // Set project data in cache
  set(owner: string, repo: string, branch: string = 'main', files: any[], fileTree: any[]): void {
    const key = this.getCacheKey(owner, repo, branch);
    
    // Remove oldest cache entries if we're at max size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
      console.log(`🗑️ Removed oldest cache entry: ${oldestKey}`);
    }
    
    const cached: CachedProject = {
      id: key,
      owner,
      repo,
      branch,
      files,
      fileTree,
      lastUpdated: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    };
    
    this.cache.set(key, cached);
    console.log(`💾 Cached project: ${key} (${files.length} files)`);
  }

  // Check if project is cached and valid
  has(owner: string, repo: string, branch: string = 'main'): boolean {
    return this.get(owner, repo, branch) !== null;
  }

  // Clear specific project from cache
  clear(owner: string, repo: string, branch: string = 'main'): void {
    const key = this.getCacheKey(owner, repo, branch);
    this.cache.delete(key);
    console.log(`🗑️ Cleared cache for: ${key}`);
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear();
    console.log('🗑️ Cleared all project cache');
  }

  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Preload project in background
  async preload(owner: string, repo: string, branch: string = 'main', fetchFileTree: Function): Promise<void> {
    const key = this.getCacheKey(owner, repo, branch);
    
    // Don't preload if already cached
    if (this.has(owner, repo, branch)) {
      console.log(`⚡ Project already cached: ${key}`);
      return;
    }

    try {
      console.log(`🔄 Preloading project: ${key}`);
      const files = await fetchFileTree(owner, repo, branch);
      
      if (files && files.length > 0) {
        const filteredFiles = files.filter((file: any) => 
          !file.path.includes('node_modules') && 
          !file.path.includes('.git/') &&
          (!file.path.startsWith('.') || 
           file.path === '.env' ||
           file.path === '.gitignore')
        );

        // Build file tree (simplified version)
        const fileTree = this.buildFileTree(filteredFiles);
        
        // Cache the data
        this.set(owner, repo, branch, filteredFiles, fileTree);
        console.log(`✅ Preloaded and cached: ${key}`);
      }
    } catch (error) {
      console.error(`❌ Failed to preload ${key}:`, error);
    }
  }

  // Build file tree structure
  private buildFileTree(files: any[]): any[] {
    const tree: any[] = [];
    const folderMap = new Map<string, any>();

    // Create folders
    const folders = new Set<string>();
    files.forEach(file => {
      const pathParts = file.path.split('/');
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderPath = pathParts.slice(0, i + 1).join('/');
        folders.add(folderPath);
      }
    });

    // Build folder structure
    Array.from(folders).sort().forEach(folderPath => {
      const pathParts = folderPath.split('/');
      const folderName = pathParts[pathParts.length - 1];
      
      const folderNode = {
        path: folderPath,
        type: "tree",
        sha: "",
        name: folderName,
        children: []
      };

      folderMap.set(folderPath, folderNode);

      if (pathParts.length === 1) {
        tree.push(folderNode);
      } else {
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = folderMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(folderNode);
        }
      }
    });

    // Add files
    files.forEach(file => {
      if (file.type === "blob" || !file.type) {
        const pathParts = file.path.split('/');
        const fileName = pathParts[pathParts.length - 1];
        
        const fileNode = {
          path: file.path,
          type: "blob",
          sha: file.sha || "",
          name: fileName
        };

        if (pathParts.length === 1) {
          tree.push(fileNode);
        } else {
          const parentPath = pathParts.slice(0, -1).join('/');
          const parent = folderMap.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(fileNode);
          }
        }
      }
    });

    // Sort: folders first, then files
    const sortTree = (nodes: any[]): any[] => {
      return nodes.sort((a, b) => {
        if (a.type === "tree" && b.type === "blob") return -1;
        if (a.type === "blob" && b.type === "tree") return 1;
        return a.name.localeCompare(b.name);
      }).map(node => ({
        ...node,
        children: node.children ? sortTree(node.children) : undefined
      }));
    };

    return sortTree(tree);
  }
}

// Export singleton instance
export const projectCache = new ProjectCacheService();