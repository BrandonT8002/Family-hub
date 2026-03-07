import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Family } from "@shared/schema";

export function useFamily() {
  return useQuery({
    queryKey: [api.family.get.path],
    queryFn: async () => {
      const res = await fetch(api.family.get.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch family");
      const data = await res.json();
      if (!data) return null;
      return api.family.get.responses[200].parse(data);
    },
    retry: (failureCount, error) => {
      if (error.message === "Failed to fetch family") {
        return failureCount < 2;
      }
      return false;
    },
    retryDelay: 1000,
  });
}

export function useUpdateFamily() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: Partial<Family>) => {
      const res = await apiRequest("PATCH", api.family.get.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.family.get.path] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string, themeConfig?: any, fontFamily?: string }) => {
      const res = await apiRequest("POST", api.family.create.path, data);
      return api.family.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.family.get.path] });
    },
  });
}
