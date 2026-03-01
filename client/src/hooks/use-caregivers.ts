import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Caregiver, CareNote } from "@shared/schema";

export function useCaregivers() {
  return useQuery<Caregiver[]>({
    queryKey: ["/api/caregivers"],
  });
}

export function useCaregiverStatus() {
  return useQuery<{
    isCaregiver: boolean;
    caregiver?: Caregiver;
    assignedChildren?: any[];
    familyName?: string;
  }>({
    queryKey: ["/api/caregiver/status"],
  });
}

export function useAddCaregiver() {
  return useMutation({
    mutationFn: async (data: {
      caregiverUserId: string;
      displayName?: string;
      accessType?: string;
      expiresAt?: string;
      assignedChildIds?: number[];
      permissions?: any;
    }) => {
      const res = await apiRequest("POST", "/api/caregivers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/caregivers"] });
    },
  });
}

export function useUpdateCaregiver() {
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; [key: string]: any }) => {
      const res = await apiRequest("PATCH", `/api/caregivers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/caregivers"] });
    },
  });
}

export function useRevokeCaregiver() {
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/caregivers/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/caregivers"] });
    },
  });
}

export function useCaregiverSchedule() {
  return useQuery({
    queryKey: ["/api/caregiver/schedule"],
  });
}

export function useCaregiverNotes() {
  return useQuery<CareNote[]>({
    queryKey: ["/api/caregiver/care-notes"],
  });
}

export function useCreateCareNote() {
  return useMutation({
    mutationFn: async (data: { childId?: number; type: string; content: string }) => {
      const res = await apiRequest("POST", "/api/caregiver/care-notes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/caregiver/care-notes"] });
    },
  });
}

export function useCareNotes(childId?: number) {
  return useQuery<CareNote[]>({
    queryKey: ["/api/care-notes", childId],
    queryFn: async () => {
      const url = childId ? `/api/care-notes?childId=${childId}` : "/api/care-notes";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch care notes");
      return res.json();
    },
  });
}
