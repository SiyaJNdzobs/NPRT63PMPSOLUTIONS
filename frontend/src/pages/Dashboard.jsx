import React from "react";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/pages/AdminDashboard";
import OwnerDashboard from "@/pages/OwnerDashboard";
import MarshalDashboard from "@/pages/MarshalDashboard";
import DriverDashboard from "@/pages/DriverDashboard";
import PassengerDashboard from "@/pages/PassengerDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  switch (user.role) {
    case "admin": return <AdminDashboard />;
    case "owner": return <OwnerDashboard />;
    case "marshal": return <MarshalDashboard />;
    case "driver": return <DriverDashboard />;
    case "passenger": return <PassengerDashboard />;
    default: return null;
  }
}
