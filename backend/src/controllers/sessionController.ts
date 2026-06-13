import { z } from "zod";
import type { AuthRequest } from "../types/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as sessionService from "../services/sessionService.js";

export const createSessionSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(160),
    metadata: z.record(z.unknown()).optional()
  })
});

export const inviteSchema = z.object({
  params: z.object({ inviteCode: z.string().min(6) })
});

export const idSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) })
});

export const createSession = asyncHandler(async (req: AuthRequest, res) => {
  const session = await sessionService.createSupportSession(req.user!.id, req.body.title, req.body.metadata);
  res.status(201).json({ session });
});

export const listSessions = asyncHandler(async (req: AuthRequest, res) => {
  const sessions = await sessionService.listAgentSessions(req.user!.id);
  res.json({ sessions });
});

export const getByInvite = asyncHandler(async (req, res) => {
  const session = await sessionService.getInviteSession(String(req.params.inviteCode));
  res.json({ session });
});

export const endSession = asyncHandler(async (req: AuthRequest, res) => {
  const session = await sessionService.endSupportSession(String(req.params.id), req.user!.id);
  res.json({ session });
});

export const getHistory = asyncHandler(async (req, res) => {
  const history = await sessionService.getSessionHistory(String(req.params.id));
  res.json(history);
});
