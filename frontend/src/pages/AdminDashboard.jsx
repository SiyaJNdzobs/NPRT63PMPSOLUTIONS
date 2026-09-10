import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ShieldCheck, AlertTriangle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { api, apiError } from "@/lib/api";
import { ResultModal } from "@/components/ResultModal";
import { toast } from "sonner";

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [result, setResult] = useState(null);

  const overview = useQuery({ queryKey: ["a-ov"], queryFn: async () => (await api.get("/admin/overview")).data, refetchInterval: 6000 });
  const ranks = useQuery({ queryKey: ["a-ranks"], queryFn: async () => (await api.get("/public/ranks")).data });
  const routes = useQuery({ queryKey: ["a-routes"], queryFn: async () => (await api.get("/public/routes")).data });
  const owners = useQuery({ queryKey: ["a-owners"], queryFn: async () => (await api.get("/admin/users/owner")).data });
  const marshals = useQuery({ queryKey: ["a-marshals"], queryFn: async () => (await api.get("/admin/users/marshal")).data });
  const drivers = useQuery({ queryKey: ["a-drivers"], queryFn: async () => (await api.get("/admin/users/driver")).data });
  const taxis = useQuery({ queryKey: ["a-taxis"], queryFn: async () => (await api.get("/admin/taxis")).data });
  const queue = useQuery({ queryKey: ["a-queue"], queryFn: async () => (await api.get("/admin/queue")).data, refetchInterval: 4000 });
  const ops = useQuery({ queryKey: ["a-ops"], queryFn: async () => (await api.get("/admin/operations")).data, refetchInterval: 6000 });
  const sos = useQuery({ queryKey: ["a-sos"], queryFn: async () => (await api.get("/admin/sos")).data, refetchInterval: 6000 });

  const invalidate = (...keys) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const [rankForm, setRankForm] = useState({ rank_name: "", location: "" });
  const [routeForm, setRouteForm] = useState({ rank_name: "", route: "", fare: "" });
  const [ownerForm, setOwnerForm] = useState({ full_name: "", email: "", cell_phone: "", rank_name: "", pin: "123456" });
  const [marshalForm, setMarshalForm] = useState({ full_name: "", cell_phone: "", rank_name: "", pin: "123456789" });

  const createRank = async () => { try { await api.post("/admin/ranks", rankForm); toast.success("Rank added"); setRankForm({ rank_name: "", location: "" }); invalidate("a-ranks", "a-ov"); } catch (e) { toast.error(apiError(e)); } };
  const createRoute = async () => { try { await api.post("/admin/routes", routeForm); toast.success("Route added"); setRouteForm({ rank_name: "", route: "", fare: "" }); invalidate("a-routes", "a-ov"); } catch (e) { toast.error(apiError(e)); } };
  const createOwner = async () => { try { await api.post("/admin/owners", ownerForm); setResult({ type: "success", title: "Owner added", message: `${ownerForm.full_name} can sign in with PIN ${ownerForm.pin}.` }); setOwnerForm({ full_name: "", email: "", cell_phone: "", rank_name: "", pin: "123456" }); invalidate("a-owners", "a-ov"); } catch (e) { setResult({ type: "error", title: "Cannot add owner", message: apiError(e) }); } };
  const createMarshal = async () => { try { await api.post("/admin/marshals", marshalForm); setResult({ type: "success", title: "Marshal added", message: `${marshalForm.full_name} can sign in with PIN ${marshalForm.pin}.` }); setMarshalForm({ full_name: "", cell_phone: "", rank_name: "", pin: "123456789" }); invalidate("a-marshals", "a-ov"); } catch (e) { setResult({ type: "error", title: "Cannot add marshal", message: apiError(e) }); } };
  const delUser = async (id) => { try { await api.delete(`/admin/users/${id}`); toast.success("Removed"); invalidate("a-owners", "a-marshals", "a-ov"); } catch (e) { toast.error(apiError(e)); } };
  const delRank = async (id) => { await api.delete(`/admin/ranks/${id}`); invalidate("a-ranks", "a-ov"); };
  const delRoute = async (id) => { await api.delete(`/admin/routes/${id}`); invalidate("a-routes", "a-ov"); };

  const ov = overview.data || {};
  const rankOptions = (ranks.data || []).map((r) => r.rank_name);

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-2xl font-extrabold font-heading">Admin control center</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[["Owners", ov.owners], ["Marshals", ov.marshals], ["Drivers", ov.drivers], ["Taxis", ov.taxis], ["Ranks", ov.ranks], ["Routes", ov.routes], ["In queue", ov.active_queue], ["Trips", ov.operations]].map(([l, v]) => (
            <Card key={l} className="bg-[#181F2C] border-[#263144] p-3 text-center">
              <div className="text-2xl font-extrabold font-mono text-primary">{v ?? 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">{l}</div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="ranks">
          <TabsList className="bg-[#121721] border border-[#263144] flex-wrap h-auto">
            {["ranks", "routes", "owners", "marshals", "drivers", "taxis", "queue", "operations", "sos"].map((t) => (
              <TabsTrigger key={t} value={t} data-testid={`admin-tab-${t}`} className="capitalize">{t}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="ranks" className="pt-4 space-y-4">
            <Card className="bg-[#181F2C] border-[#263144] p-4 flex flex-wrap gap-2 items-end">
              <Inline label="Rank name" v={rankForm.rank_name} on={(v) => setRankForm({ ...rankForm, rank_name: v })} testid="rank-name" />
              <Inline label="Location" v={rankForm.location} on={(v) => setRankForm({ ...rankForm, location: v })} testid="rank-location" />
              <Button onClick={createRank} data-testid="create-rank-btn" className="bg-primary text-black gap-1 h-10"><Plus size={14} /> Add rank</Button>
            </Card>
            <Grid items={ranks.data} render={(r) => (
              <Card key={r.id} data-testid="admin-rank-card" className="bg-[#181F2C] border-[#263144] p-4 flex items-center justify-between">
                <div><div className="font-semibold text-white">{r.rank_name}</div><div className="text-sm text-slate-400">{r.location}</div></div>
                <Button size="icon" variant="ghost" onClick={() => delRank(r.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></Button>
              </Card>
            )} />
          </TabsContent>

          <TabsContent value="routes" className="pt-4 space-y-4">
            <Card className="bg-[#181F2C] border-[#263144] p-4 flex flex-wrap gap-2 items-end">
              <SelInline label="Rank" v={routeForm.rank_name} on={(v) => setRouteForm({ ...routeForm, rank_name: v })} options={rankOptions} testid="route-rank" />
              <Inline label="Route" v={routeForm.route} on={(v) => setRouteForm({ ...routeForm, route: v })} testid="route-name" />
              <Inline label="Fare" v={routeForm.fare} on={(v) => setRouteForm({ ...routeForm, fare: v })} testid="route-fare" />
              <Button onClick={createRoute} data-testid="create-route-btn" className="bg-primary text-black gap-1 h-10"><Plus size={14} /> Add route</Button>
            </Card>
            <TableWrap head={["Rank", "Route", "Fare", ""]}>
              {(routes.data || []).map((r) => (
                <tr key={r.id} data-testid="admin-route-row" className="border-t border-[#263144]">
                  <td className="px-4 py-3 text-slate-300">{r.rank_name}</td>
                  <td className="px-4 py-3 text-white">{r.route}</td>
                  <td className="px-4 py-3 font-mono text-primary">{r.fare_label}</td>
                  <td className="px-4 py-3 text-right"><Button size="icon" variant="ghost" onClick={() => delRoute(r.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></Button></td>
                </tr>
              ))}
            </TableWrap>
          </TabsContent>

          <TabsContent value="owners" className="pt-4 space-y-4">
            <Card className="bg-[#181F2C] border-[#263144] p-4 flex flex-wrap gap-2 items-end">
              <Inline label="Full name" v={ownerForm.full_name} on={(v) => setOwnerForm({ ...ownerForm, full_name: v })} testid="owner-name" />
              <Inline label="Email" v={ownerForm.email} on={(v) => setOwnerForm({ ...ownerForm, email: v })} testid="owner-email" />
              <Inline label="Cell" v={ownerForm.cell_phone} on={(v) => setOwnerForm({ ...ownerForm, cell_phone: v })} testid="owner-cell" />
              <SelInline label="Rank" v={ownerForm.rank_name} on={(v) => setOwnerForm({ ...ownerForm, rank_name: v })} options={rankOptions} testid="owner-rank" />
              <Button onClick={createOwner} data-testid="create-owner-btn" className="bg-primary text-black gap-1 h-10"><Plus size={14} /> Add owner</Button>
            </Card>
            <UserTable users={owners.data} onDelete={delUser} showEmail testid="admin-owner-row" />
          </TabsContent>

          <TabsContent value="marshals" className="pt-4 space-y-4">
            <Card className="bg-[#181F2C] border-[#263144] p-4 flex flex-wrap gap-2 items-end">
              <Inline label="Full name" v={marshalForm.full_name} on={(v) => setMarshalForm({ ...marshalForm, full_name: v })} testid="marshal-name" />
              <Inline label="Cell" v={marshalForm.cell_phone} on={(v) => setMarshalForm({ ...marshalForm, cell_phone: v })} testid="marshal-cell" />
              <SelInline label="Rank" v={marshalForm.rank_name} on={(v) => setMarshalForm({ ...marshalForm, rank_name: v })} options={rankOptions} testid="marshal-rank" />
              <Button onClick={createMarshal} data-testid="create-marshal-btn" className="bg-primary text-black gap-1 h-10"><Plus size={14} /> Add marshal</Button>
            </Card>
            <UserTable users={marshals.data} onDelete={delUser} testid="admin-marshal-row" />
          </TabsContent>

          <TabsContent value="drivers" className="pt-4">
            <TableWrap head={["Driver", "Cell", "Owner", "Taxi", "Rank"]}>
              {(drivers.data || []).map((d) => (
                <tr key={d.id} data-testid="admin-driver-row" className="border-t border-[#263144]">
                  <td className="px-4 py-3 text-white">{d.full_name}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{d.cell_phone}</td>
                  <td className="px-4 py-3 text-slate-300">{d.owner_name}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{d.taxi_registration}</td>
                  <td className="px-4 py-3 text-slate-300">{d.rank_name}</td>
                </tr>
              ))}
            </TableWrap>
          </TabsContent>

          <TabsContent value="taxis" className="pt-4">
            <TableWrap head={["Taxi", "Owner", "Driver", "Rank", "Route", "Fare", "Status"]}>
              {(taxis.data || []).map((t) => (
                <tr key={t.id} data-testid="admin-taxi-row" className="border-t border-[#263144]">
                  <td className="px-4 py-3 font-mono text-white">{t.registration}</td>
                  <td className="px-4 py-3 text-slate-300">{t.owner_name}</td>
                  <td className="px-4 py-3 text-slate-300">{t.driver_name}</td>
                  <td className="px-4 py-3 text-slate-300">{t.rank_name}</td>
                  <td className="px-4 py-3 text-slate-300">{t.route}</td>
                  <td className="px-4 py-3 font-mono text-primary">{t.fare_label}</td>
                  <td className="px-4 py-3">{t.active_queue ? <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Queue</Badge> : <Badge className="bg-slate-500/15 text-slate-300 border-slate-500/30 text-[10px]">Idle</Badge>}</td>
                </tr>
              ))}
            </TableWrap>
          </TabsContent>

          <TabsContent value="queue" className="pt-4">
            <TableWrap head={["#", "Taxi", "Rank", "Driver", "Route", "Fare"]}>
              {(queue.data || []).map((e, i) => (
                <tr key={e.id} data-testid="admin-queue-row" className="border-t border-[#263144]">
                  <td className="px-4 py-3 font-mono text-emerald-400">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-white">{e.taxi_registration}</td>
                  <td className="px-4 py-3 text-slate-300">{e.rank_name}</td>
                  <td className="px-4 py-3 text-slate-300">{e.driver_name}</td>
                  <td className="px-4 py-3 text-slate-300">{e.route}</td>
                  <td className="px-4 py-3 font-mono text-primary">{e.fare_label}</td>
                </tr>
              ))}
            </TableWrap>
          </TabsContent>

          <TabsContent value="operations" className="pt-4">
            <TableWrap head={["Time", "Taxi", "Owner", "Route", "Seats", "Revenue", "LD"]}>
              {(ops.data || []).map((o) => (
                <tr key={o.id} data-testid="admin-op-row" className="border-t border-[#263144]">
                  <td className="px-4 py-3 text-slate-400 text-xs">{(o.departed_at || "").slice(0, 16).replace("T", " ")}</td>
                  <td className="px-4 py-3 font-mono text-white">{o.taxi_registration}</td>
                  <td className="px-4 py-3 text-slate-300">{o.owner_name}</td>
                  <td className="px-4 py-3 text-slate-300">{o.route}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{o.seats}</td>
                  <td className="px-4 py-3 font-mono text-primary">R{o.revenue}</td>
                  <td className="px-4 py-3">{o.long_distance ? "Yes" : "No"}</td>
                </tr>
              ))}
            </TableWrap>
          </TabsContent>

          <TabsContent value="sos" className="pt-4 space-y-3">
            {(sos.data || []).length === 0 && <div className="text-slate-500 text-sm">No SOS events.</div>}
            {(sos.data || []).map((s) => (
              <Card key={s.id} data-testid="admin-sos-row" className="bg-[#181F2C] border-red-900/40 p-4 flex items-center gap-3">
                <AlertTriangle className="text-red-400" size={20} />
                <div className="flex-1">
                  <div className="text-white font-medium">{s.driver_name} · <span className="font-mono">{s.taxi_registration}</span></div>
                  <div className="text-xs text-slate-400">{s.rank_name} · {s.route} · {(s.created_at || "").slice(0, 16).replace("T", " ")}</div>
                </div>
                {s.email_sent ? <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1"><ShieldCheck size={12} /> Emailed</Badge> : <Badge className="bg-slate-500/15 text-slate-300 border-slate-500/30">Logged</Badge>}
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
      <ResultModal result={result} onClose={() => setResult(null)} />
    </div>
  );
}

function Inline({ label, v, on, testid }) {
  return (
    <div className="min-w-[140px] flex-1">
      <Label className="text-slate-400 text-[11px]">{label}</Label>
      <Input value={v} onChange={(e) => on(e.target.value)} data-testid={testid} className="mt-1 h-10 bg-[#0A0D14] border-[#263144] text-white" />
    </div>
  );
}

function SelInline({ label, v, on, options, testid }) {
  return (
    <div className="min-w-[160px] flex-1">
      <Label className="text-slate-400 text-[11px]">{label}</Label>
      <Select value={v} onValueChange={on}>
        <SelectTrigger data-testid={testid} className="mt-1 h-10 bg-[#0A0D14] border-[#263144] text-white"><SelectValue placeholder="Choose" /></SelectTrigger>
        <SelectContent className="bg-[#181F2C] border-[#263144] text-white">
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function Grid({ items, render }) {
  return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{(items || []).map(render)}</div>;
}

function TableWrap({ head, children }) {
  return (
    <div className="rounded-xl border border-[#263144] overflow-hidden">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#121721] text-slate-400 text-xs uppercase tracking-wider">
            <tr>{head.map((h, i) => <th key={i} className="px-4 py-3 text-left">{h}</th>)}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function UserTable({ users, onDelete, showEmail, testid }) {
  return (
    <TableWrap head={showEmail ? ["Name", "Email", "Cell", "Rank", ""] : ["Name", "Cell", "Rank", ""]}>
      {(users || []).map((u) => (
        <tr key={u.id} data-testid={testid} className="border-t border-[#263144]">
          <td className="px-4 py-3 text-white">{u.full_name}</td>
          {showEmail && <td className="px-4 py-3 text-slate-300">{u.email}</td>}
          <td className="px-4 py-3 font-mono text-slate-300">{u.cell_phone}</td>
          <td className="px-4 py-3 text-slate-300">{u.rank_name}</td>
          <td className="px-4 py-3 text-right"><Button size="icon" variant="ghost" onClick={() => onDelete(u.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></Button></td>
        </tr>
      ))}
    </TableWrap>
  );
}
