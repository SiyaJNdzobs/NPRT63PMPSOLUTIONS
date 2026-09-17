import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Route as RouteIcon, Megaphone, Bus, LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function Landing() {
  const nav = useNavigate();
  const [ranks, setRanks] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);

  useEffect(() => {
    api.get("/public/ranks").then((r) => setRanks(r.data)).catch(() => {});
    api.get("/public/routes").then((r) => setRoutes(r.data)).catch(() => {});
    api.get("/public/updates").then((r) => setUpdates(r.data)).catch(() => {});
  }, []);

  const doSearch = async (e) => {
    e?.preventDefault();
    if (!q.trim()) { setResults(null); return; }
    const { data } = await api.get(`/public/search?q=${encodeURIComponent(q.trim())}`);
    setResults(data);
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0A0D14]/85 border-b border-[#263144] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Bus className="text-black" size={20} />
            </div>
            <div>
              <div className="font-heading font-extrabold tracking-tight leading-none">E-RANK</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">Taxi Rank Ops</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => nav("/signin")} data-testid="landing-signin-btn" className="bg-primary text-black hover:bg-primary/90 gap-2">
              <LogIn size={16} /> Sign in
            </Button>
            <Button onClick={() => nav("/signin?register=1")} variant="outline" data-testid="landing-register-btn" className="border-[#334155] text-slate-200 hover:bg-[#20293A] gap-2">
              <UserPlus size={16} /> <span className="hidden sm:inline">Sign up</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        <section className="space-y-5">
          <Badge className="bg-primary/15 text-primary border-primary/30 uppercase tracking-wider text-[11px]">
            South African Taxi Ranks
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading max-w-3xl">
            Live queues, fares and safe taxi lookup for every rank.
          </h1>
          <p className="text-slate-400 text-base max-w-2xl leading-relaxed">
            Find routes and fares, check a taxi's rank and registration, and read the latest rank updates. Drivers, marshals and owners sign in to manage operations in real time.
          </p>
          <form onSubmit={doSearch} className="flex gap-2 max-w-xl">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search rank, route or taxi registration…"
              data-testid="public-search-input"
              className="h-12 bg-[#181F2C] border-[#263144] text-white"
            />
            <Button type="submit" data-testid="public-search-btn" className="h-12 bg-primary text-black hover:bg-primary/90 gap-2">
              <Search size={18} /> Search
            </Button>
          </form>
        </section>

        {results && (
          <section data-testid="search-results" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-heading">
                Search results {results.matched_query ? `for "${results.matched_query}"` : ""}
              </h2>
              <span className="text-xs text-slate-400">
                {results.ranks.length} ranks · {results.routes.length} routes · {results.taxis.length} taxis
              </span>
            </div>

            {results.ranks.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  📍 Matching Ranks ({results.ranks.length})
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {results.ranks.map((r) => (
                    <Card key={r.rank_name} className="bg-[#181F2C] border-[#263144] p-5 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-lg text-white font-heading">{r.rank_name}</div>
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Active Rank</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-300 mt-1">
                          <MapPin size={15} className="text-emerald-400 shrink-0" />
                          <span>{r.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-[#263144]/60">
                        {r.google_maps_url && (
                          <a
                            href={r.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium flex items-center gap-1"
                          >
                            🗺️ Open on Google Maps
                          </a>
                        )}
                        {r.google_directions_url && (
                          <a
                            href={r.google_directions_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded border border-slate-700"
                          >
                            Get Directions ➔
                          </a>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="bg-[#181F2C] border-[#263144] p-4">
                <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-bold">
                  🛣️ Operating Routes ({results.routes.length})
                </div>
                {results.routes.length === 0 && <div className="text-slate-500 text-sm py-2">No routes found</div>}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {results.routes.map((r) => (
                    <div key={r.id || `${r.rank_name}-${r.route}`} className="text-sm text-white py-1 flex items-center justify-between border-b border-[#263144]/40 last:border-0">
                      <div>
                        <span className="font-medium text-slate-200">{r.route}</span>
                        <div className="text-xs text-slate-400">{r.rank_name}</div>
                      </div>
                      <span className="text-primary font-mono font-bold text-xs">{r.fare_label}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-[#181F2C] border-[#263144] p-4">
                <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-bold">
                  🚐 Verified Taxis ({results.taxis.length})
                </div>
                {results.taxis.length === 0 && <div className="text-slate-500 text-sm py-2">No taxis found</div>}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {results.taxis.map((t) => (
                    <div key={t.registration} className="text-sm text-white py-1 flex items-center justify-between border-b border-[#263144]/40 last:border-0">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                        <span className="font-mono font-bold">{t.registration}</span>
                        <span className="text-xs text-slate-400">({t.route || t.rank_name})</span>
                      </div>
                      <span className="text-xs text-primary font-mono">{t.fare_label || ""}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </section>
        )}

        {updates.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="text-primary" size={20} />
              <h2 className="text-xl font-bold font-heading">Rank updates</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {updates.map((u) => (
                <Card key={u.id} data-testid="update-card" className="bg-[#181F2C] border-[#263144] p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white">{u.title}</h3>
                    <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">{u.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{u.message}</p>
                  <div className="text-[11px] text-slate-500 mt-3">{u.rank_name} · {u.marshal_name}</div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="text-emerald-400" size={20} />
              <h2 className="text-xl font-bold font-heading">Ranks</h2>
            </div>
            <div className="space-y-2">
              {ranks.map((r) => (
                <Card key={r.id} data-testid="rank-item" className="bg-[#181F2C] border-[#263144] p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{r.rank_name}</div>
                    <div className="text-sm text-slate-400">{r.location}</div>
                  </div>
                  <MapPin className="text-slate-600" size={18} />
                </Card>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <RouteIcon className="text-primary" size={20} />
              <h2 className="text-xl font-bold font-heading">Routes & fares</h2>
            </div>
            <div className="rounded-xl border border-[#263144] overflow-hidden">
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#121721] text-slate-400 text-xs uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3">Rank</th>
                      <th className="text-left px-4 py-3">Route</th>
                      <th className="text-right px-4 py-3">Fare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((r) => (
                      <tr key={r.id} data-testid="route-row" className="border-t border-[#263144]">
                        <td className="px-4 py-3 text-slate-300">{r.rank_name}</td>
                        <td className="px-4 py-3 text-white">{r.route}</td>
                        <td className="px-4 py-3 text-right font-mono text-primary">{r.fare_label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
