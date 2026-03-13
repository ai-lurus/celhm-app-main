import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { Role } from "@celhm/types";

export interface OrgMember {
  id: number;
  organizationId: number;
  userId: number;
  role: Role;
  user: {
    id: number;
    name: string | null;
    email: string | null;
    branch: {
      id: number;
      name: string;
      code: string;
    } | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  name: string | null;
  email: string | null;
  branchId: number | null;
  branch: {
    id: number;
    name: string;
    code: string;
  } | null;
}

export function useUsers() {
  return useQuery({
    queryKey: ["users", "members"],
    queryFn: async () => {
      const response = await api.get<OrgMember[]>("/orgs/members");
      return response.data;
    },
    retry: false,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      name: string;
      role: Role;
      organizationId: number;
      branchId?: number;
    }) => {
      const response = await api.post("/auth/register", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: number;
      role?: Role;
      branchId?: number | null;
    }) => {
      const response = await api.patch(`/orgs/members/${data.id}`, {
        role: data.role,
        branchId: data.branchId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/orgs/members/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (password: string) => {
      const response = await api.patch("/auth/change-password", { password });
      return response.data;
    },
  });
}
