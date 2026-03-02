import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFamily } from "@/hooks/use-family";
import { useExpenses, useFinancialSchedule, useSavingsGoals } from "@/hooks/use-expenses";
import { useEvents } from "@/hooks/use-events";
import { useLeaveTimeToday, useSaveLeaveTimeOverride } from "@/hooks/use-leave-time";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, startOfMonth, endOfMonth, isAfter, isBefore, addDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays,
  Check,
  Circle,
  Clock,
  CalendarClock,
  MessageSquare,
  ShoppingCart,
  Wallet,
  Target,
  Heart,
  BookOpen,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return { text: "Good night", emoji: "🌙" };
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "🌤️" };
  if (h < 21) return { text: "Good evening", emoji: "🌅" };
  return { text: "Good night", emoji: "🌙" };
}

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 200 } } },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: family } = useFamily();
  const { data: expenses } = useExpenses();
  const { data: schedule } = useFinancialSchedule();
  const { data: goals } = useSavingsGoals();
  const { data: events } = useEvents();
  const { data: leaveTimeData } = useLeaveTimeToday();
  const saveOverride = useSaveLeaveTimeOverride();
  const { toast } = useToast();
  const { data: unreadData } = useQuery<{ totalUnread: number }>({
    queryKey: ['/api/conversations/unread-count'],
    refetchInterval: 15000,
    enabled: !!user && !!family,
  });

  const today = new Date();
  const greeting = getGreeting();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const monthlySpend = expenses
    ?.filter(e => isAfter(new Date(e.date), monthStart) && isBefore(new Date(e.date), monthEnd))
    .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  const upcomingBills = schedule
    ?.filter(s => !s.isPayday && isAfter(new Date(s.dueDate), today))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3) || [];

  const todayEvents = events?.filter(e => isSameDay(new Date(e.date), today)) || [];
  const tomorrowEvents = events?.filter(e => isSameDay(new Date(e.date), addDays(today, 1))) || [];

  const activeGoals = goals?.slice(0, 2) || [];

  const [setTimeOpen, setSetTimeOpen] = useState(false);
  const [walkOutTime, setWalkOutTime] = useState("");

  const showLeaveTimePrompt = leaveTimeData?.noTimeSet && !leaveTimeData?.hasLeaveTime;
  const showLeaveTimeWidget = leaveTimeData?.hasLeaveTime && leaveTimeData?.showOnDashboard;

  const leaveCountdown = useMemo(() => {
    if (!leaveTimeData?.hasLeaveTime || !leaveTimeData?.leaveTime) return null;
    const [h, m] = leaveTimeData.leaveTime.split(":").map(Number);
    const now = new Date();
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return null;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m`;
    return `${remMins}m`;
  }, [leaveTimeData]);

  const handleSetTime = () => {
    if (!walkOutTime) return;
    const todayDate = new Date().toISOString().split('T')[0];
    saveOverride.mutate({ date: todayDate, leaveTime: walkOutTime }, {
      onSuccess: () => { setSetTimeOpen(false); toast({ title: "Walk-out time set!" }); },
      onError: () => toast({ title: "Failed to set time", variant: "destructive" }),
    });
  };

  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const checklist = leaveTimeData?.checklist || [];

  const firstName = user?.firstName || "there";

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className="pb-10 space-y-6"
    >
      <motion.header variants={stagger.item} className="pt-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5" data-testid="text-greeting-label">
              {greeting.emoji} {greeting.text}
            </p>
            <h1 className="text-3xl font-display font-black tracking-tight mt-0.5" data-testid="text-dashboard-title">
              {firstName}
            </h1>
            {family?.name && (
              <p className="text-sm text-muted-foreground mt-1 font-medium" data-testid="text-family-name">{family.name}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-muted-foreground" data-testid="text-day-name">{format(today, "EEEE")}</p>
            <p className="text-2xl font-display font-black" data-testid="text-today-date">{format(today, "MMM d")}</p>
          </div>
        </div>
      </motion.header>

      {showLeaveTimeWidget && (
        <motion.div variants={stagger.item}>
          <Card className="rounded-3xl border-0 overflow-hidden shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600" data-testid="card-leave-time-widget">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                    <CalendarClock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Walking out at</p>
                    <p className="text-3xl font-black text-white" data-testid="text-dashboard-leave-time">{leaveTimeData.leaveTime}</p>
                    {leaveCountdown && (
                      <p className="text-sm text-emerald-100 font-semibold">{leaveCountdown} from now</p>
                    )}
                  </div>
                </div>
                {leaveTimeData.checklistEnabled && checklist.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                    {checklist.map((item: string) => (
                      <button
                        key={item}
                        onClick={() => setChecklistState(prev => ({ ...prev, [item]: !prev[item] }))}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl transition-all font-semibold ${
                          checklistState[item]
                            ? "bg-white/30 text-white line-through backdrop-blur-sm"
                            : "bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm"
                        }`}
                        data-testid={`checklist-${item.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        {checklistState[item] ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {showLeaveTimePrompt && (
        <motion.div variants={stagger.item}>
          <Card className="rounded-3xl border-0 overflow-hidden shadow-lg bg-gradient-to-br from-primary to-primary/80" data-testid="card-leave-time-prompt">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wider">Walk-out reminder</p>
                  <p className="text-white font-bold text-base mt-0.5">What time are you heading out?</p>
                </div>
              </div>
              <Button size="sm" className="rounded-xl font-bold px-5 bg-white text-primary hover:bg-white/90 shadow-lg" onClick={() => setSetTimeOpen(true)} data-testid="button-set-walkout">
                Set Time
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={stagger.item}>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/schedule">
            <Card className="rounded-3xl border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 h-full" data-testid="card-today-schedule">
              <CardContent className="p-4 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex items-center justify-between">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <CalendarDays className="w-5 h-5 text-white" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/50" />
                </div>
                <div className="mt-auto pt-4">
                  <p className="text-3xl font-display font-black text-white" data-testid="text-today-event-count">{todayEvents.length}</p>
                  <p className="text-xs font-semibold text-white/70 mt-0.5">Today's events</p>
                  {todayEvents.length > 0 && (
                    <p className="text-xs text-white/60 mt-1 truncate font-medium">
                      Next: {todayEvents[0].title}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/money">
            <Card className="rounded-3xl border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 h-full" data-testid="card-monthly-spend">
              <CardContent className="p-4 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex items-center justify-between">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/50" />
                </div>
                <div className="mt-auto pt-4">
                  <p className="text-2xl font-display font-black text-white" data-testid="text-monthly-spend">${monthlySpend.toFixed(0)}</p>
                  <p className="text-xs font-semibold text-white/70 mt-0.5">Spent this month</p>
                  <p className="text-xs text-white/60 mt-1 font-medium">
                    {expenses?.length || 0} transactions
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </motion.div>

      {todayEvents.length > 0 && (
        <motion.div variants={stagger.item}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-violet-500" />
              Coming up today
            </h2>
            <Link href="/schedule">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground font-semibold rounded-xl h-7 px-2" data-testid="link-see-all-schedule">
                See all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {todayEvents.slice(0, 4).map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all" data-testid={`card-event-${event.id}`}>
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-violet-50 flex flex-col items-center justify-center shrink-0">
                      <p className="text-xs font-bold text-violet-600 leading-none">{format(new Date(event.date), 'h:mm')}</p>
                      <p className="text-[10px] font-semibold text-violet-400">{format(new Date(event.date), 'a')}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate" data-testid={`text-event-title-${event.id}`}>{event.title}</p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5" data-testid={`text-event-desc-${event.id}`}>{event.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={stagger.item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-primary" />
            Quick actions
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { title: "Schedule", url: "/schedule", icon: CalendarDays, bg: "bg-violet-50", color: "text-violet-600" },
            { title: "Shopping", url: "/groceries", icon: ShoppingCart, bg: "bg-orange-50", color: "text-orange-600" },
            { title: "Chat", url: "/chat", icon: MessageSquare, bg: "bg-blue-50", color: "text-blue-600" },
            { title: "Goals", url: "/goals", icon: Target, bg: "bg-pink-50", color: "text-pink-600" },
            { title: "Money", url: "/money", icon: Wallet, bg: "bg-emerald-50", color: "text-emerald-600" },
            { title: "Wishlists", url: "/wishlists", icon: Heart, bg: "bg-red-50", color: "text-red-500" },
            { title: "Diary", url: "/diary", icon: BookOpen, bg: "bg-amber-50", color: "text-amber-600" },
            { title: "Leave", url: "/leave-time", icon: Clock, bg: "bg-teal-50", color: "text-teal-600" },
          ].map((item) => (
            <Link key={item.url} href={item.url}>
              <motion.div
                whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center gap-1.5 cursor-pointer"
                data-testid={`quick-action-${item.title.toLowerCase()}`}
              >
                <div className={`relative w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                  {item.title === "Chat" && (unreadData?.totalUnread ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1" data-testid="dashboard-chat-unread">
                      {unreadData!.totalUnread > 99 ? "99+" : unreadData!.totalUnread}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">{item.title}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {upcomingBills.length > 0 && (
        <motion.div variants={stagger.item}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-amber-500" />
              Upcoming bills
            </h2>
            <Link href="/money">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground font-semibold rounded-xl h-7 px-2" data-testid="link-see-all-bills">
                See all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <Card className="rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm overflow-hidden" data-testid="card-upcoming-bills">
            <CardContent className="p-0 divide-y divide-gray-50">
              {upcomingBills.map((bill, i) => (
                <div key={bill.id} className="flex items-center justify-between px-5 py-3.5" data-testid={`bill-row-${bill.id}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" data-testid={`text-bill-title-${bill.id}`}>{bill.title}</p>
                      <p className="text-xs text-muted-foreground font-medium" data-testid={`text-bill-due-${bill.id}`}>Due {format(new Date(bill.dueDate), 'MMM d')}</p>
                    </div>
                  </div>
                  <p className="font-display font-black text-lg shrink-0" data-testid={`text-bill-amount-${bill.id}`}>${Number(bill.amount).toFixed(0)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeGoals.length > 0 && (
        <motion.div variants={stagger.item}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-pink-500" />
              Savings progress
            </h2>
            <Link href="/goals">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground font-semibold rounded-xl h-7 px-2" data-testid="link-see-all-goals">
                See all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {activeGoals.map((goal) => {
              const progress = Math.min((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100, 100);
              return (
                <Card key={goal.id} className="rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all" data-testid={`card-goal-${goal.id}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2.5">
                      <p className="font-bold text-sm truncate" data-testid={`text-goal-name-${goal.id}`}>{goal.name}</p>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0 ml-2">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2.5 rounded-full" />
                    <div className="flex justify-between mt-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        ${Number(goal.currentAmount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        ${Number(goal.targetAmount).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}

      {tomorrowEvents.length > 0 && (
        <motion.div variants={stagger.item}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-gray-300" />
              Tomorrow
            </h2>
          </div>
          <Card className="rounded-3xl border-0 shadow-sm bg-white/60 backdrop-blur-sm overflow-hidden" data-testid="card-tomorrow-events">
            <CardContent className="p-0 divide-y divide-gray-50">
              {tomorrowEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center gap-3 px-5 py-3" data-testid={`tomorrow-event-${event.id}`}>
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-muted-foreground truncate" data-testid={`text-tomorrow-title-${event.id}`}>{event.title}</p>
                    <p className="text-xs text-muted-foreground/60 font-medium" data-testid={`text-tomorrow-time-${event.id}`}>{format(new Date(event.date), 'h:mm a')}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Dialog open={setTimeOpen} onOpenChange={setSetTimeOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Set Walk-Out Time</DialogTitle>
            <DialogDescription>What time are you planning on walking out today?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="time"
              value={walkOutTime}
              onChange={e => setWalkOutTime(e.target.value)}
              className="h-14 text-2xl text-center rounded-2xl"
              data-testid="input-dashboard-walkout"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetTimeOpen(false)} className="rounded-xl" data-testid="button-cancel-walkout">Cancel</Button>
            <Button onClick={handleSetTime} disabled={saveOverride.isPending} className="rounded-xl" data-testid="button-confirm-walkout">
              Set Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
