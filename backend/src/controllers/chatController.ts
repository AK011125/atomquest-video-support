import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as chatService from "../services/chatService.js";

export const chatParamsSchema = z.object({
  params: z.object({ sessionId: z.string().regex(/^[a-f\d]{24}$/i) })
});

export const getHistory = asyncHandler(async (req, res) => {
  const messages = await chatService.getChatHistory(req.params.sessionId);
  res.json({ messages });
});
