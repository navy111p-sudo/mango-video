/**
 * Signaling server using Server-Sent Events (SSE) for WebRTC negotiation.
 *
 * GET  - Subscribe to room events (SSE)
 * POST - Send a signal message to room peers
 */

type Client = {
  peerId: string;
  name: string;
  controller: ReadableStreamDefaultController;
};

// In-memory room state (for single-server deployment)
const rooms = new Map<string, Map<string, Client>>();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId");
  const peerId = url.searchParams.get("peerId");
  const name = url.searchParams.get("name") || "Guest";

  if (!roomId || !peerId) {
    return new Response("Missing roomId or peerId", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Get or create room
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      const room = rooms.get(roomId)!;

      // Notify existing peers about the new joiner
      for (const [existingPeerId, client] of room) {
        try {
          const msg = JSON.stringify({
            type: "peer-joined",
            peerId,
            name,
          });
          client.controller.enqueue(`data: ${msg}\n\n`);
        } catch {
          room.delete(existingPeerId);
        }
      }

      // Add new client to room
      room.set(peerId, { peerId, name, controller });

      // Send existing peers info to the new joiner
      for (const [existingPeerId, client] of room) {
        if (existingPeerId !== peerId) {
          try {
            const msg = JSON.stringify({
              type: "peer-joined",
              peerId: existingPeerId,
              name: client.name,
            });
            controller.enqueue(`data: ${msg}\n\n`);
          } catch {
            // ignore
          }
        }
      }
    },
    cancel() {
      // Remove client from room
      const room = rooms.get(roomId!);
      if (room) {
        room.delete(peerId!);

        // Notify remaining peers
        for (const [, client] of room) {
          try {
            const msg = JSON.stringify({
              type: "peer-left",
              peerId,
            });
            client.controller.enqueue(`data: ${msg}\n\n`);
          } catch {
            // ignore
          }
        }

        // Clean up empty rooms
        if (room.size === 0) {
          rooms.delete(roomId!);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { roomId, from, to, ...message } = body;

  if (!roomId || !from) {
    return new Response("Missing roomId or from", { status: 400 });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return new Response("Room not found", { status: 404 });
  }

  const data = JSON.stringify({ ...message, from });

  if (to) {
    // Send to specific peer
    const client = room.get(to);
    if (client) {
      try {
        client.controller.enqueue(`data: ${data}\n\n`);
      } catch {
        room.delete(to);
      }
    }
  } else {
    // Broadcast to all except sender
    for (const [peerId, client] of room) {
      if (peerId !== from) {
        try {
          client.controller.enqueue(`data: ${data}\n\n`);
        } catch {
          room.delete(peerId);
        }
      }
    }
  }

  return new Response("OK", { status: 200 });
}
