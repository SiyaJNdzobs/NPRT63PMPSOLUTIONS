import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { full_name, cell_number, password } = await req.json();

    if (!/^0[6-8][0-9]{8}$/.test(cell_number)) {
      return new Response(JSON.stringify({ error: "Invalid South African cell number" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      "https://xlxxvrmbjdjchjwrzwcl.supabase.co",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const syntheticEmail = `${cell_number}@owner.erank.local`;

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: syntheticEmail,
      password,
      email_confirm: true,
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { error: insertError } = await supabaseAdmin.from("users").insert({
      id: authUser.user.id,
      full_name,
      cell_number,
      role: "owner",
    });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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
