import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { WebContainerProvider } from "@/contexts/WebContainerContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { GitHubDebugPanel } from "./components/debug/GitHubDebugPanel";
import { SimpleGitHubIDE } from "./components/dashboard/SimpleGitHubIDE";
import { WebContainerDemo } from "./components/ide/WebContainerDemo";
import { WebContainerTest } from "./components/ide/WebContainerTest";
import { GitHubRealIDE } from "./components/ide/GitHubRealIDE";
import { TerminalConnectionTest } from "./components/ide/TerminalConnectionTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WebContainerProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/debug/github" element={<GitHubDebugPanel />} />
            <Route path="/github-ide" element={<SimpleGitHubIDE />} />
            <Route path="/webcontainer-demo" element={<WebContainerDemo />} />
            <Route path="/webcontainer-test" element={<WebContainerTest />} />
            <Route path="/github-real-ide" element={<GitHubRealIDE />} />
            <Route path="/terminal-test" element={<TerminalConnectionTest />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </WebContainerProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
