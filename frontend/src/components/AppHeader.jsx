import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, UserCog, Bus, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ProfileDialog } from "@/components/ProfileDialog";
import { toast } from "sonner";

const ROLE_LABEL = {
  admin: "Administrator", owner: "Owner", marshal: "Marshal",
  driver: "Driver", passenger: "Passenger",
};

export function AppHeader({ subtitle, onRefresh }) {
  const { user, logout, refreshUser } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      if (qc) {
        await qc.invalidateQueries();
      }
      if (refreshUser) {
        await refreshUser();
      }
      toast.success("Dashboard data refreshed");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0A0D14]/85 border-b border-[#263144] px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <button
          onClick={() => nav("/")}
          className="flex items-center gap-2 group"
          data-testid="header-logo"
        >
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <Bus className="text-black" size={20} />
          </div>
          <div className="text-left">
            <div className="font-heading font-extrabold tracking-tight text-white leading-none">
              E-RANK
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400">
              {subtitle || ROLE_LABEL[user?.role] || "Rank Ops"}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <div className="hidden sm:block text-right mr-1">
                <div className="text-sm text-white font-medium leading-none">{user.full_name}</div>
                <div className="text-[11px] text-slate-400">{ROLE_LABEL[user.role]}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                data-testid="dashboard-refresh-btn"
                title="Refresh dashboard data"
                className="border-[#334155] text-slate-200 hover:bg-[#20293A] gap-1.5 h-9 px-2.5 sm:px-3"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin text-primary" : "text-slate-300"} />
                <span className="text-xs font-medium">Refresh</span>
              </Button>
              {user.role !== "admin" || true ? (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setProfileOpen(true)}
                  data-testid="open-profile-btn"
                  className="border-[#334155] text-slate-200 hover:bg-[#20293A] h-9 w-9"
                >
                  <UserCog size={18} />
                </Button>
              ) : null}
              <Button
                variant="outline"
                onClick={() => { logout(); nav("/"); }}
                data-testid="logout-btn"
                className="border-[#334155] text-slate-200 hover:bg-[#20293A] gap-2"
              >
                <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
              </Button>
            </>
          )}
        </div>
      </div>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
}
