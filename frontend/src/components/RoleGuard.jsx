import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function RoleGuard({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading || user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0D14] text-slate-400">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/signin" replace />;
  if (user.must_change) return <Navigate to="/change-secret" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
