/**
 * Recordings API
 * POST - Upload a recording (receives video blob)
 * GET  - List recordings for a user
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge";

export async function POST(request: Request) {
  const { env } = await getCloudflareContext();
  const db = (env as Record<string, unknown>).DB as D1Database;
  const r2 = (env as Record<string, unknown>).RECORDINGS as R2Bucket;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const roomId = formData.get("roomId") as string;
  const roomType = formData.get("roomType") as string;
  const userName = formData.get("userName") as string;
  const durationSec = parseInt(formData.get("durationSec") as string) || 0;
  const sessionNum = parseInt(formData.get("sessionNum") as string) || 1;

  if (!file || !roomId || !userName) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  const r2Key = `${userName}/${roomId}/${now}.webm`;

  await r2.put(r2Key, file.stream(), {
    httpMetadata: { contentType: "video/webm" },
  });

  const result = await db
    .prepare(
      `INSERT INTO recordings (room_id, room_type, user_name, r2_key, file_size, duration_sec, session_num, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(roomId, roomType || "class", userName, r2Key, file.size, durationSec, sessionNum, now)
    .run();

  return Response.json({ ok: true, id: result.meta.last_row_id });
}

export async function GET(request: Request) {
  const { env } = await getCloudflareContext();
  const db = (env as Record<string, unknown>).DB as D1Database;

  const url = new URL(request.url);
  const userName = url.searchParams.get("userName");

  if (!userName) {
    return Response.json({ error: "Missing userName" }, { status: 400 });
  }

  const recordings = await db
    .prepare(
      `SELECT id, room_id, room_type, user_name, file_size, duration_sec, session_num, created_at
       FROM recordings
       WHERE user_name = ?
       ORDER BY created_at DESC
       LIMIT 50`
    )
    .bind(userName)
    .all();

  return Response.json({ recordings: recordings.results });
}
