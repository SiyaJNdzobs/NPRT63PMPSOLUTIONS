import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";

export default function ChangeSecret() {
  const { user, loading, refreshUser, logout } = useAuth();
  const nav = useNavigate();
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading || user === null) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0A0D14] text-slate-400">Loading…</div>;
  }
  if (!user) { nav("/signin"); return null; }

  const isAdmin = user.role === "admin";
  const word = isAdmin ? "password" : "PIN";

  const submit = async (e) => {
    e.preventDefault();
    if (s1 !== s2) { toast.error(`The two ${word}s do not match.`); return; }
    if (s1.length < 4) { toast.error(`Choose a ${word} of at least 4 characters.`); return; }
    setBusy(true);
    try {
      await api.post("/auth/change-secret", { new_secret: s1 });
      await refreshUser();
      toast.success(`Your ${word} was changed`);
      nav("/dashboard");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-[#181F2C] border-[#263144] p-6">
        <div className="text-center mb-5">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <KeyRound className="text-black" size={24} />
          </div>
          <h1 className="text-xl font-extrabold font-heading">Set a new {word}</h1>
          <p className="text-slate-400 text-sm mt-1">
            For your security, please change your {word} before you continue.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-slate-300 text-xs">New {word}</Label>
            <Input type="password" value={s1} onChange={(e) => setS1(e.target.value)} data-testid="new-secret-input" className="mt-1 h-11 bg-[#0A0D14] border-[#263144] text-white" />
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Confirm {word}</Label>
            <Input type="password" value={s2} onChange={(e) => setS2(e.target.value)} data-testid="confirm-secret-input" className="mt-1 h-11 bg-[#0A0D14] border-[#263144] text-white" />
          </div>
          <Button type="submit" disabled={busy} data-testid="change-secret-submit" className="w-full h-11 bg-primary text-black hover:bg-primary/90">
            {busy ? "Saving…" : `Change ${word} & continue`}
          </Button>
        </form>
        <button onClick={() => { logout(); nav("/"); }} className="w-full text-center text-xs text-slate-500 underline mt-4" data-testid="cancel-change-btn">
          Cancel and log out
        </button>
      </Card>
    </div>
  );
}
