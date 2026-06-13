"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CallRoom } from "@/components/CallRoom";
import { sessionApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { SupportSession } from "@/types/domain";

export default function SessionPage() {
  const params = useParams<{ inviteCode: string }>();
  const { user, token, hydrate } = useAuthStore();
  const [session, setSession] = useState<SupportSession>();
  const [error, setError] = useState("");

  useEffect(() => hydrate(), [hydrate]);
  useEffect(() => {
    sessionApi.byInvite(params.inviteCode).then((result) => setSession(result.session)).catch((err) => setError(err.message));
  }, [params.inviteCode]);

  if (error) return <main className="p-8 text-red-700">{error}</main>;
  if (!session) return <main className="p-8 text-slate-600">Loading session...</main>;
  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cloud p-4">
        <div className="rounded border border-slate-200 bg-white p-6">
          <h1 className="mb-2 text-xl font-semibold">{session.title}</h1>
          <p className="mb-5 text-slate-600">Sign in or create a customer account to join this secure support session.</p>
          <a className="rounded bg-signal px-4 py-2 text-white" href="/login">Continue</a>
        </div>
      </main>
    );
  }

  return <CallRoom session={session} role={user?.role === "agent" ? "agent" : "customer"} />;
}
