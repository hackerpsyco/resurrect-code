import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { GitHubIntegration } from './GitHubIntegration';
import { VercelIntegration } from './VercelIntegration';
import { 
  X, 
  Settings, 
  User, 
  Palette, 
  Bell, 
  Keyboard, 
  Code, 
  Layout, 
  Github, 
  Zap,
  Search,
  RefreshCw,
  Heart,
  Terminal,
  Globe,
  Link
} from 'lucide-react';
import { toast } from 'sonner';

interface PlatformSettingsProps {
  onClose: () => void;
  /**
   * Optional: which section to show first when opened
   * e.g. "integrations" when coming from a "Connect GitHub" button
   */
  initialSection?: 'general' | 'editor' | 'terminal' | 'appearance' | 'notifications' | 'keybindings' | 'integrations';
  /**
   * Optional: which integration tab to show first
   */
  initialIntegration?: 'github' | 'vercel';
}

export function PlatformSettings({ onClose, initialSection, initialIntegration }: PlatformSettingsProps) {
  const [activeSection, setActiveSection] = useState<
    'general' | 'editor' | 'terminal' | 'appearance' | 'notifications' | 'keybindings' | 'integrations'
  >(initialSection ?? 'general');
  const [activeIntegration, setActiveIntegration] = useState<'github' | 'vercel'>(initialIntegration ?? 'github');
  const [settings, setSettings] = useState({
    // General
    theme: 'dark',
    language: 'en',
    autoSave: true,
    
    // Editor
    fontFamily: 'Fira Code, Consolas, Courier New',
    fontSize: 14,
    fontLigatures: true,
    wordWrap: 'on',
    minimap: true,
    lineNumbers: true,
    
    // Terminal
    terminalFontSize: 14,
    terminalTheme: 'dark',
    realExecution: true,
    
    // Appearance
    sidebarPosition: 'left',
    panelPosition: 'bottom',
    showActivityBar: true,
    
    // Notifications
    enableNotifications: true,
    soundEnabled: false,
    
    // Integrations
    githubConnected: false,
    vercelConnected: false,
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const sidebarSections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'editor', label: 'Editor', icon: Code },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'keybindings', label: 'Keybindings', icon: Keyboard },
    { id: 'integrations', label: 'Integrations', icon: Zap },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">🌍 General Settings</h3>
        <p className="text-sm text-gray-400 mb-6">Configure your platform preferences and behavior.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
          <Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
            <SelectTrigger className="w-full bg-[#3c3c3c] border-[#464647] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
          <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
            <SelectTrigger className="w-full bg-[#3c3c3c] border-[#464647] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-300">Auto Save</label>
            <p className="text-xs text-gray-500">Automatically save files when editing</p>
          </div>
          <Switch 
            checked={settings.autoSave} 
            onCheckedChange={(checked) => updateSetting('autoSave', checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderEditorSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">📝 Editor Settings</h3>
        <p className="text-sm text-gray-400 mb-6">Customize your coding environment, font, and minimap.</p>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-blue-400 font-medium mb-4 flex items-center gap-2">
            <Code className="w-4 h-4" />
            Typography
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Font Family</label>
              <p className="text-xs text-gray-500 mb-2">The font family to use in the editor.</p>
              <Input
                value={settings.fontFamily}
                onChange={(e) => updateSetting('fontFamily', e.target.value)}
                className="bg-[#3c3c3c] border-[#464647] text-white"
                placeholder="Fira Code, Consolas, Courier New"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Font Size</label>
              <p className="text-xs text-gray-500 mb-2">Controls the font size in pixels.</p>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                  className="w-20 bg-[#3c3c3c] border-[#464647] text-white"
                />
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={(value) => updateSetting('fontSize', value[0])}
                  max={24}
                  min={10}
                  step={1}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Font Ligatures</label>
                <p className="text-xs text-gray-500">Enables font ligatures (e.g., -&gt; becomes →)</p>
              </div>
              <Switch 
                checked={settings.fontLigatures} 
                onCheckedChange={(checked) => updateSetting('fontLigatures', checked)}
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-blue-400 font-medium mb-4 flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Window & Layout
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Minimap</label>
                <p className="text-xs text-gray-500">Controls if the minimap is shown</p>
              </div>
              <Switch 
                checked={settings.minimap} 
                onCheckedChange={(checked) => updateSetting('minimap', checked)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Word Wrap</label>
              <p className="text-xs text-gray-500 mb-2">Controls how lines should wrap</p>
              <Select value={settings.wordWrap} onValueChange={(value) => updateSetting('wordWrap', value)}>
                <SelectTrigger className="w-full bg-[#3c3c3c] border-[#464647] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="on">On</SelectItem>
                  <SelectItem value="wordWrapColumn">Word Wrap Column</SelectItem>
                  <SelectItem value="bounded">Bounded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTerminalSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">💝 YOUR Platform Terminal</h3>
        <p className="text-sm text-gray-400 mb-6">Configure your own platform terminal settings and execution.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-300">Real Execution</label>
            <p className="text-xs text-gray-500">Enable real WebContainer execution (recommended)</p>
          </div>
          <Switch 
            checked={settings.realExecution} 
            onCheckedChange={(checked) => updateSetting('realExecution', checked)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Terminal Font Size</label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={settings.terminalFontSize}
              onChange={(e) => updateSetting('terminalFontSize', parseInt(e.target.value))}
              className="w-20 bg-[#3c3c3c] border-[#464647] text-white"
            />
            <Slider
              value={[settings.terminalFontSize]}
              onValueChange={(value) => updateSetting('terminalFontSize', value[0])}
              max={20}
              min={10}
              step={1}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Terminal Theme</label>
          <Select value={settings.terminalTheme} onValueChange={(value) => updateSetting('terminalTheme', value)}>
            <SelectTrigger className="w-full bg-[#3c3c3c] border-[#464647] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="high-contrast">High Contrast</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-medium">Your Own Platform</span>
          </div>
          <p className="text-sm text-red-300">
            This is YOUR platform - you own and control everything. 
            Real execution runs actual npm commands in WebContainer.
          </p>
        </div>
      </div>
    </div>
  );

  const renderIntegrationsSettings = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Integrations</h2>
          <p className="text-[#7d8590]">
            Connect your accounts to access repositories and manage deployments
          </p>
        </div>

        {/* Integration Tabs */}
        <div className="flex gap-2 border-b border-[#30363d]">
          <Button
            variant="ghost"
            onClick={() => setActiveIntegration('github')}
            className={`px-4 py-2 rounded-none border-b-2 ${
              activeIntegration === 'github'
                ? 'border-[#238636] text-[#238636] bg-[#238636]/10'
                : 'border-transparent text-[#7d8590] hover:text-white'
            }`}
          >
            <Github className="w-4 h-4 mr-2" />
            GitHub
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveIntegration('vercel')}
            className={`px-4 py-2 rounded-none border-b-2 ${
              activeIntegration === 'vercel'
                ? 'border-black text-white bg-black/10'
                : 'border-transparent text-[#7d8590] hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 mr-2" />
            Vercel
          </Button>
        </div>

        {/* Integration Content */}
        <div className="mt-6">
          {activeIntegration === 'github' && <GitHubIntegration />}
          {activeIntegration === 'vercel' && <VercelIntegration />}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'editor':
        return renderEditorSettings();
      case 'terminal':
        return renderTerminalSettings();
      case 'integrations':
        return renderIntegrationsSettings();
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">Settings section coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1e1e] flex">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-[#323233] border-b border-[#464647] flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#28ca42]"></div>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">YOUR Platform Settings</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#464647]"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Sidebar */}
      <div className="w-64 bg-[#252526] border-r border-[#464647] pt-12">
        <div className="p-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
            PREFERENCES
          </h2>
          <div className="space-y-1">
            {sidebarSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-[#37373d] text-white border-l-2 border-l-blue-400'
                      : 'text-gray-300 hover:bg-[#2a2d2e] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-12">
        <div className="h-full overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search settings..."
                  className="pl-10 bg-[#3c3c3c] border-[#464647] text-white"
                />
              </div>
            </div>

            {/* Content */}
            {renderContent()}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-[#464647]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span>YOUR Platform Settings</span>
                  <span className="text-gray-600">•</span>
                  <span>You own and control everything</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      // Currently only in-memory UI preferences live here.
                      // Integration keys & repos are saved via their own "Save" buttons.
                      toast.success("Preferences saved. GitHub/Vercel keys and repos are saved in the Integrations section.");
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}