import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { booking_id } = await req.json();
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from("late_trip_bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (fetchError) throw fetchError;

    if (booking.passenger_cells.length >= 5 && !booking.is_confirmed) {
      const premium = booking.base_fare * 1.1;
      const { error: updateError } = await supabaseAdmin
        .from("late_trip_bookings")
        .update({ is_confirmed: true, premium_fare: premium })
        .eq("id", booking_id);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ confirmed: true, premium_fare: premium }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ confirmed: false, passengers_needed: 5 - booking.passenger_cells.length }), {
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
