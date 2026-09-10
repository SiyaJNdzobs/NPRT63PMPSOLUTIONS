import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bus, ShieldCheck, Car, Flag, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";
import { toast } from "sonner";

const ROLES = [
  { id: "admin", label: "Admin", icon: ShieldCheck, hint: "Email & password" },
  { id: "owner", label: "Owner", icon: Car, hint: "Name & PIN" },
  { id: "marshal", label: "Marshal", icon: Flag, hint: "Name & PIN" },
  { id: "driver", label: "Driver", icon: Bus, hint: "Name & PIN" },
  { id: "passenger", label: "Passenger", icon: Users, hint: "Name & PIN" },
];

export default function SignIn() {
  const nav = useNavigate();
  const { login, register, user } = useAuth();
  const [params] = useSearchParams();
  const [role, setRole] = useState(null);
  const [ident, setIdent] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("login"); // login | register
  const [reg, setReg] = useState({ full_name: "", contact_number: "", email: "", pin: "" });

  useEffect(() => {
    if (params.get("register") === "1") {
      setRole("passenger");
      setMode("register");
    }
  }, [params]);

  useEffect(() => {
    if (user && user !== false) {
      if (user.must_change) nav("/change-secret");
      else nav("/dashboard");
    }
  }, [user, nav]);

  const submitLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(role, ident, secret);
      toast.success("Signed in");
      nav(u.must_change ? "/change-secret" : "/dashboard");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(reg);
      toast.success("Account created");
      nav("/dashboard");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const isAdmin = role === "admin";
  const identLabel = isAdmin ? "Email" : "Full name (username)";
  const secretLabel = isAdmin ? "Password" : "PIN";

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col">
      <div className="px-4 sm:px-6 py-4">
        <Button variant="ghost" onClick={() => nav("/")} data-testid="back-home-btn" className="text-slate-300 gap-2">
          <ArrowLeft size={16} /> Home
        </Button>
      </div>
      <div className="flex-1 flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md space-y-6 pt-4">
          <div className="text-center space-y-1">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-2">
              <Bus className="text-black" size={26} />
            </div>
            <h1 className="text-2xl font-extrabold font-heading">Sign in to E-RANK</h1>
            <p className="text-slate-400 text-sm">Choose your role, then sign in.</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" data-testid="role-grid">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => { setRole(r.id); setMode("login"); }}
                  data-testid={`role-${r.id}`}
                  className={`rounded-xl border p-3 flex flex-col items-center gap-1.5 transition-colors ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-[#263144] bg-[#181F2C] hover:border-primary/60 hover:bg-[#20293A]"
                  }`}
                >
                  <Icon className={active ? "text-primary" : "text-slate-300"} size={20} />
                  <div className={`text-xs font-semibold ${active ? "text-white" : "text-slate-300"}`}>{r.label}</div>
                </button>
              );
            })}
          </div>

          {mode === "login" && (
            <Card className="bg-[#181F2C] border-[#263144] p-6">
              <div className="text-sm text-slate-300 mb-4">
                {role ? (
                  <>Signing in as <span className="text-primary font-semibold capitalize">{role}</span></>
                ) : (
                  "Select a role above to continue"
                )}
              </div>
              <form onSubmit={submitLogin} className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-xs">{identLabel}</Label>
                  <Input
                    value={ident}
                    onChange={(e) => setIdent(e.target.value)}
                    disabled={!role}
                    data-testid="login-identifier-input"
                    className="mt-1 h-11 bg-[#0A0D14] border-[#263144] text-white"
                    placeholder={isAdmin ? "you@erank.co.za" : "Your full name"}
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">{secretLabel}</Label>
                  <Input
                    type="password"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    disabled={!role}
                    data-testid="login-secret-input"
                    className="mt-1 h-11 bg-[#0A0D14] border-[#263144] text-white"
                    placeholder={isAdmin ? "Password" : "PIN"}
                  />
                </div>
                <Button type="submit" disabled={busy || !role} data-testid="login-submit-btn" className="w-full h-11 bg-primary text-black hover:bg-primary/90">
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
              {role === "passenger" && (
                <div className="text-center text-sm text-slate-400 mt-4">
                  New here?{" "}
                  <button onClick={() => setMode("register")} data-testid="switch-register-btn" className="text-primary underline">
                    Create a passenger account
                  </button>
                </div>
              )}
            </Card>
          )}

          {role === "passenger" && mode === "register" && (
            <Card className="bg-[#181F2C] border-[#263144] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-300">Passenger sign up</div>
                <button onClick={() => setMode("login")} data-testid="switch-login-btn" className="text-xs text-slate-400 underline">
                  Have an account? Sign in
                </button>
              </div>
              <form onSubmit={submitRegister} className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-xs">Full name</Label>
                  <Input value={reg.full_name} onChange={(e) => setReg({ ...reg, full_name: e.target.value })} data-testid="reg-name-input" className="mt-1 h-11 bg-[#0A0D14] border-[#263144] text-white" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Contact number</Label>
                  <Input value={reg.contact_number} onChange={(e) => setReg({ ...reg, contact_number: e.target.value })} data-testid="reg-contact-input" className="mt-1 h-11 bg-[#0A0D14] border-[#263144] text-white font-mono" placeholder="+27 82 000 0000" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Email</Label>
                  <Input value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} data-testid="reg-email-input" className="mt-1 h-11 bg-[#0A0D14] border-[#263144] text-white" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Choose a PIN</Label>
                  <Input type="password" value={reg.pin} onChange={(e) => setReg({ ...reg, pin: e.target.value })} data-testid="reg-pin-input" className="mt-1 h-11 bg-[#0A0D14] border-[#263144] text-white" />
                </div>
                <Button type="submit" disabled={busy} data-testid="register-submit-btn" className="w-full h-11 bg-emerald-500 text-black hover:bg-emerald-600">
                  {busy ? "Creating…" : "Create account"}
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
