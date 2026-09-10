import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bus, AlertTriangle, MapPin, Loader2, Plus, Camera } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { api, apiError } from "@/lib/api";
import { ResultModal } from "@/components/ResultModal";
import { toast } from "sonner";
import { QrScanner } from "@/components/QrScanner";

export default function DriverDashboard() {
  const qc = useQueryClient();
  const [token, setToken] = useState("");
  const [result, setResult] = useState(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [departOpen, setDepartOpen] = useState(false);
  const [pax, setPax] = useState([{ name: "", contact: "", destination: "" }]);
  const [busy, setBusy] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const { data: status } = useQuery({
    queryKey: ["driver-status"],
    queryFn: async () => (await api.get("/driver/status")).data,
    refetchInterval: 3000,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["driver-status"] });

  const extractToken = (raw) => {
    if (!raw) return "";
    const m = String(raw).match(/token=([^&\s]+)/);
    return (m ? m[1] : String(raw)).trim();
  };

  const joinWithToken = async (raw) => {
    const tok = extractToken(raw);
    if (!tok) { toast.error("No QR code detected. Try again."); return; }
    setScanOpen(false);
    setBusy(true);
    const send = async (lat, lng) => {
      try {
        await api.post("/driver/join", { token: tok, lat, lng });
        setResult({ type: "success", title: "Joined queue", message: "You are now in the rank queue." });
        setToken("");
        refresh();
      } catch (e) {
        setResult({ type: "error", title: "Cannot join", message: apiError(e) });
      } finally { setBusy(false); }
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => send(p.coords.latitude, p.coords.longitude),
        () => send(null, null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else send(null, null);
  };

  const join = () => joinWithToken(token);

  const doDepart = async () => {
    setBusy(true);
    try {
      const payload = status?.long_distance
        ? { long_distance_passengers: pax.filter((p) => p.name.trim()) }
        : {};
      const { data } = await api.post("/driver/depart", payload);
      setDepartOpen(false);
      setResult({ type: "success", title: "Departed", message: `Trip recorded. Revenue R${data.revenue} added to owner totals.` });
      setPax([{ name: "", contact: "", destination: "" }]);
      refresh();
    } catch (e) {
      setResult({ type: "error", title: "Cannot depart", message: apiError(e) });
    } finally { setBusy(false); }
  };

  const onDepartClick = () => {
    if (status?.long_distance) setDepartOpen(true);
    else doDepart();
  };

  const sendSos = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/driver/sos");
      setSosOpen(false);
      setResult({
        type: "success", title: "SOS sent",
        message: data.email_sent
          ? `Your owner ${data.owner_notified} has been emailed with your details.`
          : "SOS recorded. We could not email the owner (no email on file).",
      });
    } catch (e) {
      setResult({ type: "error", title: "SOS failed", message: apiError(e) });
    } finally { setBusy(false); }
  };

  const inQueue = status?.in_queue;
  const taxi = status?.taxi;

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Driver operations</h1>
          <p className="text-slate-400 text-sm mt-1">
            Assigned rank: <span className="text-white font-medium">{status?.assigned_rank || "—"}</span>
          </p>
        </div>

        {taxi && (
          <Card className="bg-[#181F2C] border-[#263144] p-6" data-testid="driver-status-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-primary flex items-center justify-center">
                  <Bus className="text-black" size={22} />
                </div>
                <div>
                  <div className="font-mono text-lg font-bold">{taxi.registration}</div>
                  <div className="text-sm text-slate-400">{taxi.route} · {taxi.fare_label} · {taxi.seats} seats</div>
                </div>
              </div>
              {status?.long_distance && (
                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">Long distance</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="rounded-xl bg-[#0A0D14] p-4 text-center">
                <div className="text-3xl font-extrabold font-mono text-emerald-400" data-testid="queue-position">
                  {inQueue ? `#${status.position}` : "—"}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 mt-1">My position</div>
              </div>
              <div className="rounded-xl bg-[#0A0D14] p-4 text-center">
                <div className="text-3xl font-extrabold font-mono text-white">{status?.queue_length ?? 0}</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 mt-1">In queue</div>
              </div>
            </div>
            <div className="mt-3">
              {inQueue ? (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Active in queue</Badge>
              ) : (
                <Badge className="bg-slate-500/15 text-slate-300 border-slate-500/30">Not in queue</Badge>
              )}
            </div>
          </Card>
        )}

        {!inQueue && (
          <Card className="bg-[#181F2C] border-[#263144] p-5" data-testid="join-card">
            <Label className="text-slate-300 text-sm">Join the rank queue</Label>
            <p className="text-xs text-slate-500 mt-1 mb-3">Tap scan and point your phone camera at the marshal's rank QR code.</p>
            <Button onClick={() => setScanOpen(true)} disabled={busy} data-testid="driver-scan-btn" className="w-full h-12 bg-emerald-500 text-black hover:bg-emerald-600 gap-2">
              {busy ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />} Scan rank QR to join
            </Button>
            <button onClick={() => setManualOpen((v) => !v)} data-testid="manual-toggle" className="text-xs text-slate-400 underline mt-3">
              {manualOpen ? "Hide manual entry" : "Enter code manually"}
            </button>
            {manualOpen && (
              <div className="flex gap-2 mt-2">
                <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Rank QR code" data-testid="join-token-input" className="h-11 bg-[#0A0D14] border-[#263144] text-white font-mono" />
                <Button onClick={join} disabled={busy} data-testid="driver-join-btn" className="h-11 bg-primary text-black hover:bg-primary/90 gap-2">
                  <MapPin size={16} /> Join
                </Button>
              </div>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={onDepartClick}
            disabled={!inQueue || busy}
            data-testid="depart-btn"
            className="h-14 text-base bg-primary text-black hover:bg-primary/90 disabled:opacity-40"
          >
            DEPART
          </Button>
          <Button
            onClick={() => setSosOpen(true)}
            data-testid="sos-btn"
            className="h-16 text-lg font-bold bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            <AlertTriangle size={22} /> SOS EMERGENCY
          </Button>
        </div>
      </main>

      {/* QR camera scanner */}
      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="bg-[#181F2C] border-[#263144] max-w-sm" data-testid="scan-dialog">
          <DialogHeader>
            <DialogTitle className="text-white font-heading flex items-center gap-2"><Camera size={18} /> Scan rank QR</DialogTitle>
            <DialogDescription className="text-slate-400">Point your camera at the QR code displayed at your rank.</DialogDescription>
          </DialogHeader>
          {scanOpen && <QrScanner onResult={joinWithToken} onError={() => toast.error("Camera unavailable. Use manual entry instead.")} />}
        </DialogContent>
      </Dialog>

      {/* SOS confirm */}
      <Dialog open={sosOpen} onOpenChange={setSosOpen}>
        <DialogContent className="bg-[#181F2C] border-red-900/50" data-testid="sos-dialog">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2"><AlertTriangle size={20} /> Confirm SOS</DialogTitle>
            <DialogDescription className="text-slate-300 pt-1">
              This will immediately email your owner with your taxi, rank, route and any long-distance passenger details. Only use in a real emergency.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSosOpen(false)} className="border-[#334155] text-slate-200">Cancel</Button>
            <Button onClick={sendSos} disabled={busy} data-testid="sos-confirm-btn" className="bg-red-600 hover:bg-red-700 text-white">
              {busy ? "Sending…" : "Send SOS now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Long distance depart capture */}
      <Dialog open={departOpen} onOpenChange={setDepartOpen}>
        <DialogContent className="bg-[#181F2C] border-[#263144] max-w-lg" data-testid="depart-dialog">
          <DialogHeader>
            <DialogTitle className="text-white font-heading">Capture long-distance passengers</DialogTitle>
            <DialogDescription className="text-slate-400">Required before departing on a long-distance route.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-auto">
            {pax.map((p, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <Input placeholder="Name" value={p.name} onChange={(e) => { const c = [...pax]; c[i].name = e.target.value; setPax(c); }} data-testid={`pax-name-${i}`} className="bg-[#0A0D14] border-[#263144] text-white" />
                <Input placeholder="Contact" value={p.contact} onChange={(e) => { const c = [...pax]; c[i].contact = e.target.value; setPax(c); }} data-testid={`pax-contact-${i}`} className="bg-[#0A0D14] border-[#263144] text-white" />
                <Input placeholder="Destination" value={p.destination} onChange={(e) => { const c = [...pax]; c[i].destination = e.target.value; setPax(c); }} data-testid={`pax-dest-${i}`} className="bg-[#0A0D14] border-[#263144] text-white" />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setPax([...pax, { name: "", contact: "", destination: "" }])} data-testid="add-pax-btn" className="border-[#334155] text-slate-200 gap-1">
              <Plus size={14} /> Add passenger
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepartOpen(false)} className="border-[#334155] text-slate-200">Cancel</Button>
            <Button onClick={doDepart} disabled={busy || !pax.some((p) => p.name.trim())} data-testid="confirm-depart-btn" className="bg-primary text-black hover:bg-primary/90">
              {busy ? "Departing…" : "Confirm & depart"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResultModal result={result} onClose={() => setResult(null)} />
    </div>
  );
}
