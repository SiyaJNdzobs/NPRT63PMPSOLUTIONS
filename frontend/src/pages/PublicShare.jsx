import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ShieldCheck, Bus, ArrowLeft, MapPin, Route as RouteIcon,
  User, Phone, Copy, MessageCircle, ExternalLink, Navigation, LocateFixed, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";

export default function PublicShare() {
  const { registration } = useParams();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const [taxi, setTaxi] = useState(null);
  const [liveLoc, setLiveLoc] = useState(null);
  const [err, setErr] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Read direct lat/lng parameters if passed in share link
  const paramLat = searchParams.get("lat");
  const paramLng = searchParams.get("lng");

  useEffect(() => {
    if (!registration) return;
    api.get(`/public/taxi/${encodeURIComponent(registration)}`)
      .then((r) => setTaxi(r.data))
      .catch((e) => setErr(apiError(e)));
  }, [registration]);

  const fetchLiveLocation = async () => {
    if (!registration) return;
    try {
      setRefreshing(true);
      const r = await api.get(`/public/taxi/${encodeURIComponent(registration)}/live-location`);
      setLiveLoc(r.data);
    } catch {
      // Keep existing location if transient network error
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  useEffect(() => {
    fetchLiveLocation();
    const interval = setInterval(fetchLiveLocation, 8000);
    return () => clearInterval(interval);
  }, [registration]);

  // Determine effective coordinates: backend liveLoc priority, then URL searchParams
  const activeLat = liveLoc?.latitude || (paramLat ? parseFloat(paramLat) : null);
  const activeLng = liveLoc?.longitude || (paramLng ? parseFloat(paramLng) : null);
  const hasLiveCoords = Boolean(activeLat && activeLng);

  const googleMapsUrl = hasLiveCoords
    ? `https://www.google.com/maps/search/?api=1&query=${activeLat},${activeLng}`
    : liveLoc?.google_maps_url || null;

  const googleDirectionsUrl = hasLiveCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${activeLat},${activeLng}`
    : liveLoc?.google_directions_url || null;

  const getShareUrl = () => {
    if (taxi?.share_url && (taxi.share_url.startsWith("http://") || taxi.share_url.startsWith("https://"))) {
      return taxi.share_url;
    }
    const origin = typeof window !== "undefined" && window.location.origin && window.location.origin !== "null"
      ? window.location.origin
      : "https://erank.onrender.com";
    let base = `${origin}/t/${encodeURIComponent(taxi?.registration || registration)}`;
    if (activeLat && activeLng) {
      base += `?lat=${activeLat}&lng=${activeLng}`;
    }
    return base;
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
      <div className="px-3 sm:px-6 py-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => nav("/")} className="text-slate-300 gap-2 h-9 px-2 sm:px-3 text-sm" data-testid="share-home-btn">
          <ArrowLeft size={16} /> E-RANK
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLiveLocation}
          disabled={refreshing}
          className="border-[#263144] hover:bg-[#181F2C] text-slate-300 gap-1.5 h-8 px-2.5 text-xs"
          data-testid="share-refresh-btn"
          title="Refresh passenger location"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin text-primary" : ""} />
          <span className="hidden sm:inline">Refresh GPS</span>
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-3 sm:px-4 pb-16">
        <Card className="w-full max-w-md bg-[#181F2C] border-[#263144] p-4 sm:p-6 shadow-2xl">
          {err && <div className="text-center text-rose-400 text-sm py-4" data-testid="share-error">{err}</div>}
          {taxi && (
            <div data-testid="share-taxi-card" className="space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-lg bg-primary flex items-center justify-center">
                  <Bus className="text-black" size={22} />
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1 text-xs">
                  <ShieldCheck size={14} /> Verified taxi
                </Badge>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-wide break-words">{taxi.registration}</div>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">Safe public taxi information</p>
              </div>

              <div className="space-y-2.5 sm:space-y-3 bg-[#121721] p-3 sm:p-4 rounded-xl border border-[#263144]">
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <MapPin className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                  <span className="text-slate-400 w-14 shrink-0">Rank</span>
                  <span className="text-white font-medium break-words">{taxi.rank_name || "—"}</span>
                </div>
                <div className="flex items-start justify-between gap-2 text-xs sm:text-sm">
                  <div className="flex items-start gap-2.5">
                    <RouteIcon className="text-primary shrink-0 mt-0.5" size={16} />
                    <span className="text-slate-400 w-14 shrink-0">Route</span>
                    <span className="text-white font-medium break-words">{taxi.route || "—"}</span>
                  </div>
                  {taxi.route && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((taxi.rank_name || "") + " to " + taxi.route)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded shrink-0"
                      title="Open route in Google Maps"
                    >
                      <ExternalLink size={11} /> Maps
                    </a>
                  )}
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <User className="text-cyan-400 shrink-0 mt-0.5" size={16} />
                  <span className="text-slate-400 w-14 shrink-0">Driver</span>
                  <span className="text-white font-medium break-words">{taxi.driver_name || "—"}</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <Phone className="text-cyan-400 shrink-0 mt-0.5" size={16} />
                  <span className="text-slate-400 w-14 shrink-0">Contact</span>
                  <span className="text-white font-medium font-mono">{taxi.driver_contact || "—"}</span>
                </div>
              </div>

              {/* Bolt-Style Passenger Live Location Box */}
              {hasLiveCoords ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 to-[#12221b] border border-emerald-500/60 space-y-3 animate-in fade-in" data-testid="live-location-container">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="font-bold text-emerald-300 text-xs sm:text-sm">
                        Live Passenger Location Active
                      </span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                      Tracking Phone GPS
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Passenger live location is sharing. Tap below to track their location live on Google Maps (100% free).
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold h-11 rounded-lg flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md transition-colors"
                      data-testid="see-location-btn"
                    >
                      <MapPin size={17} /> See Location on Google Maps
                    </a>
                    {googleDirectionsUrl && (
                      <a
                        href={googleDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#181F2C] hover:bg-slate-800 border border-slate-700 text-slate-200 h-11 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-colors shrink-0"
                      >
                        <Navigation size={14} /> Directions
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#121721] border border-[#263144] text-xs text-slate-300 space-y-2" data-testid="live-location-inactive">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium text-slate-200">
                      <LocateFixed size={15} className="text-emerald-400 animate-pulse" />
                      <span>Live GPS Tracking Connecting</span>
                    </div>
                    <button
                      onClick={fetchLiveLocation}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} /> Check now
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Awaiting latest GPS coordinates from passenger phone. You can view the taxi's verified rank & route directions on Google Maps below.
                  </p>
                  {taxi.rank_name && taxi.route && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(taxi.rank_name)}&destination=${encodeURIComponent(taxi.route)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mt-1 bg-[#181F2C] hover:bg-[#20293A] border border-[#334155] text-slate-200 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
                    >
                      <MapPin size={13} className="text-cyan-400" /> View Route on Google Maps
                    </a>
                  )}
                </div>
              )}

              <p className="text-[11px] text-slate-400 leading-normal">
                Shared by a passenger with their next of kin. Keep this taxi registration and driver contact safe.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  onClick={shareWhatsApp}
                  data-testid="share-whatsapp-btn"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 h-10 text-xs sm:text-sm"
                >
                  <MessageCircle size={16} /> Share on WhatsApp
                </Button>
                <Button
                  onClick={copyShare}
                  data-testid="copy-share-btn"
                  variant="outline"
                  className="flex-1 border-[#334155] text-slate-200 hover:bg-[#20293A] gap-2 h-10 text-xs sm:text-sm"
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
