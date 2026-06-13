import { Schema, model, type Types } from "mongoose";

export interface SessionDocument {
  _id: Types.ObjectId;
  title: string;
  inviteCode: string;
  agent: Types.ObjectId;
  status: "waiting" | "active" | "ended";
  startedAt?: Date;
  endedAt?: Date;
  recordingEnabled: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<SessionDocument>(
  {
    title: { type: String, required: true, trim: true },
    inviteCode: { type: String, required: true, unique: true, index: true },
    agent: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["waiting", "active", "ended"], default: "waiting", index: true },
    startedAt: Date,
    endedAt: Date,
    recordingEnabled: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const Session = model<SessionDocument>("Session", sessionSchema);
