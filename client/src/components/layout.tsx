import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFamily, useCreateFamily } from "@/hooks/use-family";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
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
    chat: "#b3ffcc"
  });
  const [location] = useLocation();

  const THEMES = [
    { name: "Classic", colors: { home: "#b3d9ff", schedule: "#e0b3ff", money: "#ffb3c1", groceries: "#ffd9b3", chat: "#b3ffcc" } },
    { name: "Muted", colors: { home: "#d1e9ff", schedule: "#f3e8ff", money: "#ffe4e9", groceries: "#fff2e6", chat: "#e6ffed" } },
    { name: "Sunset", colors: { home: "#ffedd5", schedule: "#fee2e2", money: "#fef3c7", groceries: "#f0fdf4", chat: "#eff6ff" } },
  ];

  const getPastelBg = () => {
    const config = (family?.themeConfig as any) || {
      home: "#b3d9ff",
      schedule: "#e0b3ff",
      money: "#ffb3c1",
      groceries: "#ffd9b3",
      chat: "#b3ffcc"
    };

    if (location === "/") return `bg-[${config.home}]`;
    if (location === "/schedule") return `bg-[${config.schedule}]`;
    if (location === "/money") return `bg-[${config.money}]`;
    if (location.startsWith("/groceries")) return `bg-[${config.groceries}]`;
    if (location === "/chat") return `bg-[${config.chat}]`;
    if (location === "/settings") return "bg-slate-100";
    return "bg-background";
  };

  const getStyle = () => {
    const config = (family?.themeConfig as any) || {
      home: "#b3d9ff",
      schedule: "#e0b3ff",
      money: "#ffb3c1",
      groceries: "#ffd9b3",
      chat: "#b3ffcc"
    };
    
    if (location === "/") return config.home;
    if (location === "/schedule") return config.schedule;
    if (location === "/money") return config.money;
    if (location.startsWith("/groceries")) return config.groceries;
    if (location === "/chat") return config.chat;
    if (location === "/settings") return "#f1f5f9";
    return "#ffffff";
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

  const style = {
    "--sidebar-width": "18rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div 
        className="flex h-screen w-full transition-colors duration-500 text-foreground overflow-hidden"
        style={{ backgroundColor: getStyle() }}
      >
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full relative overflow-hidden">
          <header className="flex lg:hidden items-center p-4 border-b border-border/50 glass z-10 sticky top-0">
            <SidebarTrigger className="hover-elevate" />
            <h1 className="ml-4 font-display font-semibold text-lg">{family.name}</h1>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
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
        </div>
      </div>
    </SidebarProvider>
  );
}
