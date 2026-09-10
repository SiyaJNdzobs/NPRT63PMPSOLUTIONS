import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShieldCheck, Bus, ArrowLeft, MapPin, Route as RouteIcon, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, apiError } from "@/lib/api";

export default function PublicShare() {
  const { registration } = useParams();
  const nav = useNavigate();
  const [taxi, setTaxi] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get(`/public/taxi/${encodeURIComponent(registration)}`)
      .then((r) => setTaxi(r.data))
      .catch((e) => setErr(apiError(e)));
  }, [registration]);

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
              <p className="text-[11px] text-slate-500 mt-6">
                Shared by a passenger with their next of kin. Please keep this taxi and driver information safe.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
