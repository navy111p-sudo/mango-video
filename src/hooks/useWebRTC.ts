"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SignalingClient, type SignalMessage } from "@/lib/signaling";

export interface Peer {
  id: string;
  name: string;
  stream: MediaStream | null;
  connection: RTCPeerConnection;
}

interface UseWebRTCOptions {
  roomId: string;
  userName: string;
  peerId: string;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC({ roomId, userName, peerId }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const signalingRef = useRef<SignalingClient | null>(null);
  const peersRef = useRef<Map<string, Peer>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const createPeerConnection = useCallback(
    (remotePeerId: string, remoteName: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          signalingRef.current?.send({
            type: "ice-candidate",
            candidate: event.candidate.toJSON(),
            to: remotePeerId,
          });
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) {
          setPeers((prev) => {
            const next = new Map(prev);
            const existing = next.get(remotePeerId);
            if (existing) {
              next.set(remotePeerId, { ...existing, stream });
            }
            return next;
          });
          const existing = peersRef.current.get(remotePeerId);
          if (existing) {
            existing.stream = stream;
          }
        }
      };

      const peer: Peer = {
        id: remotePeerId,
        name: remoteName,
        stream: null,
        connection: pc,
      };
      peersRef.current.set(remotePeerId, peer);
      setPeers(new Map(peersRef.current));

      return pc;
    },
    []
  );

  const handleSignalMessage = useCallback(
    async (msg: SignalMessage) => {
      switch (msg.type) {
        case "peer-joined": {
          // Create offer for new peer
          const pc = createPeerConnection(msg.peerId, msg.name);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          signalingRef.current?.send({
            type: "offer",
            sdp: offer.sdp!,
            to: msg.peerId,
          });
          break;
        }
        case "offer": {
          const existingPeer = peersRef.current.get(msg.from);
          const pc = existingPeer
            ? existingPeer.connection
            : createPeerConnection(msg.from, msg.from);
          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: "offer", sdp: msg.sdp })
          );
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          signalingRef.current?.send({
            type: "answer",
            sdp: answer.sdp!,
            to: msg.from,
          });
          break;
        }
        case "answer": {
          const peer = peersRef.current.get(msg.from);
          if (peer) {
            await peer.connection.setRemoteDescription(
              new RTCSessionDescription({ type: "answer", sdp: msg.sdp })
            );
          }
          break;
        }
        case "ice-candidate": {
          const peer = peersRef.current.get(msg.from);
          if (peer) {
            await peer.connection.addIceCandidate(
              new RTCIceCandidate(msg.candidate)
            );
          }
          break;
        }
        case "peer-left": {
          const peer = peersRef.current.get(msg.peerId);
          if (peer) {
            peer.connection.close();
            peersRef.current.delete(msg.peerId);
            setPeers(new Map(peersRef.current));
          }
          break;
        }
      }
    },
    [createPeerConnection]
  );

  // Initialize media and signaling
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        const signaling = new SignalingClient(roomId, peerId, userName);
        signalingRef.current = signaling;

        signaling.onMessage = (msg) => handleSignalMessage(msg);
        signaling.onConnected = () => setIsConnected(true);
        signaling.onDisconnected = () => setIsConnected(false);

        signaling.connect();
      } catch (err) {
        console.error("Failed to get user media:", err);
      }
    }

    init();

    return () => {
      mounted = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peersRef.current.forEach((peer) => peer.connection.close());
      signalingRef.current?.disconnect();
    };
  }, [roomId, peerId, userName, handleSignalMessage]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled((prev) => !prev);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled((prev) => !prev);
    }
  }, []);

  const sendChatMessage = useCallback(
    (message: string) => {
      signalingRef.current?.send({
        type: "chat",
        message,
        name: userName,
        timestamp: Date.now(),
      });
    },
    [userName]
  );

  return {
    localStream,
    peers,
    isAudioEnabled,
    isVideoEnabled,
    isConnected,
    toggleAudio,
    toggleVideo,
    sendChatMessage,
  };
}
