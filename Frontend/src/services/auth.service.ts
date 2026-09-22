import { apiRequest } from "./api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user: AuthUser;
}

interface MeResponse {
  success: boolean;
  user: AuthUser;
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  return apiRequest<AuthResponse>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function loginUser(data: {
  email: string;
  password: string;
}) {
  return apiRequest<AuthResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function getCurrentUser() {
  return apiRequest<MeResponse>("/auth/me");
}

export async function logoutUser() {
  return apiRequest<{
    success: boolean;
    message: string;
  }>("/auth/logout", {
    method: "POST",
  });
}