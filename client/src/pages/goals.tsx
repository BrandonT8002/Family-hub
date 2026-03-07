import { useState, useMemo } from "react";
import { useGoals, useGoalCategories, useGoalItems, useCreateGoal, useUpdateGoal, useDeleteGoal, useCreateGoalItem, useUpdateGoalItem, useDeleteGoalItem, useCreateGoalCategory, useDeleteGoalCategory } from "@/hooks/use-goals";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Target, Plus, MoreVertical, CheckCircle2, Circle, Flame, TrendingUp, Trophy, Archive, Clock, Trash2, Edit, Eye, EyeOff, Users, User, ChevronDown, ChevronUp, BarChart3, Loader2, X, Tag, UserCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Goal, GoalItem, GoalCategory } from "@shared/schema";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const SUGGESTED_CATEGORIES = [
  { name: "Health", icon: "❤️", color: "#ef4444" },
  { name: "Education", icon: "📚", color: "#3b82f6" },
  { name: "Family", icon: "👨‍👩‍👧‍👦", color: "#8b5cf6" },
  { name: "Finance", icon: "💰", color: "#22c55e" },
  { name: "Home", icon: "🏠", color: "#f59e0b" },
  { name: "Personal", icon: "🌟", color: "#ec4899" },
  { name: "Fitness", icon: "💪", color: "#14b8a6" },
  { name: "Career", icon: "💼", color: "#6366f1" },
];

type ViewTab = "active" | "shared" | "completed" | "archived";
type SortBy = "due-soon" | "most-progressed" | "least-progressed" | "recently-updated";

function GoalProgressBar({ goal, items }: { goal: Goal; items?: GoalItem[] }) {
  const progress = useMemo(() => {
    if (goal.progressType === "checklist" || goal.progressType === "milestone") {
      if (!items || items.length === 0) return 0;
      const done = items.filter(i => i.isCompleted).length;
      return Math.round((done / items.length) * 100);
    }
    if (goal.progressType === "numeric") {
      const target = parseFloat(goal.targetValue || "0");
      const current = parseFloat(goal.currentValue || "0");
      if (target <= 0) return 0;
      return Math.min(100, Math.round((current / target) * 100));
    }
    if (goal.progressType === "streak") {
      return Math.min(100, (goal.streak || 0) * 5);
    }
    return 0;
  }, [goal, items]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{progress}%</span>
        {goal.progressType === "streak" && (
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" />
            {goal.streak || 0} day streak
          </span>
        )}
        {goal.progressType === "numeric" && (
          <span>{goal.currentValue || "0"} / {goal.targetValue || "0"} {goal.unit || ""}</span>
        )}
        {(goal.progressType === "checklist" || goal.progressType === "milestone") && items && (
          <span>{items.filter(i => i.isCompleted).length} / {items.length}</span>
        )}
      </div>
      <Progress value={progress} className="h-2" data-testid={`progress-goal-${goal.id}`} />
    </div>
  );
}

