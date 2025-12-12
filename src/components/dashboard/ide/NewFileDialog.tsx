import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileCode, Plus } from "lucide-react";
import { languageTemplates, getTemplateByName } from "@/services/languageTemplates";
import { toast } from "sonner";

interface NewFileDialogProps {
  onCreateFile: (path: string, content: string) => void;
}

export function NewFileDialog({ onCreateFile }: NewFileDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const handleCreate = () => {
    if (!fileName.trim()) {
      toast.error("Please enter a file name");
      return;
    }

    let content = "";
    if (selectedTemplate) {
      const template = getTemplateByName(selectedTemplate);
      content = template?.template || "";
    }

    // Add extension if not present
    let finalFileName = fileName.trim();
    if (selectedTemplate) {
      const template = getTemplateByName(selectedTemplate);
      if (template && !finalFileName.includes('.')) {
        finalFileName += template.extension;
      }
    }

    onCreateFile(finalFileName, content);
    setIsOpen(false);
    setFileName("");
    setSelectedTemplate("");
    toast.success(`Created ${finalFileName}`);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setFileName("");
    setSelectedTemplate("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="New File (Ctrl+N)" data-new-file-trigger>
          <Plus className="w-4 h-4 mr-2" />
          New File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            Create New File
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              placeholder="e.g., main.js, index.html, app.py"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template">Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Template</SelectItem>
                {languageTemplates.map((template) => (
                  <SelectItem key={template.name} value={template.name}>
                    <div className="flex items-center gap-2">
                      <span>{template.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({template.extension})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="text-sm text-muted-foreground">
              {getTemplateByName(selectedTemplate)?.description}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Create File
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}