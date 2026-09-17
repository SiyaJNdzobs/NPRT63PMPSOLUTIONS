import React, { useEffect, useState } from "react";
import { ShieldCheck, Search, Copy, Bus, MapPin, Route as RouteIcon, Megaphone, User, Phone, MessageCircle, Share2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";

export default function PassengerDashboard() {
  const [reg, setReg] = useState("");
  const [taxi, setTaxi] = useState(null);
  const [busy, setBusy] = useState(false);
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    api.get("/public/updates").then((r) => setUpdates(r.data)).catch(() => {});
  }, []);

  const lookup = async (e) => {
    e?.preventDefault();
    if (!reg.trim()) return;
    setBusy(true);
    setTaxi(null);
    try {
      const { data } = await api.get(`/passenger/lookup?registration=${encodeURIComponent(reg.trim())}`);
      setTaxi(data);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const getShareUrl = () => {
    if (taxi?.share_url && (taxi.share_url.startsWith("http://") || taxi.share_url.startsWith("https://"))) {
      return taxi.share_url;
    }
    const origin = typeof window !== "undefined" && window.location.origin && window.location.origin !== "null"
      ? window.location.origin
      : "https://erank.onrender.com";
    return `${origin}/t/${encodeURIComponent(taxi?.registration || "")}`;
  };

  const copyShare = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  };

  const shareWhatsApp = () => {
    const url = getShareUrl();
    const msg = `🚨 Safe Ride Details (E-RANK):\n\nI am travelling in taxi *${taxi.registration}*.\n• Rank: ${taxi.rank_name}\n• Route: ${taxi.route}\n• Driver: ${taxi.driver_name || "N/A"}\n• Driver Contact: ${taxi.driver_contact || "N/A"}\n\nTrack or view verified ride info here:\n${url}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Safe taxi lookup</h1>
          <p className="text-slate-400 text-sm mt-1">Check a taxi's rank and route by its registration number.</p>
        </div>

        <Card className="bg-[#181F2C] border-[#263144] p-5">
          <form onSubmit={lookup} className="flex gap-2">
            <Input
              value={reg}
              onChange={(e) => setReg(e.target.value)}
              placeholder="e.g. MT 004 GP"
              data-testid="lookup-input"
              className="h-12 bg-[#0A0D14] border-[#263144] text-white font-mono"
            />
            <Button type="submit" disabled={busy} data-testid="lookup-btn" className="h-12 bg-primary text-black hover:bg-primary/90 gap-2">
              <Search size={18} /> {busy ? "…" : "Check"}
            </Button>
          </form>
        </Card>

        {taxi && (
          <Card className="bg-[#181F2C] border-[#263144] p-6" data-testid="lookup-result">
            <div className="flex items-center justify-between mb-4">
              <div className="h-11 w-11 rounded-lg bg-primary flex items-center justify-center">
                <Bus className="text-black" size={22} />
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1">
                <ShieldCheck size={14} /> Verified
              </Badge>
            </div>
            <div className="text-3xl font-extrabold font-mono tracking-wide">{taxi.registration}</div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="text-emerald-400" size={18} />
                <span className="text-slate-400 w-16">Rank</span>
                <span className="text-white font-medium">{taxi.rank_name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <RouteIcon className="text-primary" size={18} />
                <span className="text-slate-400 w-16">Route</span>
                <span className="text-white font-medium">{taxi.route}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="text-cyan-400" size={18} />
                <span className="text-slate-400 w-16">Driver</span>
                <span className="text-white font-medium">{taxi.driver_name || "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="text-cyan-400" size={18} />
                <span className="text-slate-400 w-16">Contact</span>
                <span className="text-white font-medium font-mono">{taxi.driver_contact || "—"}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-4">Share this with your next of kin so they know which taxi and driver you are travelling with.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <Button
                onClick={shareWhatsApp}
                data-testid="share-whatsapp-btn"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 h-11"
              >
                <MessageCircle size={18} /> Share on WhatsApp
              </Button>
              <Button
                onClick={copyShare}
                data-testid="copy-share-btn"
                variant="outline"
                className="flex-1 border-[#334155] text-slate-200 hover:bg-[#20293A] gap-2 h-11"
              >
                <Copy size={16} /> Copy link
              </Button>
            </div>
          </Card>
        )}

        {updates.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Megaphone className="text-primary" size={18} />
              <h2 className="text-lg font-bold font-heading">Rank updates</h2>
            </div>
            {updates.map((u) => (
              <Card key={u.id} className="bg-[#181F2C] border-[#263144] p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-sm">{u.title}</h3>
                  <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">{u.status}</Badge>
                </div>
                <p className="text-sm text-slate-400 mt-1">{u.message}</p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
