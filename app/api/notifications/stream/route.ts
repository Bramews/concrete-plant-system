import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications/stream
 * Persistent SSE stream for real-time system alerts.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const responseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  };

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Helper to send events
      const sendEvent = (data: any, event = "message") => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // 1. Initial Connection Success
      sendEvent(
        { message: "Connected to Omni-Stream V2.5", timestamp: new Date() },
        "system",
      );

      // 2. Keep-alive heartbeat (every 30s)
      const heartbeat = setInterval(() => {
        sendEvent({ type: "heartbeat" }, "ping");
      }, 30000);

      // 3. Simulated Production Hook (Example)
      // In a real scenario, we'd subscribe to a global EventEmitter or Redis pub/sub here.
      // For now, we provide the architectural hook.

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers: responseHeaders });
}
