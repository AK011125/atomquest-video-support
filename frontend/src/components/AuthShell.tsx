"use client";

import { useState } from "react";
import { Video } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export function AuthShell() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"agent" | "customer">("agent");
  const [name, setName] = useState("Support Agent");
  const [email, setEmail] = useState("agent@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const auth = useAuthStore();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (mode === "login") await auth.login(email, password);
      else await auth.register(name, email, password, role);
      window.location.href = role === "agent" ? "/dashboard" : "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  }

  return (
    <main className="min-h-screen bg-cloud px-4 py-10">
      <section className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded bg-signal text-white">
            <Video size={26} />
          </div>
          <h1 className="text-4xl font-semibold tracking-normal text-ink">Real-Time Video Support</h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
            Authenticated customer support sessions with routed WebRTC media, persistent chat, reconnection handling, and operational metrics.
          </p>
        </div>
        <form onSubmit={submit} className="rounded border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 grid grid-cols-2 rounded border border-slate-200 p-1">
            <button type="button" onClick={() => setMode("login")} className={`rounded px-3 py-2 text-sm ${mode === "login" ? "bg-ink text-white" : "text-slate-600"}`}>
              Login
            </button>
            <button type="button" onClick={() => setMode("register")} className={`rounded px-3 py-2 text-sm ${mode === "register" ? "bg-ink text-white" : "text-slate-600"}`}>
              Register
            </button>
          </div>
          {mode === "register" && (
            <>
              <label className="mb-2 block text-sm font-medium">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mb-4 w-full rounded border border-slate-300 px-3 py-2" />
              <label className="mb-2 block text-sm font-medium">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as "agent" | "customer")} className="mb-4 w-full rounded border border-slate-300 px-3 py-2">
                <option value="agent">Agent</option>
                <option value="customer">Customer</option>
              </select>
            </>
          )}
          <label className="mb-2 block text-sm font-medium">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="mb-4 w-full rounded border border-slate-300 px-3 py-2" />
          <label className="mb-2 block text-sm font-medium">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-5 w-full rounded border border-slate-300 px-3 py-2" />
          {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="w-full rounded bg-signal px-4 py-2.5 font-medium text-white">{mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
      </section>
    </main>
  );
}
