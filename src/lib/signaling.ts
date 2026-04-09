/**
 * Signaling client for WebRTC peer connection negotiation.
 * Uses Server-Sent Events (SSE) for receiving messages and POST for sending.
 */

export type SignalMessage =
  | { type: "offer"; sdp: string; from: string }
  | { type: "answer"; sdp: string; from: string }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit; from: string }
  | { type: "peer-joined"; peerId: string; name: string }
  | { type: "peer-left"; peerId: string }
  | { type: "chat"; message: string; from: string; name: string; timestamp: number };

export type OutgoingMessage =
  | { type: "offer"; sdp: string; to: string }
  | { type: "answer"; sdp: string; to: string }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit; to: string }
  | { type: "chat"; message: string; name: string; timestamp: number };

export class SignalingClient {
  private eventSource: EventSource | null = null;
  private roomId: string;
  private peerId: string;
  private peerName: string;

  onMessage: ((msg: SignalMessage) => void) | null = null;
  onConnected: (() => void) | null = null;
  onDisconnected: (() => void) | null = null;

  constructor(roomId: string, peerId: string, peerName: string) {
    this.roomId = roomId;
    this.peerId = peerId;
    this.peerName = peerName;
  }

  connect() {
    const url = `/api/signaling?roomId=${this.roomId}&peerId=${this.peerId}&name=${encodeURIComponent(this.peerName)}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      this.onConnected?.();
    };

    this.eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as SignalMessage;
        this.onMessage?.(msg);
      } catch {
        // ignore malformed messages
      }
    };

    this.eventSource.onerror = () => {
      this.onDisconnected?.();
    };
  }

  async send(message: OutgoingMessage) {
    await fetch("/api/signaling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: this.roomId,
        from: this.peerId,
        name: this.peerName,
        ...message,
      }),
    });
  }

  disconnect() {
    this.eventSource?.close();
    this.eventSource = null;
  }
}
