import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signJwt } from "../utils/tokens.js";
import type { UserRole } from "../types/auth.js";

export async function registerUser(input: { name: string; email: string; password: string; role: UserRole }) {
  const existing = await User.findOne({ email: input.email });
  if (existing) throw new Error("Email already registered");

  const user = await User.create({
    name: input.name,
    email: input.email,
    role: input.role,
    passwordHash: await bcrypt.hash(input.password, 12)
  });

  const authUser = { id: user.id, email: user.email, name: user.name, role: user.role };
  return { user: authUser, token: signJwt(authUser) };
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email });
  if (!user || !(await user.comparePassword(input.password))) {
    throw new Error("Invalid credentials");
  }

  const authUser = { id: user.id, email: user.email, name: user.name, role: user.role };
  return { user: authUser, token: signJwt(authUser) };
}
