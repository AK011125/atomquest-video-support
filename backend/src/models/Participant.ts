import { Schema, model, type Types } from "mongoose";

export interface ParticipantDocument {
  _id: Types.ObjectId;
  session: Types.ObjectId;
  user?: Types.ObjectId;
  name: string;
  role: "agent" | "customer";
  socketId?: string;
  status: "connected" | "reconnecting" | "disconnected";
  joinedAt: Date;
  leftAt?: Date;
  reconnectUntil?: Date;
}

const participantSchema = new Schema<ParticipantDocument>(
  {
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    role: { type: String, enum: ["agent", "customer"], required: true },
    socketId: String,
    status: { type: String, enum: ["connected", "reconnecting", "disconnected"], default: "connected" },
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date,
    reconnectUntil: Date
  },
  { timestamps: true }
);

export const Participant = model<ParticipantDocument>("Participant", participantSchema);
