import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as authController from "../controllers/authController.js";

export const authRoutes = Router();

authRoutes.post("/register", validate(authController.registerSchema), authController.register);
authRoutes.post("/login", validate(authController.loginSchema), authController.login);
authRoutes.get("/me", authenticate, authController.me);
