export interface Extension {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  author: string;
  category: 'productivity' | 'themes' | 'languages' | 'debuggers' | 'formatters' | 'snippets' | 'other';
  icon?: string;
  rating: number;
  downloads: number;
  isInstalled: boolean;
  isEnabled: boolean;
  size: string;
  lastUpdated: string;
  homepage?: string;
  repository?: string;
  license: string;
  keywords: string[];
  engines: {
    vscode?: string;
    node?: string;
  };
  activationEvents?: string[];
  main?: string;
  contributes?: {
    commands?: Array<{
      command: string;
      title: string;
      category?: string;
    }>;
    keybindings?: Array<{
      command: string;
      key: string;
      when?: string;
    }>;
    languages?: Array<{
      id: string;
      aliases: string[];
      extensions: string[];
    }>;
    themes?: Array<{
      label: string;
      uiTheme: string;
      path: string;
    }>;
  };
}

export interface ExtensionCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

export interface ExtensionSearchFilters {
  category?: string;
  sortBy: 'relevance' | 'downloads' | 'rating' | 'name' | 'updated';
  showInstalled?: boolean;
  showEnabled?: boolean;
}