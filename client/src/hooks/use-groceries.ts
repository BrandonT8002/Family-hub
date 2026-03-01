import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";

export function useGroceryLists() {
  return useQuery({
    queryKey: [api.groceryLists.list.path],
    queryFn: async () => {
      const res = await fetch(api.groceryLists.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch grocery lists");
      return api.groceryLists.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateGroceryList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; type?: string; storeName?: string }) => {
      const res = await apiRequest("POST", api.groceryLists.create.path, data);
      return api.groceryLists.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groceryLists.list.path] });
    },
  });
}

export function useGroceryItems(listId: string | number) {
  const path = buildUrl(api.groceryItems.list.path, { listId });
  return useQuery({
    queryKey: [path],
    queryFn: async () => {
      const res = await fetch(path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch grocery items");
      return api.groceryItems.list.responses[200].parse(await res.json());
    },
    enabled: !!listId,
  });
}

export function useCreateGroceryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, ...data }: { listId: string | number; name: string; category: string; price?: string | number; notes?: string }) => {
      const path = buildUrl(api.groceryItems.create.path, { listId });
      const res = await apiRequest("POST", path, data);
      return api.groceryItems.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      const path = buildUrl(api.groceryItems.list.path, { listId: variables.listId });
      queryClient.invalidateQueries({ queryKey: [path] });
    },
  });
}

export function useToggleGroceryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isChecked, listId }: { id: string | number; isChecked: boolean; listId: string | number }) => {
      const path = buildUrl(api.groceryItems.toggle.path, { id });
      const res = await apiRequest("PATCH", path, { isChecked });
      return api.groceryItems.toggle.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      const path = buildUrl(api.groceryItems.list.path, { listId: variables.listId });
      queryClient.invalidateQueries({ queryKey: [path] });
    },
  });
}

export function useUpdateGroceryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, listId, ...data }: { id: number; listId: string | number; name?: string; category?: string; price?: string | number; notes?: string | null }) => {
      const path = buildUrl(api.groceryItems.update.path, { id });
      const res = await apiRequest("PATCH", path, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      const path = buildUrl(api.groceryItems.list.path, { listId: variables.listId });
      queryClient.invalidateQueries({ queryKey: [path] });
    },
  });
}

export function useDeleteGroceryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, listId }: { id: number; listId: string | number }) => {
      const path = buildUrl(api.groceryItems.remove.path, { id });
      const res = await apiRequest("DELETE", path);
      return res.json();
    },
    onSuccess: (_, variables) => {
      const path = buildUrl(api.groceryItems.list.path, { listId: variables.listId });
      queryClient.invalidateQueries({ queryKey: [path] });
    },
  });
}
