import type { Server } from "socket.io";
import { z } from "zod";
import { ChatMessage } from "../models/ChatMessage.js";
import { Participant } from "../models/Participant.js";
import { Session } from "../models/Session.js";
import * as chatService from "../services/chatService.js";
import { mediasoupService } from "../mediasoup/mediasoupService.js";
import type { AuthedSocket } from "./socketAuth.js";

const joinSchema = z.object({
  sessionId: z.string(),
  name: z.string().min(1),
  role: z.enum(["agent", "customer"])
});

export function registerSessionSocket(io: Server, socket: AuthedSocket) {
  socket.on("session:join", async (payload, ack) => {
    try {
      const data = joinSchema.parse(payload);
      const session = await Session.findById(data.sessionId);
      if (!session || session.status === "ended") throw new Error("Session unavailable");

      await socket.join(data.sessionId);
      await Session.findByIdAndUpdate(data.sessionId, {
        status: "active",
        startedAt: session.startedAt ?? new Date()
      });

      const participant = await Participant.findOneAndUpdate(
        { session: data.sessionId, user: socket.user?.id },
        {
          session: data.sessionId,
          user: socket.user?.id,
          name: data.name,
          role: data.role,
          socketId: socket.id,
          status: "connected",
          reconnectUntil: undefined
        },
        { upsert: true, new: true }
      );

      const [rtpCapabilities, producers, messages] = await Promise.all([
        mediasoupService.getRtpCapabilities(data.sessionId),
        Promise.resolve(mediasoupService.getProducerIds(data.sessionId, socket.id)),
        ChatMessage.find({ session: data.sessionId }).sort({ createdAt: 1 }).limit(100)
      ]);

      io.to(data.sessionId).emit("participant:update", { participant });
      ack?.({ ok: true, participant, rtpCapabilities, producers, messages });
    } catch (error) {
      ack?.({ ok: false, message: error instanceof Error ? error.message : "Join failed" });
    }
  });

  socket.on("chat:send", async (payload, ack) => {
    try {
      const data = z.object({ sessionId: z.string(), body: z.string().min(1).max(4000), fileUrl: z.string().optional() }).parse(payload);
      const message = await chatService.createChatMessage({
        sessionId: data.sessionId,
        senderId: socket.user?.id,
        senderName: socket.user?.name ?? "Guest",
        senderRole: socket.user?.role === "agent" ? "agent" : "customer",
        body: data.body,
        fileUrl: data.fileUrl
      });
      io.to(data.sessionId).emit("chat:message", message);
      ack?.({ ok: true, message });
    } catch (error) {
      ack?.({ ok: false, message: error instanceof Error ? error.message : "Message failed" });
    }
  });

  socket.on("mediasoup:createTransport", async (payload, ack) => {
    try {
      const { sessionId } = z.object({ sessionId: z.string() }).parse(payload);
      ack?.({ ok: true, transport: await mediasoupService.createWebRtcTransport(sessionId, socket.id) });
    } catch (error) {
      ack?.({ ok: false, message: error instanceof Error ? error.message : "Transport failed" });
    }
  });

  socket.on("mediasoup:connectTransport", async (payload, ack) => {
    try {
      const data = z.object({ sessionId: z.string(), transportId: z.string(), dtlsParameters: z.any() }).parse(payload);
      await mediasoupService.connectTransport(data.sessionId, socket.id, data.transportId, data.dtlsParameters);
      ack?.({ ok: true });
    } catch (error) {
      ack?.({ ok: false, message: error instanceof Error ? error.message : "Connect failed" });
    }
  });

  socket.on("mediasoup:produce", async (payload, ack) => {
    try {
      const data = z.object({ sessionId: z.string(), transportId: z.string(), kind: z.enum(["audio", "video"]), rtpParameters: z.any() }).parse(payload);
      const producerId = await mediasoupService.produce(data.sessionId, socket.id, data.transportId, data.kind, data.rtpParameters);
      socket.to(data.sessionId).emit("mediasoup:newProducer", { producerId, peerId: socket.id, kind: data.kind });
      ack?.({ ok: true, producerId });
    } catch (error) {
      ack?.({ ok: false, message: error instanceof Error ? error.message : "Produce failed" });
    }
  });

  socket.on("mediasoup:consume", async (payload, ack) => {
    try {
      const data = z.object({ sessionId: z.string(), transportId: z.string(), producerId: z.string(), rtpCapabilities: z.any() }).parse(payload);
      const consumer = await mediasoupService.consume({
        sessionId: data.sessionId,
        transportId: data.transportId,
        producerId: data.producerId,
        rtpCapabilities: data.rtpCapabilities,
        peerId: socket.id
      });
      ack?.({ ok: true, consumer });
    } catch (error) {
      ack?.({ ok: false, message: error instanceof Error ? error.message : "Consume failed" });
    }
  });

  socket.on("mediasoup:resumeConsumer", async (payload, ack) => {
    try {
      const data = z.object({ sessionId: z.string(), consumerId: z.string() }).parse(payload);
      await mediasoupService.resumeConsumer(data.sessionId, socket.id, data.consumerId);
      ack?.({ ok: true });
    } catch (error) {
      ack?.({ ok: false, message: error instanceof Error ? error.message : "Resume failed" });
    }
  });

  socket.on("call:mediaState", (payload) => {
    const data = z.object({ sessionId: z.string(), audioMuted: z.boolean(), videoEnabled: z.boolean(), quality: z.enum(["excellent", "good", "poor"]) }).parse(payload);
    socket.to(data.sessionId).emit("call:mediaState", { peerId: socket.id, ...data });
  });

  socket.on("disconnect", async () => {
    const participant = await Participant.findOneAndUpdate(
      { socketId: socket.id, status: "connected" },
      { status: "reconnecting", reconnectUntil: new Date(Date.now() + 30_000) },
      { new: true }
    );
    if (!participant) return;
    setTimeout(async () => {
      const fresh = await Participant.findById(participant._id);
      if (fresh?.status === "reconnecting" && fresh.reconnectUntil && fresh.reconnectUntil <= new Date()) {
        await Participant.findByIdAndUpdate(fresh._id, { status: "disconnected", leftAt: new Date() });
        mediasoupService.closePeer(String(fresh.session), socket.id);
        io.to(String(fresh.session)).emit("participant:update", { participant: { ...fresh.toObject(), status: "disconnected" } });
      }
    }, 30_000);
    io.to(String(participant.session)).emit("participant:update", { participant });
  });
}
