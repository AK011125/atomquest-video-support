import { nanoid } from "nanoid";
import { Session } from "../models/Session.js";

export async function createSession(agentId: string, title: string, metadata?: Record<string, unknown>) {
  return Session.create({
    agent: agentId,
    title,
    inviteCode: nanoid(12),
    metadata
  });
}

export function findSessionByInvite(inviteCode: string) {
  return Session.findOne({ inviteCode }).populate("agent", "name email role");
}

export function findAgentSessions(agentId: string, includeEnded = true) {
  const filter = includeEnded ? { agent: agentId } : { agent: agentId, status: { $ne: "ended" } };
  return Session.find(filter).sort({ updatedAt: -1 });
}
