import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Keyboard,
  Search,
  Save,
  Copy,
  Clipboard,
  Undo,
  Redo,
  FileText,
  Terminal,
  Settings,
  Zap,
  Code,
  Play,
  Bug,
  GitBranch,
  Folder,
  X
} from "lucide-react";

interface Shortcut {
  id: string;
  category: string;
  action: string;
  keys: string[];
  description: string;
  icon: React.ComponentType<any>;
}

const shortcuts: Shortcut[] = [
  // File Operations
  {
    id: "save",
    category: "File",
    action: "Save File",
    keys: ["Ctrl", "S"],
    description: "Save the current file",
    icon: Save
  },
  {
    id: "save-all",
    category: "File",
    action: "Save All",
    keys: ["Ctrl", "Shift", "S"],
    description: "Save all open files",
    icon: Save
  },
  {
    id: "new-file",
    category: "File",
    action: "New File",
    keys: ["Ctrl", "N"],
    description: "Create a new file",
    icon: FileText
  },
  {
    id: "open-file",
    category: "File",
    action: "Open File",
    keys: ["Ctrl", "O"],
    description: "Open an existing file",
    icon: Folder
  },
  {
    id: "close-file",
    category: "File",
    action: "Close File",
    keys: ["Ctrl", "W"],
    description: "Close the current file",
    icon: X
  },

  // Search & Navigation
  {
    id: "quick-open",
    category: "Navigation",
    action: "Quick Open",
    keys: ["Ctrl", "P"],
    description: "Quickly open files by name",
    icon: Search
  },
  {
    id: "find",
    category: "Navigation",
    action: "Find",
    keys: ["Ctrl", "F"],
    description: "Find text in current file",
    icon: Search
  },
  {
    id: "find-replace",
    category: "Navigation",
    action: "Find & Replace",
    keys: ["Ctrl", "H"],
    description: "Find and replace text",
    icon: Search
  },
  {
    id: "go-to-line",
    category: "Navigation",
    action: "Go to Line",
    keys: ["Ctrl", "G"],
    description: "Jump to specific line number",
    icon: Code
  },
  {
    id: "command-palette",
    category: "Navigation",
    action: "Command Palette",
    keys: ["Ctrl", "Shift", "P"],
    description: "Open command palette",
    icon: Terminal
  },

  // Editing
  {
    id: "copy",
    category: "Edit",
    action: "Copy",
    keys: ["Ctrl", "C"],
    description: "Copy selected text",
    icon: Copy
  },
  {
    id: "paste",
    category: "Edit",
    action: "Paste",
    keys: ["Ctrl", "V"],
    description: "Paste from clipboard",
    icon: Clipboard
  },
  {
    id: "cut",
    category: "Edit",
    action: "Cut",
    keys: ["Ctrl", "X"],
    description: "Cut selected text",
    icon: Copy
  },
  {
    id: "undo",
    category: "Edit",
    action: "Undo",
    keys: ["Ctrl", "Z"],
    description: "Undo last action",
    icon: Undo
  },
  {
    id: "redo",
    category: "Edit",
    action: "Redo",
    keys: ["Ctrl", "Y"],
    description: "Redo last undone action",
    icon: Redo
  },
  {
    id: "select-all",
    category: "Edit",
    action: "Select All",
    keys: ["Ctrl", "A"],
    description: "Select all text",
    icon: Code
  },
  {
    id: "duplicate-line",
    category: "Edit",
    action: "Duplicate Line",
    keys: ["Shift", "Alt", "↓"],
    description: "Duplicate current line",
    icon: Code
  },
  {
    id: "move-line-up",
    category: "Edit",
    action: "Move Line Up",
    keys: ["Alt", "↑"],
    description: "Move current line up",
    icon: Code
  },
  {
    id: "move-line-down",
    category: "Edit",
    action: "Move Line Down",
    keys: ["Alt", "↓"],
    description: "Move current line down",
    icon: Code
  },
  {
    id: "comment-line",
    category: "Edit",
    action: "Toggle Comment",
    keys: ["Ctrl", "/"],
    description: "Toggle line comment",
    icon: Code
  },

  // Code Features
  {
    id: "format-document",
    category: "Code",
    action: "Format Document",
    keys: ["Shift", "Alt", "F"],
    description: "Format entire document",
    icon: Code
  },
  {
    id: "auto-complete",
    category: "Code",
    action: "Trigger Autocomplete",
    keys: ["Ctrl", "Space"],
    description: "Show autocomplete suggestions",
    icon: Zap
  },
  {
    id: "go-to-definition",
    category: "Code",
    action: "Go to Definition",
    keys: ["F12"],
    description: "Jump to symbol definition",
    icon: Code
  },
  {
    id: "peek-definition",
    category: "Code",
    action: "Peek Definition",
    keys: ["Alt", "F12"],
    description: "Peek at symbol definition",
    icon: Code
  },
  {
    id: "rename-symbol",
    category: "Code",
    action: "Rename Symbol",
    keys: ["F2"],
    description: "Rename all occurrences",
    icon: Code
  },

  // Terminal & Debug
  {
    id: "toggle-terminal",
    category: "Terminal",
    action: "Toggle Terminal",
    keys: ["Ctrl", "`"],
    description: "Show/hide integrated terminal",
    icon: Terminal
  },
  {
    id: "new-terminal",
    category: "Terminal",
    action: "New Terminal",
    keys: ["Ctrl", "Shift", "`"],
    description: "Create new terminal instance",
    icon: Terminal
  },
  {
    id: "run-file",
    category: "Run",
    action: "Run File",
    keys: ["F5"],
    description: "Run current file",
    icon: Play
  },
  {
    id: "debug-file",
    category: "Debug",
    action: "Start Debugging",
    keys: ["Ctrl", "F5"],
    description: "Start debugging session",
    icon: Bug
  },
  {
    id: "toggle-breakpoint",
    category: "Debug",
    action: "Toggle Breakpoint",
    keys: ["F9"],
    description: "Add/remove breakpoint",
    icon: Bug
  },

  // View & Layout
  {
    id: "toggle-sidebar",
    category: "View",
    action: "Toggle Sidebar",
    keys: ["Ctrl", "B"],
    description: "Show/hide file explorer",
    icon: Folder
  },
  {
    id: "toggle-panel",
    category: "View",
    action: "Toggle Panel",
    keys: ["Ctrl", "J"],
    description: "Show/hide bottom panel",
    icon: Terminal
  },
  {
    id: "zen-mode",
    category: "View",
    action: "Zen Mode",
    keys: ["Ctrl", "K", "Z"],
    description: "Enter distraction-free mode",
    icon: Code
  },
  {
    id: "split-editor",
    category: "View",
    action: "Split Editor",
    keys: ["Ctrl", "\\"],
    description: "Split editor vertically",
    icon: Code
  },

  // Git
  {
    id: "git-commit",
    category: "Git",
    action: "Git Commit",
    keys: ["Ctrl", "Enter"],
    description: "Commit staged changes",
    icon: GitBranch
  },
  {
    id: "git-push",
    category: "Git",
    action: "Git Push",
    keys: ["Ctrl", "Shift", "K"],
    description: "Push commits to remote",
    icon: GitBranch
  },

  // AI & Automation (Cursor-like)
  {
    id: "ai-chat",
    category: "AI",
    action: "Open AI Chat",
    keys: ["Ctrl", "L"],
    description: "Open Cline AI assistant",
    icon: Zap
  },
  {
    id: "ai-generate",
    category: "AI",
    action: "Generate Code",
    keys: ["Ctrl", "K"],
    description: "Generate code with AI",
    icon: Zap
  },
  {
    id: "ai-explain",
    category: "AI",
    action: "Explain Code",
    keys: ["Ctrl", "E"],
    description: "Explain selected code",
    icon: Zap
  },
  {
    id: "ai-fix",
    category: "AI",
    action: "Fix Errors",
    keys: ["Ctrl", "Shift", "F"],
    description: "Auto-fix code errors",
    icon: Zap
  }
];

