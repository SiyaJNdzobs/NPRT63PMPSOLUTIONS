import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, Users, Bus, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { api, apiError } from "@/lib/api";
import { ResultModal } from "@/components/ResultModal";
import { toast } from "sonner";

const empty = { registration: "", seats: 15, route: "", fare: "", driver_name: "", driver_cell: "", driver_pin: "" };

export default function OwnerDashboard() {
  const qc = useQueryClient();
  const [result, setResult] = useState(null);
  const [expandedReg, setExpandedReg] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [taxiForm, setTaxiForm] = useState(empty);
  const [replaceReg, setReplaceReg] = useState(null);
  const [drv, setDrv] = useState({ driver_name: "", driver_cell: "", driver_pin: "" });

  const taxisQ = useQuery({ queryKey: ["o-taxis"], queryFn: async () => (await api.get("/owner/taxis")).data, refetchInterval: 5000 });
  const revQ = useQuery({ queryKey: ["o-rev"], queryFn: async () => (await api.get("/owner/revenue")).data, refetchInterval: 5000 });

  const addTaxi = async () => {
    try {
      await api.post("/owner/taxis", taxiForm);
      setAddOpen(false);
      setTaxiForm(empty);
      setResult({ type: "success", title: "Taxi added", message: "The taxi and its driver were created." });
      qc.invalidateQueries({ queryKey: ["o-taxis"] });
    } catch (e) {
      setResult({ type: "error", title: "Cannot add taxi", message: apiError(e) });
    }
  };

  const replaceDriver = async () => {
    try {
      await api.put(`/owner/taxis/${encodeURIComponent(replaceReg)}/driver`, drv);
      setReplaceReg(null);
      setDrv({ driver_name: "", driver_cell: "", driver_pin: "" });
      setResult({ type: "success", title: "Driver replaced", message: "The new driver can now sign in." });
      qc.invalidateQueries({ queryKey: ["o-taxis"] });
    } catch (e) {
      setResult({ type: "error", title: "Cannot replace driver", message: apiError(e) });
    }
  };

  const exportXlsx = async () => {
    try {
      const res = await api.get("/owner/revenue/export", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "erank_revenue.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Revenue exported");
    } catch (e) { toast.error(apiError(e)); }
  };

  const taxis = taxisQ.data || [];
  const rev = revQ.data;

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-2xl font-extrabold font-heading">Owner dashboard</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat icon={Bus} label="Taxis" value={taxis.length} color="text-primary" />
          <Stat icon={Users} label="Drivers" value={taxis.length} color="text-emerald-400" />
          <Stat icon={RandIcon} label="Revenue" value={`R${rev?.total_revenue ?? 0}`} color="text-primary" />
          <Stat icon={RefreshCw} label="Trips" value={rev?.total_trips ?? 0} color="text-cyan-400" />
        </div>

        <Tabs defaultValue="taxis">
          <TabsList className="bg-[#121721] border border-[#263144]">
            <TabsTrigger value="taxis" data-testid="tab-owner-taxis">Taxis & drivers</TabsTrigger>
            <TabsTrigger value="revenue" data-testid="tab-owner-revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="taxis" className="pt-4 space-y-4">
            <div className="flex justify-end">
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="add-taxi-btn" className="bg-primary text-black hover:bg-primary/90 gap-2"><Plus size={16} /> Add taxi</Button>
                </DialogTrigger>
                <DialogContent className="bg-[#181F2C] border-[#263144] max-w-lg" data-testid="add-taxi-dialog">
                  <DialogHeader><DialogTitle className="text-white font-heading">Add taxi (driver required)</DialogTitle></DialogHeader>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Registration" testid="taxi-reg" value={taxiForm.registration} onChange={(v) => setTaxiForm({ ...taxiForm, registration: v })} />
                    <Field label="Seats" testid="taxi-seats" type="number" value={taxiForm.seats} onChange={(v) => setTaxiForm({ ...taxiForm, seats: parseInt(v) || 0 })} />
                    <Field label="Route" testid="taxi-route" value={taxiForm.route} onChange={(v) => setTaxiForm({ ...taxiForm, route: v })} />
                    <Field label="Fare (e.g. 26)" testid="taxi-fare" value={taxiForm.fare} onChange={(v) => setTaxiForm({ ...taxiForm, fare: v })} />
                    <Field label="Driver name" testid="taxi-driver-name" value={taxiForm.driver_name} onChange={(v) => setTaxiForm({ ...taxiForm, driver_name: v })} />
                    <Field label="Driver cell" testid="taxi-driver-cell" value={taxiForm.driver_cell} onChange={(v) => setTaxiForm({ ...taxiForm, driver_cell: v })} />
                    <Field label="Driver PIN" testid="taxi-driver-pin" value={taxiForm.driver_pin} onChange={(v) => setTaxiForm({ ...taxiForm, driver_pin: v })} />
                  </div>
                  <DialogFooter>
                    <Button onClick={addTaxi} data-testid="save-taxi-btn" className="bg-primary text-black hover:bg-primary/90">Save taxi</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="rounded-xl border border-[#263144] overflow-hidden">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#121721] text-slate-400 text-xs uppercase tracking-wider">
                    <tr><th className="px-4 py-3 text-left">Taxi</th><th className="px-4 py-3 text-left">Driver</th><th className="px-4 py-3 text-left">Rank</th><th className="px-4 py-3 text-left">Route</th><th className="px-4 py-3 text-right">Fare</th><th className="px-4 py-3 text-right">Status</th><th className="px-4 py-3"></th></tr>
                  </thead>
                  <tbody>
                    {taxis.map((t) => {
                      const stat = (rev?.per_taxi || []).find((p) => p.registration === t.registration) || { trips: 0, revenue: 0 };
                      const ops = (rev?.operations || []).filter((o) => o.taxi_registration === t.registration).slice(0, 6);
                      const open = expandedReg === t.registration;
                      return (
                        <React.Fragment key={t.id}>
                          <tr data-testid="owner-taxi-row" className="border-t border-[#263144] cursor-pointer hover:bg-[#20293A]" onClick={() => setExpandedReg(open ? null : t.registration)}>
                            <td className="px-4 py-3 font-mono text-white"><span className="inline-flex items-center gap-1">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{t.registration}</span></td>
                            <td className="px-4 py-3 text-slate-300">{t.driver_name}</td>
                            <td className="px-4 py-3 text-slate-300">{t.rank_name}</td>
                            <td className="px-4 py-3 text-slate-300">{t.route}</td>
                            <td className="px-4 py-3 text-right font-mono text-primary">{t.fare_label}</td>
                            <td className="px-4 py-3 text-right">
                              {t.active_queue ? <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">In queue</Badge> : <Badge className="bg-slate-500/15 text-slate-300 border-slate-500/30 text-[10px]">Idle</Badge>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button size="sm" variant="outline" disabled={t.active_queue} onClick={(ev) => { ev.stopPropagation(); setReplaceReg(t.registration); }} data-testid="replace-driver-btn" className="border-[#334155] text-slate-200 text-xs">Replace driver</Button>
                            </td>
                          </tr>
                          {open && (
                            <tr data-testid="owner-taxi-expand" className="bg-[#0A0D14]">
                              <td colSpan={7} className="px-4 py-4">
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                  <div className="rounded-lg bg-[#181F2C] p-3"><div className="text-[11px] uppercase text-slate-400">Trips</div><div className="text-xl font-mono font-bold text-white">{stat.trips}</div></div>
                                  <div className="rounded-lg bg-[#181F2C] p-3"><div className="text-[11px] uppercase text-slate-400">Revenue</div><div className="text-xl font-mono font-bold text-primary">R{stat.revenue}</div></div>
                                  <div className="rounded-lg bg-[#181F2C] p-3"><div className="text-[11px] uppercase text-slate-400">Status</div><div className="text-sm font-semibold text-white mt-1">{t.active_queue ? "In queue" : "Idle"}</div></div>
                                </div>
                                <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">Recent trips</div>
                                {ops.length === 0 ? <div className="text-sm text-slate-500">No trips yet for this taxi.</div> : (
                                  <div className="space-y-1">
                                    {ops.map((o) => (
                                      <div key={o.id} className="flex items-center justify-between text-xs text-slate-300 border-b border-[#1b2434] py-1">
                                        <span>{(o.departed_at || "").slice(0, 16).replace("T", " ")}</span>
                                        <span className="text-slate-400 truncate max-w-[45%]">{o.route}</span>
                                        <span className="font-mono text-primary">R{o.revenue}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-heading">Revenue by taxi</h2>
              <Button onClick={exportXlsx} data-testid="export-revenue-btn" className="bg-emerald-500 text-black hover:bg-emerald-600 gap-2"><Download size={16} /> Export Excel</Button>
            </div>
            <div className="rounded-xl border border-[#263144] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#121721] text-slate-400 text-xs uppercase tracking-wider">
                  <tr><th className="px-4 py-3 text-left">Taxi</th><th className="px-4 py-3 text-right">Trips</th><th className="px-4 py-3 text-right">Revenue</th></tr>
                </thead>
                <tbody>
                  {(rev?.per_taxi || []).length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No trips recorded yet</td></tr>}
                  {(rev?.per_taxi || []).map((r) => (
                    <tr key={r.registration} data-testid="revenue-row" className="border-t border-[#263144]">
                      <td className="px-4 py-3 font-mono text-white">{r.registration}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{r.trips}</td>
                      <td className="px-4 py-3 text-right font-mono text-primary">R{r.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!replaceReg} onOpenChange={(v) => !v && setReplaceReg(null)}>
        <DialogContent className="bg-[#181F2C] border-[#263144]" data-testid="replace-driver-dialog">
          <DialogHeader><DialogTitle className="text-white font-heading">Replace driver for {replaceReg}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="New driver name" testid="replace-name" value={drv.driver_name} onChange={(v) => setDrv({ ...drv, driver_name: v })} />
            <Field label="Cell number" testid="replace-cell" value={drv.driver_cell} onChange={(v) => setDrv({ ...drv, driver_cell: v })} />
            <Field label="Initial PIN" testid="replace-pin" value={drv.driver_pin} onChange={(v) => setDrv({ ...drv, driver_pin: v })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplaceReg(null)} className="border-[#334155] text-slate-200">Cancel</Button>
            <Button onClick={replaceDriver} data-testid="save-replace-btn" className="bg-primary text-black hover:bg-primary/90">Replace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResultModal result={result} onClose={() => setResult(null)} />
    </div>
  );
}

function RandIcon({ className, size = 20 }) {
  return (
    <span
      className={`font-extrabold font-heading leading-none ${className || ""}`}
      style={{ fontSize: size, width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
    >
      R
    </span>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <Card className="bg-[#181F2C] border-[#263144] p-4">
      <Icon className={color} size={20} />
      <div className="text-2xl font-extrabold font-mono mt-2">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
    </Card>
  );
}

function Field({ label, testid, value, onChange, type = "text" }) {
  return (
    <div>
      <Label className="text-slate-300 text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid} className="mt-1 h-10 bg-[#0A0D14] border-[#263144] text-white" />
    </div>
  );
}
