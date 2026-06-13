"use client";

import { useEffect, useState } from "react";
import { Activity, MessageSquare, Radio, Users, Video } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type Metrics = Awaited<ReturnType<typeof adminApi.metrics>>;

const tiles = [
  ["users", "Users", Users],
  ["activeSessions", "Active Sessions", Video],
  ["endedSessions", "Ended Sessions", Activity],
  ["messages", "Messages", MessageSquare],
  ["activeParticipants", "Participants", Users],
  ["recordings", "Recordings", Radio]
] as const;

export default function AdminPage() {
  const { token, user, hydrate } = useAuthStore();
  const [metrics, setMetrics] = useState<Metrics>();
  const [error, setError] = useState("");

  useEffect(() => hydrate(), [hydrate]);
  useEffect(() => {
    if (!token) return;
    adminApi.metrics(token).then(setMetrics).catch((err) => setError(err.message));
  }, [token]);

  if (!token || user?.role !== "admin") {
    return <main className="p-8 text-slate-600">Admin access required.</main>;
  }

  return (
    <main className="min-h-screen bg-cloud p-6">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-1 text-slate-500">Operational metrics across support sessions.</p>
        {error && <p className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map(([key, label, Icon]) => (
            <div key={key} className="rounded border border-slate-200 bg-white p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-signal">
                <Icon size={20} />
              </div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-3xl font-semibold">{metrics?.[key] ?? 0}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
