import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QrCode, Download, Printer, RefreshCw, Plus, Megaphone, Trash2, MapPin } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { api, apiError } from "@/lib/api";
import { ResultModal } from "@/components/ResultModal";
import { toast } from "sonner";

export default function MarshalDashboard() {
  const qc = useQueryClient();
  const [reg, setReg] = useState("");
  const [result, setResult] = useState(null);
  const [fareRoute, setFareRoute] = useState("");
  const [newFare, setNewFare] = useState("");
  const [post, setPost] = useState({ title: "", message: "" });
  const [departOpen, setDepartOpen] = useState(false);
  const [departReg, setDepartReg] = useState("");
  const [departPax, setDepartPax] = useState([{ name: "", contact: "", destination: "" }]);

  const rankQ = useQuery({ queryKey: ["m-rank"], queryFn: async () => (await api.get("/marshal/rank")).data, refetchInterval: 5000 });
  const queueQ = useQuery({ queryKey: ["m-queue"], queryFn: async () => (await api.get("/marshal/queue")).data, refetchInterval: 3000 });
  const routesQ = useQuery({ queryKey: ["m-routes"], queryFn: async () => (await api.get("/marshal/routes")).data });
  const updatesQ = useQuery({ queryKey: ["m-updates"], queryFn: async () => (await api.get("/marshal/updates")).data });
  const qrQ = useQuery({ queryKey: ["m-qr"], queryFn: async () => (await api.get("/marshal/qr")).data });

  const addTaxi = async () => {
    if (!reg.trim()) return;
    try {
      await api.post("/marshal/queue/add", { registration: reg.trim() });
      setResult({ type: "success", title: "Taxi added", message: `${reg.trim()} added to the queue.` });
      setReg("");
      qc.invalidateQueries({ queryKey: ["m-queue"] });
    } catch (e) {
      setResult({ type: "error", title: "Cannot add taxi", message: apiError(e) });
    }
  };

  const runDepart = async (registration, paxList) => {
    try {
      const payload = { registration };
      if (paxList) payload.long_distance_passengers = paxList.filter((p) => p.name.trim());
      const { data } = await api.post("/marshal/queue/depart", payload);
      setDepartOpen(false);
      setDepartPax([{ name: "", contact: "", destination: "" }]);
      setResult({ type: "success", title: "Taxi departed", message: `Trip recorded. Revenue R${data.revenue} added to owner totals.` });
      qc.invalidateQueries({ queryKey: ["m-queue"] });
    } catch (e) {
      setResult({ type: "error", title: "Cannot depart", message: apiError(e) });
    }
  };

  const onDepart = (entry) => {
    if (entry.long_distance) { setDepartReg(entry.taxi_registration); setDepartOpen(true); }
    else runDepart(entry.taxi_registration, null);
  };

  const updateFare = async () => {
    if (!fareRoute || !newFare) { toast.error("Choose a route and fare."); return; }
    try {
      await api.post("/marshal/fare", { route: fareRoute, fare: newFare });
      toast.success("Fare updated");
      setNewFare("");
      qc.invalidateQueries({ queryKey: ["m-routes"] });
    } catch (e) { toast.error(apiError(e)); }
  };

  const createPost = async () => {
    if (!post.title.trim() || !post.message.trim()) { toast.error("Add a title and message."); return; }
    try {
      await api.post("/marshal/updates", { ...post, status: "Active" });
      toast.success("Update posted");
      setPost({ title: "", message: "" });
      qc.invalidateQueries({ queryKey: ["m-updates"] });
    } catch (e) { toast.error(apiError(e)); }
  };

  const delPost = async (id) => {
    await api.delete(`/marshal/updates/${id}`);
    qc.invalidateQueries({ queryKey: ["m-updates"] });
  };

  const toggleGeo = async (v) => {
    try {
      await api.post("/marshal/geo-check", { enabled: v });
      qc.invalidateQueries({ queryKey: ["m-rank"] });
      qc.invalidateQueries({ queryKey: ["m-qr"] });
      toast.success(`Geo-check ${v ? "on" : "off"}`);
    } catch (e) { toast.error(apiError(e)); }
  };

  const regenQr = async () => {
    try {
      await api.post("/marshal/qr/regenerate");
      qc.invalidateQueries({ queryKey: ["m-qr"] });
      toast.success("QR regenerated");
    } catch (e) { toast.error(apiError(e)); }
  };

  const downloadQr = () => {
    const a = document.createElement("a");
    a.href = qrQ.data.image;
    a.download = `erank-qr-${qrQ.data.rank_name}.png`;
    a.click();
  };

  const printQr = () => {
    const w = window.open("");
    w.document.write(`<img src="${qrQ.data.image}" style="width:320px"/><h2 style="font-family:sans-serif">${qrQ.data.rank_name} — E-RANK</h2>`);
    w.document.close();
    w.print();
  };

  const rank = rankQ.data;
  const queue = queueQ.data || [];

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold font-heading">{rank?.rank_name || "Rank"} control</h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1"><MapPin size={14} /> {rank?.location}</p>
          </div>
          <Card className="bg-[#181F2C] border-[#263144] px-4 py-2 flex items-center gap-3" data-testid="geo-toggle-card">
            <div>
              <div className="text-sm font-medium">Geo-check (20m)</div>
              <div className="text-[11px] text-slate-400">Require drivers near the rank</div>
            </div>
            <Switch checked={!!rank?.geo_check_enabled} onCheckedChange={toggleGeo} data-testid="geo-toggle" />
          </Card>
        </div>

        <Tabs defaultValue="queue">
          <TabsList className="bg-[#121721] border border-[#263144]">
            <TabsTrigger value="queue" data-testid="tab-queue">Queue</TabsTrigger>
            <TabsTrigger value="fares" data-testid="tab-fares">Fares</TabsTrigger>
            <TabsTrigger value="updates" data-testid="tab-updates">Updates</TabsTrigger>
            <TabsTrigger value="qr" data-testid="tab-qr">QR</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-4 pt-4">
            <Card className="bg-[#181F2C] border-[#263144] p-4">
              <Label className="text-slate-300 text-sm">Add taxi by registration</Label>
              <div className="flex gap-2 mt-2">
                <Input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="e.g. MT 004 GP" data-testid="marshal-reg-input" className="h-11 bg-[#0A0D14] border-[#263144] text-white font-mono" />
                <Button onClick={addTaxi} data-testid="marshal-add-btn" className="h-11 bg-primary text-black hover:bg-primary/90 gap-1"><Plus size={16} /> Add</Button>
              </div>
            </Card>
            <div className="rounded-xl border border-[#263144] overflow-hidden">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#121721] text-slate-400 text-xs uppercase tracking-wider">
                    <tr><th className="px-4 py-3 text-left">#</th><th className="px-4 py-3 text-left">Taxi</th><th className="px-4 py-3 text-left">Driver</th><th className="px-4 py-3 text-left">Route</th><th className="px-4 py-3 text-right">Fare</th><th className="px-4 py-3 text-right">Action</th></tr>
                  </thead>
                  <tbody>
                    {queue.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Queue is empty</td></tr>}
                    {queue.map((e) => (
                      <tr key={e.id} data-testid="queue-row" className="border-t border-[#263144]">
                        <td className="px-4 py-3 font-mono text-emerald-400 font-bold">#{e.position}</td>
                        <td className="px-4 py-3 font-mono text-white">{e.taxi_registration}</td>
                        <td className="px-4 py-3 text-slate-300">{e.driver_name}</td>
                        <td className="px-4 py-3 text-slate-300">{e.route}{e.long_distance && <Badge className="ml-2 bg-primary/15 text-primary border-primary/30 text-[9px]">LD</Badge>}</td>
                        <td className="px-4 py-3 text-right font-mono text-primary">{e.fare_label}</td>
                        <td className="px-4 py-3 text-right"><Button size="sm" onClick={() => onDepart(e)} data-testid="marshal-depart-btn" className="bg-primary text-black hover:bg-primary/90 text-xs h-8">Depart</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fares" className="pt-4">
            <Card className="bg-[#181F2C] border-[#263144] p-5 max-w-lg space-y-3">
              <Label className="text-slate-300 text-sm">Update route fare</Label>
              <Select value={fareRoute} onValueChange={setFareRoute}>
                <SelectTrigger data-testid="fare-route-select" className="h-11 bg-[#0A0D14] border-[#263144] text-white"><SelectValue placeholder="Choose route" /></SelectTrigger>
                <SelectContent className="bg-[#181F2C] border-[#263144] text-white">
                  {(routesQ.data || []).map((r) => <SelectItem key={r.id} value={r.route}>{r.route} ({r.fare_label})</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input value={newFare} onChange={(e) => setNewFare(e.target.value)} placeholder="New fare e.g. 28" data-testid="fare-input" className="h-11 bg-[#0A0D14] border-[#263144] text-white" />
                <Button onClick={updateFare} data-testid="fare-update-btn" className="h-11 bg-primary text-black hover:bg-primary/90">Update</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="updates" className="pt-4 space-y-4">
            <Card className="bg-[#181F2C] border-[#263144] p-5 max-w-2xl space-y-3">
              <Label className="text-slate-300 text-sm">Post a rank update</Label>
              <Input value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} placeholder="Title" data-testid="update-title-input" className="h-11 bg-[#0A0D14] border-[#263144] text-white" />
              <Textarea value={post.message} onChange={(e) => setPost({ ...post, message: e.target.value })} placeholder="Message" data-testid="update-message-input" className="bg-[#0A0D14] border-[#263144] text-white" />
              <Button onClick={createPost} data-testid="post-update-btn" className="bg-primary text-black hover:bg-primary/90 gap-2"><Megaphone size={16} /> Post update</Button>
            </Card>
            <div className="space-y-2">
              {(updatesQ.data || []).map((u) => (
                <Card key={u.id} className="bg-[#181F2C] border-[#263144] p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2"><h3 className="font-semibold text-white text-sm">{u.title}</h3><Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">{u.status}</Badge></div>
                    <p className="text-sm text-slate-400 mt-1">{u.message}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => delPost(u.id)} data-testid="delete-update-btn" className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="qr" className="pt-4">
            <Card className="bg-[#181F2C] border-[#263144] p-6 max-w-md text-center">
              <div className="flex items-center justify-center gap-2 mb-2 text-slate-300"><QrCode size={18} /> Rank check-in QR</div>
              {qrQ.data && (
                <>
                  <div className="bg-white rounded-xl p-4 inline-block"><img src={qrQ.data.image} alt="Rank QR" width={220} height={220} data-testid="qr-image" /></div>
                  <div className="text-xs text-slate-500 mt-3 break-all">{qrQ.data.url}</div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <Button variant="outline" onClick={downloadQr} data-testid="qr-download-btn" className="border-[#334155] text-slate-200 gap-1"><Download size={14} /> Save</Button>
                    <Button variant="outline" onClick={printQr} data-testid="qr-print-btn" className="border-[#334155] text-slate-200 gap-1"><Printer size={14} /> Print</Button>
                    <Button variant="outline" onClick={regenQr} data-testid="qr-regen-btn" className="border-[#334155] text-slate-200 gap-1"><RefreshCw size={14} /> New</Button>
                  </div>
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Dialog open={departOpen} onOpenChange={setDepartOpen}>
        <DialogContent className="bg-[#181F2C] border-[#263144] max-w-lg" data-testid="marshal-depart-dialog">
          <DialogHeader>
            <DialogTitle className="text-white font-heading">Long-distance passengers — {departReg}</DialogTitle>
            <DialogDescription className="text-slate-400">Required before departing a long-distance taxi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-auto">
            {departPax.map((p, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <Input placeholder="Name" value={p.name} onChange={(ev) => { const c = [...departPax]; c[i].name = ev.target.value; setDepartPax(c); }} data-testid={`m-pax-name-${i}`} className="bg-[#0A0D14] border-[#263144] text-white" />
                <Input placeholder="Contact" value={p.contact} onChange={(ev) => { const c = [...departPax]; c[i].contact = ev.target.value; setDepartPax(c); }} className="bg-[#0A0D14] border-[#263144] text-white" />
                <Input placeholder="Destination" value={p.destination} onChange={(ev) => { const c = [...departPax]; c[i].destination = ev.target.value; setDepartPax(c); }} className="bg-[#0A0D14] border-[#263144] text-white" />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setDepartPax([...departPax, { name: "", contact: "", destination: "" }])} className="border-[#334155] text-slate-200 gap-1"><Plus size={14} /> Add passenger</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepartOpen(false)} className="border-[#334155] text-slate-200">Cancel</Button>
            <Button onClick={() => runDepart(departReg, departPax)} disabled={!departPax.some((p) => p.name.trim())} data-testid="m-confirm-depart-btn" className="bg-primary text-black hover:bg-primary/90">Confirm & depart</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResultModal result={result} onClose={() => setResult(null)} />
    </div>
  );
}
