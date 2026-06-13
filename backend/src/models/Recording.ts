import { Schema, model, type Types } from "mongoose";

export interface RecordingDocument {
  _id: Types.ObjectId;
  session: Types.ObjectId;
  status: "starting" | "recording" | "stopped" | "failed";
  filePath?: string;
  startedAt: Date;
  stoppedAt?: Date;
  error?: string;
}

const recordingSchema = new Schema<RecordingDocument>(
  {
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    status: { type: String, enum: ["starting", "recording", "stopped", "failed"], default: "starting" },
    filePath: String,
    startedAt: { type: Date, default: Date.now },
    stoppedAt: Date,
    error: String
  },
  { timestamps: true }
);

export const Recording = model<RecordingDocument>("Recording", recordingSchema);