export function KeyboardShortcutsPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(shortcuts.map(s => s.category)))];
  
  const filteredShortcuts = shortcuts.filter(shortcut => {
    const matchesSearch = shortcut.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shortcut.keys.join(" ").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || shortcut.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderKeyCombo = (keys: string[]) => (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <div key={index} className="flex items-center">
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="mx-1 text-gray-400">+</span>}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          title="Keyboard Shortcuts"
          className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#464647]"
        >
          <Keyboard className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search shortcuts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Shortcuts List */}
          <ScrollArea className="h-96">
            <div className="space-y-6">
              {categories.filter(cat => cat !== "All").map((category) => {
                const categoryShortcuts = filteredShortcuts.filter(s => s.category === category);
                if (categoryShortcuts.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      {category === "File" && <FileText className="w-4 h-4" />}
                      {category === "Navigation" && <Search className="w-4 h-4" />}
                      {category === "Edit" && <Code className="w-4 h-4" />}
                      {category === "Code" && <Code className="w-4 h-4" />}
                      {category === "Terminal" && <Terminal className="w-4 h-4" />}
                      {category === "Run" && <Play className="w-4 h-4" />}
                      {category === "Debug" && <Bug className="w-4 h-4" />}
                      {category === "View" && <Settings className="w-4 h-4" />}
                      {category === "Git" && <GitBranch className="w-4 h-4" />}
                      {category === "AI" && <Zap className="w-4 h-4" />}
                      {category}
                    </h3>
                    <div className="grid gap-2">
                      {categoryShortcuts.map((shortcut) => {
                        const IconComponent = shortcut.icon;
                        return (
                          <Card key={shortcut.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <IconComponent className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{shortcut.action}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {shortcut.description}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {shortcut.category}
                                </Badge>
                                {renderKeyCombo(shortcut.keys)}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                    {category !== categories[categories.length - 1] && <Separator className="mt-4" />}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Press <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Ctrl+?</kbd> to open this panel anytime</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}