import { useState } from "react";
import { useExpenses, useCreateExpense, useFinancialSchedule, useCreateFinancialSchedule, useSavingsGoals, useUpdateSavingsGoal, useCreateSavingsGoal } from "@/hooks/use-expenses";
import { format, startOfWeek, startOfMonth, isAfter } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Plus, Receipt, TrendingUp, Wallet, Calendar as CalendarIcon, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORIES = ["Groceries", "Rent/Mortgage", "Utilities", "Subscriptions", "Gas", "Clothing", "Dining Out", "Entertainment", "School", "Other"];
const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#94a3b8', '#10b981', '#f43f5e', '#0ea5e9', '#64748b'];

export default function Money() {
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: schedule, isLoading: scheduleLoading } = useFinancialSchedule();
  const { data: goals, isLoading: goalsLoading } = useSavingsGoals();
  
  const createExpense = useCreateExpense();
  const createSchedule = useCreateFinancialSchedule();
  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  const [expenseForm, setExpenseForm] = useState({ amount: "", category: "", description: "", vendor: "", tag: "" });
  const [scheduleForm, setScheduleForm] = useState({ title: "", amount: "", type: "Recurring", frequency: "Monthly", dueDate: "", isPayday: false });
  const [goalForm, setGoalForm] = useState({ name: "", targetAmount: "", currentAmount: "0" });

  const expensesData = expenses || [];
  const scheduleData = schedule || [];
  const goalsData = goals || [];

  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const spentThisWeek = expensesData
    .filter(e => isAfter(new Date(e.date), weekStart))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const spentThisMonth = expensesData
    .filter(e => isAfter(new Date(e.date), monthStart))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalSpent = expensesData.reduce((sum, exp) => sum + Number(exp.amount), 0);
  
  // Grocery specific analytics
  const grocerySpend = expensesData
    .filter(e => e.category === "Groceries" || e.tag === "grocery")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const aggregated = expensesData.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
    return acc;
  }, {} as Record<string, number>);
  
  const chartData = Object.entries(aggregated)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value);

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpense.mutate(expenseForm, {
      onSuccess: () => {
        setExpenseOpen(false);
        setExpenseForm({ amount: "", category: "", description: "", vendor: "", tag: "" });
      }
    });
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSchedule.mutate(scheduleForm, {
      onSuccess: () => {
        setScheduleOpen(false);
        setScheduleForm({ title: "", amount: "", type: "Recurring", frequency: "Monthly", dueDate: "", isPayday: false });
      }
    });
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGoal.mutate(goalForm, {
      onSuccess: () => {
        setGoalOpen(false);
        setGoalForm({ name: "", targetAmount: "", currentAmount: "0" });
      }
    });
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Money Management</h1>
          <p className="text-muted-foreground mt-1">Intentional tracking for financial clarity.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-md hover-elevate gap-2 bg-primary text-primary-foreground">
                <Plus className="w-4 h-4" /> Log Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader><DialogTitle className="font-display text-xl">Log Expense</DialogTitle></DialogHeader>
              <form onSubmit={handleExpenseSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input type="number" step="0.01" required value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="pl-7 rounded-xl" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={expenseForm.category} onValueChange={(val) => setExpenseForm({...expenseForm, category: val})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store / Vendor</label>
                  <Input value={expenseForm.vendor} onChange={e => setExpenseForm({...expenseForm, vendor: e.target.value})} placeholder="e.g. Costco, Netflix" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input required value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} placeholder="What was it for?" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tag</label>
                  <Select value={expenseForm.tag} onValueChange={(val) => setExpenseForm({...expenseForm, tag: val})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Optional Tag" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grocery">Grocery</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="gas">Gas</SelectItem>
                      <SelectItem value="bill">Bill</SelectItem>
                      <SelectItem value="leisure">Leisure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={createExpense.isPending} className="w-full rounded-xl h-11 mt-2">
                  {createExpense.isPending ? "Saving..." : "Save Expense"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/50 p-1 rounded-xl border border-white/20 backdrop-blur-sm">
          <TabsTrigger value="overview" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Overview</TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Schedule</TabsTrigger>
          <TabsTrigger value="goals" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Savings Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Spent this Week</p>
                    <h3 className="text-2xl font-display font-bold mt-1">${spentThisWeek.toFixed(2)}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><TrendingUp className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Spent this Month</p>
                    <h3 className="text-2xl font-display font-bold mt-1">${spentThisMonth.toFixed(2)}</h3>
                  </div>
                  <div className="p-2 bg-accent/10 rounded-lg text-accent"><Wallet className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
                    <h3 className="text-2xl font-display font-bold mt-1">{goalsData.length}</h3>
                  </div>
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><Target className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Grocery Spend</p>
                    <h3 className="text-2xl font-display font-bold mt-1">${grocerySpend.toFixed(2)}</h3>
                  </div>
                  <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><ArrowDownRight className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                    <h3 className="text-2xl font-display font-bold mt-1">{expensesData.length}</h3>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Receipt className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/30 p-4">
                <CardTitle className="text-lg flex items-center gap-2 font-display">
                  <Receipt className="w-4 h-4" /> Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {expensesLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading transactions...</div>
                  ) : expensesData.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-muted-foreground">No transactions logged yet.</p>
                      <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setExpenseOpen(true)}>Log your first expense</Button>
                    </div>
                  ) : (
                    expensesData.slice().reverse().slice(0, 8).map((exp) => (
                      <div key={exp.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{exp.vendor || exp.description}</p>
                            <div className="flex gap-2 items-center text-xs text-muted-foreground mt-0.5">
                              <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded-md font-medium">{exp.category}</span>
                              <span>•</span>
                              <span>{format(new Date(exp.date), 'MMM d')}</span>
                              {exp.tag && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{exp.tag}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold font-display text-lg">-${Number(exp.amount).toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-lg font-display">Spending Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {chartData.length > 0 ? (
                    <>
                      <div className="w-full h-[200px] mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-3">
                        {chartData.slice(0, 4).map((entry, index) => (
                          <div key={entry.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                              <span className="text-muted-foreground">{entry.name}</span>
                            </div>
                            <span className="font-bold">${entry.value.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-10 text-center text-muted-foreground italic">Add expenses to see breakdown.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/50 shadow-sm bg-primary/5 border-primary/20">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm font-display text-primary flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4" /> Financial Tip
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-xs text-primary/80 leading-relaxed">
                    Families who manually log their expenses typically save 15% more annually by identifying unused subscriptions and impulsive spending patterns.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-display font-semibold">Recurring Obligations</h2>
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Add Item</Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle className="font-display">Add Financial Item</DialogTitle></DialogHeader>
                <form onSubmit={handleScheduleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input required value={scheduleForm.title} onChange={e => setScheduleForm({...scheduleForm, title: e.target.value})} placeholder="e.g. Rent, Netflix, Salary" className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount</label>
                      <Input type="number" step="0.01" required value={scheduleForm.amount} onChange={e => setScheduleForm({...scheduleForm, amount: e.target.value})} className="rounded-xl" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Frequency</label>
                      <Select value={scheduleForm.frequency} onValueChange={v => setScheduleForm({...scheduleForm, frequency: v})}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="One-time">One-time</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Input type="date" required value={scheduleForm.dueDate} onChange={e => setScheduleForm({...scheduleForm, dueDate: e.target.value})} className="rounded-xl" />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" checked={scheduleForm.isPayday} onChange={e => setScheduleForm({...scheduleForm, isPayday: e.target.checked})} id="isPayday" />
                    <label htmlFor="isPayday" className="text-sm font-medium cursor-pointer">Mark as Payday / Income</label>
                  </div>
                  <Button type="submit" className="w-full rounded-xl" disabled={createSchedule.isPending}>Save Item</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scheduleLoading ? (
              <div>Loading schedule...</div>
            ) : scheduleData.length === 0 ? (
              <div className="col-span-full p-12 text-center border-2 border-dashed rounded-3xl">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No financial items scheduled</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-1">Track your rent, subscriptions, and paydays here separate from the family calendar.</p>
              </div>
            ) : (
              scheduleData.map(item => (
                <Card key={item.id} className="rounded-2xl border-border/50 shadow-sm hover-elevate transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2 rounded-xl ${item.isPayday ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                        {item.isPayday ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold font-display ${item.isPayday ? 'text-emerald-500' : ''}`}>
                          {item.isPayday ? '+' : '-'}${Number(item.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">{item.frequency}</p>
                      </div>
                    </div>
                    <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5" /> Due {format(new Date(item.dueDate), 'MMM do')}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-display font-semibold">Savings Goals</h2>
            <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2 bg-primary"><Target className="w-4 h-4" /> New Goal</Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle className="font-display">New Savings Goal</DialogTitle></DialogHeader>
                <form onSubmit={handleGoalSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Goal Name</label>
                    <Input required value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} placeholder="e.g. New Couch, Vacation" className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Amount</label>
                      <Input type="number" required value={goalForm.targetAmount} onChange={e => setGoalForm({...goalForm, targetAmount: e.target.value})} className="rounded-xl" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Initial Savings</label>
                      <Input type="number" value={goalForm.currentAmount} onChange={e => setGoalForm({...goalForm, currentAmount: e.target.value})} className="rounded-xl" placeholder="0" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full rounded-xl" disabled={createGoal.isPending}>Create Goal</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goalsLoading ? (
              <div>Loading goals...</div>
            ) : goalsData.length === 0 ? (
              <div className="col-span-full p-12 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No savings goals yet</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-1">Work together to save for something special.</p>
              </div>
            ) : (
              goalsData.map(goal => {
                const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;
                return (
                  <Card key={goal.id} className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-xl font-display font-bold">{goal.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            ${Number(goal.currentAmount).toLocaleString()} saved of ${Number(goal.targetAmount).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-display font-black text-primary">{Math.round(progress)}%</span>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <Progress value={progress} className="h-3 rounded-full bg-primary/10" />
                        
                        <div className="flex gap-2">
                          <Input 
                            type="number" 
                            placeholder="Add amount" 
                            className="rounded-xl h-9" 
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = Number((e.target as HTMLInputElement).value);
                                if (val) {
                                  updateGoal.mutate({ id: goal.id, currentAmount: (Number(goal.currentAmount) + val).toString() });
                                  (e.target as HTMLInputElement).value = "";
                                }
                              }
                            }}
                          />
                          <Button size="sm" variant="secondary" className="rounded-xl">Update</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
