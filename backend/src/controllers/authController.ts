import { z } from "zod";
import type { AuthRequest } from "../types/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/authService.js";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["agent", "customer", "admin"]).default("customer")
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  res.json(result);
});

export const me = asyncHandler(async (req: AuthRequest, res) => {
  res.json({ user: req.user });
});
