import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCode, GitCompare, Save, X } from "lucide-react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

interface FileEdit {
  path: string;
  originalContent: string;
  modifiedContent: string;
  language: string;
}

interface DiffCodeEditorProps {
  files: FileEdit[];
  onSave: (files: FileEdit[]) => void;
  onClose: () => void;
}

export function DiffCodeEditor({ files, onSave, onClose }: DiffCodeEditorProps) {
  const [activeFile, setActiveFile] = useState(0);
  const [editedFiles, setEditedFiles] = useState<FileEdit[]>(files);

  useEffect(() => {
    setEditedFiles(files);
  }, [files]);

  const handleContentChange = (index: number, newContent: string) => {
    setEditedFiles((prev) =>
      prev.map((file, i) => (i === index ? { ...file, modifiedContent: newContent } : file))
    );
  };

  const styles = {
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
  };

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No files to edit
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileCode className="w-5 h-5" />
          Code Editor
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onSave(editedFiles)}>
            <Save className="w-4 h-4 mr-2" />
            Save All
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs value={String(activeFile)} onValueChange={(v) => setActiveFile(Number(v))}>
          <TabsList className="w-full justify-start rounded-none border-b">
            {editedFiles.map((file, index) => (
              <TabsTrigger key={index} value={String(index)} className="gap-2">
                <FileCode className="w-3 h-3" />
                {file.path.split("/").pop()}
              </TabsTrigger>
            ))}
          </TabsList>

          {editedFiles.map((file, index) => (
            <TabsContent key={index} value={String(index)} className="h-[calc(100vh-300px)] m-0">
              <Tabs defaultValue="diff" className="h-full">
                <TabsList className="ml-4 mt-2">
                  <TabsTrigger value="diff" className="gap-2">
                    <GitCompare className="w-3 h-3" />
                    Diff View
                  </TabsTrigger>
                  <TabsTrigger value="edit" className="gap-2">
                    <FileCode className="w-3 h-3" />
                    Edit
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="diff" className="h-[calc(100%-50px)] overflow-auto">
                  <ReactDiffViewer
                    oldValue={file.originalContent}
                    newValue={file.modifiedContent}
                    splitView={true}
                    compareMethod={DiffMethod.WORDS}
                    useDarkTheme={true}
                    styles={styles}
                    leftTitle="Original"
                    rightTitle="AI Modified"
                    showDiffOnly={false}
                  />
                </TabsContent>

                <TabsContent value="edit" className="h-[calc(100%-50px)] p-4">
                  <textarea
                    className="w-full h-full font-mono text-sm bg-muted p-4 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    value={file.modifiedContent}
                    onChange={(e) => handleContentChange(index, e.target.value)}
                    spellCheck={false}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
