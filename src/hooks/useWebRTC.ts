"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SignalingClient } from "@/lib/signaling";

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
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const createPeerConnection = useCallback(
    (remotePeerId: string, remoteName: string): RTCPeerConnection => {
      // Close existing connection if any
      const existing = peersRef.current.get(remotePeerId);
      if (existing) {
        existing.connection.close();
      }

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
          signalingRef.current?.sendIceCandidate(
            remotePeerId,
            event.candidate.toJSON()
          );
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) {
          setPeers((prev) => {
            const next = new Map(prev);
            const peer = next.get(remotePeerId);
            if (peer) {
              next.set(remotePeerId, { ...peer, stream });
            }
            return next;
          });
          const peer = peersRef.current.get(remotePeerId);
          if (peer) {
            peer.stream = stream;
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

      // Apply any pending ICE candidates
      const pending = pendingCandidatesRef.current.get(remotePeerId);
      if (pending) {
        pending.forEach((c) => pc.addIceCandidate(new RTCIceCandidate(c)));
        pendingCandidatesRef.current.delete(remotePeerId);
      }

      return pc;
    },
    []
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

        // When a new peer joins, create an offer
        signaling.onPeerJoined = async (remotePeerId, remoteName) => {
          // Only the peer with the "smaller" ID initiates the offer
          // This prevents both peers from sending offers simultaneously
          if (peerId < remotePeerId) {
            const pc = createPeerConnection(remotePeerId, remoteName);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            signaling.sendOffer(remotePeerId, offer.sdp!);
          } else {
            // Just register the peer, wait for their offer
            if (!peersRef.current.has(remotePeerId)) {
              const pc = createPeerConnection(remotePeerId, remoteName);
              void pc; // connection ready for incoming offer
            }
          }
        };

        signaling.onOffer = async (from, sdp) => {
          const existingPeer = peersRef.current.get(from);
          const pc = existingPeer
            ? existingPeer.connection
            : createPeerConnection(from, from);
          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: "offer", sdp })
          );
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          signaling.sendAnswer(from, answer.sdp!);
        };

        signaling.onAnswer = async (from, sdp) => {
          const peer = peersRef.current.get(from);
          if (peer) {
            await peer.connection.setRemoteDescription(
              new RTCSessionDescription({ type: "answer", sdp })
            );
          }
        };

        signaling.onIceCandidate = async (from, candidate) => {
          const peer = peersRef.current.get(from);
          if (peer && peer.connection.remoteDescription) {
            await peer.connection.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } else {
            // Queue candidate until remote description is set
            const pending = pendingCandidatesRef.current.get(from) || [];
            pending.push(candidate);
            pendingCandidatesRef.current.set(from, pending);
          }
        };

        signaling.onPeerLeft = (remotePeerId) => {
          const peer = peersRef.current.get(remotePeerId);
          if (peer) {
            peer.connection.close();
            peersRef.current.delete(remotePeerId);
            setPeers(new Map(peersRef.current));
          }
        };

        signaling.onConnected = () => setIsConnected(true);

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
  }, [roomId, peerId, userName, createPeerConnection]);

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
      signalingRef.current?.sendChat(message, Date.now());
    },
    []
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
