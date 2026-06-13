import { ChatMessage } from "../models/ChatMessage.js";

export async function createChatMessage(input: {
  sessionId: string;
  senderId?: string;
  senderName: string;
  senderRole: "agent" | "customer" | "system";
  body: string;
  fileUrl?: string;
}) {
  return ChatMessage.create({
    session: input.sessionId,
    sender: input.senderId,
    senderName: input.senderName,
    senderRole: input.senderRole,
    body: input.body,
    fileUrl: input.fileUrl
  });
}

export function getChatHistory(sessionId: string) {
  return ChatMessage.find({ session: sessionId }).sort({ createdAt: 1 }).limit(500);
}
