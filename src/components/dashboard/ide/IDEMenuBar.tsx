import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileCode,
  FolderOpen,
  Save,
  Copy,
  Clipboard,
  Scissors,
  Undo,
  Redo,
  Search,
  Eye,
  Terminal,
  Settings,
  GitBranch,
  GitCommit,
  ArrowDown,
  ArrowUp,
  Play,
  Square,
  Bug,
  Users,
  Share,
  Bell,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface IDEMenuBarProps {
  projectName: string;
  activeFile?: string;
  onNewFile: () => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onSaveAll: () => void;
  onCloseFile: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onCut: () => void;
  onFind: () => void;
  onReplace: () => void;
  onTogglePanel: () => void;
  onToggleSidebar: () => void;
  onRunCode: () => void;
  onDebugCode: () => void;
  onGitCommit: () => void;
  onGitPush: () => void;
  onGitPull: () => void;
  onOpenTerminal: () => void;
  onOpenSettings: () => void;
}

export function IDEMenuBar({
  projectName,
  activeFile,
  onNewFile,
  onOpenFile,
  onSaveFile,
  onSaveAll,
  onCloseFile,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onCut,
  onFind,
  onReplace,
  onTogglePanel,
  onToggleSidebar,
  onRunCode,
  onDebugCode,
  onGitCommit,
  onGitPush,
  onGitPull,
  onOpenTerminal,
  onOpenSettings,
}: IDEMenuBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showGitDialog, setShowGitDialog] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      toast.info(`Searching for: ${searchQuery}`);
      onFind();
    }
  };

  const handleGitCommit = () => {
    if (!commitMessage.trim()) {
      toast.error("Please enter a commit message");
      return;
    }
    onGitCommit();
    setCommitMessage("");
    setShowGitDialog(false);
    toast.success("Changes committed successfully");
  };

  return (
    <>
      {/* Main Menu Bar */}
      <div className="h-9 bg-[#2d2d30] border-b border-[#464647] flex items-center justify-between px-4">
        <div className="flex items-center gap-6">
          {/* Project Breadcrumb */}
          <div className="flex items-center gap-1 text-[#cccccc]">
            <FileCode className="w-4 h-4 text-[#0078d4]" />
            <span className="text-sm font-medium">{projectName}</span>
            {activeFile && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-sm">{activeFile.split('/').pop()}</span>
              </>
            )}
          </div>

          {/* Menu Items */}
          <div className="flex items-center gap-4 text-sm text-[#cccccc]">
            {/* File Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-1 text-sm text-[#cccccc] hover:text-white">
                  File
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#2d2d30] border-[#464647]">
                <DropdownMenuItem onClick={onNewFile} className="text-[#cccccc] hover:bg-[#464647]">
                  <FileCode className="w-4 h-4 mr-2" />
                  New File
                  <span className="ml-auto text-xs">Ctrl+N</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenFile} className="text-[#cccccc] hover:bg-[#464647]">
                  <FileCode className="w-4 h-4 mr-2" />
                  Open File
                  <span className="ml-auto text-xs">Ctrl+O</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#464647]" />
                <DropdownMenuItem onClick={onSaveFile} className="text-[#cccccc] hover:bg-[#464647]">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                  <span className="ml-auto text-xs">Ctrl+S</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSaveAll} className="text-[#cccccc] hover:bg-[#464647]">
                  <Save className="w-4 h-4 mr-2" />
                  Save All
                  <span className="ml-auto text-xs">Ctrl+Shift+S</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#464647]" />
                <DropdownMenuItem onClick={onCloseFile} className="text-[#cccccc] hover:bg-[#464647]">
                  Close File
                  <span className="ml-auto text-xs">Ctrl+W</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-1 text-sm text-[#cccccc] hover:text-white">
                  Edit
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#2d2d30] border-[#464647]">
                <DropdownMenuItem onClick={onUndo} className="text-[#cccccc] hover:bg-[#464647]">
                  <Undo className="w-4 h-4 mr-2" />
                  Undo
                  <span className="ml-auto text-xs">Ctrl+Z</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRedo} className="text-[#cccccc] hover:bg-[#464647]">
                  <Redo className="w-4 h-4 mr-2" />
                  Redo
                  <span className="ml-auto text-xs">Ctrl+Y</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#464647]" />
                <DropdownMenuItem onClick={onCut} className="text-[#cccccc] hover:bg-[#464647]">
                  <Scissors className="w-4 h-4 mr-2" />
                  Cut
                  <span className="ml-auto text-xs">Ctrl+X</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCopy} className="text-[#cccccc] hover:bg-[#464647]">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                  <span className="ml-auto text-xs">Ctrl+C</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPaste} className="text-[#cccccc] hover:bg-[#464647]">
                  <Clipboard className="w-4 h-4 mr-2" />
                  Paste
                  <span className="ml-auto text-xs">Ctrl+V</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#464647]" />
                <DropdownMenuItem onClick={onFind} className="text-[#cccccc] hover:bg-[#464647]">
                  <Search className="w-4 h-4 mr-2" />
                  Find
                  <span className="ml-auto text-xs">Ctrl+F</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onReplace} className="text-[#cccccc] hover:bg-[#464647]">
                  <Search className="w-4 h-4 mr-2" />
                  Replace
                  <span className="ml-auto text-xs">Ctrl+H</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-1 text-sm text-[#cccccc] hover:text-white">
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#2d2d30] border-[#464647]">
                <DropdownMenuItem onClick={onToggleSidebar} className="text-[#cccccc] hover:bg-[#464647]">
                  <Eye className="w-4 h-4 mr-2" />
                  Toggle Sidebar
                  <span className="ml-auto text-xs">Ctrl+B</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onTogglePanel} className="text-[#cccccc] hover:bg-[#464647]">
                  <Terminal className="w-4 h-4 mr-2" />
                  Toggle Panel
                  <span className="ml-auto text-xs">Ctrl+J</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenTerminal} className="text-[#cccccc] hover:bg-[#464647]">
                  <Terminal className="w-4 h-4 mr-2" />
                  Terminal
                  <span className="ml-auto text-xs">Ctrl+`</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Go Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-1 text-sm text-[#cccccc] hover:text-white">
                  Go
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#2d2d30] border-[#464647]">
                <DropdownMenuItem onClick={() => toast.info("Go to Line")} className="text-[#cccccc] hover:bg-[#464647]">
                  Go to Line
                  <span className="ml-auto text-xs">Ctrl+G</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Go to File")} className="text-[#cccccc] hover:bg-[#464647]">
                  Go to File
                  <span className="ml-auto text-xs">Ctrl+P</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Run Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-1 text-sm text-[#cccccc] hover:text-white">
                  Run
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#2d2d30] border-[#464647]">
                <DropdownMenuItem onClick={onRunCode} className="text-[#cccccc] hover:bg-[#464647]">
                  <Play className="w-4 h-4 mr-2" />
                  Run Code
                  <span className="ml-auto text-xs">F5</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDebugCode} className="text-[#cccccc] hover:bg-[#464647]">
                  <Bug className="w-4 h-4 mr-2" />
                  Debug Code
                  <span className="ml-auto text-xs">Ctrl+F5</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Stop execution")} className="text-[#cccccc] hover:bg-[#464647]">
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                  <span className="ml-auto text-xs">Shift+F5</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Git Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-1 text-sm text-[#cccccc] hover:text-white">
                  Git
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#2d2d30] border-[#464647]">
                <DropdownMenuItem onClick={() => setShowGitDialog(true)} className="text-[#cccccc] hover:bg-[#464647]">
                  <GitCommit className="w-4 h-4 mr-2" />
                  Commit
                  <span className="ml-auto text-xs">Ctrl+Enter</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onGitPush} className="text-[#cccccc] hover:bg-[#464647]">
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Push
                  <span className="ml-auto text-xs">Ctrl+Shift+K</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onGitPull} className="text-[#cccccc] hover:bg-[#464647]">
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Pull
                  <span className="ml-auto text-xs">Ctrl+Shift+P</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#464647]" />
                <DropdownMenuItem onClick={() => toast.info("Git status")} className="text-[#cccccc] hover:bg-[#464647]">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Terminal Menu */}
            <Button 
              variant="ghost" 
              className="h-auto p-1 text-sm text-[#cccccc] hover:text-white"
              onClick={onOpenTerminal}
            >
              Terminal
            </Button>
          </div>
        </div>

        {/* Right Side - Search and Actions */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search files, symbols, or actions..."
            className="w-64 h-7 bg-[#3c3c3c] border-[#464647] text-[#cccccc] text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-[#cccccc] hover:bg-[#464647]"
              onClick={() => toast.info("Collaboration features coming soon!")}
            >
              <Users className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-3 text-[#cccccc] hover:bg-[#464647] bg-[#0078d4]"
              onClick={() => toast.info("Share project")}
            >
              <Share className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
              onClick={() => toast.info("No new notifications")}
            >
              <Bell className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
              onClick={onOpenSettings}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Git Commit Dialog */}
      <Dialog open={showGitDialog} onOpenChange={setShowGitDialog}>
        <DialogContent className="bg-[#2d2d30] border-[#464647]">
          <DialogHeader>
            <DialogTitle className="text-[#cccccc]">Commit Changes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#cccccc] mb-2 block">Commit Message</label>
              <Input
                placeholder="Enter commit message..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="bg-[#3c3c3c] border-[#464647] text-[#cccccc]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commitMessage.trim()) {
                    handleGitCommit();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowGitDialog(false)}
                className="border-[#464647] text-[#cccccc] hover:bg-[#464647]"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleGitCommit}
                disabled={!commitMessage.trim()}
                className="bg-[#0078d4] hover:bg-[#106ebe]"
              >
                <GitCommit className="w-4 h-4 mr-2" />
                Commit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}