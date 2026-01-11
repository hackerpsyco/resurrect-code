import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Maximize2, Minimize2 } from 'lucide-react';

interface MobileResponsiveIDELayoutProps {
  children: React.ReactNode;
  sidebarContent: React.ReactNode;
  terminalContent: React.ReactNode;
  aiChatContent?: React.ReactNode;
  previewContent?: React.ReactNode;
  onClose: () => void;
}

interface IDEState {
  sidebarOpen: boolean;
  terminalOpen: boolean;
  terminalMaximized: boolean;
  previewMaximized: boolean;
  isMobile: boolean;
  isTablet: boolean;
  viewportWidth: number;
}

export function MobileResponsiveIDELayout({
  children,
  sidebarContent,
  terminalContent,
  aiChatContent,
  previewContent,
  onClose,
}: MobileResponsiveIDELayoutProps) {
  const [state, setState] = useState<IDEState>({
    sidebarOpen: false,
    terminalOpen: false,
    terminalMaximized: false,
    previewMaximized: false,
    isMobile: window.innerWidth < 640,
    isTablet: window.innerWidth >= 640 && window.innerWidth < 1024,
    viewportWidth: window.innerWidth,
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isMobile = width < 640;
      const isTablet = width >= 640 && width < 1024;

      setState((prev) => ({
        ...prev,
        isMobile,
        isTablet,
        viewportWidth: width,
        // Close sidebar when resizing to desktop
        sidebarOpen: isMobile ? prev.sidebarOpen : false,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when view changes on mobile
  useEffect(() => {
    if (state.isMobile && state.sidebarOpen) {
      setState((prev) => ({ ...prev, sidebarOpen: false }));
    }
  }, [state.isMobile, state.sidebarOpen]);

  const toggleSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  }, []);

  const toggleTerminal = useCallback(() => {
    setState((prev) => ({ ...prev, terminalOpen: !prev.terminalOpen }));
  }, []);

  const toggleTerminalMaximize = useCallback(() => {
    setState((prev) => ({
      ...prev,
      terminalMaximized: !prev.terminalMaximized,
    }));
  }, []);

  const togglePreviewMaximize = useCallback(() => {
    setState((prev) => ({
      ...prev,
      previewMaximized: !prev.previewMaximized,
    }));
  }, []);

  // Mobile layout (< 640px)
  if (state.isMobile) {
    return (
      <div className="w-full h-screen bg-[#0d1117] flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="h-14 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-4 flex-shrink-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#238636] flex items-center justify-center">
              <span className="text-white font-bold text-xs">R</span>
            </div>
            <span className="text-white font-semibold text-sm truncate">IDE</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-8 w-8 p-0 text-[#cccccc] hover:bg-[#30363d]"
            >
              {state.sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-[#cccccc] hover:bg-[#30363d]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Sidebar Overlay */}
        {state.sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setState((prev) => ({ ...prev, sidebarOpen: false }))}
          />
        )}

        {/* Mobile Sidebar */}
        {state.sidebarOpen && (
          <div className="fixed left-0 top-14 bottom-0 w-64 bg-[#161b22] border-r border-[#30363d] z-40 flex flex-col overflow-y-auto">
            {sidebarContent}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor */}
          <div className="flex-1 overflow-auto">{children}</div>

          {/* Terminal - Collapsible on Mobile */}
          {state.terminalMaximized ? (
            // Fullscreen Terminal
            <div className="fixed inset-0 z-50 bg-[#0d1117] flex flex-col">
              <div className="h-12 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-4 flex-shrink-0">
                <span className="text-white font-semibold text-sm">Terminal</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTerminalMaximize}
                  className="h-8 w-8 p-0 text-[#cccccc] hover:bg-[#30363d]"
                >
                  <Minimize2 className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto">{terminalContent}</div>
            </div>
          ) : state.terminalOpen ? (
            // Minimized Terminal
            <div className="h-40 bg-[#161b22] border-t border-[#30363d] flex flex-col flex-shrink-0">
              <div className="h-10 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between px-4 flex-shrink-0">
                <span className="text-white font-semibold text-xs">Terminal</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTerminalMaximize}
                    className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#30363d]"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTerminal}
                    className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#30363d]"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">{terminalContent}</div>
            </div>
          ) : null}

          {/* Terminal Toggle Button */}
          {!state.terminalOpen && !state.terminalMaximized && (
            <div className="h-10 bg-[#161b22] border-t border-[#30363d] flex items-center px-4 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTerminal}
                className="border-[#30363d] text-[#cccccc] hover:bg-[#21262d] text-xs"
              >
                Show Terminal
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tablet layout (640px - 1024px)
  if (state.isTablet) {
    return (
      <div className="w-full h-screen bg-[#0d1117] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#238636] flex items-center justify-center">
              <span className="text-white font-bold text-xs">R</span>
            </div>
            <span className="text-white font-semibold text-sm">IDE</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-[#cccccc] hover:bg-[#30363d]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-[#161b22] border-r border-[#30363d] overflow-y-auto flex-shrink-0">
            {sidebarContent}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Editor */}
            <div className="flex-1 overflow-auto">{children}</div>

            {/* Terminal */}
            {state.terminalOpen && (
              <div className="h-48 bg-[#161b22] border-t border-[#30363d] flex flex-col flex-shrink-0">
                <div className="h-10 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between px-4 flex-shrink-0">
                  <span className="text-white font-semibold text-xs">Terminal</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTerminal}
                    className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#30363d]"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-auto">{terminalContent}</div>
              </div>
            )}

            {/* Terminal Toggle */}
            {!state.terminalOpen && (
              <div className="h-10 bg-[#161b22] border-t border-[#30363d] flex items-center px-4 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTerminal}
                  className="border-[#30363d] text-[#cccccc] hover:bg-[#21262d] text-xs"
                >
                  Show Terminal
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout (≥ 1024px)
  return (
    <div className="w-full h-screen bg-[#0d1117] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-[#238636] flex items-center justify-center">
            <span className="text-white font-bold text-xs">R</span>
          </div>
          <span className="text-white font-semibold">IDE</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-[#cccccc] hover:bg-[#30363d]"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-[#161b22] border-r border-[#30363d] overflow-y-auto flex-shrink-0">
          {sidebarContent}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor and Preview/AI Chat */}
          <div className="flex-1 flex overflow-hidden gap-0">
            {/* Editor */}
            <div className="flex-1 overflow-auto">{children}</div>

            {/* Right Panel (AI Chat or Preview) */}
            {aiChatContent && (
              <div className="w-96 bg-[#161b22] border-l border-[#30363d] overflow-y-auto flex-shrink-0">
                {aiChatContent}
              </div>
            )}
          </div>

          {/* Terminal */}
          {state.terminalOpen && (
            <div className="h-64 bg-[#161b22] border-t border-[#30363d] flex flex-col flex-shrink-0">
              <div className="h-10 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between px-4 flex-shrink-0">
                <span className="text-white font-semibold text-sm">Terminal</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTerminal}
                  className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#30363d]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto">{terminalContent}</div>
            </div>
          )}

          {/* Terminal Toggle */}
          {!state.terminalOpen && (
            <div className="h-10 bg-[#161b22] border-t border-[#30363d] flex items-center px-4 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTerminal}
                className="border-[#30363d] text-[#cccccc] hover:bg-[#21262d]"
              >
                Show Terminal
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
