import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bus, AlertTriangle, MapPin, Loader2, Camera, Users, ListOrdered, CheckCircle2, RefreshCw, Navigation, X } from "lucide-react";
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
  const [busy, setBusy] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  // GPS location consent — same pattern as PassengerDashboard
  const [locationConsent, setLocationConsent] = useState(null); // null=unknown, 'granted', 'denied'
  const [consentOpen, setConsentOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("erank_driver_location_consent");
    if (saved === "granted" || saved === "denied") {
      setLocationConsent(saved);
    } else {
      // First time — show the consent dialog
      setConsentOpen(true);
    }
  }, []);

  const grantConsent = () => {
    localStorage.setItem("erank_driver_location_consent", "granted");
    setLocationConsent("granted");
    setConsentOpen(false);
  };

  const denyConsent = () => {
    localStorage.setItem("erank_driver_location_consent", "denied");
    setLocationConsent("denied");
    setConsentOpen(false);
  };

  const { data: status } = useQuery({
    queryKey: ["driver-status"],
    queryFn: async () => (await api.get("/driver/status")).data,
    refetchInterval: 3000,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["driver-status"] });

  const dismissNotification = async (notifId) => {
    try {
      await api.post(`/driver/notifications/${notifId}/read`);
      refresh();
      toast.success("Notification acknowledged");
    } catch (e) {
      console.error("Could not mark notification as read", e);
    }
  };

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

    if (locationConsent === "denied") {
      // Consent denied — still send null coords; backend will reject if geo-check is on
      send(null, null);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => send(p.coords.latitude, p.coords.longitude),
        () => {
          // Browser denied GPS at OS level even though user said yes in app
          setResult({
            type: "error",
            title: "Location unavailable",
            message: "Your device denied GPS access. Please enable location in your phone/browser settings and try again.",
          });
          setBusy(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else send(null, null);
  };

  const join = () => joinWithToken(token);

  const doDepart = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/driver/depart", {});
      setResult({ type: "success", title: "Departed", message: `Trip recorded. Revenue R${data.revenue} added to owner totals.` });
      refresh();
    } catch (e) {
      setResult({ type: "error", title: "Cannot depart", message: apiError(e) });
    } finally { setBusy(false); }
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

      {/* GPS Location Consent Modal */}
      <Dialog open={consentOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-[#181F2C] border-[#263144] max-w-sm" data-testid="driver-gps-consent-dialog">
          <DialogHeader>
            <DialogTitle className="text-white font-heading flex items-center gap-2">
              <Navigation size={20} className="text-primary" /> Allow Location Access
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2 leading-relaxed">
              E-RANK uses your GPS location to verify you are at the rank before allowing you to join the queue.
              <br /><br />
              <span className="text-slate-400 text-xs">If geo-check is enabled at your rank, you must be within 20 metres to join.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button
              onClick={grantConsent}
              data-testid="driver-gps-allow-btn"
              className="bg-primary text-black hover:bg-primary/90 gap-2 flex-1"
            >
              <Navigation size={16} /> Allow location
            </Button>
            <Button
              onClick={denyConsent}
              variant="outline"
              data-testid="driver-gps-deny-btn"
              className="border-[#334155] text-slate-300 gap-2 flex-1"
            >
              <X size={16} /> Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold font-heading">Driver operations</h1>
            <p className="text-slate-400 text-sm mt-1">
              Assigned rank: <span className="text-white font-medium">{status?.assigned_rank || "—"}</span>
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={refresh}
            data-testid="driver-refresh-btn"
            className="border-[#263144] hover:bg-[#181F2C] text-slate-300 gap-1.5 shrink-0"
            title="Refresh latest queue and status"
          >
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>

        {/* GPS Location Status Banner */}
        {locationConsent === "denied" && (
          <div className="flex items-center gap-3 bg-amber-950/50 border border-amber-500/40 rounded-xl px-4 py-3 text-sm" data-testid="driver-gps-denied-banner">
            <Navigation size={16} className="text-amber-400 shrink-0" />
            <span className="text-amber-200 flex-1">Location sharing is off. Geo-checked ranks may prevent you from joining the queue.</span>
            <button
              onClick={() => setConsentOpen(true)}
              className="text-xs text-primary underline shrink-0"
              data-testid="driver-gps-change-btn"
            >
              Change
            </button>
          </div>
        )}
        {locationConsent === "granted" && (
          <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm" data-testid="driver-gps-granted-banner">
            <Navigation size={16} className="text-emerald-400 shrink-0" />
            <span className="text-emerald-200 flex-1">Location sharing on · GPS will verify you are at the rank when joining the queue.</span>
            <button
              onClick={() => { localStorage.removeItem("erank_driver_location_consent"); setConsentOpen(true); }}
              className="text-xs text-slate-400 underline shrink-0"
              data-testid="driver-gps-change-btn"
            >
              Change
            </button>
          </div>
        )}

        {/* In-App Driver Notifications (e.g. Queue Skipped Reason from Marshal) */}
        {status?.notifications && status.notifications.length > 0 && (
          <div className="space-y-3" data-testid="driver-notifications-container">
            {status.notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-gradient-to-r from-amber-950/60 via-[#1F1912] to-[#181F2C] border border-amber-500/50 rounded-xl p-4 shadow-lg text-white space-y-2 animate-in fade-in"
                data-testid={`driver-notification-${notif.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-300 text-sm">{notif.title || "Queue Notification"}</span>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">Important</Badge>
                      </div>
                      <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      {notif.reason && (
                        <div className="mt-2 bg-black/40 border border-amber-500/20 rounded-md p-2.5 text-xs text-amber-200">
                          <span className="text-slate-400">Reason given by Marshal:</span>{" "}
                          <span className="font-medium">"{notif.reason}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dismissNotification(notif.id)}
                    className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs shrink-0 h-8 gap-1"
                    data-testid={`dismiss-notification-${notif.id}`}
                  >
                    <CheckCircle2 size={14} /> Got it
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

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

        {/* Rank Queue Board */}
        <Card className="bg-[#181F2C] border-[#263144] p-5" data-testid="driver-queue-board-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <ListOrdered size={18} />
              </div>
              <div>
                <h2 className="font-bold text-white text-base leading-tight">
                  {status?.assigned_rank || "Rank"} Queue
                </h2>
                <p className="text-[11px] text-slate-400">
                  Live queue for your assigned rank ({status?.queue?.length ?? 0} taxis)
                </p>
              </div>
            </div>
            <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
              Live updates
            </Badge>
          </div>

          <div className="rounded-lg border border-[#263144] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#121721] text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5 text-left w-12">#</th>
                    <th className="px-3 py-2.5 text-left">Taxi</th>
                    <th className="px-3 py-2.5 text-left">Driver</th>
                    <th className="px-3 py-2.5 text-left">Route</th>
                    <th className="px-3 py-2.5 text-right">Fare</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263144]">
                  {!status?.queue || status.queue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                        No taxis currently waiting in this rank's queue.
                      </td>
                    </tr>
                  ) : (
                    status.queue.map((qItem) => {
                      const isMe = qItem.taxi_registration === taxi?.registration;
                      return (
                        <tr
                          key={qItem.id}
                          className={`transition-colors ${
                            isMe
                              ? "bg-emerald-500/15 border-l-4 border-l-emerald-400 hover:bg-emerald-500/20"
                              : "hover:bg-[#20293A]/50"
                          }`}
                          data-testid={`driver-queue-row-${qItem.taxi_registration.replace(/\s+/g, "-")}`}
                        >
                          <td className="px-3 py-3 font-mono font-bold">
                            <span className={isMe ? "text-emerald-400" : "text-slate-400"}>
                              #{qItem.position}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-mono font-semibold text-white">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{qItem.taxi_registration}</span>
                              {isMe && (
                                <Badge className="bg-emerald-500 text-black font-bold text-[9px] px-1 py-0 h-4">
                                  YOU
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-300 text-xs sm:text-sm">
                            {qItem.driver_name || "—"}
                          </td>
                          <td className="px-3 py-3 text-slate-300 text-xs sm:text-sm">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span>{qItem.route}</span>
                              {qItem.long_distance && (
                                <Badge className="bg-primary/15 text-primary border-primary/30 text-[9px] px-1 py-0 h-4">
                                  LD
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-primary font-medium text-xs sm:text-sm">
                            {qItem.fare_label}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-3">
          {inQueue && status?.long_distance ? (
            <Card className="bg-[#181F2C] border-amber-500/30 p-4 rounded-xl" data-testid="driver-ld-control-card">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Bus size={20} />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Long-Distance Trip Control</div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Your rank marshal will capture the passenger manifest and depart the taxi on your behalf when full.
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Button
              onClick={doDepart}
              disabled={!inQueue || busy}
              data-testid="depart-btn"
              className="h-14 text-base bg-primary text-black hover:bg-primary/90 disabled:opacity-40"
            >
              DEPART
            </Button>
          )}
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

      <ResultModal result={result} onClose={() => setResult(null)} />
    </div>
  );
}
