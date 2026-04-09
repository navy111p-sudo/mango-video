/**
 * Signaling client using HTTP polling with D1 database backend.
 */

export interface SignalMessage {
  id: number;
  from_peer: string;
  to_peer: string | null;
  type: string;
  payload: string;
  created_at: number;
}

export interface Participant {
  peer_id: string;
  name: string;
}

export class SignalingClient {
  private roomId: string;
  private peerId: string;
  private peerName: string;
  private lastMessageId = 0;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private knownPeers = new Set<string>();

  onOffer: ((from: string, sdp: string) => void) | null = null;
  onAnswer: ((from: string, sdp: string) => void) | null = null;
  onIceCandidate: ((from: string, candidate: RTCIceCandidateInit) => void) | null = null;
  onPeerJoined: ((peerId: string, name: string) => void) | null = null;
  onPeerLeft: ((peerId: string) => void) | null = null;
  onChat: ((from: string, name: string, message: string, timestamp: number) => void) | null = null;
  onConnected: (() => void) | null = null;

  constructor(roomId: string, peerId: string, peerName: string) {
    this.roomId = roomId;
    this.peerId = peerId;
    this.peerName = peerName;
  }

  async connect() {
    // Send initial heartbeat to register
    await this.sendHeartbeat();
    this.onConnected?.();

    // Start polling every 500ms
    this.pollInterval = setInterval(() => this.poll(), 500);

    // Send heartbeat every 5 seconds
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 5000);
  }

  private async sendHeartbeat() {
    try {
      await fetch("/api/signaling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: this.roomId,
          peerId: this.peerId,
          name: this.peerName,
          type: "heartbeat",
        }),
      });
    } catch {
      // ignore
    }
  }

  private async poll() {
    try {
      const res = await fetch(
        `/api/signaling?roomId=${this.roomId}&peerId=${this.peerId}&afterId=${this.lastMessageId}`
      );
      if (!res.ok) return;

      const data = (await res.json()) as {
        messages: SignalMessage[];
        participants: Participant[];
      };

      // Handle new/left participants
      const currentPeers = new Set(data.participants.map((p) => p.peer_id));

      // Check for new peers
      for (const p of data.participants) {
        if (!this.knownPeers.has(p.peer_id)) {
          this.knownPeers.add(p.peer_id);
          this.onPeerJoined?.(p.peer_id, p.name);
        }
      }

      // Check for left peers
      for (const id of this.knownPeers) {
        if (!currentPeers.has(id)) {
          this.knownPeers.delete(id);
          this.onPeerLeft?.(id);
        }
      }

      // Handle messages
      for (const msg of data.messages) {
        if (msg.id > this.lastMessageId) {
          this.lastMessageId = msg.id;
        }
        this.handleMessage(msg);
      }
    } catch {
      // ignore polling errors
    }
  }

  private handleMessage(msg: SignalMessage) {
    switch (msg.type) {
      case "offer":
        this.onOffer?.(msg.from_peer, msg.payload);
        break;
      case "answer":
        this.onAnswer?.(msg.from_peer, msg.payload);
        break;
      case "ice-candidate":
        try {
          const candidate = JSON.parse(msg.payload) as RTCIceCandidateInit;
          this.onIceCandidate?.(msg.from_peer, candidate);
        } catch {
          // ignore
        }
        break;
      case "chat":
        try {
          const chatData = JSON.parse(msg.payload) as { name: string; message: string; timestamp: number };
          this.onChat?.(msg.from_peer, chatData.name, chatData.message, chatData.timestamp);
        } catch {
          // ignore
        }
        break;
    }
  }

  async sendOffer(to: string, sdp: string) {
    await this.sendMessage("offer", sdp, to);
  }

  async sendAnswer(to: string, sdp: string) {
    await this.sendMessage("answer", sdp, to);
  }

  async sendIceCandidate(to: string, candidate: RTCIceCandidateInit) {
    await this.sendMessage("ice-candidate", JSON.stringify(candidate), to);
  }

  async sendChat(message: string, timestamp: number) {
    await this.sendMessage(
      "chat",
      JSON.stringify({ name: this.peerName, message, timestamp })
    );
  }

  private async sendMessage(type: string, payload: string, to?: string) {
    try {
      await fetch("/api/signaling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: this.roomId,
          peerId: this.peerId,
          name: this.peerName,
          type,
          payload,
          to,
        }),
      });
    } catch {
      // ignore
    }
  }

  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.knownPeers.clear();
  }
}
