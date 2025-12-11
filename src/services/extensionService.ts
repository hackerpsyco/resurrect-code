import { Extension, ExtensionCategory, ExtensionSearchFilters } from '@/types/extensions';

// Mock extension data - in a real app, this would come from an API
const mockExtensions: Extension[] = [
  {
    id: 'ms-python.python',
    name: 'python',
    displayName: 'Python',
    description: 'IntelliSense (Pylance), Linting, Debugging (multi-threaded, remote), Jupyter Notebooks, code formatting, refactoring, unit tests, and more.',
    version: '2024.0.1',
    author: 'Microsoft',
    category: 'languages',
    icon: '🐍',
    rating: 4.8,
    downloads: 85000000,
    isInstalled: false,
    isEnabled: false,
    size: '45.2 MB',
    lastUpdated: '2024-01-15',
    homepage: 'https://github.com/Microsoft/vscode-python',
    repository: 'https://github.com/Microsoft/vscode-python',
    license: 'MIT',
    keywords: ['python', 'intellisense', 'debugging', 'linting'],
    engines: { vscode: '^1.74.0' },
    activationEvents: ['onLanguage:python'],
    contributes: {
      languages: [{
        id: 'python',
        aliases: ['Python', 'py'],
        extensions: ['.py', '.pyi', '.pyc', '.pyo', '.pyw', '.pyz']
      }]
    }
  },
  {
    id: 'ms-vscode.vscode-typescript-next',
    name: 'typescript',
    displayName: 'TypeScript Importer',
    description: 'Automatically searches for TypeScript definitions in workspace files and provides all known symbols as completion item to allow code completion.',
    version: '4.9.4',
    author: 'Microsoft',
    category: 'languages',
    icon: '📘',
    rating: 4.6,
    downloads: 12000000,
    isInstalled: true,
    isEnabled: true,
    size: '12.8 MB',
    lastUpdated: '2024-01-10',
    license: 'MIT',
    keywords: ['typescript', 'javascript', 'intellisense'],
    engines: { vscode: '^1.70.0' }
  },
  {
    id: 'esbenp.prettier-vscode',
    name: 'prettier',
    displayName: 'Prettier - Code formatter',
    description: 'Code formatter using prettier',
    version: '10.1.0',
    author: 'Prettier',
    category: 'formatters',
    icon: '💅',
    rating: 4.7,
    downloads: 35000000,
    isInstalled: true,
    isEnabled: true,
    size: '8.4 MB',
    lastUpdated: '2024-01-08',
    license: 'MIT',
    keywords: ['formatter', 'prettier', 'javascript', 'typescript'],
    engines: { vscode: '^1.5.0' }
  },
  {
    id: 'ms-vscode.vscode-json',
    name: 'json',
    displayName: 'JSON Language Features',
    description: 'Provides rich language support for JSON files including IntelliSense, validation, formatting, and more.',
    version: '1.0.0',
    author: 'Microsoft',
    category: 'languages',
    icon: '📄',
    rating: 4.5,
    downloads: 50000000,
    isInstalled: false,
    isEnabled: false,
    size: '2.1 MB',
    lastUpdated: '2024-01-12',
    license: 'MIT',
    keywords: ['json', 'intellisense', 'validation'],
    engines: { vscode: '^1.0.0' }
  },
  {
    id: 'bradlc.vscode-tailwindcss',
    name: 'tailwindcss',
    displayName: 'Tailwind CSS IntelliSense',
    description: 'Intelligent Tailwind CSS tooling for VS Code',
    version: '0.10.5',
    author: 'Tailwind Labs',
    category: 'languages',
    icon: '🎨',
    rating: 4.9,
    downloads: 8000000,
    isInstalled: false,
    isEnabled: false,
    size: '15.6 MB',
    lastUpdated: '2024-01-14',
    license: 'MIT',
    keywords: ['tailwind', 'css', 'intellisense', 'autocomplete'],
    engines: { vscode: '^1.65.0' }
  },
  {
    id: 'github.copilot',
    name: 'copilot',
    displayName: 'GitHub Copilot',
    description: 'Your AI pair programmer',
    version: '1.156.0',
    author: 'GitHub',
    category: 'productivity',
    icon: '🤖',
    rating: 4.4,
    downloads: 25000000,
    isInstalled: false,
    isEnabled: false,
    size: '32.1 MB',
    lastUpdated: '2024-01-16',
    license: 'Proprietary',
    keywords: ['ai', 'copilot', 'autocomplete', 'github'],
    engines: { vscode: '^1.74.0' }
  },
  {
    id: 'dracula-theme.theme-dracula',
    name: 'dracula',
    displayName: 'Dracula Official',
    description: 'Official Dracula Theme. A dark theme for many editors, shells, and more.',
    version: '2.24.2',
    author: 'Dracula Theme',
    category: 'themes',
    icon: '🧛',
    rating: 4.8,
    downloads: 5000000,
    isInstalled: false,
    isEnabled: false,
    size: '1.2 MB',
    lastUpdated: '2024-01-05',
    license: 'MIT',
    keywords: ['theme', 'dark', 'dracula'],
    engines: { vscode: '^1.0.0' },
    contributes: {
      themes: [{
        label: 'Dracula',
        uiTheme: 'vs-dark',
        path: './theme/dracula.json'
      }]
    }
  },
  {
    id: 'ms-vscode.vscode-eslint',
    name: 'eslint',
    displayName: 'ESLint',
    description: 'Integrates ESLint JavaScript into VS Code.',
    version: '2.4.4',
    author: 'Microsoft',
    category: 'formatters',
    icon: '🔍',
    rating: 4.6,
    downloads: 28000000,
    isInstalled: true,
    isEnabled: true,
    size: '6.8 MB',
    lastUpdated: '2024-01-11',
    license: 'MIT',
    keywords: ['eslint', 'linter', 'javascript', 'typescript'],
    engines: { vscode: '^1.74.0' }
  },
  {
    id: 'saoudrizwan.claude-dev',
    name: 'cline',
    displayName: 'Cline (Claude Dev)',
    description: 'Autonomous coding agent right in your editor. Cline can handle complex software development tasks with Claude AI.',
    version: '2.1.0',
    author: 'Saoud Rizwan',
    category: 'productivity',
    icon: '🤖',
    rating: 4.9,
    downloads: 2500000,
    isInstalled: false,
    isEnabled: false,
    size: '18.4 MB',
    lastUpdated: '2024-01-18',
    homepage: 'https://github.com/saoudrizwan/claude-dev',
    repository: 'https://github.com/saoudrizwan/claude-dev',
    license: 'MIT',
    keywords: ['ai', 'claude', 'autonomous', 'coding', 'assistant', 'cline'],
    engines: { vscode: '^1.74.0' },
    activationEvents: ['*'],
    contributes: {
      commands: [
        {
          command: 'cline.start',
          title: 'Start New Task',
          category: 'Cline'
        },
        {
          command: 'cline.openChat',
          title: 'Open Cline Chat',
          category: 'Cline'
        }
      ]
    }
  }
];

