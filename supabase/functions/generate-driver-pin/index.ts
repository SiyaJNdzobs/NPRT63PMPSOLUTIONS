import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { taxi_id } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    const { data: hashData, error: hashError } = await supabaseAdmin.rpc(
      "hash_pin",
      { plain_pin: pin }
    );

    if (hashError) throw hashError;

    const { error: updateError } = await supabaseAdmin
      .from("taxis")
      .update({ driver_pin_hash: hashData })
      .eq("id", taxi_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ pin }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
