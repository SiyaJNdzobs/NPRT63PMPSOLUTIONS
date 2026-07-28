/**
 * supabaseClient.js
 * ─────────────────
 * Single source of truth for the Supabase JS client used across the entire
 * taxi-rank-app.  Import `supabase` wherever you need DB / Auth / Realtime
 * access, and `callEdgeFunction` when you need to invoke a Deno Edge Function.
 *
 * The anon key is intentionally public – Row Level Security (RLS) policies
 * in the database enforce all data-access rules.
 */

import { createClient } from '@supabase/supabase-js';

// ── Project credentials ───────────────────────────────────────────────────────
const SUPABASE_URL     = 'https://xlxxvrmbjdjchjwrzwcl.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhseHh2cm1iamRqY2hqd3J6d2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4Nzk3MzMsImV4cCI6MjEwMDQ1NTczM30.' +
  'Mpr_UvxHMRTkcHS7L9ngoNIHJYBGWZ0koczIrqmdUZw';

// ── Client instance ───────────────────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Persist sessions so users stay logged in between app restarts
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// ── Edge Function helper ──────────────────────────────────────────────────────
/**
 * Invoke a deployed Supabase Edge Function.
 *
 * @param {string} functionName  - Name as declared in supabase/config.toml
 * @param {object} body          - JSON payload to send
 * @returns {{ data, error }}
 *
 * Available functions:
 *   'generate-qr-token'   – generate / verify a signed QR JWT for a rank
 *   'generate-driver-pin' – create & store a 6-digit bcrypt PIN for a taxi
 *   'confirm-late-trip'   – confirm a late-pooling booking once ≥5 passengers join
 */
export const callEdgeFunction = async (functionName, body = {}) => {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });
  return { data, error };
};