const categories: ExtensionCategory[] = [
  {
    id: 'all',
    name: 'All Categories',
    description: 'Browse all available extensions',
    icon: '📦',
    count: mockExtensions.length
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Tools to boost your productivity',
    icon: '⚡',
    count: mockExtensions.filter(e => e.category === 'productivity').length
  },
  {
    id: 'languages',
    name: 'Programming Languages',
    description: 'Language support and syntax highlighting',
    icon: '💻',
    count: mockExtensions.filter(e => e.category === 'languages').length
  },
  {
    id: 'themes',
    name: 'Themes',
    description: 'Color themes and UI customization',
    icon: '🎨',
    count: mockExtensions.filter(e => e.category === 'themes').length
  },
  {
    id: 'formatters',
    name: 'Formatters',
    description: 'Code formatting and linting tools',
    icon: '📐',
    count: mockExtensions.filter(e => e.category === 'formatters').length
  },
  {
    id: 'debuggers',
    name: 'Debuggers',
    description: 'Debugging tools and utilities',
    icon: '🐛',
    count: mockExtensions.filter(e => e.category === 'debuggers').length
  },
  {
    id: 'snippets',
    name: 'Snippets',
    description: 'Code snippets and templates',
    icon: '📝',
    count: mockExtensions.filter(e => e.category === 'snippets').length
  }
];

class ExtensionService {
  private extensions: Extension[] = [...mockExtensions];
  private installedExtensions: Set<string> = new Set();
  private enabledExtensions: Set<string> = new Set();

  constructor() {
    // Load extension state from localStorage
    this.loadExtensionState();
    
    // Initialize with some pre-installed extensions
    this.extensions.forEach(ext => {
      if (ext.isInstalled) {
        this.installedExtensions.add(ext.id);
      }
      if (ext.isEnabled) {
        this.enabledExtensions.add(ext.id);
      }
    });
  }

  private saveExtensionState() {
    const state = {
      installed: Array.from(this.installedExtensions),
      enabled: Array.from(this.enabledExtensions)
    };
    localStorage.setItem('vscode-extensions-state', JSON.stringify(state));
  }

  private loadExtensionState() {
    try {
      const saved = localStorage.getItem('vscode-extensions-state');
      if (saved) {
        const state = JSON.parse(saved);
        this.installedExtensions = new Set(state.installed || []);
        this.enabledExtensions = new Set(state.enabled || []);
        
        // Update extension objects
        this.extensions.forEach(ext => {
          ext.isInstalled = this.installedExtensions.has(ext.id);
          ext.isEnabled = this.enabledExtensions.has(ext.id);
        });
      }
    } catch (error) {
      console.error('Failed to load extension state:', error);
    }
  }

