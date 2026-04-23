/**
 * CAT — Cloudflare Worker proxy for Claude API
 *
 * Deploy this worker at workers.dev (or a custom domain).
 * Set the secret:  wrangler secret put ANTHROPIC_API_KEY
 *
 * The worker:
 *  - Handles CORS so the static CAT site can call it from any origin.
 *  - Forwards POST /v1/messages to api.anthropic.com using your secret key.
 *  - Streams the response back (SSE / chunked transfer).
 *
 * Quick deploy:
 *   1. npx wrangler init cat-proxy  (select "Hello World" worker)
 *   2. Replace the generated worker with this file.
 *   3. npx wrangler secret put ANTHROPIC_API_KEY
 *   4. npx wrangler deploy
 *   5. Copy the *.workers.dev URL into CAT's chat setup screen.
 */

const ALLOWED_ORIGINS = ["*"]; // Tighten to your domain in production

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request, env) {
    // ── Preflight ──────────────────────────────────────────────────────────
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
    }

    // ── Forward to Anthropic ───────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Stream response back (handles both streaming and non-streaming modes)
    const responseHeaders = {
      ...CORS_HEADERS,
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    };

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  },
};
