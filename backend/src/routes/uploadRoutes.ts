import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { upload, uploadFile } from "../controllers/uploadController.js";

export const uploadRoutes = Router();

uploadRoutes.post("/", authenticate, upload.single("file"), uploadFile);
