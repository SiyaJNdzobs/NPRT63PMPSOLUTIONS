import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ShieldCheck, AlertTriangle, RefreshCw, KeyRound, Edit2, RotateCcw, Crown, Check } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ResultModal } from "@/components/ResultModal";
import { toast } from "sonner";

export default function AdminDashboard() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [result, setResult] = useState(null);

  const isSiya =
    user?.email?.toLowerCase() === "siya@erank.co.za" ||
    user?.username?.toLowerCase() === "siya" ||
    user?.full_name?.toLowerCase() === "siya";

  const overview = useQuery({ queryKey: ["a-ov"], queryFn: async () => (await api.get("/admin/overview")).data, refetchInterval: 6000 });
  const ranks = useQuery({ queryKey: ["a-ranks"], queryFn: async () => (await api.get("/public/ranks")).data });
  const routes = useQuery({ queryKey: ["a-routes"], queryFn: async () => (await api.get("/public/routes")).data });
  const owners = useQuery({ queryKey: ["a-owners"], queryFn: async () => (await api.get("/admin/users/owner")).data });
  const marshals = useQuery({ queryKey: ["a-marshals"], queryFn: async () => (await api.get("/admin/users/marshal")).data });
  const drivers = useQuery({ queryKey: ["a-drivers"], queryFn: async () => (await api.get("/admin/users/driver")).data });
  const passengers = useQuery({ queryKey: ["a-passengers"], queryFn: async () => (await api.get("/admin/users/passenger")).data });
  const admins = useQuery({ queryKey: ["a-admins"], queryFn: async () => (await api.get("/admin/users/admin")).data, enabled: !!isSiya });
  const taxis = useQuery({ queryKey: ["a-taxis"], queryFn: async () => (await api.get("/admin/taxis")).data });
  const queue = useQuery({ queryKey: ["a-queue"], queryFn: async () => (await api.get("/admin/queue")).data, refetchInterval: 4000 });
  const ops = useQuery({ queryKey: ["a-ops"], queryFn: async () => (await api.get("/admin/operations")).data, refetchInterval: 6000 });
  const sos = useQuery({ queryKey: ["a-sos"], queryFn: async () => (await api.get("/admin/sos")).data, refetchInterval: 6000 });

  const invalidate = (...keys) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  // Credential Reset & Edit state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetting, setResetting] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [newSecret, setNewSecret] = useState("");
  const [savingSecret, setSavingSecret] = useState(false);

  const openResetModal = (u) => {
    setResetTarget(u);
    setResetModalOpen(true);
  };

  const handleConfirmReset = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const { data } = await api.post(`/admin/users/${resetTarget.id}/reset-pin`);
      toast.success(data.message || `Credentials reset to default.`);
      invalidate("a-owners", "a-marshals", "a-drivers", "a-passengers", "a-admins");
      setResetModalOpen(false);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setResetting(false);
    }
  };

  const openEditModal = (u) => {
    setEditTarget(u);
    setNewSecret("");
    setEditModalOpen(true);
  };

  const handleSaveSecret = async () => {
    if (!editTarget) return;
    if (!newSecret || newSecret.trim().length < 4) {
      toast.error("PIN/Password must be at least 4 characters.");
      return;
    }
    setSavingSecret(true);
    try {
      const { data } = await api.post(`/admin/users/${editTarget.id}/edit-secret`, {
        new_secret: newSecret.trim(),
      });
      toast.success(data.message || "PIN/Password updated successfully");
      invalidate("a-owners", "a-marshals", "a-drivers", "a-passengers", "a-admins");
      setEditModalOpen(false);
      setNewSecret("");
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSavingSecret(false);
    }
  };

  const [rankForm, setRankForm] = useState({ rank_name: "", location: "" });
  const [routeForm, setRouteForm] = useState({ rank_name: "", route: "", fare: "" });
  const [ownerForm, setOwnerForm] = useState({ full_name: "", email: "", cell_phone: "", rank_name: "", pin: "123456" });
  const [marshalForm, setMarshalForm] = useState({ full_name: "", cell_phone: "", rank_name: "", pin: "123456789" });
  const [ownerCellError, setOwnerCellError] = useState(null);
  const [marshalCellError, setMarshalCellError] = useState(null);

  // SA phone: +27 prefix + 9 digits. After stripping +27 or leading 0, must have exactly 9 digits.
  const validateSAPhone = (raw) => {
    if (!raw || !raw.trim()) return "Cell number is required.";
    const digits = raw.replace(/\D/g, "");
    const local = digits.startsWith("27") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits;
    if (local.length !== 9) return "Enter a valid South African number: +27 followed by 9 digits (e.g. +27 81 234 5678).";
    return null;
  };

  const createRank = async () => { try { await api.post("/admin/ranks", rankForm); toast.success("Rank added"); setRankForm({ rank_name: "", location: "" }); invalidate("a-ranks", "a-ov"); } catch (e) { toast.error(apiError(e)); } };
  const createRoute = async () => { try { await api.post("/admin/routes", routeForm); toast.success("Route added"); setRouteForm({ rank_name: "", route: "", fare: "" }); invalidate("a-routes", "a-ov"); } catch (e) { toast.error(apiError(e)); } };
  const createOwner = async () => {
    const err = validateSAPhone(ownerForm.cell_phone);
    if (err) { setOwnerCellError(err); return; }
    setOwnerCellError(null);
    try { await api.post("/admin/owners", ownerForm); setResult({ type: "success", title: "Owner added", message: `${ownerForm.full_name} can sign in with PIN ${ownerForm.pin}.` }); setOwnerForm({ full_name: "", email: "", cell_phone: "", rank_name: "", pin: "123456" }); invalidate("a-owners", "a-ov"); } catch (e) { setResult({ type: "error", title: "Cannot add owner", message: apiError(e) }); }
  };
  const createMarshal = async () => {
    const err = validateSAPhone(marshalForm.cell_phone);
    if (err) { setMarshalCellError(err); return; }
    setMarshalCellError(null);
    try { await api.post("/admin/marshals", marshalForm); setResult({ type: "success", title: "Marshal added", message: `${marshalForm.full_name} can sign in with PIN ${marshalForm.pin}.` }); setMarshalForm({ full_name: "", cell_phone: "", rank_name: "", pin: "123456789" }); invalidate("a-marshals", "a-ov"); } catch (e) { setResult({ type: "error", title: "Cannot add marshal", message: apiError(e) }); }
  };
  const delUser = async (id) => { try { await api.delete(`/admin/users/${id}`); toast.success("Removed"); invalidate("a-owners", "a-marshals", "a-ov"); } catch (e) { toast.error(apiError(e)); } };
  const delRank = async (id) => { await api.delete(`/admin/ranks/${id}`); invalidate("a-ranks", "a-ov"); };
  const delRoute = async (id) => { await api.delete(`/admin/routes/${id}`); invalidate("a-routes", "a-ov"); };

  const ov = overview.data || {};
  const rankOptions = (ranks.data || []).map((r) => r.rank_name);

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold font-heading">Admin control center</h1>
          <Button
            size="sm"
            variant="outline"
            onClick={() => qc.invalidateQueries()}
            data-testid="admin-refresh-btn"
            className="border-[#263144] hover:bg-[#181F2C] text-slate-300 gap-1.5 shrink-0"
            title="Refresh latest admin data"
          >
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>

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
            {["ranks", "routes", "owners", "marshals", "drivers", "passengers", ...(isSiya ? ["admins"] : []), "taxis", "queue", "operations", "sos"].map((t) => (
              <TabsTrigger key={t} value={t} data-testid={`admin-tab-${t}`} className="capitalize">
                {t === "admins" ? "👑 Admins" : t}
              </TabsTrigger>
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
              <div>
                <Inline label="Cell (+27…)" v={ownerForm.cell_phone} on={(v) => { setOwnerForm({ ...ownerForm, cell_phone: v }); setOwnerCellError(null); }} testid="owner-cell" />
                {ownerCellError && <p className="text-red-400 text-xs mt-1 max-w-[220px]">{ownerCellError}</p>}
              </div>
              <SelInline label="Rank" v={ownerForm.rank_name} on={(v) => setOwnerForm({ ...ownerForm, rank_name: v })} options={rankOptions} testid="owner-rank" />
              <Button onClick={createOwner} data-testid="create-owner-btn" className="bg-primary text-black gap-1 h-10"><Plus size={14} /> Add owner</Button>
            </Card>
            <UserTable users={owners.data} onDelete={delUser} onReset={openResetModal} onEdit={openEditModal} showEmail testid="admin-owner-row" />
          </TabsContent>

          <TabsContent value="marshals" className="pt-4 space-y-4">
            <Card className="bg-[#181F2C] border-[#263144] p-4 flex flex-wrap gap-2 items-end">
              <Inline label="Full name" v={marshalForm.full_name} on={(v) => setMarshalForm({ ...marshalForm, full_name: v })} testid="marshal-name" />
              <div>
                <Inline label="Cell (+27…)" v={marshalForm.cell_phone} on={(v) => { setMarshalForm({ ...marshalForm, cell_phone: v }); setMarshalCellError(null); }} testid="marshal-cell" />
                {marshalCellError && <p className="text-red-400 text-xs mt-1 max-w-[220px]">{marshalCellError}</p>}
              </div>
              <SelInline label="Rank" v={marshalForm.rank_name} on={(v) => setMarshalForm({ ...marshalForm, rank_name: v })} options={rankOptions} testid="marshal-rank" />
              <Button onClick={createMarshal} data-testid="create-marshal-btn" className="bg-primary text-black gap-1 h-10"><Plus size={14} /> Add marshal</Button>
            </Card>
            <UserTable users={marshals.data} onDelete={delUser} onReset={openResetModal} onEdit={openEditModal} testid="admin-marshal-row" />
          </TabsContent>

          <TabsContent value="drivers" className="pt-4">
            <TableWrap head={["Driver", "Cell", "Owner", "Taxi", "Rank", "Default PIN", "Actions"]}>
              {(drivers.data || []).map((d) => (
                <tr key={d.id} data-testid="admin-driver-row" className="border-t border-[#263144]">
                  <td className="px-4 py-3 text-white font-medium">{d.full_name}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{d.cell_phone}</td>
                  <td className="px-4 py-3 text-slate-300">{d.owner_name}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{d.taxi_registration}</td>
                  <td className="px-4 py-3 text-slate-300">{d.rank_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-primary">{d.default_pin || "12345678"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openResetModal({ ...d, role: "driver", default_pin: d.default_pin || "12345678" })}
                        className="h-8 px-2 text-amber-400 hover:bg-amber-400/10 gap-1 text-xs"
                        title="Reset to default driver PIN (12345678)"
                        data-testid={`reset-driver-pin-btn-${d.id}`}
                      >
                        <RotateCcw size={13} /> Reset PIN
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal({ ...d, role: "driver" })}
                        className="h-8 px-2 text-cyan-400 hover:bg-cyan-400/10 gap-1 text-xs"
                        title="Edit driver PIN"
                        data-testid={`edit-driver-pin-btn-${d.id}`}
                      >
                        <Edit2 size={13} /> Edit PIN
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </TableWrap>
          </TabsContent>

          <TabsContent value="passengers" className="pt-4">
            <TableWrap head={["Passenger", "Cell", "Email", "Default PIN", "Joined", "Actions"]}>
              {(passengers.data || []).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No registered passengers found.</td></tr>
              )}
              {(passengers.data || []).map((p) => (
                <tr key={p.id} data-testid="admin-passenger-row" className="border-t border-[#263144]">
                  <td className="px-4 py-3 text-white font-medium">{p.full_name}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{p.cell_phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-300">{p.email || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-primary">{p.default_pin || (p.username === "lizwi lakhe" ? "246810" : "1234")}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{(p.created_at || "").slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openResetModal({ ...p, role: "passenger", default_pin: p.default_pin || (p.username === "lizwi lakhe" ? "246810" : "1234") })}
                        className="h-8 px-2 text-amber-400 hover:bg-amber-400/10 gap-1 text-xs"
                        title="Reset to default passenger PIN"
                        data-testid={`reset-passenger-pin-btn-${p.id}`}
                      >
                        <RotateCcw size={13} /> Reset PIN
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal({ ...p, role: "passenger" })}
                        className="h-8 px-2 text-cyan-400 hover:bg-cyan-400/10 gap-1 text-xs"
                        title="Edit passenger PIN"
                        data-testid={`edit-passenger-pin-btn-${p.id}`}
                      >
                        <Edit2 size={13} /> Edit PIN
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => delUser(p.id)}
                        className="h-8 w-8 text-slate-400 hover:text-red-400"
                        title="Remove passenger"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </TableWrap>
          </TabsContent>

          {isSiya && (
            <TabsContent value="admins" className="pt-4 space-y-4">
              <Card className="bg-gradient-to-r from-amber-950/40 via-[#181F2C] to-[#181F2C] border-amber-500/30 p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Crown size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    Super Admin Credential Control <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">Siya Only</Badge>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    As Super Admin Siya, you have exclusive authority to reset and edit administrator passwords across the entire platform.
                  </p>
                </div>
              </Card>

              <TableWrap head={["Admin Name", "Email", "Status", "Default Password", "Actions"]}>
                {(admins.data || []).map((a) => {
                  const targetIsSiya = a.email?.toLowerCase() === "siya@erank.co.za" || a.username?.toLowerCase() === "siya" || a.full_name?.toLowerCase() === "siya";
                  return (
                    <tr key={a.id} data-testid="admin-admin-row" className="border-t border-[#263144]">
                      <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                        {targetIsSiya ? <Crown size={15} className="text-amber-400" /> : <ShieldCheck size={15} className="text-cyan-400" />}
                        <span>{a.full_name}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{a.email}</td>
                      <td className="px-4 py-3">
                        {targetIsSiya ? (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] gap-1">
                            <Crown size={10} /> Super Admin
                          </Badge>
                        ) : (
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-[10px]">
                            Admin
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-primary">{a.default_pin || "erank2026"}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openResetModal({ ...a, role: "admin", default_pin: a.default_pin || "erank2026" })}
                            className="h-8 px-2 text-amber-400 hover:bg-amber-400/10 gap-1 text-xs"
                            title="Reset admin password to default (erank2026)"
                            data-testid={`reset-admin-pwd-btn-${a.id}`}
                          >
                            <RotateCcw size={13} /> Reset Password
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal({ ...a, role: "admin" })}
                            className="h-8 px-2 text-cyan-400 hover:bg-cyan-400/10 gap-1 text-xs"
                            title="Edit admin password"
                            data-testid={`edit-admin-pwd-btn-${a.id}`}
                          >
                            <Edit2 size={13} /> Edit Password
                          </Button>
                          {!targetIsSiya && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => delUser(a.id)}
                              className="h-8 w-8 text-slate-400 hover:text-red-400"
                              title="Remove admin"
                            >
                              <Trash2 size={15} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </TableWrap>
            </TabsContent>
          )}

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

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="bg-[#181F2C] border-[#263144] text-white max-w-md">
          <DialogHeader>
            <div className="h-11 w-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 mx-auto">
              <RotateCcw size={22} />
            </div>
            <DialogTitle className="text-center text-lg font-bold font-heading">
              Reset to 1st Default PIN?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-slate-300">
            <p>
              Are you sure you want to reset credentials for{" "}
              <strong className="text-white">{resetTarget?.full_name}</strong>{" "}
              (<span className="capitalize text-primary">{resetTarget?.role}</span>)?
            </p>
            <div className="p-3 bg-[#0A0D14] border border-[#263144] rounded-lg space-y-1">
              <div className="text-xs text-slate-400">1st Default PIN / Password:</div>
              <div className="text-lg font-mono font-bold text-primary">
                {resetTarget?.default_pin || (resetTarget?.role === "admin" ? "erank2026" : resetTarget?.role === "marshal" ? "123456789" : resetTarget?.role === "driver" ? "12345678" : "123456")}
              </div>
            </div>
            <p className="text-xs text-slate-400">
              The user's password/PIN will immediately revert to this default.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setResetModalOpen(false)} className="border-[#334155] text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReset}
              disabled={resetting}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1.5"
            >
              <RotateCcw size={14} /> {resetting ? "Resetting..." : "Confirm Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit PIN / Password Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-[#181F2C] border-[#263144] text-white max-w-md">
          <DialogHeader>
            <div className="h-11 w-11 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2 mx-auto">
              <KeyRound size={22} />
            </div>
            <DialogTitle className="text-center text-lg font-bold font-heading">
              Edit PIN / Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-slate-300">
            <p>
              Set a new custom PIN / password for{" "}
              <strong className="text-white">{editTarget?.full_name}</strong>{" "}
              (<span className="capitalize text-primary">{editTarget?.role}</span>).
            </p>
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">New PIN or Password (min 4 characters) *</Label>
              <Input
                type="text"
                value={newSecret}
                onChange={(e) => setNewSecret(e.target.value)}
                placeholder="Enter new PIN or password..."
                className="bg-[#0A0D14] border-[#263144] text-white h-10 font-mono"
                autoFocus
              />
            </div>
            {editTarget?.default_pin && (
              <p className="text-xs text-slate-500">
                Original default PIN: <span className="font-mono text-slate-400">{editTarget.default_pin}</span>
              </p>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} className="border-[#334155] text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={handleSaveSecret}
              disabled={savingSecret || !newSecret.trim()}
              className="bg-primary hover:bg-primary/90 text-black font-bold gap-1.5"
            >
              <Check size={14} /> {savingSecret ? "Saving..." : "Save PIN / Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function UserTable({ users, onDelete, onReset, onEdit, showEmail, testid }) {
  return (
    <TableWrap head={showEmail ? ["Name", "Email", "Cell", "Rank", "Default PIN", "Actions"] : ["Name", "Cell", "Rank", "Default PIN", "Actions"]}>
      {(users || []).map((u) => (
        <tr key={u.id} data-testid={testid} className="border-t border-[#263144]">
          <td className="px-4 py-3 text-white font-medium">{u.full_name}</td>
          {showEmail && <td className="px-4 py-3 text-slate-300">{u.email}</td>}
          <td className="px-4 py-3 font-mono text-slate-300">{u.cell_phone}</td>
          <td className="px-4 py-3 text-slate-300">{u.rank_name}</td>
          <td className="px-4 py-3 font-mono text-xs text-primary">{u.default_pin || (u.role === "marshal" ? "123456789" : "123456")}</td>
          <td className="px-4 py-3 text-right whitespace-nowrap">
            <div className="flex items-center justify-end gap-1">
              {onReset && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReset(u)}
                  className="h-8 px-2 text-amber-400 hover:bg-amber-400/10 gap-1 text-xs"
                  title="Reset to 1st default PIN"
                  data-testid={`reset-pin-btn-${u.id}`}
                >
                  <RotateCcw size={13} /> Reset PIN
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(u)}
                  className="h-8 px-2 text-cyan-400 hover:bg-cyan-400/10 gap-1 text-xs"
                  title="Edit / change PIN or password"
                  data-testid={`edit-pin-btn-${u.id}`}
                >
                  <Edit2 size={13} /> Edit PIN
                </Button>
              )}
              {onDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(u.id)}
                  className="h-8 w-8 text-slate-400 hover:text-red-400"
                  title="Remove user"
                >
                  <Trash2 size={15} />
                </Button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </TableWrap>
  );
}
