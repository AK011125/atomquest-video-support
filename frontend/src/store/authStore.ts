"use client";

import { create } from "zustand";
import type { User } from "@/types/domain";
import { authApi } from "@/lib/api";

type AuthState = {
  user?: User;
  token?: string;
  login(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string, role: "agent" | "customer"): Promise<void>;
  hydrate(): void;
  logout(): void;
};

export const useAuthStore = create<AuthState>((set) => ({
  hydrate() {
    const raw = localStorage.getItem("video-support-auth");
    if (raw) set(JSON.parse(raw));
  },
  async login(email, password) {
    const result = await authApi.login(email, password);
    localStorage.setItem("video-support-auth", JSON.stringify(result));
    set(result);
  },
  async register(name, email, password, role) {
    const result = await authApi.register(name, email, password, role);
    localStorage.setItem("video-support-auth", JSON.stringify(result));
    set(result);
  },
  logout() {
    localStorage.removeItem("video-support-auth");
    set({ user: undefined, token: undefined });
  }
}));
