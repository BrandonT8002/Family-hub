import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useFamily } from "@/hooks/use-family";
import { useCaregiverMode } from "./layout";
import { useQuery } from "@tanstack/react-query";
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
  ClipboardList,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Dumbbell,
  Users,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const primaryNav = [
  { title: "Home", url: "/", icon: Home },
  { title: "Schedule", url: "/schedule", icon: CalendarDays },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Shopping", url: "/groceries", icon: ShoppingCart },
];

const caregiverPrimaryNav = [
  { title: "Home", url: "/", icon: Home },
  { title: "Schedule", url: "/schedule", icon: CalendarDays },
  { title: "Notes", url: "/care-notes", icon: ClipboardList },
  { title: "Chat", url: "/chat", icon: MessageSquare },
];

const moreNavSections = [
  {
    label: "Essentials",
    items: [
      { title: "Money", url: "/money", icon: Wallet, description: "Bills, expenses & savings", accent: "bg-emerald-50 text-emerald-600" },
      { title: "Goals", url: "/goals", icon: Target, description: "Track what matters", accent: "bg-blue-50 text-blue-600" },
      { title: "Wishlists", url: "/wishlists", icon: Heart, description: "Share what you'd love", accent: "bg-pink-50 text-pink-600" },
    ],
  },
  {
    label: "Growth",
    items: [
      { title: "Academics", url: "/academics", icon: GraduationCap, description: "Classes, grades & progress", accent: "bg-indigo-50 text-indigo-600" },
      { title: "Workouts", url: "/workouts", icon: Dumbbell, description: "Fitness & consistency", accent: "bg-orange-50 text-orange-600" },
      { title: "Snapshots", url: "/snapshots", icon: BarChart3, description: "Progress over time", accent: "bg-teal-50 text-teal-600" },
    ],
  },
  {
    label: "Personal",
    items: [
      { title: "Diary", url: "/diary", icon: BookOpen, description: "Private reflections", accent: "bg-amber-50 text-amber-600" },
      { title: "Leave Time", url: "/leave-time", icon: Clock, description: "Walk-out reminders", accent: "bg-violet-50 text-violet-600" },
      { title: "Connections", url: "/connections", icon: Users, description: "Linked family accounts", accent: "bg-cyan-50 text-cyan-600" },
      { title: "Caregiver", url: "/settings", icon: ShieldCheck, description: "Manage caretaker access", accent: "bg-sky-50 text-sky-600" },
    ],
  },
];

const allMoreUrls = moreNavSections.flatMap(s => s.items.map(i => i.url)).concat(["/settings"]);

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { data: family } = useFamily();
  const { isCaregiver } = useCaregiverMode();
  const [moreOpen, setMoreOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: unreadData } = useQuery<{ totalUnread: number }>({
    queryKey: ['/api/conversations/unread-count'],
    refetchInterval: 10000,
    enabled: !!user && !!family,
  });

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

  const navItems = isCaregiver ? caregiverPrimaryNav : primaryNav;
  const isMoreActive = !isCaregiver && allMoreUrls.some((url) => isActive(url));

  return (
    <>
      <AnimatePresence>
        {moreOpen && !isCaregiver && (
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
        {moreOpen && !isCaregiver && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
          >
            <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/60 overflow-hidden max-w-lg mx-auto">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              {moreNavSections.map((section) => (
                <div key={section.label} className="px-4 pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 pt-2 pb-1.5">{section.label}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = isActive(item.url);
                      return (
                        <Link key={item.url} href={item.url}>
                          <button
                            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                              active
                                ? "bg-primary/8 text-primary"
                                : "text-gray-700 hover:bg-gray-50 active:scale-[0.98]"
                            }`}
                            data-testid={`nav-more-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-primary/10 text-primary" : item.accent}`}>
                              <item.icon className="w-[18px] h-[18px]" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className={`text-sm leading-tight ${active ? "font-bold" : "font-semibold"}`}>{item.title}</p>
                              <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{item.description}</p>
                            </div>
                            <ChevronRight className={`w-4 h-4 shrink-0 ${active ? "text-primary/50" : "text-gray-300"}`} />
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="border-t border-gray-100/80 mx-4 mt-1" />

              <div className="px-4 py-2">
                <Link href="/settings">
                  <button
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                      isActive("/settings")
                        ? "bg-primary/8 text-primary"
                        : "text-gray-700 hover:bg-gray-50 active:scale-[0.98]"
                    }`}
                    data-testid="nav-more-settings"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive("/settings") ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"}`}>
                      <Settings className="w-[18px] h-[18px]" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className={`text-sm leading-tight ${isActive("/settings") ? "font-bold" : "font-semibold"}`}>Settings</p>
                      <p className="text-[11px] text-gray-400 leading-tight mt-0.5">Theme, font & preferences</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isActive("/settings") ? "text-primary/50" : "text-gray-300"}`} />
                  </button>
                </Link>
              </div>

              <div className="border-t border-gray-100/80 mx-4" />

              <div className="px-5 py-3 flex items-center gap-3">
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
            {navItems.map((item) => {
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
                    <div className="relative">
                      <item.icon className={`w-5 h-5 relative z-10 ${active ? "stroke-[2.5]" : ""}`} />
                      {item.title === "Chat" && (unreadData?.totalUnread ?? 0) > 0 && (
                        <span
                          className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 z-20"
                          data-testid="badge-chat-unread"
                        >
                          {unreadData!.totalUnread > 99 ? "99+" : unreadData!.totalUnread}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] relative z-10 leading-none ${active ? "font-bold" : "font-medium"}`}>
                      {item.title}
                    </span>
                  </button>
                </Link>
              );
            })}

            {!isCaregiver && (
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
            )}
          </div>
        </nav>
      </motion.div>
    </>
  );
}
