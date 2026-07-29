import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { full_name, cell_number, rank_id } = await req.json();

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

    const syntheticEmail = `${cell_number}@marshal.erank.local`;
    const tempPassword = `Erank${cell_number.slice(-4)}!`;

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: syntheticEmail,
      password: tempPassword,
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
      role: "marshal",
    });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { error: rankError } = await supabaseAdmin
      .from("ranks")
      .update({ marshal_id: authUser.user.id })
      .eq("id", rank_id);

    if (rankError) {
      return new Response(JSON.stringify({ error: rankError.message }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true, temp_password: tempPassword }), {
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
