import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowLeft } from "lucide-react";
import logo from "@/assets/yeehaul-logo.png";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const Login = () => {
  const [searchParams] = useSearchParams();
  const isSignup = searchParams.get("signup") === "true";
  const [mode, setMode] = useState<"login" | "signup">(isSignup ? "signup" : "login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
  const { user, userRole, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (user && userRole)  navigate("/dashboard");
    else if (user && !userRole) navigate("/onboarding");
  }, [user, userRole, authLoading, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error("Google sign-in failed. Please try again.");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — orange brand side (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-orange flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-black/5 rounded-full translate-y-1/3 -translate-x-1/4" />

        <Link to="/" className="flex items-center gap-2 relative z-10">
          <img src={logo} alt="YeeHaul" className="h-10 w-10" width={40} height={40} />
          <span className="text-xl font-extrabold text-white font-['Space_Grotesk']">YeeHaul</span>
        </Link>

        <div className="relative z-10">
          <p className="text-5xl font-extrabold text-white leading-tight mb-4">
            Move anything.<br />Earn from anywhere.
          </p>
          <p className="text-white/70 text-lg">
            The hauling marketplace for real people with real trucks.
          </p>
        </div>

        <div className="flex gap-6 relative z-10">
          {[
            { value: "82%", label: "Haulers keep" },
            { value: "Live", label: "GPS tracking" },
            { value: "Free", label: "To post" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-white/60 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-background">
        {/* Mobile back link */}
        <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 lg:hidden w-fit">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>

        <div className="w-full max-w-sm mx-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src={logo} alt="YeeHaul" className="h-9 w-9" width={36} height={36} />
            <span className="text-xl font-extrabold font-['Space_Grotesk'] text-gradient-orange">YeeHaul</span>
          </div>

          <h1 className="text-2xl font-bold mb-1">
            {mode === "login" ? "Welcome back 👋" : "Create your account"}
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            {mode === "login"
              ? "Sign in to manage your hauls"
              : "Get started — it only takes a minute"}
          </p>

          {/* Google */}
          <Button variant="outline" className="w-full gap-2 h-11 font-medium border-border hover:border-primary/40 hover:bg-primary/5 transition-colors mb-4" onClick={handleGoogleAuth}>
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="Your name" className="pl-9 h-11" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-9 h-11" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-9 h-11" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-gradient-orange shadow-orange font-semibold text-base" disabled={loading}>
              {loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button className="text-primary font-semibold hover:underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "Sign up free" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
