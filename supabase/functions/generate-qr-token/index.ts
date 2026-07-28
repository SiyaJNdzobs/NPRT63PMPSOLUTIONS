import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const encoder = new TextEncoder();

serve(async (req) => {
  try {
    const { action, rank_id, token } = await req.json();
    const secret = Deno.env.get("QR_SIGNING_SECRET") ?? "fallback-dev-secret";
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    if (action === "generate") {
      const jwt = await create(
        { alg: "HS256", typ: "JWT" },
        { rank_id, exp: getNumericDate(60 * 60) },
        key
      );
      return new Response(JSON.stringify({ token: jwt }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "verify") {
      const payload = await verify(token, key);
      return new Response(JSON.stringify({ valid: true, rank_id: payload.rank_id }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
