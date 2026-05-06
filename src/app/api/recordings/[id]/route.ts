/**
 * Stream a recording from R2
 * GET /api/recordings/[id] - Stream video
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { env } = await getCloudflareContext();
  const db = (env as Record<string, unknown>).DB as D1Database;
  const r2 = (env as Record<string, unknown>).RECORDINGS as R2Bucket;

  const recording = await db
    .prepare(`SELECT r2_key FROM recordings WHERE id = ?`)
    .bind(id)
    .first<{ r2_key: string }>();

  if (!recording) {
    return new Response("Not found", { status: 404 });
  }

  const object = await r2.get(recording.r2_key);
  if (!object) {
    return new Response("File not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": "video/webm",
      "Content-Length": String(object.size),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
