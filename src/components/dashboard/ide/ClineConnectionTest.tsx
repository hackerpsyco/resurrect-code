import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Settings,
  Zap,
  Globe,
  Database,
  Bot,
} from "lucide-react";
import { AIService, getAIConfig } from "@/services/aiService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestResult {
  name: string;
  status: "pending" | "running" | "success" | "error";
  message: string;
  details?: string;
}

interface ClineConnectionTestProps {
  onConfigureAI: () => void;
}

export function ClineConnectionTest({ onConfigureAI }: ClineConnectionTestProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tests, setTests] = useState<TestResult[]>([
    { name: "AI Provider Configuration", status: "pending", message: "Checking AI provider setup..." },
    { name: "API Key