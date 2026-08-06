import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@backendClient/backendClient-js";
// import { backendClient } from "@/integrations/backendClient/client"
import { backendClient } from '@/lib/mockBackend';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sendOtp: (email: string, password: string, isSignup: boolean) => Promise<{ error: Error | null }>;
  verifyOtpAndAuth: (email: string, password: string, token: string, isSignup: boolean) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = backendClient.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state change:', { event, user: session?.user?.email });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle OAuth callback and new-user flag
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.email);
          
          // Mark as new user if this is their first login
          const isNewUser = session.user.created_at === session.user.last_sign_in_at;
          if (isNewUser) {
            console.log('🆕 New user detected');
            localStorage.setItem('is_new_user', 'true');
          }
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          localStorage.removeItem('is_new_user');
        }
      }
    );

    // Check for existing session
    backendClient.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session check:', { user: session?.user?.email });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOtp = async (email: string, password: string, isSignup: boolean) => {
    console.log('🔐 Sending OTP:', { email, isSignup });
    
    // Store credentials temporarily for verification step
    sessionStorage.setItem(`auth_email_${email}`, email);
    sessionStorage.setItem(`auth_password_${email}`, password);
    sessionStorage.setItem(`auth_isSignup_${email}`, isSignup ? 'true' : 'false');
    
    // For signup: create user, for login: just send OTP
    const { error } = await backendClient.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: isSignup, // Create user on signup
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    
    if (error) {
      console.error('Failed to send OTP:', error);
      
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('rate limit') || error.status === 429) {
        const rateLimitError = new Error(
          'Email rate limit exceeded. Please wait a few minutes before requesting another code.'
        );
        (rateLimitError as any).code = 'RATE_LIMIT';
        return { error: rateLimitError };
      }
      
      return { error };
    }
    
    console.log('✅ OTP sent successfully');
    return { error: null };
  };

  const verifyOtpAndAuth = async (email: string, password: string, token: string, isSignup: boolean) => {
    console.log('🔐 Verifying OTP and authenticating:', { email, isSignup });
    
    try {
      // Step 1: Verify OTP - this automatically signs in the user
      const { data: otpData, error: otpError } = await backendClient.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      
      if (otpError) {
        console.error('OTP verification failed:', otpError);
        return { error: otpError };
      }
      
      console.log('✅ OTP verified and user authenticated');
      
      // Step 2: If signup, update user profile with password info
      if (isSignup) {
        console.log('🔐 New user account created via OTP');
        localStorage.setItem('is_new_user', 'true');
        
        // Update user metadata
        const { error: updateError } = await backendClient.auth.updateUser({
          data: { 
            signup_method: 'otp',
            created_at: new Date().toISOString()
          }
        });
        
        if (updateError) {
          console.warn('Failed to update user metadata:', updateError);
        }
        
        console.log('✅ Account created successfully');
      } else {
        console.log('✅ Login successful');
      }
      
      // Clear stored credentials
      sessionStorage.removeItem(`auth_email_${email}`);
      sessionStorage.removeItem(`auth_password_${email}`);
      sessionStorage.removeItem(`auth_isSignup_${email}`);
      
      return { error: null };
    } catch (err) {
      console.error('Auth error:', err);
      return { error: err as Error };
    }
  };

  const signInWithGoogle = async () => {
    console.log('🔐 Google OAuth signin attempt');
    
    const { data, error } = await backendClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    console.log('🔐 Google OAuth response:', { 
      url: data.url ? 'redirect_url_generated' : 'no_url',
      error: error?.message 
    });
    
    return { error };
  };

  const signOut = async () => {
    await backendClient.auth.signOut();
    localStorage.removeItem('is_new_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      sendOtp,
      verifyOtpAndAuth,
      signInWithGoogle,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
