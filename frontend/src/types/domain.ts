export type Role = "agent" | "customer" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type SupportSession = {
  _id: string;
  title: string;
  inviteCode: string;
  status: "waiting" | "active" | "ended";
  recordingEnabled: boolean;
  activeParticipants?: number;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  _id: string;
  session: string;
  senderName: string;
  senderRole: Role | "system";
  body: string;
  fileUrl?: string;
  createdAt: string;
};