  async searchExtensions(query: string = '', filters: ExtensionSearchFilters = { sortBy: 'relevance' }): Promise<Extension[]> {
    let results = [...this.extensions];

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      results = results.filter(ext => ext.category === filters.category);
    }

    // Apply installed filter
    if (filters.showInstalled !== undefined) {
      results = results.filter(ext => ext.isInstalled === filters.showInstalled);
    }

    // Apply enabled filter
    if (filters.showEnabled !== undefined) {
      results = results.filter(ext => ext.isEnabled === filters.showEnabled);
    }

    // Apply search query
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      results = results.filter(ext => 
        ext.displayName.toLowerCase().includes(searchTerm) ||
        ext.description.toLowerCase().includes(searchTerm) ||
        ext.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm)) ||
        ext.author.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    results.sort((a, b) => {
      switch (filters.sortBy) {
        case 'downloads':
          return b.downloads - a.downloads;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        case 'updated':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        default: // relevance
          if (query.trim()) {
            const aScore = this.calculateRelevanceScore(a, query);
            const bScore = this.calculateRelevanceScore(b, query);
            return bScore - aScore;
          }
          return b.downloads - a.downloads;
      }
    });

    return results;
  }

  private calculateRelevanceScore(extension: Extension, query: string): number {
    const searchTerm = query.toLowerCase();
    let score = 0;

    // Exact name match gets highest score
    if (extension.displayName.toLowerCase() === searchTerm) {
      score += 100;
    } else if (extension.displayName.toLowerCase().includes(searchTerm)) {
      score += 50;
    }

    // Description match
    if (extension.description.toLowerCase().includes(searchTerm)) {
      score += 20;
    }

    // Keywords match
    extension.keywords.forEach(keyword => {
      if (keyword.toLowerCase().includes(searchTerm)) {
        score += 10;
      }
    });

    // Author match
    if (extension.author.toLowerCase().includes(searchTerm)) {
      score += 5;
    }

    return score;
  }

  async getCategories(): Promise<ExtensionCategory[]> {
    return categories;
  }

  async getExtension(id: string): Promise<Extension | null> {
    return this.extensions.find(ext => ext.id === id) || null;
  }

  async installExtension(id: string): Promise<{ success: boolean; message: string }> {
    const extension = this.extensions.find(ext => ext.id === id);
    if (!extension) {
      return { success: false, message: 'Extension not found' };
    }

    if (extension.isInstalled) {
      return { success: false, message: 'Extension is already installed' };
    }

    // Simulate installation delay with progress
    await new Promise(resolve => setTimeout(resolve, 2000));

    extension.isInstalled = true;
    extension.isEnabled = true;
    this.installedExtensions.add(id);
    this.enabledExtensions.add(id);

    // Store in localStorage for persistence
    this.saveExtensionState();

    return { success: true, message: `${extension.displayName} installed and activated successfully! Features are now available in the code editor.` };
  }

  async uninstallExtension(id: string): Promise<{ success: boolean; message: string }> {
    const extension = this.extensions.find(ext => ext.id === id);
    if (!extension) {
      return { success: false, message: 'Extension not found' };
    }

    if (!extension.isInstalled) {
      return { success: false, message: 'Extension is not installed' };
    }

    // Simulate uninstallation delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    extension.isInstalled = false;
    extension.isEnabled = false;
    this.installedExtensions.delete(id);
    this.enabledExtensions.delete(id);

    // Save state
    this.saveExtensionState();

    return { success: true, message: `${extension.displayName} uninstalled successfully` };
  }

  async enableExtension(id: string): Promise<{ success: boolean; message: string }> {
    const extension = this.extensions.find(ext => ext.id === id);
    if (!extension) {
      return { success: false, message: 'Extension not found' };
    }

    if (!extension.isInstalled) {
      return { success: false, message: 'Extension must be installed first' };
    }

    if (extension.isEnabled) {
      return { success: false, message: 'Extension is already enabled' };
    }

    extension.isEnabled = true;
    this.enabledExtensions.add(id);

    // Save state
    this.saveExtensionState();

    return { success: true, message: `${extension.displayName} enabled successfully` };
  }

  async disableExtension(id: string): Promise<{ success: boolean; message: string }> {
    const extension = this.extensions.find(ext => ext.id === id);
    if (!extension) {
      return { success: false, message: 'Extension not found' };
    }

    if (!extension.isEnabled) {
      return { success: false, message: 'Extension is already disabled' };
    }

    extension.isEnabled = false;
    this.enabledExtensions.delete(id);

    // Save state
    this.saveExtensionState();

    return { success: true, message: `${extension.displayName} disabled successfully` };
  }

  async getInstalledExtensions(): Promise<Extension[]> {
    return this.extensions.filter(ext => ext.isInstalled);
  }

  async getEnabledExtensions(): Promise<Extension[]> {
    return this.extensions.filter(ext => ext.isEnabled);
  }
}

export const extensionService = new ExtensionService();