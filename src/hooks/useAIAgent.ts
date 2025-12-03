import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ErrorInfo {
  deploymentId: string;
  projectName: string;
  branch: string;
  commitMessage: string;
  errorMessage: string;
  errorLogs: string[];
}

interface AgentStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "error";
  result?: unknown;
  timestamp?: string;
}

export function useAIAgent() {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const updateStep = (stepId: string, updates: Partial<AgentStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
    );
  };

  const runAgent = useCallback(async (errorInfo: ErrorInfo) => {
    setIsRunning(true);
    setSteps([
      { id: "analyze", name: "Analyzing Error", status: "pending" },
      { id: "search", name: "Searching Solutions", status: "pending" },
      { id: "generate", name: "Generating Fix", status: "pending" },
      { id: "pr", name: "Creating PR", status: "pending" },
    ]);

    try {
      // Step 1: Analyze error
      setCurrentStep("analyze");
      updateStep("analyze", { status: "running" });
      
      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke(
        "ai-agent",
        {
          body: {
            action: "analyze_error",
            errorInfo,
          },
        }
      );

      if (analyzeError) throw new Error(analyzeError.message);
      
      updateStep("analyze", {
        status: "completed",
        result: analyzeData.result,
        timestamp: new Date().toISOString(),
      });
      
      toast.info("Error analyzed", {
        description: analyzeData.result?.rootCause || "Analysis complete",
      });

      // Step 2: Search solutions
      setCurrentStep("search");
      updateStep("search", { status: "running" });

      const { data: searchData, error: searchError } = await supabase.functions.invoke(
        "ai-agent",
        {
          body: {
            action: "search_solution",
            errorAnalysis: JSON.stringify(analyzeData.result),
          },
        }
      );

      if (searchError) throw new Error(searchError.message);

      updateStep("search", {
        status: "completed",
        result: searchData.result,
        timestamp: new Date().toISOString(),
      });

      const solutionCount = searchData.result?.solutions?.length || 0;
      toast.info(`Found ${solutionCount} solution(s)`, {
        description: "Generating fix code...",
      });

      // Step 3: Generate fix
      setCurrentStep("generate");
      updateStep("generate", { status: "running" });

      const { data: fixData, error: fixError } = await supabase.functions.invoke(
        "ai-agent",
        {
          body: {
            action: "generate_fix",
            errorAnalysis: JSON.stringify(analyzeData.result),
            searchResults: JSON.stringify(searchData.result),
          },
        }
      );

      if (fixError) throw new Error(fixError.message);

      updateStep("generate", {
        status: "completed",
        result: fixData.result,
        timestamp: new Date().toISOString(),
      });

      // Step 4: Create PR (simulated for now)
      setCurrentStep("pr");
      updateStep("pr", { status: "running" });

      // Simulate PR creation delay
      await new Promise((r) => setTimeout(r, 1500));

      updateStep("pr", {
        status: "completed",
        result: {
          prUrl: `https://github.com/user/${errorInfo.projectName}/pull/42`,
          branch: "resurrect-fix",
        },
        timestamp: new Date().toISOString(),
      });

      toast.success("Fix ready!", {
        description: "Pull request created on branch 'resurrect-fix'",
      });

      setCurrentStep(null);
      return { success: true, fix: fixData.result };

    } catch (error) {
      console.error("AI Agent error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (currentStep) {
        updateStep(currentStep, { status: "error" });
      }

      // Handle rate limiting
      if (errorMessage.includes("429") || errorMessage.includes("Rate limit")) {
        toast.error("Rate limit exceeded", {
          description: "Please wait a moment and try again.",
        });
      } else if (errorMessage.includes("402")) {
        toast.error("AI credits exhausted", {
          description: "Please add credits to continue using AI features.",
        });
      } else {
        toast.error("Agent failed", {
          description: errorMessage,
        });
      }

      return { success: false, error: errorMessage };
    } finally {
      setIsRunning(false);
    }
  }, [currentStep]);

  return {
    runAgent,
    isRunning,
    steps,
    currentStep,
  };
}
