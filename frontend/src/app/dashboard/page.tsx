"use client";

import { useEffect, useState } from "react";
import { Copy, LogOut, Plus, Radio, Square, Video } from "lucide-react";
import { apiUrl, sessionApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { SupportSession } from "@/types/domain";

export default function DashboardPage() {
  const { user, token, hydrate, logout } = useAuthStore();
  const [title, setTitle] = useState("Customer support call");
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [error, setError] = useState("");

  useEffect(() => hydrate(), [hydrate]);
  useEffect(() => {
    if (!token) return;
    sessionApi.list(token).then((result) => setSessions(result.sessions)).catch((err) => setError(err.message));
  }, [token]);

  async function createSession(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    const result = await sessionApi.create(title, token);
    setSessions((items) => [result.session, ...items]);
  }

  async function toggleRecording(session: SupportSession) {
    if (!token) return;
    if (session.recordingEnabled) await sessionApi.stopRecording(session._id, token);
    else await sessionApi.startRecording(session._id, token);
    setSessions((items) => items.map((item) => (item._id === session._id ? { ...item, recordingEnabled: !session.recordingEnabled } : item)));
  }

  async function endSession(session: SupportSession) {
    if (!token) return;
    const result = await sessionApi.end(session._id, token);
    setSessions((items) => items.map((item) => (item._id === session._id ? result.session : item)));
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cloud">
        <a href="/login" className="rounded bg-signal px-4 py-2 text-white">Sign in</a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cloud">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded bg-signal p-2 text-white"><Video size={22} /></div>
            <div>
              <h1 className="text-xl font-semibold">Agent Dashboard</h1>
              <p className="text-sm text-slate-500">{user?.name ?? "Support team"}</p>
            </div>
          </div>
          <button onClick={logout} className="rounded border border-slate-300 p-2" title="Log out"><LogOut size={18} /></button>
        </div>
      </header>
      <section className="mx-auto grid max-w-6xl gap-5 p-6 lg:grid-cols-[340px_1fr]">
        <form onSubmit={createSession} className="h-fit rounded border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold">Create Session</h2>
          <label className="mb-2 block text-sm font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mb-4 w-full rounded border border-slate-300 px-3 py-2" />
          <button className="flex w-full items-center justify-center gap-2 rounded bg-signal px-4 py-2.5 font-medium text-white">
            <Plus size={18} /> Create
          </button>
          {error && <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        </form>
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold">Sessions</h2>
              <p className="text-sm text-slate-500">Active calls and history</p>
            </div>
          </div>
          <div className="overflow-hidden rounded border border-slate-200 bg-white">
            {sessions.map((session) => {
              const inviteUrl = `${window.location.origin}/session/${session.inviteCode}`;
              return (
                <div key={session._id} className="grid gap-3 border-b border-slate-200 p-4 last:border-b-0 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{session.title}</h3>
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">{session.status}</span>
                      <span className="rounded bg-teal-50 px-2 py-1 text-xs text-signal">{session.activeParticipants ?? 0} participants</span>
                    </div>
                    <p className="mt-2 break-all text-sm text-slate-500">{inviteUrl}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => navigator.clipboard.writeText(inviteUrl)} className="rounded border border-slate-300 p-2" title="Copy invite"><Copy size={18} /></button>
                    <a href={`/session/${session.inviteCode}`} className="rounded bg-ink px-3 py-2 text-sm text-white">Join</a>
                    <button onClick={() => toggleRecording(session)} className="rounded border border-slate-300 p-2" title={session.recordingEnabled ? "Stop recording" : "Start recording"}>
                      {session.recordingEnabled ? <Square size={18} /> : <Radio size={18} />}
                    </button>
                    {session.status !== "ended" && <button onClick={() => endSession(session)} className="rounded border border-red-200 px-3 py-2 text-sm text-red-700">End</button>}
                  </div>
                </div>
              );
            })}
            {sessions.length === 0 && <div className="p-8 text-center text-slate-500">No sessions yet.</div>}
          </div>
        </div>
      </section>
    </main>
  );
}
