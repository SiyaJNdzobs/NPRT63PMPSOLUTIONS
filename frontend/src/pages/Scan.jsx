import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, Loader2, Bus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { api, apiError } from "@/lib/api";
import { ResultModal } from "@/components/ResultModal";

export default function Scan() {
  const q = new URLSearchParams(useLocation().search);
  const token = q.get("token");
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const join = useCallback(async () => {
    setBusy(true);
    const send = async (lat, lng) => {
      try {
        await api.post("/driver/join", { token, lat, lng });
        setResult({ type: "success", title: "Joined queue", message: "You have joined the rank queue. Head to your dashboard to see your position." });
      } catch (e) {
        setResult({ type: "error", title: "Cannot join", message: apiError(e) });
      } finally {
        setBusy(false);
      }
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => send(pos.coords.latitude, pos.coords.longitude),
        () => send(null, null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      send(null, null);
    }
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0D14] text-slate-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-[#181F2C] border-[#263144] p-6 text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-3">
          <Bus className="text-black" size={24} />
        </div>
        <h1 className="text-xl font-extrabold font-heading">Rank QR check-in</h1>
        {!token && <p className="text-slate-400 text-sm mt-2">This QR link is missing its code.</p>}
        {token && (!user || user.role !== "driver") && (
          <div className="mt-4 space-y-3">
            <p className="text-slate-400 text-sm">Sign in as a driver to join the queue.</p>
            <Button onClick={() => nav("/signin")} data-testid="scan-signin-btn" className="w-full bg-primary text-black gap-2">
              <LogIn size={16} /> Driver sign in
            </Button>
          </div>
        )}
        {token && user && user.role === "driver" && (
          <div className="mt-4 space-y-3">
            <p className="text-slate-400 text-sm">Confirm to join the queue at this rank. Your location may be checked.</p>
            <Button onClick={join} disabled={busy} data-testid="scan-join-btn" className="w-full h-12 bg-emerald-500 text-black hover:bg-emerald-600 gap-2">
              {busy ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
              {busy ? "Joining…" : "Join queue"}
            </Button>
            <Button variant="outline" onClick={() => nav("/dashboard")} className="w-full border-[#334155] text-slate-200" data-testid="scan-dashboard-btn">
              Go to dashboard
            </Button>
          </div>
        )}
      </Card>
      <ResultModal result={result} onClose={() => { setResult(null); if (result?.type === "success") nav("/dashboard"); }} />
    </div>
  );
}
