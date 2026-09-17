import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  QrCode, Download, Printer, RefreshCw, Plus, Megaphone, Trash2,
  MapPin, Users, Save, CheckCircle2, AlertCircle, SkipForward,
} from "lucide-react";
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
  const [manifestOpen, setManifestOpen] = useState(false);
  const [currentTaxi, setCurrentTaxi] = useState(null);
  const [manifestPax, setManifestPax] = useState([]);
  const [savingManifest, setSavingManifest] = useState(false);

  // Skip taxi state
  const [skipOpen, setSkipOpen] = useState(false);
  const [skipTaxi, setSkipTaxi] = useState(null);
  const [skipReason, setSkipReason] = useState("");
  const [skipping, setSkipping] = useState(false);

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

  const openSkipModal = (entry) => {
    setSkipTaxi(entry);
    setSkipReason("");
    setSkipOpen(true);
  };

  const submitSkip = async () => {
    if (!skipTaxi) return;
    if (!skipReason.trim()) {
      toast.error("Please provide a reason for skipping this taxi.");
      return;
    }
    setSkipping(true);
    try {
      await api.post("/marshal/queue/skip", {
        registration: skipTaxi.taxi_registration,
        reason: skipReason.trim(),
      });
      setSkipOpen(false);
      setResult({
        type: "success",
        title: "Taxi Skipped in Queue",
        message: `Taxi ${skipTaxi.taxi_registration} was moved back 1 position. An in-app notification with your reason was sent to the driver.`,
      });
      qc.invalidateQueries({ queryKey: ["m-queue"] });
    } catch (e) {
      setResult({ type: "error", title: "Cannot skip taxi", message: apiError(e) });
    } finally {
      setSkipping(false);
    }
  };

  const runDepart = async (registration, paxList) => {
    try {
      const payload = { registration };
      if (paxList) payload.long_distance_passengers = paxList.filter((p) => p.name.trim());
      const { data } = await api.post("/marshal/queue/depart", payload);
      setManifestOpen(false);
      setResult({ type: "success", title: "Taxi departed", message: `Trip recorded. Revenue R${data.revenue} added to owner totals.` });
      qc.invalidateQueries({ queryKey: ["m-queue"] });
    } catch (e) {
      setResult({ type: "error", title: "Cannot depart", message: apiError(e) });
    }
  };

  const openManifest = (entry) => {
    setCurrentTaxi(entry);
    const existing = entry.long_distance_passengers || [];
    if (existing.length > 0) {
      setManifestPax(
        existing.map((p) => ({
          name: p.name || "",
          kin_name: p.kin_name || p.next_of_kin || "",
          kin_contact: p.kin_contact || p.contact || "",
          destination: p.destination || "",
        }))
      );
    } else {
      setManifestPax([{ name: "", kin_name: "", kin_contact: "", destination: "" }]);
    }
    setManifestOpen(true);
  };

  const saveManifest = async (showToast = true) => {
    if (!currentTaxi) return false;
    const validPax = manifestPax.filter((p) => p.name.trim());
    if (validPax.length === 0) {
      toast.error("Please enter at least one passenger name.");
      return false;
    }
    setSavingManifest(true);
    try {
      await api.post("/marshal/long-distance/save", {
        registration: currentTaxi.taxi_registration,
        passengers: validPax,
      });
      if (showToast) toast.success(`Saved manifest for ${currentTaxi.taxi_registration} (${validPax.length} passengers).`);
      qc.invalidateQueries({ queryKey: ["m-queue"] });
      return true;
    } catch (e) {
      toast.error(apiError(e));
      return false;
    } finally {
      setSavingManifest(false);
    }
  };

  const departFromManifest = async () => {
    if (!currentTaxi) return;
    const validPax = manifestPax.filter((p) => p.name.trim());
    if (validPax.length === 0) {
      toast.error("Please enter at least one passenger name before departing.");
      return;
    }
    const saved = await saveManifest(false);
    if (!saved) return;
    await runDepart(currentTaxi.taxi_registration, validPax);
  };

  const onDepart = (entry) => {
    if (entry.long_distance) {
      if (entry.long_distance_passengers && entry.long_distance_passengers.length > 0) {
        runDepart(entry.taxi_registration, entry.long_distance_passengers);
      } else {
        openManifest(entry);
      }
    } else {
      runDepart(entry.taxi_registration, null);
    }
  };

  const quickFillSeats = () => {
    if (!currentTaxi) return;
    const targetSeats = currentTaxi.seats || 15;
    const currentList = [...manifestPax];
    while (currentList.length < targetSeats) {
      currentList.push({ name: "", kin_name: "", kin_contact: "", destination: "" });
    }
    setManifestPax(currentList);
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

            {queue.filter((e) => e.long_distance).length > 0 && (
              <Card className="bg-gradient-to-r from-amber-950/40 via-[#181F2C] to-[#181F2C] border-amber-500/40 p-4 rounded-xl shadow-md" data-testid="marshal-long-distance-banner">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <AlertCircle size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base">Long-Distance Trip in Queue</h3>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[11px]">Action Required</Badge>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Driver joined under a long-distance route. Capture passenger names and next-of-kin contacts for emergency SOS protection before departure.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {queue.filter((e) => e.long_distance).map((t) => (
                      <Button
                        key={t.id}
                        size="sm"
                        onClick={() => openManifest(t)}
                        data-testid={`marshal-banner-manifest-btn-${t.taxi_registration.replace(/\s+/g, '-')}`}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs h-9 gap-1.5 shadow"
                      >
                        <Users size={15} /> Capture Passengers ({t.taxi_registration})
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

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
                        <td className="px-4 py-3 font-mono text-white font-semibold">{e.taxi_registration}</td>
                        <td className="px-4 py-3 text-slate-300">{e.driver_name}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {e.route}
                          {e.long_distance && <Badge className="ml-2 bg-primary/15 text-primary border-primary/30 text-[9px]">LD</Badge>}
                          {e.long_distance && (
                            e.long_distance_passengers?.length > 0 ? (
                              <Badge className="ml-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px]">
                                {e.long_distance_passengers.length} pax saved
                              </Badge>
                            ) : (
                              <Badge className="ml-1.5 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                                Manifest pending
                              </Badge>
                            )
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-primary">{e.fare_label}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {e.long_distance && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openManifest(e)}
                                data-testid={`marshal-manifest-btn-${e.taxi_registration.replace(/\s+/g, '-')}`}
                                className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs h-8 gap-1"
                              >
                                <Users size={13} /> {e.long_distance_passengers?.length > 0 ? "Edit Pax" : "Capture Pax"}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openSkipModal(e)}
                              data-testid={`marshal-skip-btn-${e.taxi_registration.replace(/\s+/g, '-')}`}
                              className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs h-8 gap-1"
                              title="Skip taxi in queue and notify driver"
                            >
                              <SkipForward size={13} /> Skip
                            </Button>
                            <Button size="sm" onClick={() => onDepart(e)} data-testid="marshal-depart-btn" className="bg-primary text-black hover:bg-primary/90 text-xs h-8">Depart</Button>
                          </div>
                        </td>
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
      <Dialog open={manifestOpen} onOpenChange={setManifestOpen}>
        <DialogContent className="bg-[#181F2C] border-[#263144] max-w-4xl" data-testid="marshal-manifest-dialog">
          <DialogHeader>
            <DialogTitle className="text-white font-heading flex items-center justify-between gap-2 flex-wrap">
              <span>Long-Distance Passenger Manifest — <span className="text-primary font-mono">{currentTaxi?.taxi_registration}</span></span>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">
                {manifestPax.filter((p) => p.name.trim()).length} / {currentTaxi?.seats || 15} Seats Recorded
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Route: <span className="text-white font-medium">{currentTaxi?.route}</span> · Driver: <span className="text-white font-medium">{currentTaxi?.driver_name}</span>.
              This passenger manifest is immediately synchronized to the owner for emergency SOS protection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
              <div className="text-xs text-slate-400">
                Ensure passenger names, next-of-kin names, and contact phone numbers are captured.
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={quickFillSeats}
                  data-testid="marshal-quick-fill-btn"
                  className="border-[#334155] text-slate-300 hover:text-white text-xs h-8"
                >
                  Fill to Capacity ({currentTaxi?.seats || 15} seats)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setManifestPax([...manifestPax, { name: "", kin_name: "", kin_contact: "", destination: "" }])}
                  data-testid="marshal-add-row-btn"
                  className="border-[#334155] text-slate-300 hover:text-white text-xs h-8 gap-1"
                >
                  <Plus size={13} /> Add Row
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-[#263144] overflow-hidden max-h-[50vh] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121721] text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center">#</th>
                    <th className="px-3 py-2.5">Passenger Name *</th>
                    <th className="px-3 py-2.5">Next of Kin Name *</th>
                    <th className="px-3 py-2.5">Next of Kin Contact *</th>
                    <th className="px-3 py-2.5">Destination</th>
                    <th className="px-2 py-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263144]">
                  {manifestPax.map((p, i) => (
                    <tr key={i} className="hover:bg-[#1f2937]/50">
                      <td className="px-3 py-2 text-center font-mono text-slate-400 font-bold">{i + 1}</td>
                      <td className="px-2 py-1.5">
                        <Input
                          placeholder="e.g. Sipho Khumalo"
                          value={p.name}
                          onChange={(e) => {
                            const c = [...manifestPax];
                            c[i].name = e.target.value;
                            setManifestPax(c);
                          }}
                          className="h-9 bg-[#0A0D14] border-[#263144] text-white text-xs font-medium"
                          data-testid={`manifest-pax-name-${i}`}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          placeholder="e.g. Nomsa Khumalo"
                          value={p.kin_name}
                          onChange={(e) => {
                            const c = [...manifestPax];
                            c[i].kin_name = e.target.value;
                            setManifestPax(c);
                          }}
                          className="h-9 bg-[#0A0D14] border-[#263144] text-white text-xs"
                          data-testid={`manifest-pax-kin-name-${i}`}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          placeholder="e.g. 082 345 6789"
                          value={p.kin_contact}
                          onChange={(e) => {
                            const c = [...manifestPax];
                            c[i].kin_contact = e.target.value;
                            setManifestPax(c);
                          }}
                          className="h-9 bg-[#0A0D14] border-[#263144] text-white text-xs font-mono"
                          data-testid={`manifest-pax-kin-contact-${i}`}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          placeholder="e.g. Johannesburg"
                          value={p.destination}
                          onChange={(e) => {
                            const c = [...manifestPax];
                            c[i].destination = e.target.value;
                            setManifestPax(c);
                          }}
                          className="h-9 bg-[#0A0D14] border-[#263144] text-white text-xs"
                          data-testid={`manifest-pax-destination-${i}`}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const c = manifestPax.filter((_, idx) => idx !== i);
                            setManifestPax(c.length > 0 ? c : [{ name: "", kin_name: "", kin_contact: "", destination: "" }]);
                          }}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 pt-2 border-t border-[#263144]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setManifestOpen(false)}
              className="border-[#334155] text-slate-300"
            >
              Close
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => saveManifest(true)}
                disabled={savingManifest || !manifestPax.some((p) => p.name.trim())}
                data-testid="marshal-save-manifest-btn"
                className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
              >
                <Save size={15} /> {savingManifest ? "Saving…" : "Save Manifest"}
              </Button>
              <Button
                type="button"
                onClick={departFromManifest}
                disabled={savingManifest || !manifestPax.some((p) => p.name.trim())}
                data-testid="marshal-save-depart-btn"
                className="bg-primary text-black hover:bg-primary/90 gap-1.5"
              >
                <CheckCircle2 size={15} /> Save & Depart
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Taxi Modal */}
      <Dialog open={skipOpen} onOpenChange={setSkipOpen}>
        <DialogContent className="bg-[#181F2C] border-[#263144] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <SkipForward size={20} /> Skip Taxi in Queue
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Moving <span className="font-mono font-bold text-white">{skipTaxi?.taxi_registration}</span> ({skipTaxi?.driver_name}) back 1 position in queue. The driver will receive an in-app notification with your reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-slate-300 mb-1 block">
                Reason for skipping (e.g. Taxi not at rank, driver away, vehicle issue) *
              </Label>
              <Textarea
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="Enter the reason why this taxi is being skipped..."
                className="bg-[#0A0D14] border-[#263144] text-white text-sm min-h-[90px]"
                data-testid="marshal-skip-reason-input"
              />
            </div>
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-300/90">
              ⚠️ The next taxi in line will advance to position #{skipTaxi?.position}, and this taxi will be bumped down one spot.
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-[#263144]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSkipOpen(false)}
              className="border-[#334155] text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitSkip}
              disabled={skipping || !skipReason.trim()}
              data-testid="marshal-confirm-skip-btn"
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-1.5"
            >
              {skipping ? "Skipping…" : "Skip & Notify Driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResultModal result={result} onClose={() => setResult(null)} />
    </div>
  );
}
