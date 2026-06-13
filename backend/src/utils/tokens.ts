import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthUser } from "../types/auth.js";

export function signJwt(user: AuthUser) {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(user, env.JWT_SECRET, options);
}

export function verifyJwt(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as AuthUser;
}
