import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck, Bus, ArrowLeft, MapPin, Route as RouteIcon,
  User, Phone, Copy, MessageCircle, ExternalLink, Navigation, LocateFixed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";

export default function PublicShare() {
  const { registration } = useParams();
  const nav = useNavigate();
  const [taxi, setTaxi] = useState(null);
  const [liveLoc, setLiveLoc] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get(`/public/taxi/${encodeURIComponent(registration)}`)
      .then((r) => setTaxi(r.data))
      .catch((e) => setErr(apiError(e)));
  }, [registration]);

  const fetchLiveLocation = () => {
    if (!registration) return;
    api.get(`/public/taxi/${encodeURIComponent(registration)}/live-location`)
      .then((r) => setLiveLoc(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchLiveLocation();
    const interval = setInterval(fetchLiveLocation, 8000);
    return () => clearInterval(interval);
  }, [registration]);

  const getShareUrl = () => {
    if (taxi?.share_url && (taxi.share_url.startsWith("http://") || taxi.share_url.startsWith("https://"))) {
      return taxi.share_url;
    }
    const origin = typeof window !== "undefined" && window.location.origin && window.location.origin !== "null"
      ? window.location.origin
      : "https://erank.onrender.com";
    return `${origin}/t/${encodeURIComponent(taxi?.registration || registration)}`;
  };

  const copyShare = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  };

  const shareWhatsApp = () => {
    const url = getShareUrl();
    const msg = `🚨 Safe Ride Details (E-RANK):\n\nTaxi: *${taxi?.registration || registration}*\n• Rank: ${taxi?.rank_name || "—"}\n• Route: ${taxi?.route || "—"}\n• Driver: ${taxi?.driver_name || "N/A"}\n• Driver Contact: ${taxi?.driver_contact || "N/A"}\n\n📍 Track ride and passenger live location:\n${url}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col">
      <div className="px-4 sm:px-6 py-4">
        <Button variant="ghost" onClick={() => nav("/")} className="text-slate-300 gap-2" data-testid="share-home-btn">
          <ArrowLeft size={16} /> E-RANK
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-md bg-[#181F2C] border-[#263144] p-6">
          {err && <div className="text-center text-slate-400" data-testid="share-error">{err}</div>}
          {taxi && (
            <div data-testid="share-taxi-card">
              <div className="flex items-center justify-between mb-4">
                <div className="h-11 w-11 rounded-lg bg-primary flex items-center justify-center">
                  <Bus className="text-black" size={22} />
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1">
                  <ShieldCheck size={14} /> Verified taxi
                </Badge>
              </div>
              <div className="text-3xl font-extrabold font-mono tracking-wide">{taxi.registration}</div>
              <p className="text-slate-400 text-sm mt-1">Safe public taxi information</p>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="text-emerald-400" size={18} />
                  <span className="text-slate-400 w-16">Rank</span>
                  <span className="text-white font-medium">{taxi.rank_name}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <RouteIcon className="text-primary" size={18} />
                    <span className="text-slate-400 w-16">Route</span>
                    <span className="text-white font-medium">{taxi.route}</span>
                  </div>
                  {taxi.route && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((taxi.rank_name || "") + " to " + taxi.route)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded"
                      title="Open route in Google Maps"
                    >
                      <ExternalLink size={11} /> Google Maps
                    </a>
                  )}
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

              {/* Bolt-Style Passenger Live Location */}
              {liveLoc?.has_location ? (
                <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 to-[#12221b] border border-emerald-500/50 space-y-3 animate-in fade-in" data-testid="live-location-container">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="font-bold text-emerald-300 text-sm">
                        Live Passenger Location Active
                      </span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                      Tracking Phone GPS
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The passenger accepted location sharing. Tap below to see their phone's live location on Google Maps (100% free).
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <a
                      href={liveLoc.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold h-11 rounded-lg flex items-center justify-center gap-2 text-sm shadow-md transition-colors"
                      data-testid="see-location-btn"
                    >
                      <MapPin size={18} /> See Location on Google Maps
                    </a>
                    {liveLoc.google_directions_url && (
                      <a
                        href={liveLoc.google_directions_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#181F2C] hover:bg-slate-800 border border-slate-700 text-slate-200 h-11 px-4 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-colors"
                      >
                        <Navigation size={15} /> Directions
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-5 p-3 rounded-lg bg-[#0A0D14] border border-[#263144] text-xs text-slate-400 flex items-center gap-2" data-testid="live-location-inactive">
                  <LocateFixed size={16} className="text-slate-500 shrink-0" />
                  <span>Passenger phone GPS sharing is currently inactive or was declined.</span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 mt-5">
                Shared by a passenger with their next of kin. Please keep this taxi and driver information safe.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={shareWhatsApp}
                  data-testid="share-whatsapp-btn"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 h-10 text-sm"
                >
                  <MessageCircle size={16} /> Share on WhatsApp
                </Button>
                <Button
                  onClick={copyShare}
                  data-testid="copy-share-btn"
                  variant="outline"
                  className="flex-1 border-[#334155] text-slate-200 hover:bg-[#20293A] gap-2 h-10 text-sm"
                >
                  <Copy size={16} /> Copy link
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
