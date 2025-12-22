import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state change:', { event, user: session?.user?.email, pathname: window.location.pathname });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle OAuth callback and new-user flag
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.email);
          
          // Mark as new user if this is their first login (Google OAuth users)
          const isNewUser = session.user.created_at === session.user.last_sign_in_at;
          if (isNewUser) {
            console.log('🆕 New user detected, setting flag');
            localStorage.setItem('is_new_user', 'true');
          }
          
          // Do NOT navigate here – let route components decide redirects
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          localStorage.removeItem('is_new_user');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session check:', { user: session?.user?.email, pathname: window.location.pathname });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    console.log('🔐 Supabase signup attempt:', { email, passwordLength: password.length });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    
    console.log('🔐 Supabase signup response:', { 
      user: data.user?.email, 
      session: !!data.session,
      error: error?.message 
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Supabase signin attempt:', { email, passwordLength: password.length });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('🔐 Supabase signin response:', { 
      user: data.user?.email, 
      session: !!data.session,
      error: error?.message 
    });
    
    return { error };
  };

  const signInWithGoogle = async () => {
    console.log('🔐 Google OAuth signin attempt');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
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
    console.log('🔐 Signing out user');
    await supabase.auth.signOut();
    // Clear any cached data
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
