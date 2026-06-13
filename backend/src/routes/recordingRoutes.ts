import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as recordingController from "../controllers/recordingController.js";

export const recordingRoutes = Router();

recordingRoutes.post("/:sessionId/start", authenticate, authorize("agent", "admin"), validate(recordingController.recordingSchema), recordingController.startRecording);
recordingRoutes.post("/:sessionId/stop", authenticate, authorize("agent", "admin"), validate(recordingController.recordingSchema), recordingController.stopRecording);
