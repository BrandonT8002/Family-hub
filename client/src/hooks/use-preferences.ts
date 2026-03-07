import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface WidgetPref {
  key: string;
  enabled: boolean;
  order: number;
}

export interface NavPref {
  key: string;
  enabled: boolean;
  order: number;
}

export interface UserPreferences {
  dashboardWidgets: WidgetPref[];
  navOrder: NavPref[];
}

export const DEFAULT_WIDGETS: WidgetPref[] = [
  { key: "leaveTime", enabled: true, order: 0 },
  { key: "schedule", enabled: true, order: 1 },
  { key: "money", enabled: true, order: 2 },
  { key: "todayEvents", enabled: true, order: 3 },
  { key: "quickActions", enabled: true, order: 4 },
  { key: "upcomingBills", enabled: true, order: 5 },
  { key: "savings", enabled: true, order: 6 },
  { key: "tomorrow", enabled: true, order: 7 },
];

export const DEFAULT_NAV: NavPref[] = [
  { key: "money", enabled: true, order: 0 },
  { key: "goals", enabled: true, order: 1 },
  { key: "wishlists", enabled: true, order: 2 },
  { key: "academics", enabled: true, order: 3 },
  { key: "workouts", enabled: true, order: 4 },
  { key: "snapshots", enabled: true, order: 5 },
  { key: "diary", enabled: true, order: 6 },
  { key: "leaveTime", enabled: true, order: 7 },
  { key: "connections", enabled: true, order: 8 },
  { key: "members", enabled: true, order: 9 },
  { key: "caregiver", enabled: true, order: 10 },
];

export const WIDGET_LABELS: Record<string, string> = {
  leaveTime: "Leave Time",
  schedule: "Today's Schedule",
  money: "Money Summary",
  todayEvents: "Today's Events",
  quickActions: "Quick Actions",
  upcomingBills: "Upcoming Bills",
  savings: "Savings Progress",
  tomorrow: "Tomorrow",
};

export const NAV_LABELS: Record<string, string> = {
  money: "Money",
  goals: "Goals",
  wishlists: "Wishlists",
  academics: "Academics",
  workouts: "Workouts",
  snapshots: "Snapshots",
  diary: "Diary",
  leaveTime: "Leave Time",
  connections: "Connections",
  members: "Members",
  caregiver: "Caregiver",
};

function mergeWithDefaults(saved: WidgetPref[] | undefined, defaults: WidgetPref[]): WidgetPref[] {
  if (!saved || saved.length === 0) return defaults;
  const savedMap = new Map(saved.map(w => [w.key, w]));
  const merged: WidgetPref[] = [];
  for (const s of saved) {
    if (defaults.some(d => d.key === s.key)) merged.push(s);
  }
  for (const d of defaults) {
    if (!savedMap.has(d.key)) merged.push({ ...d, order: merged.length });
  }
  return merged.sort((a, b) => a.order - b.order);
}

function mergeNavWithDefaults(saved: NavPref[] | undefined, defaults: NavPref[]): NavPref[] {
  if (!saved || saved.length === 0) return defaults;
  const savedMap = new Map(saved.map(n => [n.key, n]));
  const merged: NavPref[] = [];
  for (const s of saved) {
    if (defaults.some(d => d.key === s.key)) merged.push(s);
  }
  for (const d of defaults) {
    if (!savedMap.has(d.key)) merged.push({ ...d, order: merged.length });
  }
  return merged.sort((a, b) => a.order - b.order);
}

export function usePreferences() {
  const query = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  const widgets = mergeWithDefaults(query.data?.dashboardWidgets as WidgetPref[], DEFAULT_WIDGETS);
  const navItems = mergeNavWithDefaults(query.data?.navOrder as NavPref[], DEFAULT_NAV);

  return {
    ...query,
    widgets,
    navItems,
  };
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      const res = await apiRequest("PUT", "/api/preferences", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({ title: "Preferences saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    },
  });
}
