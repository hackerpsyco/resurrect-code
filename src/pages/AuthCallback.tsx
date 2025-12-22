import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function AuthCallback() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔐 Auth callback page loaded');

    // Once auth state is resolved, decide where to go
    if (loading) return;

    if (user) {
      console.log('✅ User authenticated on callback, redirecting to dashboard');
      toast.success('Successfully signed in!');
      navigate('/dashboard', { replace: true });
    } else {
      console.log('❌ No user found on callback, redirecting to auth');
      toast.error('Authentication failed. Please try again.');
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you to your dashboard.</p>
      </div>
    </div>
  );
}