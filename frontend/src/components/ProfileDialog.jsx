import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";

export function ProfileDialog({ open, onOpenChange }) {
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);

  const emailEditable = user && ["admin", "owner", "passenger"].includes(user.role);
  const phoneEditable = user && ["owner", "marshal", "driver", "passenger"].includes(user.role);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setContact(user.cell_phone || "");
    }
  }, [user, open]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {};
      if (emailEditable) payload.email = email;
      if (phoneEditable) payload.contact_number = contact;
      const { data } = await api.put("/profile", payload);
      setUser(data);
      toast.success("Profile updated");
      onOpenChange(false);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#181F2C] border-[#263144]" data-testid="profile-dialog">
        <DialogHeader>
          <DialogTitle className="text-white font-heading">Profile settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-slate-300 text-xs">Full name</Label>
            <Input value={user.full_name} disabled className="mt-1 bg-[#0A0D14] border-[#263144] text-slate-400" />
          </div>
          {user.rank_name && (
            <div>
              <Label className="text-slate-300 text-xs">Rank</Label>
              <Input value={user.rank_name} disabled className="mt-1 bg-[#0A0D14] border-[#263144] text-slate-400" />
            </div>
          )}
          {emailEditable && (
            <div>
              <Label className="text-slate-300 text-xs">Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="profile-email-input"
                className="mt-1 bg-[#0A0D14] border-[#263144] text-white h-11"
                placeholder="you@example.com"
              />
            </div>
          )}
          {phoneEditable && (
            <div>
              <Label className="text-slate-300 text-xs">Contact number</Label>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                data-testid="profile-contact-input"
                className="mt-1 bg-[#0A0D14] border-[#263144] text-white h-11 font-mono"
                placeholder="+27 82 000 0000"
              />
              <p className="text-[11px] text-slate-500 mt-1">Saved in +27 format.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#334155] text-slate-200">
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} data-testid="profile-save-btn" className="bg-primary text-black hover:bg-primary/90">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
