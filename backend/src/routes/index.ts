import { Router } from "express";
import { adminRoutes } from "./adminRoutes.js";
import { authRoutes } from "./authRoutes.js";
import { chatRoutes } from "./chatRoutes.js";
import { recordingRoutes } from "./recordingRoutes.js";
import { sessionRoutes } from "./sessionRoutes.js";
import { uploadRoutes } from "./uploadRoutes.js";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/sessions", sessionRoutes);
apiRoutes.use("/chat", chatRoutes);
apiRoutes.use("/recordings", recordingRoutes);
apiRoutes.use("/uploads", uploadRoutes);
apiRoutes.use("/admin", adminRoutes);
