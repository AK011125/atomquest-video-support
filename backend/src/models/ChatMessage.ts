import { Schema, model, type Types } from "mongoose";

export interface ChatMessageDocument {
  _id: Types.ObjectId;
  session: Types.ObjectId;
  sender?: Types.ObjectId;
  senderName: string;
  senderRole: "agent" | "customer" | "system";
  body: string;
  fileUrl?: string;
  createdAt: Date;
}

const chatMessageSchema = new Schema<ChatMessageDocument>(
  {
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ["agent", "customer", "system"], required: true },
    body: { type: String, required: true, maxlength: 4000 },
    fileUrl: String
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ChatMessage = model<ChatMessageDocument>("ChatMessage", chatMessageSchema);
