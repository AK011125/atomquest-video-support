import type { Server } from "socket.io";
import { socketAuth } from "./socketAuth.js";
import { registerSessionSocket } from "./sessionSocket.js";

export function registerSockets(io: Server) {
  io.use(socketAuth);
  io.on("connection", (socket) => registerSessionSocket(io, socket));
}
