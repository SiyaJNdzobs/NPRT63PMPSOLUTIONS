import React, { useEffect, useState } from "react";
import {
  ShieldCheck, Search, Copy, Bus, MapPin, Route as RouteIcon, Megaphone,
  User, Phone, MessageCircle, Share2, ExternalLink, Navigation, LocateFixed, Radio, Check, X,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";

export default function PassengerDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [taxi, setTaxi] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [updates, setUpdates] = useState([]);

  // Bolt-style Passenger Live Location Sharing states
  const [locationConsent, setLocationConsent] = useState(() => {
    return localStorage.getItem("erank_location_consent") || "unset";
  });
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setTrackingActive(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.warn("Geo error:", err),
      { enableHighAccuracy: true, timeout: 10000 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.warn("Geo watch error:", err),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  };

  const acceptLocation = () => {
    localStorage.setItem("erank_location_consent", "granted");
    setLocationConsent("granted");
    setConsentModalOpen(false);
    startLocationTracking();
    toast.success("Live location sharing enabled for your safety!");
  };

  const declineLocation = () => {
    localStorage.setItem("erank_location_consent", "denied");
    setLocationConsent("denied");
    setConsentModalOpen(false);
    setTrackingActive(false);
    toast.info("Location sharing declined. Next of kin will see taxi & driver info only.");
  };

  const loadUpdates = async () => {
    try {
      const { data } = await api.get("/public/updates");
      setUpdates(data);
    } catch {}
  };

  useEffect(() => {
    loadUpdates();
    const savedConsent = localStorage.getItem("erank_location_consent");
    if (!savedConsent || savedConsent === "unset") {
      // Prompt passenger to accept or decline location sharing when entering app
      setConsentModalOpen(true);
    } else if (savedConsent === "granted") {
      startLocationTracking();
    }
  }, []);

  // Broadcast live location to backend when passenger has chosen a taxi
  useEffect(() => {
    if (!taxi?.registration || !currentCoords || locationConsent !== "granted") return;

    const pushLocation = async () => {
      try {
        await api.post(`/public/taxi/${encodeURIComponent(taxi.registration)}/live-location`, {
          latitude: currentCoords.lat,
          longitude: currentCoords.lng,
          passenger_name: "Passenger",
        });
      } catch (e) {
        console.error("Failed to push live ride location", e);
      }
    };

    pushLocation();
    const interval = setInterval(pushLocation, 15000);
    return () => clearInterval(interval);
  }, [taxi?.registration, currentCoords, locationConsent]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;
    setBusy(true);
    setTaxi(null);
    setSearchResults(null);

    // 1. First attempt direct taxi registration lookup
    try {
      const { data } = await api.get(`/passenger/lookup?registration=${encodeURIComponent(query)}`);
      if (data && data.registration) {
        setTaxi(data);
        setBusy(false);
        return;
      }
    } catch {
      // Not a single exact taxi registration -> proceed to smart location/rank/route search
    }

    // 2. Smart Location / Rank / Route search (handles "Johannesburg", "Kimberley", rank names, etc.)
    try {
      const { data } = await api.get(`/passenger/search?q=${encodeURIComponent(query)}`);
      setSearchResults(data);
      if ((!data.ranks || data.ranks.length === 0) && (!data.routes || data.routes.length === 0) && (!data.taxis || data.taxis.length === 0)) {
        toast.info(`No ranks or taxis found for "${query}". Check spelling or try a city name.`);
      }
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const selectTaxiFromSearch = async (regNum) => {
    setBusy(true);
    try {
      const { data } = await api.get(`/passenger/lookup?registration=${encodeURIComponent(regNum)}`);
      setTaxi(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      <AppHeader onRefresh={loadUpdates} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Safe taxi & rank lookup</h1>
          <p className="text-slate-400 text-sm mt-1">
            Search by taxi registration, rank name, or city/location (e.g. <span className="text-primary font-mono font-medium">Johannesburg</span>, <span className="text-primary font-mono font-medium">MTN Rank</span>, or <span className="text-primary font-mono font-medium">MT 004 GP</span>).
          </p>
        </div>

        {/* Bolt-style Live Location Sharing Status Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#263144] bg-[#181F2C] text-sm" data-testid="location-status-bar">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${locationConsent === "granted" ? "bg-emerald-500/20 text-emerald-400 animate-pulse" : "bg-slate-700/50 text-slate-400"}`}>
              <LocateFixed size={18} />
            </div>
            <div>
              <div className="font-medium text-xs sm:text-sm text-white flex items-center gap-2">
                <span>Live Location Sharing (Bolt-Style):</span>
                {locationConsent === "granted" ? (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                    Active · Tracking Phone GPS
                  </Badge>
                ) : (
                  <Badge className="bg-slate-700 text-slate-300 text-[10px]">
                    Disabled
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {locationConsent === "granted"
                  ? "Next-of-kin will see your phone's live location on Google Maps."
                  : "Next-of-kin sees taxi and driver info only (no GPS location)."}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConsentModalOpen(true)}
            className="text-xs border-[#334155] text-slate-300 hover:bg-[#20293A] shrink-0"
            data-testid="toggle-location-consent-btn"
          >
            {locationConsent === "granted" ? "Change" : "Enable"}
          </Button>
        </div>

        <Card className="bg-[#181F2C] border-[#263144] p-5">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. Johannesburg, Swazi Rank, or MT 004 GP"
              data-testid="lookup-input"
              className="h-12 bg-[#0A0D14] border-[#263144] text-white font-medium"
            />
            <Button type="submit" disabled={busy} data-testid="lookup-btn" className="h-12 bg-primary text-black hover:bg-primary/90 gap-2 px-5">
              <Search size={18} /> {busy ? "…" : "Search"}
            </Button>
          </form>
        </Card>

        {/* Smart Location / Rank / Route Search Results */}
        {searchResults && (
          <div className="space-y-6" data-testid="passenger-search-results">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-heading text-white">
                Results for "{searchResults.matched_query}"
              </h2>
              <span className="text-xs text-slate-400">
                {searchResults.ranks?.length ?? 0} ranks · {searchResults.routes?.length ?? 0} routes · {searchResults.taxis?.length ?? 0} taxis
              </span>
            </div>

            {/* Ranks with Google Maps integration */}
            {searchResults.ranks && searchResults.ranks.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <MapPin size={14} /> Matching Ranks ({searchResults.ranks.length})
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {searchResults.ranks.map((r) => (
                    <Card key={r.rank_name} className="bg-[#181F2C] border-[#263144] p-4 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-white text-base font-heading">{r.rank_name}</h3>
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Active Rank</Badge>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                          <MapPin size={13} className="text-emerald-400 shrink-0" /> {r.location}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-[#263144]/60 flex items-center gap-2">
                        {r.google_maps_url && (
                          <a
                            href={r.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> Google Maps
                          </a>
                        )}
                        {r.google_directions_url && (
                          <a
                            href={r.google_directions_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-700 flex items-center gap-1"
                          >
                            <Navigation size={11} /> Directions
                          </a>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Taxis */}
            {searchResults.taxis && searchResults.taxis.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs uppercase font-bold tracking-wider text-primary flex items-center gap-1.5">
                  <Bus size={14} /> Available Taxis ({searchResults.taxis.length})
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {searchResults.taxis.map((t) => (
                    <Card
                      key={t.registration}
                      onClick={() => selectTaxiFromSearch(t.registration)}
                      className="bg-[#181F2C] border-[#263144] hover:border-primary/50 cursor-pointer p-4 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-white text-base">{t.registration}</span>
                        <span className="font-mono text-primary text-xs font-semibold">{t.fare_label}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {t.rank_name} · Route: {t.route}
                      </div>
                      <div className="text-[11px] text-cyan-400 mt-2 flex items-center gap-1">
                        <span>Tap to inspect & share with next of kin ➔</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Routes */}
            {searchResults.routes && searchResults.routes.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <RouteIcon size={14} /> Routes & Fares
                </div>
                <Card className="bg-[#181F2C] border-[#263144] divide-y divide-[#263144]">
                  {searchResults.routes.map((r) => (
                    <div key={r.id || `${r.rank_name}-${r.route}`} className="p-3 flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium text-slate-200">{r.route}</div>
                        <div className="text-xs text-slate-400">{r.rank_name}</div>
                      </div>
                      <span className="font-mono text-primary font-bold text-xs">{r.fare_label}</span>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>
        )}

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
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/40 border border-cyan-500/30 px-2 py-1 rounded"
                    title="Open route in Google Maps"
                  >
                    <ExternalLink size={11} /> Google Maps Route
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

            {locationConsent === "granted" && currentCoords && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs text-emerald-300 font-medium">Your phone's live location is being broadcast for your next of kin</span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-black font-bold px-2.5 py-1 rounded flex items-center gap-1 shrink-0"
                >
                  <MapPin size={12} /> See Location
                </a>
              </div>
            )}

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

      {/* Bolt-style Location Sharing Permission Prompt */}
      <Dialog open={consentModalOpen} onOpenChange={setConsentModalOpen}>
        <DialogContent className="bg-[#181F2C] border-[#263144] text-white max-w-md">
          <DialogHeader>
            <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-2 mx-auto">
              <LocateFixed size={28} />
            </div>
            <DialogTitle className="text-center text-xl font-bold font-heading text-white">
              Share Your Live Location with Next of Kin?
            </DialogTitle>
            <DialogDescription className="text-center text-slate-300 text-sm mt-1">
              Just like Bolt, E-RANK can broadcast your phone's live GPS coordinates when you share your ride with your family or next of kin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-slate-300">
            <div className="p-3 bg-[#0A0D14] rounded-lg border border-[#263144] space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>100% Free:</strong> Uses standard Google Maps web links without paid subscriptions.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Tracks YOUR phone:</strong> Next of kin sees where your phone is on the map, not the driver's phone.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Emergency safety:</strong> In case of detour or emergency, your family has your exact live coordinates.</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#263144]">
            <Button
              type="button"
              variant="outline"
              onClick={declineLocation}
              className="flex-1 border-[#334155] text-slate-300 hover:bg-slate-800"
              data-testid="decline-location-btn"
            >
              <X size={15} className="mr-1" /> Decline
            </Button>
            <Button
              type="button"
              onClick={acceptLocation}
              className="flex-1 bg-primary text-black hover:bg-primary/90 font-bold"
              data-testid="accept-location-btn"
            >
              <Check size={15} className="mr-1" /> Accept & Share Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
