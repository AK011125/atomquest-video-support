import * as mediasoup from "mediasoup";
import type { types as mediaSoupTypes } from "mediasoup";
import { env } from "../config/env.js";

type Peer = {
  transports: Map<string, mediaSoupTypes.WebRtcTransport>;
  producers: Map<string, mediaSoupTypes.Producer>;
  consumers: Map<string, mediaSoupTypes.Consumer>;
};

type Room = {
  router: mediaSoupTypes.Router;
  peers: Map<string, Peer>;
};

const mediaCodecs: mediaSoupTypes.RtpCodecCapability[] = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    preferredPayloadType: 100,
    clockRate: 48000,
    channels: 2
  },
  {
    kind: "video",
    mimeType: "video/VP8",
    preferredPayloadType: 101,
    clockRate: 90000,
    parameters: { "x-google-start-bitrate": 1000 }
  }
];

class MediasoupService {
  private worker?: mediaSoupTypes.Worker;
  private rooms = new Map<string, Room>();

  async init() {
    this.worker = await mediasoup.createWorker({
      rtcMinPort: env.MEDIASOUP_MIN_PORT,
      rtcMaxPort: env.MEDIASOUP_MAX_PORT
    });

    this.worker.on("died", () => {
      console.error("mediasoup worker died; exiting");
      process.exit(1);
    });
  }

  async getRouter(sessionId: string) {
    if (!this.worker) throw new Error("mediasoup worker not initialized");
    let room = this.rooms.get(sessionId);
    if (!room) {
      room = { router: await this.worker.createRouter({ mediaCodecs }), peers: new Map() };
      this.rooms.set(sessionId, room);
    }
    return room.router;
  }

  async getRtpCapabilities(sessionId: string) {
    return (await this.getRouter(sessionId)).rtpCapabilities;
  }

  async createWebRtcTransport(sessionId: string, peerId: string) {
    const router = await this.getRouter(sessionId);
    const transport = await router.createWebRtcTransport({
      listenIps: [{ ip: env.MEDIASOUP_LISTEN_IP, announcedIp: env.MEDIASOUP_ANNOUNCED_IP }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1_000_000
    });

    this.peer(sessionId, peerId).transports.set(transport.id, transport);
    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters
    };
  }

  async connectTransport(sessionId: string, peerId: string, transportId: string, dtlsParameters: mediaSoupTypes.DtlsParameters) {
    const transport = this.peer(sessionId, peerId).transports.get(transportId);
    if (!transport) throw new Error("Transport not found");
    await transport.connect({ dtlsParameters });
  }

  async produce(sessionId: string, peerId: string, transportId: string, kind: mediaSoupTypes.MediaKind, rtpParameters: mediaSoupTypes.RtpParameters) {
    const peer = this.peer(sessionId, peerId);
    const transport = peer.transports.get(transportId);
    if (!transport) throw new Error("Transport not found");
    const producer = await transport.produce({ kind, rtpParameters });
    peer.producers.set(producer.id, producer);
    producer.on("transportclose", () => peer.producers.delete(producer.id));
    return producer.id;
  }

  async consume(input: {
    sessionId: string;
    peerId: string;
    producerId: string;
    transportId: string;
    rtpCapabilities: mediaSoupTypes.RtpCapabilities;
  }) {
    const router = await this.getRouter(input.sessionId);
    if (!router.canConsume({ producerId: input.producerId, rtpCapabilities: input.rtpCapabilities })) {
      throw new Error("Cannot consume producer");
    }

    const peer = this.peer(input.sessionId, input.peerId);
    const transport = peer.transports.get(input.transportId);
    if (!transport) throw new Error("Transport not found");

    const consumer = await transport.consume({
      producerId: input.producerId,
      rtpCapabilities: input.rtpCapabilities,
      paused: true
    });
    peer.consumers.set(consumer.id, consumer);
    consumer.on("transportclose", () => peer.consumers.delete(consumer.id));
    return {
      id: consumer.id,
      producerId: input.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters
    };
  }

  async resumeConsumer(sessionId: string, peerId: string, consumerId: string) {
    const consumer = this.peer(sessionId, peerId).consumers.get(consumerId);
    if (!consumer) throw new Error("Consumer not found");
    await consumer.resume();
  }

  getProducerIds(sessionId: string, exceptPeerId?: string) {
    const room = this.rooms.get(sessionId);
    if (!room) return [];
    return [...room.peers.entries()]
      .filter(([peerId]) => peerId !== exceptPeerId)
      .flatMap(([, peer]) => [...peer.producers.keys()]);
  }

  closePeer(sessionId: string, peerId: string) {
    const room = this.rooms.get(sessionId);
    const peer = room?.peers.get(peerId);
    if (!peer) return;
    peer.consumers.forEach((consumer) => consumer.close());
    peer.producers.forEach((producer) => producer.close());
    peer.transports.forEach((transport) => transport.close());
    room!.peers.delete(peerId);
    if (room!.peers.size === 0) {
      room!.router.close();
      this.rooms.delete(sessionId);
    }
  }

  private peer(sessionId: string, peerId: string) {
    const room = this.rooms.get(sessionId);
    if (!room) throw new Error("Room not found");
    let peer = room.peers.get(peerId);
    if (!peer) {
      peer = { transports: new Map(), producers: new Map(), consumers: new Map() };
      room.peers.set(peerId, peer);
    }
    return peer;
  }
}

export const mediasoupService = new MediasoupService();
