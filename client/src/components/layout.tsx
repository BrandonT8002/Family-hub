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
  const [location] = useLocation();

  const getPastelBg = () => {
    if (location === "/") return "bg-[#f0f7ff]"; // Pastel Blue
    if (location === "/schedule") return "bg-[#fcf5ff]"; // Pastel Lavender
    if (location === "/money") return "bg-[#fff5f7]"; // Pastel Rose
    if (location.startsWith("/groceries")) return "bg-[#fffaf0]"; // Pastel Peach
    if (location === "/chat") return "bg-[#f0fff4]"; // Pastel Mint
    return "bg-background";
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
                    createFamily.mutate({ name: familyName });
                  }
                }}
                className="space-y-4 pt-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Family Name</label>
                  <Input 
                    placeholder="e.g. The Smiths, Our Home..." 
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="h-12 px-4 rounded-xl bg-background border-border/50 focus:ring-primary/20 transition-all"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                  disabled={!familyName.trim() || createFamily.isPending}
                >
                  {createFamily.isPending ? "Creating..." : "Create Family Space"}
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
      <div className={`flex h-screen w-full transition-colors duration-500 text-foreground overflow-hidden ${getPastelBg()}`}>
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
