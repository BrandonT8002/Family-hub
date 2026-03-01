import { motion } from "framer-motion";
import { ArrowRight, Heart, Calendar, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function LandingPage() {
  const { login } = useAuth();
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground font-sans">
      {/* Left Panel - Branding/Hero */}
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
            <span className="font-display font-bold text-2xl tracking-tight">FamilyHub</span>
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

      {/* Right Panel - Auth */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold mb-3">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to access your family space.</p>
          </div>

          <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-xl shadow-black/5">
            <Button 
              className="w-full h-14 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              onClick={() => login()}
            >
              Continue with Replit
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <p className="text-center text-xs text-muted-foreground mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy. Secure authentication provided by Replit.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
