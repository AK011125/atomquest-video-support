import type { Socket } from "socket.io";
import { verifyJwt } from "../utils/tokens.js";
import type { AuthUser } from "../types/auth.js";

export type AuthedSocket = Socket & { user?: AuthUser };

export function socketAuth(socket: AuthedSocket, next: (err?: Error) => void) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Missing token"));
  try {
    socket.user = verifyJwt(token);
    return next();
  } catch {
    return next(new Error("Invalid token"));
  }
}
