import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔐 Auth event:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && currentSession?.user) {
          const isNewUser = currentSession.user.created_at === currentSession.user.last_sign_in_at;
          if (isNewUser) {
            localStorage.setItem('is_new_user', 'true');
          }
        }

        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('is_new_user');
          // Optional: redirect to login page
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    console.log('🚀 Initiating Google Redirect to:', `${window.location.origin}/dashboard`);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Change: Redirecting to dashboard directly if you don't have a callback route
        // Ensure "https://resurrect-code.vercel.app/dashboard" is in Supabase Redirect URLs
        redirectTo: `${window.location.origin}/dashboard`, 
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) console.error("Google Auth Error:", error.message);
    return { error: error as AuthError | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('is_new_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signUp, 
      signIn, 
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
