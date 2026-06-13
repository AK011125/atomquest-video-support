import { Types } from "mongoose";
import { ChatMessage } from "../models/ChatMessage.js";
import { Participant } from "../models/Participant.js";
import { Recording } from "../models/Recording.js";
import { Session } from "../models/Session.js";
import * as sessionRepository from "../repositories/sessionRepository.js";

export async function createSupportSession(agentId: string, title: string, metadata?: Record<string, unknown>) {
  return sessionRepository.createSession(agentId, title, metadata);
}

export async function getInviteSession(inviteCode: string) {
  const session = await sessionRepository.findSessionByInvite(inviteCode);
  if (!session) throw new Error("Session not found");
  return session;
}

export async function listAgentSessions(agentId: string) {
  const sessions = await sessionRepository.findAgentSessions(agentId);
  const ids = sessions.map((session) => session._id);
  const participants = await Participant.find({ session: { $in: ids }, status: { $in: ["connected", "reconnecting"] } });
  return sessions.map((session) => ({
    ...session.toObject(),
    activeParticipants: participants.filter((p) => p.session.equals(session._id)).length
  }));
}

export async function endSupportSession(sessionId: string, agentId: string) {
  const session = await Session.findOneAndUpdate(
    { _id: sessionId, agent: agentId, status: { $ne: "ended" } },
    { status: "ended", endedAt: new Date(), recordingEnabled: false },
    { new: true }
  );
  if (!session) throw new Error("Session not found or already ended");
  await Participant.updateMany({ session: session._id, status: { $ne: "disconnected" } }, { status: "disconnected", leftAt: new Date() });
  await Recording.updateMany({ session: session._id, status: "recording" }, { status: "stopped", stoppedAt: new Date() });
  return session;
}

export async function getSessionHistory(sessionId: string) {
  const id = new Types.ObjectId(sessionId);
  const [session, participants, messages, recordings] = await Promise.all([
    Session.findById(id),
    Participant.find({ session: id }).sort({ joinedAt: 1 }),
    ChatMessage.find({ session: id }).sort({ createdAt: 1 }),
    Recording.find({ session: id }).sort({ startedAt: -1 })
  ]);
  if (!session) throw new Error("Session not found");
  return { session, participants, messages, recordings };
}
