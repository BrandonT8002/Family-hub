import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Loader2, DollarSign, Target, Dumbbell, PiggyBank, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import type { Snapshot } from "@shared/schema";

type SnapshotType = "weekly" | "monthly" | "yearly";

interface SnapshotData {
  spending: { total: number; categoryBreakdown: Record<string, number>; transactionCount: number };
  goals: { completed: number; active: number; total: number };
  workouts: { total: number; types: Record<string, number> };
  savings: { current: number; target: number; progress: number };
  generatedAt: string;
}

const CATEGORY_COLORS = [
  "#f97316", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f59e0b", "#6366f1", "#ef4444", "#22c55e",
  "#06b6d4", "#a855f7", "#d946ef", "#84cc16",
];

const WORKOUT_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

function getCurrentPeriod(type: SnapshotType): string {
  const now = new Date();
  if (type === "yearly") {
    return String(now.getFullYear());
  }
  if (type === "monthly") {
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${month}`;
  }
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const week = String(Math.ceil((days + startOfYear.getDay() + 1) / 7)).padStart(2, "0");
  return `${now.getFullYear()}-W${week}`;
}

function formatPeriodLabel(period: string, type: string): string {
  if (type === "yearly") return period;
  if (type === "monthly") {
    const [y, m] = period.split("-");
    const date = new Date(Number(y), Number(m) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return period.replace("-W", " Week ");
}

function SpendingCard({ data }: { data: SnapshotData["spending"] }) {
  const entries = Object.entries(data.categoryBreakdown || {});
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <Card className="border-0 shadow-sm bg-orange-50/60 dark:bg-orange-950/20" data-testid="card-spending">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Spending</CardTitle>
        <DollarSign className="w-4 h-4 text-orange-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold" data-testid="text-spending-total">
          ${Number(data.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-muted-foreground" data-testid="text-transaction-count">
          {data.transactionCount || 0} transactions
        </div>
        {entries.length > 0 && (
          <div className="space-y-2 pt-1">
            {entries.map(([cat, amount], i) => (
              <div key={cat} className="space-y-1" data-testid={`spending-category-${i}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate">{cat}</span>
                  <span className="font-medium">${Number(amount).toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(amount / maxVal) * 100}%`,
                      backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GoalsCard({ data }: { data: SnapshotData["goals"] }) {
  const progress = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <Card className="border-0 shadow-sm bg-violet-50/60 dark:bg-violet-950/20" data-testid="card-goals">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Goals</CardTitle>
        <Target className="w-4 h-4 text-violet-500" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <svg width="72" height="72" viewBox="0 0 72 72" data-testid="goals-progress-ring">
            <circle cx="36" cy="36" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" opacity="0.3" />
            <circle
              cx="36" cy="36" r={radius} fill="none"
              stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              transform="rotate(-90 36 36)"
            />
            <text x="36" y="36" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold fill-foreground">
              {progress}%
            </text>
          </svg>
          <div className="space-y-1 text-sm">
            <div data-testid="text-goals-completed">
              <span className="font-semibold text-emerald-600">{data.completed}</span> completed
            </div>
            <div data-testid="text-goals-active">
              <span className="font-semibold text-blue-600">{data.active}</span> active
            </div>
            <div data-testid="text-goals-total">
              <span className="font-semibold">{data.total}</span> total
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkoutsCard({ data }: { data: SnapshotData["workouts"] }) {
  const types = Object.entries(data.types || {});

  return (
    <Card className="border-0 shadow-sm bg-emerald-50/60 dark:bg-emerald-950/20" data-testid="card-workouts">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Workouts</CardTitle>
        <Dumbbell className="w-4 h-4 text-emerald-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold" data-testid="text-workouts-total">{data.total || 0}</div>
        <div className="text-xs text-muted-foreground">total sessions</div>
        {types.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {types.map(([type, count], i) => (
              <div key={type} className="flex items-center gap-2 text-xs" data-testid={`workout-type-${i}`}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: WORKOUT_COLORS[i % WORKOUT_COLORS.length] }} />
                <span className="text-muted-foreground flex-1 truncate">{type}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SavingsCard({ data }: { data: SnapshotData["savings"] }) {
  const progress = Math.min(100, Math.max(0, data.progress || 0));

  return (
    <Card className="border-0 shadow-sm bg-amber-50/60 dark:bg-amber-950/20" data-testid="card-savings">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Savings</CardTitle>
        <PiggyBank className="w-4 h-4 text-amber-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold" data-testid="text-savings-current">
            ${Number(data.current || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-muted-foreground" data-testid="text-savings-target">
            / ${Number(data.target || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <Progress value={progress} className="h-2" data-testid="progress-savings" />
        <div className="text-xs text-muted-foreground" data-testid="text-savings-progress">
          {progress.toFixed(1)}% of target
        </div>
      </CardContent>
    </Card>
  );
}

function SnapshotDashboard({ data }: { data: SnapshotData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="snapshot-dashboard">
      <SpendingCard data={data.spending} />
      <GoalsCard data={data.goals} />
      <WorkoutsCard data={data.workouts} />
      <SavingsCard data={data.savings} />
    </div>
  );
}

function PastSnapshotCard({ snapshot }: { snapshot: Snapshot }) {
  const [expanded, setExpanded] = useState(false);
  const data = snapshot.data as unknown as SnapshotData;

  return (
    <Card className="border-0 shadow-sm" data-testid={`card-snapshot-${snapshot.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-sm" data-testid={`text-snapshot-period-${snapshot.id}`}>
              {formatPeriodLabel(snapshot.period, snapshot.type)}
            </span>
            <Badge variant="secondary" className="text-xs" data-testid={`badge-snapshot-type-${snapshot.id}`}>
              {snapshot.type}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground" data-testid={`text-snapshot-date-${snapshot.id}`}>
              {snapshot.createdAt ? new Date(snapshot.createdAt).toLocaleDateString() : ""}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              data-testid={`button-expand-snapshot-${snapshot.id}`}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap" data-testid={`snapshot-highlights-${snapshot.id}`}>
          {data?.spending && (
            <span>${Number(data.spending.total || 0).toFixed(2)} spent</span>
          )}
          {data?.goals && (
            <span>{data.goals.completed}/{data.goals.total} goals</span>
          )}
          {data?.workouts && (
            <span>{data.workouts.total} workouts</span>
          )}
          {data?.savings && (
            <span>{data.savings.progress?.toFixed(0)}% saved</span>
          )}
        </div>
        {expanded && data && (
          <div className="mt-4">
            <SnapshotDashboard data={data} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Snapshots() {
  const [snapshotType, setSnapshotType] = useState<SnapshotType>("monthly");
  const { toast } = useToast();

  const { data: snapshots = [], isLoading } = useQuery<Snapshot[]>({
    queryKey: ["/api/snapshots"],
  });

  const generateMutation = useMutation({
    mutationFn: async (params: { type: SnapshotType; period: string }) => {
      const res = await apiRequest("POST", "/api/snapshots/generate", params);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/snapshots"] });
      toast({ title: "Snapshot generated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to generate snapshot", variant: "destructive" });
    },
  });

  const handleGenerate = () => {
    const period = getCurrentPeriod(snapshotType);
    generateMutation.mutate({ type: snapshotType, period });
  };

  const latestSnapshot = snapshots.length > 0 ? snapshots[0] : null;
  const pastSnapshots = snapshots.length > 1 ? snapshots.slice(1) : [];
  const latestData = latestSnapshot?.data as unknown as SnapshotData | null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-snapshots">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-32">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-snapshots-title">
            <BarChart3 className="w-6 h-6" />
            Snapshots
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Review your progress over time</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={snapshotType} onValueChange={(v) => setSnapshotType(v as SnapshotType)}>
          <SelectTrigger className="w-[140px]" data-testid="select-snapshot-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly" data-testid="option-weekly">Weekly</SelectItem>
            <SelectItem value="monthly" data-testid="option-monthly">Monthly</SelectItem>
            <SelectItem value="yearly" data-testid="option-yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          data-testid="button-generate-report"
        >
          {generateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <BarChart3 className="w-4 h-4 mr-2" />
          )}
          Generate Report
        </Button>
      </div>

      {latestSnapshot && latestData && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold" data-testid="text-latest-snapshot-title">
              {formatPeriodLabel(latestSnapshot.period, latestSnapshot.type)}
            </h2>
            <Badge variant="secondary" className="text-xs" data-testid="badge-latest-type">
              {latestSnapshot.type}
            </Badge>
            {latestData.generatedAt && (
              <span className="text-xs text-muted-foreground" data-testid="text-latest-generated">
                Generated {new Date(latestData.generatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <SnapshotDashboard data={latestData} />
        </div>
      )}

      {!latestSnapshot && (
        <Card className="border-0 shadow-sm" data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-medium text-muted-foreground mb-1">No snapshots yet</h3>
            <p className="text-sm text-muted-foreground/70">
              Select a period type and generate your first report
            </p>
          </CardContent>
        </Card>
      )}

      {pastSnapshots.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold" data-testid="text-past-snapshots-title">Past Snapshots</h2>
          <div className="space-y-3">
            {pastSnapshots.map((s) => (
              <PastSnapshotCard key={s.id} snapshot={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
