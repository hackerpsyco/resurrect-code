import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Settings, Code, Bug, Zap, LogOut } from "lucide-react";

interface MobileResponsiveDashboardProps {
  children: React.ReactNode;
  activeView: "dashboard" | "editor" | "extensions" | "issues" | "devops" | "settings";
  onViewChange: (view: "dashboard" | "editor" | "extensions" | "issues" | "devops" | "settings") => void;
  user?: { email?: string };
  onSignOut?: () => void;
}

export function MobileResponsiveDashboard({
  children,
  activeView,
  onViewChange,
  user,
  onSignOut
}: MobileResponsiveDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Close sidebar on mobile when resizing to desktop
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when view changes on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [activeView, isMobile]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "extensions", label: "Extensions", icon: Code },
    { id: "issues", label: "Issues", icon: Bug },
    { id: "devops", label: "DevOps", icon: Zap },
    { id: "settings", label: "Settings", icon: Settings }
  ] as const;

  return (
    <div className="w-full h-screen bg-[#0d1117] flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-4 flex-shrink-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#238636] flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="text-white font-semibold text-sm">Resurrect</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-8 w-8 p-0 text-[#cccccc] hover:bg-[#30363d]"
          type="button"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 bg-[#161b22] border-r border-[#30363d] flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[#30363d] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#238636] flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
            <span className="text-white font-semibold">Resurrect</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  activeView === item.id
                    ? "bg-[#238636] text-white"
                    : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-[#30363d] p-4 space-y-3 flex-shrink-0">
          <div className="px-2">
            <p className="text-xs text-[#8b949e]">Signed in as</p>
            <p className="text-sm text-white font-medium truncate">{user?.email?.split('@')[0]}</p>
          </div>
          <Button
            onClick={onSignOut}
            variant="outline"
            size="sm"
            className="w-full border-[#30363d] text-[#cccccc] hover:bg-[#21262d]"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && sidebarOpen && (
        <div className="fixed left-0 top-14 bottom-0 w-64 bg-[#161b22] border-r border-[#30363d] z-40 flex flex-col overflow-y-auto">
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeView === item.id
                      ? "bg-[#238636] text-white"
                      : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-[#30363d] p-4 space-y-3 flex-shrink-0">
            <div className="px-2">
              <p className="text-xs text-[#8b949e]">Signed in as</p>
              <p className="text-sm text-white font-medium truncate">{user?.email?.split('@')[0]}</p>
            </div>
            <Button
              onClick={() => {
                onSignOut?.();
                setSidebarOpen(false);
              }}
              variant="outline"
              size="sm"
              className="w-full border-[#30363d] text-[#cccccc] hover:bg-[#21262d]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:flex h-16 bg-[#161b22] border-b border-[#30363d] items-center px-6 flex-shrink-0">
          <h1 className="text-xl font-semibold text-white">
            {navItems.find(item => item.id === activeView)?.label || 'Dashboard'}
          </h1>
        </div>

        {/* Content Area - Fill remaining space without blank areas */}
        <div className="flex-1 overflow-auto w-full bg-[#0d1117]">
          {children}
        </div>
      </div>
    </div>
  );
}
