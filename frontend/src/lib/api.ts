import type { SupportSession, User } from "@/types/domain";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type AuthResponse = { token: string; user: User };

export function apiUrl(path: string) {
  return `${API_URL}${path}`;
}

export async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message ?? "Request failed");
  }
  return response.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    api<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string, role: "agent" | "customer") =>
    api<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, role }) })
};

export const sessionApi = {
  create: (title: string, token: string) =>
    api<{ session: SupportSession }>("/api/sessions", { method: "POST", body: JSON.stringify({ title }) }, token),
  list: (token: string) => api<{ sessions: SupportSession[] }>("/api/sessions", {}, token),
  byInvite: (inviteCode: string) => api<{ session: SupportSession }>(`/api/sessions/invite/${inviteCode}`),
  end: (sessionId: string, token: string) => api<{ session: SupportSession }>(`/api/sessions/${sessionId}/end`, { method: "POST" }, token),
  startRecording: (sessionId: string, token: string) => api(`/api/recordings/${sessionId}/start`, { method: "POST" }, token),
  stopRecording: (sessionId: string, token: string) => api(`/api/recordings/${sessionId}/stop`, { method: "POST" }, token)
};

export const adminApi = {
  metrics: (token: string) =>
    api<Record<"users" | "activeSessions" | "endedSessions" | "messages" | "activeParticipants" | "recordings", number>>(
      "/api/admin/metrics",
      {},
      token
    )
};
