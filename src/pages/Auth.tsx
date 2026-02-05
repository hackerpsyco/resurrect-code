import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Cpu, Mail, Lock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number | null>(null);
  const { sendOtp, verifyOtpAndAuth, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();

  // Check for OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const fragment = window.location.hash;
      
      if (accessToken || fragment.includes('access_token')) {
        console.log('🔐 OAuth callback detected');
        setIsOAuthCallback(true);
        toast.success("Successfully signed in with Google! Redirecting...");
      }
    };

    handleOAuthCallback();
  }, []);

  // Rate limit cooldown timer
  useEffect(() => {
    if (rateLimitCooldown === null || rateLimitCooldown <= 0) return;

    const timer = setInterval(() => {
      setRateLimitCooldown(prev => {
        if (prev === null || prev <= 1) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitCooldown]);

  if (loading || isOAuthCallback) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isOAuthCallback ? "Completing Google sign in..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    console.log('🔐 User already logged in, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!showOtpInput) {
        // Step 1: Send OTP
        const { error } = await sendOtp(email, password, !isLogin);
        
        if (error) {
          if ((error as any).code === 'RATE_LIMIT') {
            setRateLimitCooldown(300);
            toast.error(
              "⏱️ Email rate limit exceeded. Please wait 5 minutes before requesting another code.",
              { duration: 10000 }
            );
          } else {
            toast.error(error.message || "Failed to send OTP. Please try again.");
          }
        } else {
          setShowOtpInput(true);
          toast.success("✅ OTP sent to your email! Enter the 6-digit code.");
        }
      } else {
        // Step 2: Verify OTP and authenticate
        if (!otp || otp.length !== 6) {
          toast.error("Please enter a valid 6-digit OTP code");
          return;
        }
        
        const { error } = await verifyOtpAndAuth(email, password, otp, !isLogin);
        
        if (error) {
          if (error.message.includes("Invalid")) {
            toast.error("Invalid OTP code. Please check and try again.");
          } else if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Try logging in.");
            setIsLogin(true);
            setShowOtpInput(false);
            setOtp("");
          } else if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please try again.");
          } else if (error.message.includes("Failed to fetch") || error.message.includes("ERR_CERT")) {
            toast.error("Network error. Please check your connection and try again.");
          } else {
            toast.error(error.message || "Authentication failed. Please try again.");
          }
        } else {
          const message = isLogin ? "Welcome back!" : "🎉 Account created successfully!";
          toast.success(message);
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.error('🔥 Auth error:', err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const { error } = await sendOtp(email, password, !isLogin);
      if (error) {
        if ((error as any).code === 'RATE_LIMIT') {
          setRateLimitCooldown(300);
          toast.error(
            "⏱️ Email rate limit exceeded. Please wait 5 minutes before requesting another code.",
            { duration: 10000 }
          );
        } else {
          toast.error(error.message || "Failed to resend OTP. Please try again.");
        }
      } else {
        toast.success("OTP code resent! Check your email.");
      }
    } catch (err) {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      console.log('🔐 Starting Google OAuth flow');
      const { error } = await signInWithGoogle();
      
      if (error) {
        console.error('Google OAuth error:', error);
        toast.error("Failed to sign in with Google. Please try again.");
      } else {
        toast.success("Redirecting to Google...");
      }
    } catch (err) {
      console.error('🔥 Google OAuth error:', err);
      toast.error("Something went wrong with Google sign in.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_110%)] animate-pulse" />
      <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-[80px] sm:blur-[128px] animate-blob" />
      <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-accent/10 rounded-full blur-[80px] sm:blur-[128px] animate-blob animation-delay-2000" />

      <Card className="relative z-10 w-full max-w-md bg-card border-border p-6 sm:p-8 animate-fade-in shadow-2xl">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors duration-200 hover:translate-x-1 transform"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 animate-slide-down">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center hover:scale-110 transition-transform duration-300">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          <span className="text-2xl font-bold">
            Innoalaxy
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 animate-slide-down animation-delay-100">
          {isLogin ? "Welcome to Innoalaxy" : "Join Innoalaxy"}
        </h1>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base animate-slide-down animation-delay-200">
          {isLogin
            ? "Sign in to continue to Innoalaxy"
            : "Get started with Innoalaxy"}
        </p>

        {/* Google Sign In Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full mb-6 bg-white hover:bg-gray-50 text-gray-900 border-gray-300 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 animate-slide-down animation-delay-300"
        >
          {isGoogleLoading ? (
            <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </Button>

        <div className="relative mb-6 animate-slide-down animation-delay-400">
          <Separator />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-card px-2 text-xs text-muted-foreground">OR</span>
          </div>
        </div>

        {/* Email/Password/OTP Form */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-slide-down animation-delay-500">
          {!showOtpInput ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background border-border transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background border-border transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Send OTP"
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2 animate-slide-down">
                <Label htmlFor="otp" className="text-sm sm:text-base">Enter OTP Code</Label>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  We sent a 6-digit code to <strong className="text-foreground">{email}</strong>
                </p>
                <div className="relative group">
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl sm:text-3xl tracking-widest bg-background border-border transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                    required
                    maxLength={6}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : isLogin ? (
                  "Verify & Sign In"
                ) : (
                  "Verify & Create Account"
                )}
              </Button>

              <div className="text-center space-y-2 text-xs sm:text-sm">
                {rateLimitCooldown !== null && rateLimitCooldown > 0 ? (
                  <p className="text-amber-600 dark:text-amber-500 animate-pulse">
                    ⏱️ Rate limit active. Please wait {Math.floor(rateLimitCooldown / 60)}:{(rateLimitCooldown % 60).toString().padStart(2, '0')} before requesting another code.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading || (rateLimitCooldown !== null && rateLimitCooldown > 0)}
                    className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    Resend OTP
                  </button>
                )}
                <div className="flex items-center justify-center gap-2">
                  {rateLimitCooldown === null && (
                    <>
                      <span className="mx-2 text-muted-foreground">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowOtpInput(false);
                          setOtp("");
                          setRateLimitCooldown(null);
                        }}
                        disabled={isLoading}
                        className="text-muted-foreground hover:underline transition-opacity"
                      >
                        Change email
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </form>

        {/* Toggle */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6 animate-slide-down animation-delay-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setShowOtpInput(false);
              setOtp("");
              setEmail("");
              setPassword("");
            }}
            className="text-primary hover:underline font-medium transition-colors"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </Card>
    </div>
  );
}
