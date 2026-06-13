import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as recordingService from "../services/recordingService.js";

export const recordingSchema = z.object({
  params: z.object({ sessionId: z.string().regex(/^[a-f\d]{24}$/i) })
});

export const startRecording = asyncHandler(async (req, res) => {
  const recording = await recordingService.startRecording(req.params.sessionId);
  res.status(201).json({ recording });
});

export const stopRecording = asyncHandler(async (req, res) => {
  const recording = await recordingService.stopRecording(req.params.sessionId);
  res.json({ recording });
});
