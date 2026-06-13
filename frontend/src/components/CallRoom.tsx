"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Device } from "mediasoup-client";
import type { types as mediasoupTypes } from "mediasoup-client";
import type { Socket } from "socket.io-client";
import { Mic, MicOff, PhoneOff, Signal, Video, VideoOff } from "lucide-react";
import { createSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import type { ChatMessage, Role, SupportSession } from "@/types/domain";
import { ChatPanel } from "./ChatPanel";

type Ack<T> = ({ ok: true } & T) | { ok: false; message: string };

export function CallRoom({ session, role }: { session: SupportSession; role: Extract<Role, "agent" | "customer"> }) {
  const { user, token, hydrate } = useAuthStore();
  const [socket, setSocket] = useState<Socket>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [quality, setQuality] = useState<"excellent" | "good" | "poor">("good");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStream = useRef<MediaStream | null>(null);
  const device = useRef<Device | null>(null);
  const sendTransport = useRef<mediasoupTypes.Transport | null>(null);
  const recvTransport = useRef<mediasoupTypes.Transport | null>(null);

  useEffect(() => hydrate(), [hydrate]);

  const displayName = useMemo(() => user?.name ?? (role === "agent" ? "Agent" : "Customer"), [role, user?.name]);

  useEffect(() => {
    if (!token) return;
    const nextSocket = createSocket(token);
    setSocket(nextSocket);

    nextSocket.on("chat:message", (message: ChatMessage) => setMessages((items) => [...items, message]));
    nextSocket.on("mediasoup:newProducer", ({ producerId }) => consumeProducer(nextSocket, producerId));
    nextSocket.on("connect", () => joinRoom(nextSocket));

    return () => {
      nextSocket.disconnect();
      localStream.current?.getTracks().forEach((track) => track.stop());
    };
  }, [token]);

  async function joinRoom(activeSocket: Socket) {
    const joinAck: Ack<{ rtpCapabilities: mediasoupTypes.RtpCapabilities; producers: string[]; messages: ChatMessage[] }> = await new Promise((resolve) =>
      activeSocket.emit("session:join", { sessionId: session._id, name: displayName, role }, resolve)
    );
    if (!joinAck.ok) return;

    setMessages(joinAck.messages);
    device.current = new Device();
    await device.current.load({ routerRtpCapabilities: joinAck.rtpCapabilities });
    await createTransports(activeSocket);
    await publishLocalMedia(activeSocket);
    joinAck.producers.forEach((producerId) => consumeProducer(activeSocket, producerId));
  }

  async function createTransports(activeSocket: Socket) {
    const sendAck: Ack<{ transport: mediasoupTypes.TransportOptions }> = await new Promise((resolve) =>
      activeSocket.emit("mediasoup:createTransport", { sessionId: session._id }, resolve)
    );
    const recvAck: Ack<{ transport: mediasoupTypes.TransportOptions }> = await new Promise((resolve) =>
      activeSocket.emit("mediasoup:createTransport", { sessionId: session._id }, resolve)
    );
    if (!sendAck.ok || !recvAck.ok || !device.current) return;

    sendTransport.current = device.current.createSendTransport(sendAck.transport);
    recvTransport.current = device.current.createRecvTransport(recvAck.transport);

    sendTransport.current.on("connect", ({ dtlsParameters }, callback, errback) => {
      activeSocket.emit("mediasoup:connectTransport", { sessionId: session._id, transportId: sendTransport.current!.id, dtlsParameters }, (ack: Ack<object>) =>
        ack.ok ? callback() : errback(new Error(ack.message))
      );
    });
    recvTransport.current.on("connect", ({ dtlsParameters }, callback, errback) => {
      activeSocket.emit("mediasoup:connectTransport", { sessionId: session._id, transportId: recvTransport.current!.id, dtlsParameters }, (ack: Ack<object>) =>
        ack.ok ? callback() : errback(new Error(ack.message))
      );
    });
    sendTransport.current.on("produce", ({ kind, rtpParameters }, callback, errback) => {
      activeSocket.emit("mediasoup:produce", { sessionId: session._id, transportId: sendTransport.current!.id, kind, rtpParameters }, (ack: Ack<{ producerId: string }>) =>
        ack.ok ? callback({ id: ack.producerId }) : errback(new Error(ack.message))
      );
    });
  }

  async function publishLocalMedia(activeSocket: Socket) {
    localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current;
    for (const track of localStream.current.getTracks()) {
      await sendTransport.current?.produce({ track });
    }
    activeSocket.emit("call:mediaState", { sessionId: session._id, audioMuted, videoEnabled, quality });
  }

  async function consumeProducer(activeSocket: Socket, producerId: string) {
    if (!device.current || !recvTransport.current) return;
    const ack: Ack<{ consumer: { id: string; producerId: string; kind: mediasoupTypes.MediaKind; rtpParameters: mediasoupTypes.RtpParameters } }> = await new Promise((resolve) =>
      activeSocket.emit("mediasoup:consume", { sessionId: session._id, transportId: recvTransport.current!.id, producerId, rtpCapabilities: device.current!.rtpCapabilities }, resolve)
    );
    if (!ack.ok) return;
    const consumer = await recvTransport.current.consume(ack.consumer);
    const stream = new MediaStream([consumer.track]);
    if (remoteVideoRef.current) {
      const existing = remoteVideoRef.current.srcObject as MediaStream | null;
      if (existing) existing.addTrack(consumer.track);
      else remoteVideoRef.current.srcObject = stream;
    }
    activeSocket.emit("mediasoup:resumeConsumer", { sessionId: session._id, consumerId: consumer.id });
  }

  function toggleAudio() {
    localStream.current?.getAudioTracks().forEach((track) => (track.enabled = audioMuted));
    setAudioMuted((value) => !value);
  }

  function toggleVideo() {
    localStream.current?.getVideoTracks().forEach((track) => (track.enabled = !videoEnabled));
    setVideoEnabled((value) => !value);
  }

  return (
    <main className="grid min-h-screen bg-cloud lg:grid-cols-[1fr_360px]">
      <section className="flex flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <div>
            <h1 className="font-semibold">{session.title}</h1>
            <p className="text-sm text-slate-500">Session {session.inviteCode}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Signal size={18} className={quality === "poor" ? "text-amber" : "text-signal"} />
            {quality}
          </div>
        </header>
        <div className="grid flex-1 gap-4 p-4 md:grid-cols-2">
          <video ref={remoteVideoRef} autoPlay playsInline className="h-full min-h-[320px] w-full rounded bg-ink object-cover" />
          <video ref={localVideoRef} autoPlay muted playsInline className="h-full min-h-[320px] w-full rounded bg-slate-800 object-cover" />
        </div>
        <footer className="flex justify-center gap-3 border-t border-slate-200 bg-white p-4">
          <button onClick={toggleAudio} className="rounded border border-slate-300 p-3" title={audioMuted ? "Unmute audio" : "Mute audio"}>
            {audioMuted ? <MicOff /> : <Mic />}
          </button>
          <button onClick={toggleVideo} className="rounded border border-slate-300 p-3" title={videoEnabled ? "Turn camera off" : "Turn camera on"}>
            {videoEnabled ? <Video /> : <VideoOff />}
          </button>
          <button onClick={() => window.location.assign("/dashboard")} className="rounded bg-red-600 p-3 text-white" title="Leave call">
            <PhoneOff />
          </button>
        </footer>
      </section>
      <ChatPanel socket={socket} sessionId={session._id} messages={messages} />
    </main>
  );
}
