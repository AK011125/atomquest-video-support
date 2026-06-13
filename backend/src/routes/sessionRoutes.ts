import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as sessionController from "../controllers/sessionController.js";

export const sessionRoutes = Router();

sessionRoutes.get("/", authenticate, authorize("agent", "admin"), sessionController.listSessions);
sessionRoutes.post("/", authenticate, authorize("agent", "admin"), validate(sessionController.createSessionSchema), sessionController.createSession);
sessionRoutes.get("/invite/:inviteCode", validate(sessionController.inviteSchema), sessionController.getByInvite);
sessionRoutes.get("/:id/history", authenticate, validate(sessionController.idSchema), sessionController.getHistory);
sessionRoutes.post("/:id/end", authenticate, authorize("agent", "admin"), validate(sessionController.idSchema), sessionController.endSession);
