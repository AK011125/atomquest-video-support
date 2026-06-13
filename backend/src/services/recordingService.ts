import path from "node:path";
import { env } from "../config/env.js";
import { Recording } from "../models/Recording.js";
import { Session } from "../models/Session.js";

export async function startRecording(sessionId: string) {
  const active = await Recording.findOne({ session: sessionId, status: { $in: ["starting", "recording"] } });
  if (active) return active;

  const recording = await Recording.create({
    session: sessionId,
    status: "recording",
    filePath: path.join(env.RECORDING_DIR, `${sessionId}-${Date.now()}.webm`)
  });
  await Session.findByIdAndUpdate(sessionId, { recordingEnabled: true });
  return recording;
}

export async function stopRecording(sessionId: string) {
  const recording = await Recording.findOneAndUpdate(
    { session: sessionId, status: { $in: ["starting", "recording"] } },
    { status: "stopped", stoppedAt: new Date() },
    { new: true }
  );
  await Session.findByIdAndUpdate(sessionId, { recordingEnabled: false });
  if (!recording) throw new Error("No active recording");
  return recording;
}
