import type { Request } from "express";

export type UserRole = "agent" | "customer" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}
