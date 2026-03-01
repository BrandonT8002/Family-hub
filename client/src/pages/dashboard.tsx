import { useState, useEffect, useMemo } from "react";
import { useExpenses, useFinancialSchedule, useSavingsGoals } from "@/hooks/use-expenses";
import { useEvents } from "@/hooks/use-events";
import { useLeaveTimeToday, useSaveLeaveTimeOverride } from "@/hooks/use-leave-time";
import { format, isSameDay, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
  MessageSquare, 
  Plus, 
  TrendingUp, 
  Wallet, 
  Clock,
  ArrowRight,
  ShoppingCart,
  Receipt,
  Target,
  CalendarClock,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: expenses } = useExpenses();
  const { data: schedule } = useFinancialSchedule();
  const { data: goals } = useSavingsGoals();
  const { data: events } = useEvents();
  const { data: leaveTimeData } = useLeaveTimeToday();
  const saveOverride = useSaveLeaveTimeOverride();
  const { toast } = useToast();

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const monthlySpend = expenses
    ?.filter(e => isAfter(new Date(e.date), monthStart) && isBefore(new Date(e.date), monthEnd))
    .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  const upcomingBills = schedule
    ?.filter(s => !s.isPayday && isAfter(new Date(s.dueDate), today))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3) || [];

  const activeGoals = goals?.slice(0, 2) || [];
  const todayEvents = events?.filter(e => isSameDay(new Date(e.date), today)) || [];

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

  return (
    <div className="space-y-8 pb-10">
      {showLeaveTimeWidget && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[2rem] border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm overflow-hidden" data-testid="card-leave-time-widget">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-2xl shadow-sm">
                    <CalendarClock className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Walking out at</p>
                    <p className="text-2xl font-black text-emerald-800" data-testid="text-dashboard-leave-time">{leaveTimeData.leaveTime}</p>
                    {leaveCountdown && (
                      <p className="text-sm text-emerald-600 font-medium">{leaveCountdown} from now</p>
                    )}
                  </div>
                </div>
                {leaveTimeData.checklistEnabled && checklist.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                    {checklist.map((item: string) => (
                      <button
                        key={item}
                        onClick={() => setChecklistState(prev => ({ ...prev, [item]: !prev[item] }))}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all ${
                          checklistState[item]
                            ? "bg-emerald-200 text-emerald-800 line-through"
                            : "bg-white/70 text-emerald-700 hover:bg-emerald-100"
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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[2rem] border-primary/20 bg-primary/5 shadow-sm overflow-hidden" data-testid="card-leave-time-prompt">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/80 p-3 rounded-2xl shadow-sm">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Good morning!</h3>
                  <p className="text-slate-600 font-bold text-sm">What time are you planning on walking out today?</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-xl font-black px-5" onClick={() => setSetTimeOpen(true)} data-testid="button-set-walkout">Set Time</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <header>
        <h1 className="text-4xl font-display font-bold tracking-tight" data-testid="text-dashboard-title">Family Overview</h1>
        <p className="text-muted-foreground mt-2 text-lg">Everything at a glance for your household.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2.5rem] border-white/80 shadow-xl overflow-hidden bg-white/90 backdrop-blur-xl transition-all hover:shadow-2xl hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary font-black uppercase tracking-widest text-[11px]">Monthly Spending</CardDescription>
            <CardTitle className="text-4xl font-display font-black text-slate-900">${monthlySpend.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-primary font-black mb-6">
              <TrendingUp className="w-5 h-5" />
              <span>{expenses?.length || 0} Transactions Tracked</span>
            </div>
            <Link href="/money">
              <Button variant="default" className="w-full rounded-2xl h-12 bg-primary text-primary-foreground font-black shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all" data-testid="button-manage-money">
                Manage Money
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-white/80 shadow-xl bg-white/90 backdrop-blur-xl transition-all hover:shadow-2xl hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardDescription className="text-orange-600 font-black uppercase tracking-widest text-[11px]">Shopping Lists</CardDescription>
            <CardTitle className="text-4xl font-display font-black text-slate-900">Lists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-orange-600 font-black mb-6">
              <ShoppingCart className="w-5 h-5" />
              <span>Stay Organized Together</span>
            </div>
            <Link href="/groceries">
              <Button variant="default" className="w-full rounded-2xl h-12 bg-orange-500 text-white font-black shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all border-none" data-testid="button-open-shopping">
                Open Shopping
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-white/80 shadow-xl bg-white/90 backdrop-blur-xl transition-all hover:shadow-2xl hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-900 font-black uppercase tracking-widest text-[11px]">Today's Schedule</CardDescription>
            <CardTitle className="text-4xl font-display font-black text-slate-900">{todayEvents.length} Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              {todayEvents.length > 0 ? (
                todayEvents.slice(0, 3).map(event => (
                  <div key={event.id} className="flex items-center gap-3 text-sm truncate bg-slate-50 p-3 rounded-2xl border-2 border-white shadow-sm">
                    <div className="bg-primary/20 p-1.5 rounded-lg">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 leading-none mb-1">{format(new Date(event.date), 'h:mm a')}</p>
                      <p className="truncate font-bold text-slate-500 leading-none">{event.title}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 font-bold italic bg-slate-50 p-4 rounded-2xl text-center border-2 border-white">Quiet day today.</p>
              )}
            </div>
            <Link href="/schedule">
              <Button variant="outline" className="w-full rounded-2xl h-12 border-2 border-slate-200 font-black text-slate-900 hover:bg-slate-50 transition-all" data-testid="button-view-calendar">
                View Calendar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> Upcoming Bills
          </h2>
          <div className="space-y-3">
            {upcomingBills.length > 0 ? (
              upcomingBills.map(bill => (
                <Card key={bill.id} className="rounded-2xl border-white/40 shadow-sm hover-elevate transition-all bg-white/70 backdrop-blur-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl shadow-inner">
                        <Receipt className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-black text-sm">{bill.title}</p>
                        <p className="text-xs text-primary/70 font-bold">Due {format(new Date(bill.dueDate), 'MMM d')}</p>
                      </div>
                    </div>
                    <p className="font-display font-black text-xl text-primary">-${Number(bill.amount).toFixed(2)}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-white/60 rounded-3xl text-primary/60 font-bold bg-white/40">
                No upcoming bills.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" /> Savings Goals
          </h2>
          <div className="space-y-4">
            {activeGoals.length > 0 ? (
              activeGoals.map(goal => {
                const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;
                return (
                  <Card key={goal.id} className="rounded-2xl border-white/40 shadow-sm bg-white/70 backdrop-blur-sm">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="font-black text-lg">{goal.name}</p>
                          <p className="text-sm text-primary font-bold mt-0.5">
                            ${Number(goal.currentAmount).toLocaleString()} / ${Number(goal.targetAmount).toLocaleString()}
                          </p>
                        </div>
                        <p className="font-display font-black text-primary text-2xl">{Math.round(progress)}%</p>
                      </div>
                      <Progress value={progress} className="h-3 rounded-full bg-white border border-white/60 shadow-inner" />
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-white/60 rounded-3xl text-primary/60 font-bold bg-white/40">
                Set a savings goal to track progress.
              </div>
            )}
          </div>
        </section>
      </div>

      <Dialog open={setTimeOpen} onOpenChange={setSetTimeOpen}>
        <DialogContent className="max-w-sm">
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
            <Button variant="outline" onClick={() => setSetTimeOpen(false)}>Cancel</Button>
            <Button onClick={handleSetTime} disabled={saveOverride.isPending} data-testid="button-confirm-walkout">
              Set Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
