import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dumbbell, Plus, Trash2, Loader2, Flame, Timer, TrendingUp } from "lucide-react";
import type { Workout } from "@shared/schema";

const WORKOUT_TYPES = ["Cardio", "Strength", "Yoga", "Walking", "Running", "Swimming", "Cycling", "HIIT", "Other"] as const;

const TYPE_COLORS: Record<string, string> = {
  Cardio: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Strength: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Yoga: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Walking: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Running: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Swimming: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  Cycling: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  HIIT: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  Other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function getDayLabel(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function getDateLabel(d: Date) {
  return d.getDate().toString();
}

function getLast7Days() {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function getKeyMetric(w: Workout) {
  if (w.weight && Number(w.weight) > 0) return `${w.weight} lbs`;
  if (w.distance && Number(w.distance) > 0) return `${w.distance} ${w.distanceUnit || "miles"}`;
  if (w.reps) return `${w.reps} reps`;
  return null;
}

export default function Workouts() {
  const { toast } = useToast();
  const { data: workouts = [], isLoading } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    type: "",
    duration: "",
    reps: "",
    sets: "",
    weight: "",
    distance: "",
    distanceUnit: "miles",
    notes: "",
    isPrivate: true,
    date: formatDate(new Date()),
  });

  const resetForm = () =>
    setForm({
      type: "",
      duration: "",
      reps: "",
      sets: "",
      weight: "",
      distance: "",
      distanceUnit: "miles",
      notes: "",
      isPrivate: true,
      date: formatDate(new Date()),
    });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await apiRequest("POST", "/api/workouts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Workout logged!" });
    },
    onError: () => toast({ title: "Failed to log workout", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/workouts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      setDeletingId(null);
      toast({ title: "Workout deleted" });
    },
    onError: () => toast({ title: "Failed to delete workout", variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!form.type) {
      toast({ title: "Please select a workout type", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      type: form.type,
      duration: form.duration ? Number(form.duration) : null,
      reps: form.reps ? Number(form.reps) : null,
      sets: form.sets ? Number(form.sets) : null,
      weight: form.weight || null,
      distance: form.distance || null,
      distanceUnit: form.distanceUnit,
      notes: form.notes || null,
      isPrivate: form.isPrivate,
      date: new Date(form.date).toISOString(),
    });
  };

  const handleQuickAdd = (type: string) => {
    setForm((f) => ({ ...f, type }));
    setDialogOpen(true);
  };

  const last7Days = useMemo(() => getLast7Days(), []);

  const workoutsByDate = useMemo(() => {
    const map: Record<string, Workout[]> = {};
    for (const w of workouts) {
      const key = formatDate(new Date(w.date || w.createdAt || ""));
      if (!map[key]) map[key] = [];
      map[key].push(w);
    }
    return map;
  }, [workouts]);

  const daysWithWorkouts = useMemo(() => {
    const set = new Set<string>();
    for (const w of workouts) {
      set.add(formatDate(new Date(w.date || w.createdAt || "")));
    }
    return set;
  }, [workouts]);

  const sortedDates = useMemo(() => {
    return Object.keys(workoutsByDate).sort((a, b) => b.localeCompare(a));
  }, [workoutsByDate]);

  const weeklySummary = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const thisWeek = workouts.filter((w) => {
      const d = new Date(w.date || w.createdAt || "");
      return d >= weekStart;
    });

    const totalDuration = thisWeek.reduce((sum, w) => sum + (w.duration || 0), 0);

    const typeCounts: Record<string, number> = {};
    for (const w of thisWeek) {
      typeCounts[w.type] = (typeCounts[w.type] || 0) + 1;
    }
    const mostCommon = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

    return { total: thisWeek.length, totalDuration, mostCommon };
  }, [workouts]);

  const monthlyTrend = useMemo(() => {
    const weeks: number[] = [0, 0, 0, 0];
    const now = new Date();
    for (const w of workouts) {
      const d = new Date(w.date || w.createdAt || "");
      const daysAgo = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo < 7) weeks[3]++;
      else if (daysAgo < 14) weeks[2]++;
      else if (daysAgo < 21) weeks[1]++;
      else if (daysAgo < 28) weeks[0]++;
    }
    const max = Math.max(...weeks, 1);
    return weeks.map((count) => ({ count, height: Math.max(8, (count / max) * 100) }));
  }, [workouts]);

  const today = formatDate(new Date());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-32">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-workouts-title">
          <Dumbbell className="w-6 h-6" />
          Workouts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track your fitness journey</p>
      </div>

      <div className="flex gap-2 justify-between" data-testid="weekly-calendar-strip">
        {last7Days.map((day) => {
          const key = formatDate(day);
          const hasWorkout = daysWithWorkouts.has(key);
          const isToday = key === today;
          return (
            <div
              key={key}
              className={`flex flex-col items-center gap-1 p-2 rounded-md flex-1 text-center ${isToday ? "bg-muted" : ""}`}
              data-testid={`calendar-day-${key}`}
            >
              <span className="text-xs text-muted-foreground">{getDayLabel(day)}</span>
              <span className={`text-sm font-medium ${isToday ? "text-foreground" : "text-muted-foreground"}`}>
                {getDateLabel(day)}
              </span>
              {hasWorkout && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </div>
          );
        })}
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">Quick add</p>
        <div className="flex flex-wrap gap-2">
          {WORKOUT_TYPES.map((type) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd(type)}
              data-testid={`button-quick-add-${type.toLowerCase()}`}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold" data-testid="stat-weekly-total">{weeklySummary.total}</div>
            <div className="text-xs text-muted-foreground">This week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Timer className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold" data-testid="stat-weekly-duration">{weeklySummary.totalDuration}</div>
            <div className="text-xs text-muted-foreground">Minutes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-lg font-bold truncate" data-testid="stat-most-common">{weeklySummary.mostCommon}</div>
            <div className="text-xs text-muted-foreground">Top type</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Monthly Trend</p>
          <div className="flex items-end gap-3 h-24" data-testid="monthly-trend-chart">
            {monthlyTrend.map((week, i) => (
              <div key={i} className="flex flex-col items-center flex-1 gap-1">
                <div
                  className="w-full bg-primary/20 rounded-sm transition-all"
                  style={{ height: `${week.height}%` }}
                  data-testid={`trend-bar-${i}`}
                />
                <span className="text-[10px] text-muted-foreground">W{i + 1}</span>
                <span className="text-xs font-medium">{week.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">History</h2>
        <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-log-workout">
          <Plus className="w-4 h-4 mr-1" />Log Workout
        </Button>
      </div>

      {sortedDates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground" data-testid="text-no-workouts">
            No workouts logged yet. Start tracking your fitness!
          </CardContent>
        </Card>
      )}

      {sortedDates.map((dateKey) => (
        <div key={dateKey} className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground" data-testid={`date-group-${dateKey}`}>
            {new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
          {workoutsByDate[dateKey].map((w) => (
            <Card key={w.id} data-testid={`card-workout-${w.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={`no-default-hover-elevate no-default-active-elevate ${TYPE_COLORS[w.type] || TYPE_COLORS.Other}`} data-testid={`badge-type-${w.id}`}>
                      {w.type}
                    </Badge>
                    {w.duration && (
                      <span className="text-sm text-muted-foreground" data-testid={`duration-${w.id}`}>{w.duration} min</span>
                    )}
                    {getKeyMetric(w) && (
                      <span className="text-sm font-medium" data-testid={`metric-${w.id}`}>{getKeyMetric(w)}</span>
                    )}
                    {w.sets && w.reps && (
                      <span className="text-sm text-muted-foreground">{w.sets}x{w.reps}</span>
                    )}
                    {!w.isPrivate && (
                      <Badge variant="outline" className="text-xs">Shared</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingId(w.id)}
                    data-testid={`button-delete-workout-${w.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
                {w.notes && (
                  <p className="text-sm text-muted-foreground mt-2" data-testid={`notes-${w.id}`}>{w.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Type *</label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {WORKOUT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} data-testid={`option-type-${t.toLowerCase()}`}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Duration (min)</label>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  placeholder="30"
                  data-testid="input-duration"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  data-testid="input-date"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Sets</label>
                <Input
                  type="number"
                  value={form.sets}
                  onChange={(e) => setForm((f) => ({ ...f, sets: e.target.value }))}
                  placeholder="3"
                  data-testid="input-sets"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Reps</label>
                <Input
                  type="number"
                  value={form.reps}
                  onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
                  placeholder="12"
                  data-testid="input-reps"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Weight</label>
                <Input
                  type="number"
                  value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                  placeholder="lbs"
                  data-testid="input-weight"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Distance</label>
                <Input
                  type="number"
                  value={form.distance}
                  onChange={(e) => setForm((f) => ({ ...f, distance: e.target.value }))}
                  placeholder="0"
                  data-testid="input-distance"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Unit</label>
                <Select value={form.distanceUnit} onValueChange={(v) => setForm((f) => ({ ...f, distanceUnit: v }))}>
                  <SelectTrigger data-testid="select-distance-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="miles">Miles</SelectItem>
                    <SelectItem value="km">Kilometers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="How did it go?"
                data-testid="input-notes"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Share with family</label>
              <Switch
                checked={!form.isPrivate}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isPrivate: !checked }))}
                data-testid="switch-privacy"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              data-testid="button-submit-workout"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Log Workout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this workout? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
