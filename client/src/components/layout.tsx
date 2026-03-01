import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFamily, useCreateFamily } from "@/hooks/use-family";
import { BottomNav } from "./bottom-nav";
import LandingPage from "@/pages/landing";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

export function Layout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: family, isLoading: familyLoading } = useFamily();
  const createFamily = useCreateFamily();
  const [familyName, setFamilyName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState({
    home: "#b3d9ff",
    schedule: "#e0b3ff",
    money: "#ffb3c1",
    groceries: "#ffd9b3",
    chat: "#b3ffcc",
    diary: "#f5e6d3"
  });
  const [location] = useLocation();

  const THEMES = [
    { name: "Pastel", colors: { home: "#b3d9ff", schedule: "#e0b3ff", money: "#ffb3c1", groceries: "#ffd9b3", chat: "#b3ffcc", diary: "#f5e6d3" } },
    { name: "Colorful", colors: { home: "#3b82f6", schedule: "#8b5cf6", money: "#ef4444", groceries: "#f59e0b", chat: "#10b981", diary: "#d97706" } },
    { name: "Basic", colors: { home: "#f8fafc", schedule: "#f1f5f9", money: "#e2e8f0", groceries: "#cbd5e1", chat: "#94a3b8", diary: "#e2d8cd" } },
    { name: "Mono", colors: { home: "#ffffff", schedule: "#f3f4f6", money: "#e5e7eb", groceries: "#d1d5db", chat: "#9ca3af", diary: "#e5e7eb" } },
    { name: "Night", colors: { home: "#1e293b", schedule: "#334155", money: "#475569", groceries: "#64748b", chat: "#94a3b8", diary: "#78716c" } },
  ];

  const getStyle = () => {
    const config = (family?.themeConfig as any) || {
      home: "#b3d9ff",
      schedule: "#e0b3ff",
      money: "#ffb3c1",
      groceries: "#ffd9b3",
      chat: "#b3ffcc"
    };
    
    let bgColor = "#ffffff";
    if (location === "/") bgColor = config.home;
    else if (location === "/schedule") bgColor = config.schedule;
    else if (location === "/money") bgColor = config.money;
    else if (location.startsWith("/groceries")) bgColor = config.groceries;
    else if (location === "/chat") bgColor = config.chat;
    else if (location === "/diary") bgColor = config.diary || "#f5e6d3";
    else if (location === "/goals") bgColor = config.goals || "#d4edda";
    else if (location === "/wishlists") bgColor = config.wishlists || "#fce4ec";
    else if (location === "/leave-time") bgColor = config.leaveTime || "#e8f5e9";
    else if (location === "/settings") bgColor = "#f1f5f9";

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

  if (!family) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="w-full max-w-md shadow-xl border-border/50">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👋</span>
              </div>
              <CardTitle className="text-2xl font-display">Welcome to FamilyHub</CardTitle>
              <CardDescription className="text-base mt-2">
                Let's set up your family space to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (familyName.trim()) {
                    createFamily.mutate({ name: familyName, themeConfig: selectedTheme });
                  }
                }}
                className="space-y-6 pt-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1">Family Name</label>
                  <Input 
                    placeholder="e.g. The Smiths, Our Home..." 
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="h-14 px-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/30 text-lg font-bold"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-700 ml-1">Pick a Starting Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {THEMES.map((t) => (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => setSelectedTheme(t.colors)}
                        className={`p-3 rounded-2xl border-2 transition-all text-left ${JSON.stringify(selectedTheme) === JSON.stringify(t.colors) ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                      >
                        <div className="flex gap-0.5 mb-2">
                          {Object.values(t.colors).slice(0, 3).map((c, i) => (
                            <div key={i} className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">{t.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98] bg-primary text-white"
                  disabled={!familyName.trim() || createFamily.isPending}
                >
                  {createFamily.isPending ? "Creating..." : "Start Family Adventure"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full transition-colors duration-500 text-foreground flex flex-col"
      style={getStyle()}
    >
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm text-primary font-black text-sm">
            {family.name?.[0] || "F"}
          </div>
          <h1 className="text-sm font-bold text-foreground/80 tracking-tight" data-testid="text-family-name">{family.name}</h1>
        </div>
      </header>
      <main
        id="main-scroll-area"
        className="flex-1 overflow-y-auto pb-24 px-4 md:px-6 lg:px-8"
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
  );
}
