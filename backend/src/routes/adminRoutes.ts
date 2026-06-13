import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import * as adminController from "../controllers/adminController.js";

export const adminRoutes = Router();

adminRoutes.get("/metrics", authenticate, authorize("admin"), adminController.metrics);