function GoalItemsList({ goal }: { goal: Goal }) {
  const { data: items = [], isLoading } = useGoalItems(goal.id);
  const createItem = useCreateGoalItem();
  const updateItem = useUpdateGoalItem();
  const deleteItem = useDeleteGoalItem();
  const [newItemTitle, setNewItemTitle] = useState("");

  const handleAdd = () => {
    if (!newItemTitle.trim()) return;
    createItem.mutate({ goalId: goal.id, title: newItemTitle.trim(), sortOrder: items.length });
    setNewItemTitle("");
  };

  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin mx-auto" />;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 group" data-testid={`goal-item-${item.id}`}>
          <button
            onClick={() => updateItem.mutate({ id: item.id, goalId: goal.id, isCompleted: !item.isCompleted })}
            className="flex-shrink-0"
            data-testid={`toggle-item-${item.id}`}
          >
            {item.isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          <span className={`flex-1 text-sm ${item.isCompleted ? "line-through text-muted-foreground" : ""}`}>
            {item.title}
          </span>
          <button
            onClick={() => deleteItem.mutate({ id: item.id, goalId: goal.id })}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid={`delete-item-${item.id}`}
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <Input
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          placeholder={goal.progressType === "milestone" ? "Add milestone..." : "Add item..."}
          className="text-sm h-8"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          data-testid={`input-new-item-${goal.id}`}
        />
        <Button size="sm" variant="ghost" onClick={handleAdd} className="h-8 px-2" data-testid={`button-add-item-${goal.id}`}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function NumericProgress({ goal }: { goal: Goal }) {
  const updateGoal = useUpdateGoal();
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");

  const handleSubmit = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    const current = parseFloat(goal.currentValue || "0");
    const newVal = mode === "add" ? current + num : current - num;
    updateGoal.mutate({ id: goal.id, currentValue: String(Math.max(0, newVal)) });
    setAmount("");
    setEditing(false);
  };

  const handleQuickAdjust = (delta: number) => {
    const current = parseFloat(goal.currentValue || "0");
    const newVal = current + delta;
    updateGoal.mutate({ id: goal.id, currentValue: String(Math.max(0, newVal)) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {goal.currentValue || "0"} / {goal.targetValue || "0"} {goal.unit || ""}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleQuickAdjust(-1)}
            disabled={parseFloat(goal.currentValue || "0") <= 0}
            data-testid={`button-quick-minus-${goal.id}`}
          >
            <span className="text-lg font-bold leading-none">−</span>
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleQuickAdjust(1)}
            data-testid={`button-quick-plus-${goal.id}`}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(!editing)} className="text-xs ml-1" data-testid={`button-update-numeric-${goal.id}`}>
            Custom
          </Button>
        </div>
      </div>
      {editing && (
        <div className="space-y-2">
          <div className="flex rounded-md overflow-visible border border-border">
            <button
              onClick={() => setMode("add")}
              className={`flex-1 text-sm font-medium py-1.5 transition-colors ${
                mode === "add"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                  : "text-muted-foreground"
              }`}
              data-testid={`button-mode-add-${goal.id}`}
            >
              <Plus className="w-3.5 h-3.5 inline mr-1" />Add
            </button>
            <button
              onClick={() => setMode("remove")}
              className={`flex-1 text-sm font-medium py-1.5 transition-colors ${
                mode === "remove"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                  : "text-muted-foreground"
              }`}
              data-testid={`button-mode-remove-${goal.id}`}
            >
              <span className="inline mr-1">−</span>Remove
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Amount to ${mode}`}
              className="text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              data-testid={`input-numeric-${goal.id}`}
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!amount || parseFloat(amount) <= 0}
              variant={mode === "add" ? "default" : "destructive"}
              data-testid={`button-submit-numeric-${goal.id}`}
            >
              {mode === "add" ? "Add" : "Remove"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StreakTracker({ goal }: { goal: Goal }) {
  const updateGoal = useUpdateGoal();
  const { toast } = useToast();

  const isCheckedToday = useMemo(() => {
    if (!goal.lastStreakDate) return false;
    const last = new Date(goal.lastStreakDate);
    const today = new Date();
    return last.toDateString() === today.toDateString();
  }, [goal.lastStreakDate]);

  const handleCheckIn = () => {
    if (isCheckedToday) return;
    const today = new Date();
    const last = goal.lastStreakDate ? new Date(goal.lastStreakDate) : null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = 1;
    if (last && last.toDateString() === yesterday.toDateString()) {
      newStreak = (goal.streak || 0) + 1;
    }

    const bestStreak = Math.max(goal.bestStreak || 0, newStreak);

    updateGoal.mutate({
      id: goal.id,
      streak: newStreak,
      bestStreak,
      lastStreakDate: today.toISOString(),
    });
    toast({ title: newStreak > 1 ? `${newStreak} day streak! 🔥` : "Day 1 — let's go!" });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{goal.streak || 0}</div>
            <div className="text-xs text-muted-foreground">Current</div>
          </div>
          <Flame className="w-6 h-6 text-orange-500" />
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{goal.bestStreak || 0}</div>
            <div className="text-xs text-muted-foreground">Best</div>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleCheckIn}
          disabled={isCheckedToday}
          className={isCheckedToday ? "bg-emerald-500 text-white" : ""}
          data-testid={`button-checkin-${goal.id}`}
        >
          {isCheckedToday ? "Done today ✓" : "Check in"}
        </Button>
      </div>
    </div>
  );
}

function GoalCard({ goal, categories, onEdit, onDelete }: { goal: Goal; categories: GoalCategory[]; onEdit: (g: Goal) => void; onDelete: (g: Goal) => void }) {
  const [expanded, setExpanded] = useState(false);
  const updateGoal = useUpdateGoal();
  const { data: items = [] } = useGoalItems(expanded ? goal.id : null);
  const category = categories.find(c => c.id === goal.categoryId);
  const { toast } = useToast();

  const dueInfo = useMemo(() => {
    if (!goal.dueDate) return null;
    const due = new Date(goal.dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, color: "text-red-500" };
    if (diff === 0) return { text: "Due today", color: "text-amber-600" };
    if (diff <= 7) return { text: `${diff}d left`, color: "text-amber-600" };
    return { text: `${diff}d left`, color: "text-muted-foreground" };
  }, [goal.dueDate]);

  const handleStatusChange = (status: string) => {
    updateGoal.mutate({ id: goal.id, status }, {
      onSuccess: () => toast({ title: status === "completed" ? "Goal completed! 🎉" : status === "archived" ? "Goal archived" : "Goal reactivated" }),
      onError: () => toast({ title: "Failed to update goal", variant: "destructive" }),
    });
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-shadow" data-testid={`card-goal-${goal.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {category && (
                <Badge variant="secondary" className="text-xs" style={{ backgroundColor: category.color ? `${category.color}20` : undefined, color: category.color || undefined }}>
                  {category.icon} {category.name}
                </Badge>
              )}
              <Badge variant={goal.type === "short-term" ? "default" : "outline"} className="text-xs">
                {goal.type === "short-term" ? "Short-term" : "Long-term"}
              </Badge>
              {goal.visibility === "family" && (
                <Badge variant="default" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />Family Goal
                </Badge>
              )}
              {goal.visibility === "personal" && (
                <Badge variant="secondary" className="text-xs">
                  <User className="w-3 h-3 mr-1" />Personal
                </Badge>
              )}
            </div>
            <CardTitle className="text-base font-semibold">{goal.title}</CardTitle>
            {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
            {goal.visibility === "family" && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {(goal as any).creatorProfileImage && (
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={(goal as any).creatorProfileImage} />
                    <AvatarFallback className="text-[10px]">{((goal as any).creatorDisplayName || "?")[0]}</AvatarFallback>
                  </Avatar>
                )}
                {(goal as any).creatorDisplayName && (
                  <span className="text-xs text-muted-foreground" data-testid={`text-creator-${goal.id}`}>
                    Created by {(goal as any).creatorDisplayName}
                  </span>
                )}
                {(goal as any).lastUpdatedByName && goal.updatedAt && (
                  <span className="text-xs text-muted-foreground/70" data-testid={`text-updated-by-${goal.id}`}>
                    {" · "}Updated by {(goal as any).lastUpdatedByName} {formatTimeAgo(new Date(goal.updatedAt))}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {dueInfo && (
              <span className={`text-xs ${dueInfo.color} mr-2`} data-testid={`due-info-${goal.id}`}>
                <Clock className="w-3 h-3 inline mr-1" />{dueInfo.text}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`menu-goal-${goal.id}`}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(goal)} data-testid={`edit-goal-${goal.id}`}>
                  <Edit className="w-4 h-4 mr-2" />Edit
                </DropdownMenuItem>
                {goal.status === "active" && (
                  <>
                    <DropdownMenuItem onClick={() => handleStatusChange("completed")} data-testid={`complete-goal-${goal.id}`}>
                      <Trophy className="w-4 h-4 mr-2" />Mark Complete
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange("archived")} data-testid={`archive-goal-${goal.id}`}>
                      <Archive className="w-4 h-4 mr-2" />Archive
                    </DropdownMenuItem>
                  </>
                )}
                {(goal.status === "completed" || goal.status === "archived") && (
                  <DropdownMenuItem onClick={() => handleStatusChange("active")} data-testid={`reactivate-goal-${goal.id}`}>
                    <TrendingUp className="w-4 h-4 mr-2" />Reactivate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(goal)} className="text-red-600" data-testid={`delete-goal-${goal.id}`}>
                  <Trash2 className="w-4 h-4 mr-2" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <GoalProgressBar goal={goal} items={items} />

        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
          data-testid={`expand-goal-${goal.id}`}
        >
          {expanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
          {expanded ? "Hide details" : "Show details"}
        </Button>

        {expanded && (
          <div className="pt-2 border-t space-y-3">
            {(goal.progressType === "checklist" || goal.progressType === "milestone") && (
              <GoalItemsList goal={goal} />
            )}
            {goal.progressType === "numeric" && (
              <NumericProgress goal={goal} />
            )}
            {goal.progressType === "streak" && (
              <StreakTracker goal={goal} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Goals() {
  const { data: goals = [], isLoading } = useGoals();
  const { data: categories = [] } = useGoalCategories();
  const { user } = useAuth();
  const { toast } = useToast();

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const createCategory = useCreateGoalCategory();
  const deleteCategory = useDeleteGoalCategory();

  const [viewTab, setViewTab] = useState<ViewTab>("active");
  const [sortBy, setSortBy] = useState<SortBy>("recently-updated");
  const [typeFilter, setTypeFilter] = useState<"all" | "short-term" | "long-term">("all");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");

  const [goalOpen, setGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", categoryId: "", type: "short-term",
    progressType: "checklist", visibility: "personal",
    targetValue: "", unit: "", dueDate: ""
  });

  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [newCatColor, setNewCatColor] = useState("#3b82f6");

  const resetForm = () => setForm({
    title: "", description: "", categoryId: "", type: "short-term",
    progressType: "checklist", visibility: "personal",
    targetValue: "", unit: "", dueDate: ""
  });

  const filteredGoals = useMemo(() => {
    let filtered = goals;

    if (viewTab === "active") filtered = filtered.filter(g => g.status === "active");
    else if (viewTab === "shared") filtered = filtered.filter(g => g.visibility === "family" && g.status === "active");
    else if (viewTab === "completed") filtered = filtered.filter(g => g.status === "completed");
    else if (viewTab === "archived") filtered = filtered.filter(g => g.status === "archived");

    if (typeFilter !== "all") filtered = filtered.filter(g => g.type === typeFilter);
    if (categoryFilter !== "all") filtered = filtered.filter(g => g.categoryId === categoryFilter);

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "due-soon") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === "recently-updated") {
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      }
      return 0;
    });

    return filtered;
  }, [goals, viewTab, sortBy, typeFilter, categoryFilter]);

  const stats = useMemo(() => {
    const active = goals.filter(g => g.status === "active").length;
    const completed = goals.filter(g => g.status === "completed").length;
    const streaks = goals.filter(g => g.progressType === "streak" && g.status === "active");
    const longestStreak = streaks.reduce((max, g) => Math.max(max, g.bestStreak || 0), 0);
    return { active, completed, longestStreak };
  }, [goals]);

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast({ title: "Please enter a goal title", variant: "destructive" });
      return;
    }

    const data: any = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      type: form.type,
      progressType: form.progressType,
      visibility: form.visibility,
      targetValue: form.targetValue || null,
      unit: form.unit || null,
      dueDate: form.dueDate || null,
    };

    if (editingGoal) {
      updateGoal.mutate({ id: editingGoal.id, ...data }, {
        onSuccess: () => { setGoalOpen(false); setEditingGoal(null); resetForm(); toast({ title: "Goal updated" }); },
        onError: () => toast({ title: "Failed to update goal", variant: "destructive" }),
      });
    } else {
      createGoal.mutate(data, {
        onSuccess: () => { setGoalOpen(false); resetForm(); toast({ title: "Goal created! 🎯" }); },
        onError: () => toast({ title: "Failed to create goal", variant: "destructive" }),
      });
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      description: goal.description || "",
      categoryId: goal.categoryId ? String(goal.categoryId) : "",
      type: goal.type,
      progressType: goal.progressType,
      visibility: goal.visibility,
      targetValue: goal.targetValue || "",
      unit: goal.unit || "",
      dueDate: goal.dueDate ? new Date(goal.dueDate).toISOString().split("T")[0] : "",
    });
    setGoalOpen(true);
  };

  const handleDelete = () => {
    if (!deletingGoal) return;
    deleteGoal.mutate(deletingGoal.id, {
      onSuccess: () => { setDeletingGoal(null); toast({ title: "Goal deleted" }); },
      onError: () => toast({ title: "Failed to delete goal", variant: "destructive" }),
    });
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    createCategory.mutate({ name: newCatName.trim(), icon: newCatIcon || null, color: newCatColor }, {
      onSuccess: () => { setNewCatName(""); setNewCatIcon(""); toast({ title: "Category created" }); },
      onError: () => toast({ title: "Failed to create category", variant: "destructive" }),
    });
  };

  const [seeding, setSeeding] = useState(false);

  const handleSeedCategories = async () => {
    setSeeding(true);
    try {
      for (const cat of SUGGESTED_CATEGORIES) {
        await apiRequest("POST", "/api/goals/categories", { name: cat.name, icon: cat.icon, color: cat.color });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/goals/categories"] });
      toast({ title: "Starter categories added!" });
    } catch {
      toast({ title: "Failed to add categories", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-goals-title">
            <Target className="w-6 h-6" />Goals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Set intentions, track progress, build momentum</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCategoryOpen(true)} data-testid="button-manage-categories">
            <Tag className="w-4 h-4 mr-1" />Categories
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setEditingGoal(null); setGoalOpen(true); }} data-testid="button-new-goal">
            <Plus className="w-4 h-4 mr-1" />New Goal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-white/70 border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600" data-testid="stat-active-goals">{stats.active}</div>
            <div className="text-xs text-muted-foreground">Active Goals</div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600" data-testid="stat-completed-goals">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-500" data-testid="stat-best-streak">{stats.longestStreak}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Flame className="w-3 h-3" />Best Streak
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["active", "shared", "completed", "archived"] as ViewTab[]).map(tab => (
          <Button
            key={tab}
            variant={viewTab === tab ? "default" : "outline"}
            size="sm"
            onClick={() => setViewTab(tab)}
            className={`capitalize text-xs ${tab === "shared" && viewTab !== "shared" ? "border-primary/40 text-primary" : ""}`}
            data-testid={`tab-${tab}`}
          >
            {tab === "active" && <TrendingUp className="w-3 h-3 mr-1" />}
            {tab === "shared" && <Users className="w-3 h-3 mr-1" />}
            {tab === "completed" && <Trophy className="w-3 h-3 mr-1" />}
            {tab === "archived" && <Archive className="w-3 h-3 mr-1" />}
            {tab === "shared" ? "Family Goals" : tab}
          </Button>
        ))}
        <div className="ml-auto flex gap-2">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger className="h-8 w-[130px] text-xs" data-testid="select-type-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="short-term">Short-term</SelectItem>
              <SelectItem value="long-term">Long-term</SelectItem>
            </SelectContent>
          </Select>
          {categories.length > 0 && (
            <Select value={String(categoryFilter)} onValueChange={(v) => setCategoryFilter(v === "all" ? "all" : Number(v))}>
              <SelectTrigger className="h-8 w-[140px] text-xs" data-testid="select-category-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="h-8 w-[150px] text-xs" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recently-updated">Recently Updated</SelectItem>
              <SelectItem value="due-soon">Due Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredGoals.length === 0 ? (
        <Card className="bg-white/50 border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-muted-foreground mb-2">
              {viewTab === "active" ? "No active goals yet" :
               viewTab === "shared" ? "No family goals yet" :
               viewTab === "completed" ? "No completed goals yet" :
               "No archived goals"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {viewTab === "active" ? "Create your first goal to start tracking progress" :
               viewTab === "shared" ? "Create a goal and share it with your family so everyone can track progress together" :
               "Goals will appear here as you use them"}
            </p>
            {(viewTab === "active" || viewTab === "shared") && (
              <Button onClick={() => { resetForm(); setEditingGoal(null); if (viewTab === "shared") setForm(f => ({ ...f, visibility: "family" })); setGoalOpen(true); }} data-testid="button-empty-new-goal">
                <Plus className="w-4 h-4 mr-1" />{viewTab === "shared" ? "Create Family Goal" : "Create a Goal"}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              categories={categories}
              onEdit={handleEdit}
              onDelete={setDeletingGoal}
            />
          ))}
        </div>
      )}

      <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Goal" : "New Goal"}</DialogTitle>
            <DialogDescription>
              {editingGoal ? "Update your goal details" : "Set an intention and choose how to track it"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Goal Name</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Save for vacation, Work out 3x/week"
                data-testid="input-goal-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description (optional)</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does success look like?"
                className="resize-none"
                rows={2}
                data-testid="input-goal-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger data-testid="select-goal-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short-term">Short-term</SelectItem>
                    <SelectItem value="long-term">Long-term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={form.categoryId || "none"} onValueChange={(v) => setForm({ ...form, categoryId: v === "none" ? "" : v })}>
                  <SelectTrigger data-testid="select-goal-category">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Progress Tracking</label>
              <Select value={form.progressType} onValueChange={(v) => setForm({ ...form, progressType: v })}>
                <SelectTrigger data-testid="select-progress-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checklist">Checklist</SelectItem>
                  <SelectItem value="numeric">Numeric</SelectItem>
                  <SelectItem value="streak">Streak / Consistency</SelectItem>
                  <SelectItem value="milestone">Milestones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={`p-4 rounded-lg border-2 transition-colors ${form.visibility === "family" ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-muted"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${form.visibility === "family" ? "bg-primary/10" : "bg-muted"}`}>
                    {form.visibility === "family" ? <Users className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{form.visibility === "family" ? "Shared with Family" : "Personal Goal"}</p>
                    <p className="text-xs text-muted-foreground">{form.visibility === "family" ? "All family members can view and contribute to this goal" : "Only you can see this goal"}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={form.visibility === "family" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setForm({ ...form, visibility: form.visibility === "family" ? "personal" : "family" })}
                  data-testid="button-toggle-visibility"
                >
                  {form.visibility === "family" ? "Shared" : "Make Shared"}
                </Button>
              </div>
            </div>
            {form.progressType === "numeric" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Target</label>
                  <Input
                    type="number"
                    value={form.targetValue}
                    onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                    placeholder="e.g., 1500"
                    data-testid="input-target-value"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Unit</label>
                  <Input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="e.g., $, pages, miles"
                    data-testid="input-unit"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">Due Date (optional)</label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                data-testid="input-due-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setGoalOpen(false); setEditingGoal(null); resetForm(); }} data-testid="button-cancel-goal">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createGoal.isPending || updateGoal.isPending} data-testid="button-save-goal">
              {(createGoal.isPending || updateGoal.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {editingGoal ? "Save Changes" : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Goal Categories</DialogTitle>
            <DialogDescription>Create custom categories to organize your goals</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {categories.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No categories yet. Start with our suggestions?</p>
                <Button variant="outline" size="sm" onClick={handleSeedCategories} disabled={seeding} data-testid="button-seed-categories">
                  {seeding && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  Add Starter Pack
                </Button>
              </div>
            )}
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50" data-testid={`category-${cat.id}`}>
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.name}</span>
                  {cat.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCategory.mutate(cat.id, {
                    onSuccess: () => toast({ title: "Category deleted" }),
                    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
                  })}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                  data-testid={`delete-category-${cat.id}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <div className="border-t pt-3 space-y-2">
              <label className="text-sm font-medium">Add New Category</label>
              <div className="flex gap-2">
                <Input
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  placeholder="Icon"
                  className="w-16 text-center"
                  data-testid="input-category-icon"
                />
                <Input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category name"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  data-testid="input-category-name"
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-8 h-9 rounded cursor-pointer border"
                  data-testid="input-category-color"
                />
                <Button size="sm" onClick={handleAddCategory} className="h-9" data-testid="button-add-category">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingGoal} onOpenChange={(open) => !open && setDeletingGoal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingGoal?.title}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
