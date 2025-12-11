import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DiffViewer } from "./DiffViewer";
import { Loader2 } from "lucide-react";

interface FileChange {
  path: string;
  oldContent: string;
  newContent: string;
}

interface PRPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: FileChange[];
  prTitle: string;
  prDescription: string;
  onConfirm: () => Promise<void>;
  isCreating?: boolean;
}

export function PRPreviewDialog({
  open,
  onOpenChange,
  changes,
  prTitle,
  prDescription,
  onConfirm,
  isCreating = false,
}: PRPreviewDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Changes</DialogTitle>
          <DialogDescription>
            Review the proposed changes before creating the pull request
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">PR Title</h3>
            <p className="text-sm text-muted-foreground">{prTitle}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Description</h3>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">
              {prDescription}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">File Changes ({changes.length})</h3>
            <DiffViewer changes={changes} />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting || isCreating}>
            {(isSubmitting || isCreating) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Pull Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
