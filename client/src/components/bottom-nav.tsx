import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useFamily } from "@/hooks/use-family";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Home,
  CalendarDays,
  Wallet,
  ShoppingCart,
  MessageSquare,
  BookOpen,
  Target,
  Heart,
  Settings,
  LogOut,
  MoreHorizontal,
  X,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const primaryNav = [
  { title: "Home", url: "/", icon: Home },
  { title: "Schedule", url: "/schedule", icon: CalendarDays },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Shopping", url: "/groceries", icon: ShoppingCart },
];

const moreNav = [
  { title: "Money", url: "/money", icon: Wallet },
  { title: "Diary", url: "/diary", icon: BookOpen },
  { title: "Goals", url: "/goals", icon: Target },
  { title: "Wishlists", url: "/wishlists", icon: Heart },
  { title: "Leave Time", url: "/leave-time", icon: Clock },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { data: family } = useFamily();
  const [moreOpen, setMoreOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useCallback(() => {
    const mainEl = document.getElementById("main-scroll-area");
    if (!mainEl) return;
    const currentY = mainEl.scrollTop;
    if (currentY > lastScrollY.current && currentY > 60) {
      setVisible(false);
      setMoreOpen(false);
    } else {
      setVisible(true);
    }
    lastScrollY.current = currentY;

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => setVisible(true), 1500);
  }, []);

  useEffect(() => {
    const mainEl = document.getElementById("main-scroll-area");
    if (!mainEl) return;
    mainEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    setMoreOpen(false);
  }, [location]);

  const isActive = (url: string) =>
    url === "/" ? location === "/" : location.startsWith(url);

  const isMoreActive = moreNav.some((item) => isActive(item.url));

  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
          >
            <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/60 overflow-hidden max-w-lg mx-auto">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>

              <div className="grid grid-cols-3 gap-1 px-4 pb-3">
                {moreNav.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <Link key={item.url} href={item.url}>
                      <button
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl w-full transition-all duration-200 ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-gray-500 hover:bg-gray-100 active:scale-95"
                        }`}
                        data-testid={`nav-more-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        <item.icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                        <span className={`text-[11px] leading-none ${active ? "font-bold" : "font-medium"}`}>
                          {item.title}
                        </span>
                      </button>
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-3">
                <Avatar className="w-9 h-9 border-2 border-white shadow-sm">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[11px] text-gray-400 truncate">{family?.name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-gray-400 hover:text-red-500 rounded-xl h-8 px-2"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ y: visible ? 0 : 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pointer-events-none"
      >
        <nav
          className="max-w-md mx-auto pointer-events-auto"
          data-testid="bottom-nav"
        >
          <div className="bg-white/80 backdrop-blur-2xl rounded-[1.75rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/60 px-2 py-1.5 flex items-center justify-around">
            {primaryNav.map((item) => {
              const active = isActive(item.url);
              return (
                <Link key={item.url} href={item.url}>
                  <button
                    className={`relative flex flex-col items-center gap-0.5 py-2 px-4 rounded-2xl transition-all duration-300 ${
                      active
                        ? "text-primary"
                        : "text-gray-400 active:scale-90"
                    }`}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-primary/10 rounded-2xl"
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      />
                    )}
                    <item.icon className={`w-5 h-5 relative z-10 ${active ? "stroke-[2.5]" : ""}`} />
                    <span className={`text-[10px] relative z-10 leading-none ${active ? "font-bold" : "font-medium"}`}>
                      {item.title}
                    </span>
                  </button>
                </Link>
              );
            })}

            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`relative flex flex-col items-center gap-0.5 py-2 px-4 rounded-2xl transition-all duration-300 ${
                moreOpen || isMoreActive
                  ? "text-primary"
                  : "text-gray-400 active:scale-90"
              }`}
              data-testid="nav-more"
            >
              {(moreOpen || isMoreActive) && (
                <motion.div
                  layoutId={moreOpen ? undefined : "nav-pill"}
                  className="absolute inset-0 bg-primary/10 rounded-2xl"
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              {moreOpen ? (
                <X className="w-5 h-5 relative z-10 stroke-[2.5]" />
              ) : (
                <MoreHorizontal className={`w-5 h-5 relative z-10 ${isMoreActive ? "stroke-[2.5]" : ""}`} />
              )}
              <span className={`text-[10px] relative z-10 leading-none ${moreOpen || isMoreActive ? "font-bold" : "font-medium"}`}>
                More
              </span>
            </button>
          </div>
        </nav>
      </motion.div>
    </>
  );
}
