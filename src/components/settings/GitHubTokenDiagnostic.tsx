import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
// import { backendClient } from '@/integrations/backendClient/client'
import { backendClient } from '@/lib/mockBackend';

export function GitHubTokenDiagnostic() {
  const [isChecking, setIsChecking] = useState(false);
  const [tokenInLocalStorage, setTokenInLocalStorage] = useState(false);
  const [tokenInBackendClient, setTokenInBackendClient] = useState(false);
  const [tokenValue, setTokenValue] = useState('');
  const [error, setError] = useState('');

  const checkTokenStatus = async () => {
    setIsChecking(true);
    setError('');
    try {
      // Check localStorage
      const localToken = localStorage.getItem('github_token');
      setTokenInLocalStorage(!!localToken);
      if (localToken) {
        setTokenValue(localToken.substring(0, 10) + '...');
      }

      // Get current session using BackendClient client
      const { data: { session }, error: sessionError } = await backendClient.auth.getSession();

      if (sessionError || !session) {
        setError('Not authenticated - please log in');
        return;
      }

      // Check BackendClient user_credentials table directly
      const { data, error: dbError } = await backendClient
        .from('user_credentials')
        .select('credentials')
        .single();

      if (dbError) {
        console.warn('⚠️ Error fetching credentials:', dbError);
        setTokenInBackendClient(false);
        setError(`Failed to fetch credentials: ${dbError.message}`);
      } else if (data && data.credentials && data.credentials.githubToken) {
        setTokenInBackendClient(true);
        console.log('✅ GitHub token found in user_credentials table');
      } else {
        setTokenInBackendClient(false);
        console.log('❌ GitHub token NOT in user_credentials table');
        console.log('📋 Data received:', data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkTokenStatus();
  }, []);

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <RefreshCw className="w-5 h-5" />
          GitHub Token Diagnostic
        </CardTitle>
        <CardDescription>
          Check where your GitHub token is stored
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Checks */}
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

          {/* BackendClient Settings Table Status */}
          <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
            <div className="flex items-center gap-3">
              {tokenInBackendClient ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <div>
                <p className="text-sm font-medium text-white">BackendClient Database</p>
                <p className="text-xs text-[#7d8590]">GitHub token in user_credentials table</p>
              </div>
            </div>
            <Badge className={tokenInBackendClient ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
              {tokenInBackendClient ? '✅ Saved' : '❌ Not Saved'}
            </Badge>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400">
              ❌ Error: {error}
            </p>
          </div>
        )}

        {/* Info Box */}
        {tokenInLocalStorage && !tokenInBackendClient && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-400">
              ⚠️ Your GitHub token is in browser storage but NOT in BackendClient. 
              <br />
              <strong>Solution:</strong> Disconnect and reconnect GitHub to save it to BackendClient.
            </p>
          </div>
        )}

        {tokenInBackendClient && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-xs text-green-400">
              ✅ Your GitHub token is saved in BackendClient! Scheduled analysis should work.
            </p>
          </div>
        )}

        {!tokenInLocalStorage && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-400">
              ℹ️ GitHub is not connected. Go to GitHub Integration and connect your account.
            </p>
          </div>
        )}

        {/* Refresh Button */}
        <Button
          onClick={checkTokenStatus}
          disabled={isChecking}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            '🔍 Check Status'
          )}
        </Button>

        {/* Instructions */}
        <div className="text-xs text-[#7d8590] space-y-2 p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
          <p><strong>What this checks:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Browser Storage: Token in localStorage (for client-side use)</li>
            <li>BackendClient Database: Token in user_credentials table (for all features)</li>
          </ul>
          <p className="mt-2"><strong>If token is missing from BackendClient:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to Settings → GitHub Integration</li>
            <li>Click Disconnect</li>
            <li>Click Connect GitHub</li>
            <li>Enter your token and click Connect</li>
            <li>Check status again</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
