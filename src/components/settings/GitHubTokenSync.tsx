import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { syncGitHubTokenToSupabase, verifyGitHubTokenInSupabase } from '@/services/githubTokenSync';

export function GitHubTokenSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tokenInSupabase, setTokenInSupabase] = useState(false);
  const [tokenInLocalStorage, setTokenInLocalStorage] = useState(false);

  // Check on mount
  useEffect(() => {
    checkTokenStatus();
  }, []);

  const checkTokenStatus = async () => {
    setIsVerifying(true);
    try {
      // Check localStorage
      const hasLocalToken = !!localStorage.getItem('github_token');
      setTokenInLocalStorage(hasLocalToken);

      // Check Supabase
      const hasSupabaseToken = await verifyGitHubTokenInSupabase();
      setTokenInSupabase(hasSupabaseToken);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const success = await syncGitHubTokenToSupabase();
      if (success) {
        setTokenInSupabase(true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Zap className="w-5 h-5" />
          GitHub Token Sync
        </CardTitle>
        <CardDescription>
          Sync your GitHub token to Supabase for scheduled analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Status */}
        <div className="space-y-3">
          {/* localStorage Status */}
          <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
            <div className="flex items-center gap-3">
              {tokenInLocalStorage ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              )}
              <div>
                <p className="text-sm font-medium text-white">Browser Storage</p>
                <p className="text-xs text-[#7d8590]">GitHub token in localStorage</p>
              </div>
            </div>
            <Badge className={tokenInLocalStorage ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
              {tokenInLocalStorage ? '✅ Found' : '⚠️ Missing'}
            </Badge>
          </div>

          {/* Supabase Status */}
          <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
            <div className="flex items-center gap-3">
              {tokenInSupabase ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <div>
                <p className="text-sm font-medium text-white">Supabase Metadata</p>
                <p className="text-xs text-[#7d8590]">GitHub token in user metadata</p>
              </div>
            </div>
            <Badge className={tokenInSupabase ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
              {tokenInSupabase ? '✅ Synced' : '❌ Not synced'}
            </Badge>
          </div>
        </div>

        {/* Info Box */}
        {tokenInLocalStorage && !tokenInSupabase && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-400">
              💡 Your GitHub token is in browser storage but not synced to Supabase. 
              Click "Sync Now" to enable scheduled analysis.
            </p>
          </div>
        )}

        {tokenInSupabase && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-xs text-green-400">
              ✅ Your GitHub token is synced! Scheduled analysis will work.
            </p>
          </div>
        )}

        {!tokenInLocalStorage && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-400">
              ⚠️ GitHub is not connected. Go to GitHub Integration and connect your account first.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSync}
            disabled={isSyncing || !tokenInLocalStorage || tokenInSupabase}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : tokenInSupabase ? (
              '✅ Already Synced'
            ) : (
              '🔄 Sync Now'
            )}
          </Button>
          <Button
            onClick={checkTokenStatus}
            disabled={isVerifying}
            variant="outline"
            className="border-[#30363d] text-[#7d8590] hover:text-white"
          >
            {isVerifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              '🔍 Check'
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-[#7d8590] space-y-1">
          <p>
            <strong>How it works:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Your GitHub token is stored in browser storage when you connect</li>
            <li>Click "Sync Now" to save it to Supabase</li>
            <li>Edge functions can then access it for scheduled analysis</li>
            <li>Once synced, scheduled analysis will work automatically</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
