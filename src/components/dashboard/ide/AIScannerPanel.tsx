import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldAlert, AlertTriangle, Info, Play, Loader2 } from "lucide-react";

interface Issue {
  severity: "critical" | "warning" | "info";
  line?: number;
  description: string;
  fix?: string;
}

interface AIScannerPanelProps {
  currentFile?: { path: string; content?: string };
  onFixApplied?: (newContent: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://resurrect-code-lzgz.vercel.app';

export function AIScannerPanel({ currentFile, onFixApplied }: AIScannerPanelProps) {
  const [loading, setLoading] = useState(false);
  const [fixingIdx, setFixingIdx] = useState<number | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleApplyFix = async (issue: Issue, idx: number) => {
    if (!currentFile || !currentFile.content || !onFixApplied) return;

    setFixingIdx(idx);
    setError(null);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/ai/fix-file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          content: currentFile.content,
          issueDescription: issue.description,
          fileName: currentFile.path
        })
      });

      if (!response.ok) throw new Error("Fix failed");

      const data = await response.json();
      if (data.fixedContent) {
        onFixApplied(data.fixedContent);
      } else {
        throw new Error("No fixed content returned");
      }
    } catch (err) {
      setError("Failed to apply AI fix. Please try again.");
    } finally {
      setFixingIdx(null);
    }
  };

  const scanFile = async () => {
    if (!currentFile || !currentFile.content) return;

    setLoading(true);
    setIssues([]);
    setError(null);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/ai/scan-file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          content: currentFile.content,
          fileName: currentFile.path
        })
      });

      if (!response.ok) throw new Error("Scanner failed");

      const data = await response.json();
      setIssues(data.issues || []);
    } catch (err) {
      setError("Failed to run AI scan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (level: string) => {
    switch (level) {
      case "critical": return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#252526]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#464647]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#0078d4]" />
          <span className="text-sm font-medium text-white">AI Code Scanner</span>
        </div>
      </div>

      {/* Control Area */}
      <div className="p-3 border-b border-[#464647]">
        <Button 
          onClick={scanFile} 
          disabled={loading || !currentFile?.content}
          className="w-full bg-[#0078d4] hover:bg-[#006abc] text-white text-xs gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Scan Current File
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        {!loading && issues.length === 0 && (
          <p className="text-xs text-[#7d8590] text-center mt-4">
            {currentFile ? "Click Scan to analyze this file." : "Open a file to scan."}
          </p>
        )}

        <div className="space-y-2">
          {issues.map((issue, idx) => (
            <div key={idx} className="p-2 bg-[#1e1e1e] border border-[#464647] rounded space-y-1">
              <div className="flex items-center gap-2">
                {getSeverityIcon(issue.severity)}
                <span className="text-xs font-medium text-white">
                  {issue.line ? `Line ${issue.line}` : 'General'}
                </span>
                <span className="text-xs text-[#858585] uppercase">({issue.severity})</span>
              </div>
              <p className="text-xs text-[#cccccc] whitespace-pre-wrap">{issue.description}</p>
              {issue.fix && (
                <div className="mt-1 p-2 bg-[#1a1a1a] border-l-2 border-[#0078d4] text-[11px] text-[#7d8590] font-mono flex flex-col gap-2">
                  <span>Fix: {issue.fix}</span>
                  {onFixApplied && (
                    <Button 
                      onClick={() => handleApplyFix(issue, idx)}
                      disabled={fixingIdx !== null || loading}
                      className="self-start h-6 px-2 text-[10px] bg-[#0078d4] hover:bg-[#006abc] text-white"
                    >
                      {fixingIdx === idx ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      {fixingIdx === idx ? 'Applying...' : 'Apply Fix'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
