import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Calendar, Wallet, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export default function LandingPage() {
  const { login, register, isLoggingIn, isRegistering, loginError, registerError } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ email, password, firstName, lastName });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isLoading = isLoggingIn || isRegistering;
  const displayError = error || loginError || registerError;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground font-sans">
      <div className="flex-1 lg:w-1/2 relative overflow-hidden bg-primary/5 flex flex-col justify-between p-8 lg:p-16">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-accent/10 blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-primary text-primary-foreground p-2.5 rounded-xl shadow-lg shadow-primary/20">
              <Heart className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">Family Hub</span>
          </div>

          <h1 className="font-display text-4xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
            The operating system <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              for your family.
            </span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-md leading-relaxed mb-12">
            Coordinate schedules, track shared expenses, manage groceries, and stay connected—all in one beautiful, private space.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg"
        >
          <div className="bg-background/60 backdrop-blur-md p-5 rounded-2xl border border-border/50 shadow-sm">
            <Calendar className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Shared Calendar</h3>
            <p className="text-sm text-muted-foreground">Never miss a practice or appointment.</p>
          </div>
          <div className="bg-background/60 backdrop-blur-md p-5 rounded-2xl border border-border/50 shadow-sm">
            <Wallet className="w-6 h-6 text-accent mb-3" />
            <h3 className="font-semibold mb-1">Expense Tracking</h3>
            <p className="text-sm text-muted-foreground">Keep the household budget in check effortlessly.</p>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold mb-3" data-testid="text-auth-heading">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-muted-foreground">
              {mode === "login" ? "Sign in to access your family space." : "Get started with Family Hub."}
            </p>
          </div>

          <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-xl shadow-black/5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                      required
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                      required
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "register" ? "Password (6+ characters)" : "Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl"
                  required
                  minLength={mode === "register" ? 6 : 1}
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {displayError && (
                <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl" data-testid="text-auth-error">
                  {displayError}
                </div>
              )}

              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                data-testid="button-submit-auth"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="button-toggle-auth-mode"
              >
                {mode === "login" ? (
                  <>Don't have an account? <span className="font-semibold text-primary">Sign up</span></>
                ) : (
                  <>Already have an account? <span className="font-semibold text-primary">Sign in</span></>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
