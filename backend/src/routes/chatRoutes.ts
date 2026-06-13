import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as chatController from "../controllers/chatController.js";

export const chatRoutes = Router();

chatRoutes.get("/:sessionId", authenticate, validate(chatController.chatParamsSchema), chatController.getHistory);
