import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Goal, GoalItem, GoalCategory } from "@shared/schema";

export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    refetchInterval: 30000,
  });
}

export function useGoalCategories() {
  return useQuery<GoalCategory[]>({
    queryKey: ["/api/goals/categories"],
  });
}

export function useGoalItems(goalId: number | null) {
  return useQuery<GoalItem[]>({
    queryKey: ["/api/goals", goalId, "items"],
    queryFn: async () => {
      const res = await fetch(`/api/goals/${goalId}/items`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
    enabled: !!goalId,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/goals", data);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/goals"] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PATCH", `/api/goals/${id}`, data);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/goals"] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/goals/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/goals"] }),
  });
}

export function useCreateGoalItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, ...data }: any) => {
      const res = await apiRequest("POST", `/api/goals/${goalId}/items`, data);
      return res.json();
    },
    onSuccess: (_d: any, vars: any) => qc.invalidateQueries({ queryKey: ["/api/goals", vars.goalId, "items"] }),
  });
}

export function useUpdateGoalItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, goalId, ...data }: any) => {
      const res = await apiRequest("PATCH", `/api/goals/items/${id}`, data);
      return res.json();
    },
    onSuccess: (_d: any, vars: any) => qc.invalidateQueries({ queryKey: ["/api/goals", vars.goalId, "items"] }),
  });
}

export function useDeleteGoalItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, goalId }: { id: number; goalId: number }) => {
      await apiRequest("DELETE", `/api/goals/items/${id}`);
      return { goalId };
    },
    onSuccess: (_d: any, vars: any) => qc.invalidateQueries({ queryKey: ["/api/goals", vars.goalId, "items"] }),
  });
}

export function useCreateGoalCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/goals/categories", data);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/goals/categories"] }),
  });
}

export function useDeleteGoalCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/goals/categories/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/goals/categories"] }),
  });
}
