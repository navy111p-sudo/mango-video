/**
 * Signaling server using D1 database + HTTP polling for WebRTC negotiation.
 *
 * GET  - Poll for new messages and participants
 * POST - Send a signal message or heartbeat
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId");
  const peerId = url.searchParams.get("peerId");
  const afterId = url.searchParams.get("afterId") || "0";

  if (!roomId || !peerId) {
    return Response.json({ error: "Missing roomId or peerId" }, { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const db = (env as Record<string, unknown>).DB as D1Database;

  // Get messages for this peer (broadcast or directed to them)
  const messages = await db
    .prepare(
      `SELECT id, from_peer, to_peer, type, payload, created_at
       FROM messages
       WHERE room_id = ? AND id > ? AND from_peer != ?
         AND (to_peer IS NULL OR to_peer = ?)
       ORDER BY id ASC
       LIMIT 50`
    )
    .bind(roomId, afterId, peerId, peerId)
    .all();

  // Get active participants (seen within last 15 seconds)
  const now = Math.floor(Date.now() / 1000);
  const participants = await db
    .prepare(
      `SELECT peer_id, name FROM participants
       WHERE room_id = ? AND last_seen > ? AND peer_id != ?`
    )
    .bind(roomId, now - 15, peerId)
    .all();

  // Clean up old messages (older than 60 seconds)
  await db
    .prepare(`DELETE FROM messages WHERE created_at < ?`)
    .bind(now - 60)
    .run();

  // Clean up stale participants (older than 30 seconds)
  await db
    .prepare(`DELETE FROM participants WHERE last_seen < ?`)
    .bind(now - 30)
    .run();

  return Response.json({
    messages: messages.results,
    participants: participants.results,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { roomId, peerId, name, type, payload, to } = body as {
    roomId: string;
    peerId: string;
    name?: string;
    type: string;
    payload?: string;
    to?: string;
  };

  if (!roomId || !peerId) {
    return Response.json({ error: "Missing roomId or peerId" }, { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const db = (env as Record<string, unknown>).DB as D1Database;
  const now = Math.floor(Date.now() / 1000);

  // Always update participant heartbeat
  await db
    .prepare(
      `INSERT INTO participants (room_id, peer_id, name, last_seen)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (room_id, peer_id)
       DO UPDATE SET last_seen = ?, name = ?`
    )
    .bind(roomId, peerId, name || "Guest", now, now, name || "Guest")
    .run();

  if (type === "heartbeat") {
    return Response.json({ ok: true });
  }

  // Insert signaling message
  await db
    .prepare(
      `INSERT INTO messages (room_id, from_peer, to_peer, type, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(roomId, peerId, to || null, type, payload || "", now)
    .run();

  return Response.json({ ok: true });
}
