import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useLeaveTimeSettings() {
  return useQuery({
    queryKey: ["/api/leave-time/settings"],
  });
}

export function useLeaveTimeToday() {
  return useQuery({
    queryKey: ["/api/leave-time/today"],
  });
}

export function useFamilyLeaveTimes() {
  return useQuery({
    queryKey: ["/api/leave-time/family"],
  });
}

export function useLeaveTimeTemplates() {
  return useQuery({
    queryKey: ["/api/leave-time/templates"],
  });
}

export function useSaveLeaveTimeSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/leave-time/settings", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/leave-time/settings"] });
      qc.invalidateQueries({ queryKey: ["/api/leave-time/today"] });
    },
  });
}

export function useSaveLeaveTimeOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/leave-time/override", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/leave-time/today"] });
    },
  });
}

export function useDeleteLeaveTimeOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (date: string) => {
      await apiRequest("DELETE", `/api/leave-time/override/${date}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/leave-time/today"] });
    },
  });
}

export function useCreateLeaveTimeTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; items: string[] }) => {
      const res = await apiRequest("POST", "/api/leave-time/templates", data);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/leave-time/templates"] }),
  });
}

export function useDeleteLeaveTimeTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/leave-time/templates/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/leave-time/templates"] }),
  });
}
