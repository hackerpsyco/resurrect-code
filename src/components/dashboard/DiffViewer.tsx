import { useMemo } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FileChange {
  path: string;
  oldContent: string;
  newContent: string;
}

interface DiffViewerProps {
  changes: FileChange[];
}

export function DiffViewer({ changes }: DiffViewerProps) {
  const styles = useMemo(
    () => ({
      variables: {
        dark: {
          diffViewerBackground: "#1e1e1e",
          diffViewerColor: "#d4d4d4",
          addedBackground: "#044B53",
          addedColor: "#d4d4d4",
          removedBackground: "#632F34",
          removedColor: "#d4d4d4",
          wordAddedBackground: "#055d67",
          wordRemovedBackground: "#7d383f",
          addedGutterBackground: "#034148",
          removedGutterBackground: "#4b1818",
          gutterBackground: "#2d2d2d",
          gutterBackgroundDark: "#262626",
          highlightBackground: "#2a2a2a",
          highlightGutterBackground: "#2d2d2d",
        },
      },
    }),
    []
  );

  if (changes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No changes to display
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {changes.map((change, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-sm font-mono">{change.path}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[500px]">
              <ReactDiffViewer
                oldValue={change.oldContent}
                newValue={change.newContent}
                splitView={true}
                compareMethod={DiffMethod.WORDS}
                useDarkTheme={true}
                styles={styles}
                leftTitle="Original"
                rightTitle="Modified"
                showDiffOnly={false}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
