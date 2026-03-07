import { ReactNode, createContext, useContext } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFamily } from "@/hooks/use-family";
import { useCaregiverStatus } from "@/hooks/use-caregivers";
import { BottomNav } from "./bottom-nav";
import LandingPage from "@/pages/landing";
import Onboarding from "@/pages/onboarding";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

const CaregiverContext = createContext<{ isCaregiver: boolean }>({ isCaregiver: false });
export const useCaregiverMode = () => useContext(CaregiverContext);

export function Layout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: family, isLoading: familyLoading, error: familyError, refetch: familyRefetch } = useFamily();
  const { data: cgStatus } = useCaregiverStatus();
  const isCaregiverMode = cgStatus?.isCaregiver || false;
  const [location] = useLocation();

  const getStyle = () => {
    const config = (family?.themeConfig as any) || {
      home: "#f8f9fa",
      schedule: "#f8f9fa",
      money: "#f8f9fa",
      groceries: "#f8f9fa",
      chat: "#f8f9fa",
      diary: "#f8f9fa",
      goals: "#f8f9fa",
      wishlists: "#f8f9fa",
      leaveTime: "#f8f9fa"
    };
    
    let bgColor = "#f8f9fa";
    if (location === "/") bgColor = config.home;
    else if (location === "/schedule") bgColor = config.schedule;
    else if (location === "/money") bgColor = config.money;
    else if (location.startsWith("/groceries")) bgColor = config.groceries;
    else if (location === "/chat") bgColor = config.chat;
    else if (location === "/diary") bgColor = config.diary || "#f8f9fa";
    else if (location === "/goals") bgColor = config.goals || "#f8f9fa";
    else if (location === "/wishlists") bgColor = config.wishlists || "#f8f9fa";
    else if (location === "/leave-time") bgColor = config.leaveTime || "#f8f9fa";
    else if (location === "/care-notes") bgColor = config.chat || "#f8f9fa";
    else if (location === "/caregiver") bgColor = config.home || "#f8f9fa";
    else if (location === "/settings") bgColor = "#f8f9fa";

    return { 
      backgroundColor: bgColor,
      fontFamily: family?.fontFamily || "'Bricolage Grotesque', sans-serif"
    };
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (familyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (familyError && !family) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-sm text-muted-foreground" data-testid="text-family-error">Something went wrong loading your family data.</p>
        <button
          onClick={() => familyRefetch()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          data-testid="button-retry-family"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!family && !familyError) {
    return <Onboarding />;
  }

  if (!family) {
    return <Onboarding />;
  }

  return (
    <CaregiverContext.Provider value={{ isCaregiver: isCaregiverMode }}>
      <div 
        className="min-h-screen w-full transition-colors duration-500 text-foreground flex flex-col"
        style={getStyle()}
      >
        <header className="flex items-center justify-between px-5 pb-2 shrink-0" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm text-primary font-black text-sm">
              {family.name?.[0] || "F"}
            </div>
            <h1 className="text-sm font-bold text-foreground/80 tracking-tight" data-testid="text-family-name">
              {family.name}
              {isCaregiverMode && <span className="text-[10px] ml-1.5 text-primary/60 uppercase tracking-wider">Caregiver</span>}
            </h1>
          </div>
        </header>
        <main
          id="main-scroll-area"
          className="flex-1 overflow-y-auto pb-32 px-4 md:px-6 lg:px-8"
        >
          <AnimatePresence mode="wait">
            <motion.div 
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav />
      </div>
    </CaregiverContext.Provider>
  );
}
