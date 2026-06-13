import { ChatMessage } from "../models/ChatMessage.js";
import { Participant } from "../models/Participant.js";
import { Recording } from "../models/Recording.js";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const metrics = asyncHandler(async (_req, res) => {
  const [users, activeSessions, endedSessions, messages, activeParticipants, recordings] = await Promise.all([
    User.countDocuments(),
    Session.countDocuments({ status: { $ne: "ended" } }),
    Session.countDocuments({ status: "ended" }),
    ChatMessage.countDocuments(),
    Participant.countDocuments({ status: { $in: ["connected", "reconnecting"] } }),
    Recording.countDocuments()
  ]);

  res.json({ users, activeSessions, endedSessions, messages, activeParticipants, recordings });
});
