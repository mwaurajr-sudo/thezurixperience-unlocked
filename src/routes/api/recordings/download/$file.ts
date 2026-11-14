import { createFileRoute } from "@tanstack/react-router";
import { downloadName, hostedRecordings } from "@/lib/recordings";
import { handle, json } from "@/server/http.server";

/**
 * Sends a set as a file download. The sets live in R2 on another address, where browsers
 * ignore a link's "download" attribute and just play the file, so the site fetches it from
 * R2 and passes it on with a header that tells the browser to save it.
 * Only sets listed in src/lib/recordings.ts can be fetched.
 */
export const Route = createFileRoute("/api/recordings/download/$file")({
  server: {
    handlers: {
      GET: handle(async ({ request, params }: { request: Request; params: { file: string } }) => {
        const file = decodeURIComponent(params.file ?? "");
        const recording = hostedRecordings.find((r) => r.src.endsWith(`/recordings/${file}`));
        if (!recording) return json({ success: false, message: "That recording doesn't exist." }, 404);

        const upstream = await fetch(new URL(recording.src, request.url));
        if (!upstream.ok || !upstream.body) {
          return json({ success: false, message: "Couldn't fetch that recording. Please try again." }, 502);
        }

        const name = downloadName(recording);
        const headers = new Headers({
          "Content-Type": upstream.headers.get("content-type") || "audio/mp4",
          "Content-Disposition": `attachment; filename="${name.replace(/[^\x20-\x7e]/g, "")}"; filename*=UTF-8''${encodeURIComponent(name)}`,
          "Cache-Control": "public, max-age=86400",
        });
        const length = upstream.headers.get("content-length");
        if (length) headers.set("Content-Length", length);

        return new Response(upstream.body, { headers });
      }),
    },
  },
});
