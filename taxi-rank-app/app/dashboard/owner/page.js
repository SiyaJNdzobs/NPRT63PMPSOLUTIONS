"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "../../../components/Navbar";

export default function OwnerDashboard() {
  const { user, role } = useAuth();
  const router = useRouter();

  const [taxis, setTaxis] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [activeTab, setActiveTab] = useState("fleet");
  
  // Add Taxi form state
  const [taxiForm, setTaxiForm] = useState({
    registrationNumber: "",
    driverName: "",
    driverCell: "",
    rankId: "",
    fare: "25",
    capacity: "15"
  });

  // Reassign Driver modal state
  const [driverModal, setDriverModal] = useState(null); // holds taxi object when editing driver
  const [driverForm, setDriverForm] = useState({ driverName: "", driverCell: "" });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || role !== "owner") {
      router.push("/login");
      return;
    }

    const loadOwnerData = async () => {
      try {
        const [taxisRes, ranksRes] = await Promise.all([
          axios.get(`/api/taxis/owner/${user.uid}`),
          axios.get("/api/ranks")
        ]);
        setTaxis(taxisRes.data);
        setRanks(ranksRes.data);
        if (ranksRes.data.length > 0) {
          setTaxiForm(prev => ({ ...prev, rankId: ranksRes.data[0].rankId }));
        }
      } catch (err) {
        console.error("Failed to load owner dashboard data:", err);
      }
    };

    loadOwnerData();
  }, [user, role]);

  const refreshTaxis = async () => {
    try {
      const res = await axios.get(`/api/taxis/owner/${user.uid}`);
      setTaxis(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTaxi = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const selectedRank = ranks.find(r => r.rankId === taxiForm.rankId);
      await axios.post("/api/taxis/add", {
        ...taxiForm,
        ownerId: user.uid,
        ownerName: user.fullName,
        rankName: selectedRank ? selectedRank.rankName : ""
      });

      setMessage("Taxi and driver registered successfully!");
      setTaxiForm({
        registrationNumber: "",
        driverName: "",
        driverCell: "",
        rankId: ranks[0]?.rankId || "",
        fare: "25",
        capacity: "15"
      });
      setActiveTab("fleet");
      refreshTaxis();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add taxi");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTaxi = async (taxiId) => {
    if (!confirm("Are you sure you want to delete this taxi from your fleet?")) return;
    setError("");
    setMessage("");
    try {
      await axios.delete(`/api/taxis/${taxiId}`);
      setMessage("Taxi removed successfully.");
      refreshTaxis();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete taxi");
    }
  };

  const handleOpenDriverModal = (taxi) => {
    setDriverModal(taxi);
    setDriverForm({ driverName: taxi.driverName || "", driverCell: taxi.driverCell || "" });
  };

  const handleUpdateDriver = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await axios.put(`/api/taxis/${driverModal.taxiId}/driver`, driverForm);
      setMessage(`Driver updated for taxi ${driverModal.registrationNumber}.`);
      setDriverModal(null);
      refreshTaxis();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update driver details");
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalRides = taxis.reduce((sum, t) => sum + (t.totalRides || 0), 0);
  const totalEarnings = taxis.reduce((sum, t) => sum + (t.totalEarnings || 0), 0);

  if (!user || role !== "owner") return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Owner Dashboard</h1>
            <p className="text-slate-500 text-sm font-light mt-1">Manage your fleet and tracks profits</p>
          </div>
          <div className="bg-slate-200/60 p-1.5 rounded-xl flex gap-1 self-stretch sm:self-auto">
            <button
              onClick={() => { setActiveTab("fleet"); setError(""); setMessage(""); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === "fleet" ? "bg-white text-blue-900 shadow-sm" : "text-slate-600"}`}
            >
              MY FLEET
            </button>
            <button
              onClick={() => { setActiveTab("add"); setError(""); setMessage(""); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === "add" ? "bg-white text-blue-900 shadow-sm" : "text-slate-600"}`}
            >
              REGISTER TAXI
            </button>
          </div>
        </header>

        {message && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-xl mb-6 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Tab 1: My Fleet */}
        {activeTab === "fleet" && (
          <div className="space-y-8">
            {/* Owner Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Total Owned Taxis</span>
                <span className="text-3xl font-extrabold text-slate-800">{taxis.length}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Cumulative Fleet Rides</span>
                <span className="text-3xl font-extrabold text-slate-800">{totalRides}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Total Fleet Earnings</span>
                <span className="text-3xl font-extrabold text-green-700">R {totalEarnings}</span>
              </div>
            </div>

            {/* Taxis Table */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Registered Fleet Taxis</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="py-3 font-semibold">Reg Number</th>
                      <th className="py-3 font-semibold">Rank Location</th>
                      <th className="py-3 font-semibold">Assigned Driver</th>
                      <th className="py-3 font-semibold">Driver Cell</th>
                      <th className="py-3 font-semibold">Total Rides</th>
                      <th className="py-3 font-semibold">Total Earnings</th>
                      <th className="py-3 font-semibold">Availability</th>
                      <th className="py-3 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxis.map((taxi) => (
                      <tr key={taxi.taxiId} className="border-b border-slate-50 text-slate-600 hover:bg-slate-50/50">
                        <td className="py-4 font-bold text-blue-900">{taxi.registrationNumber}</td>
                        <td className="py-4">{taxi.rankName}</td>
                        <td className="py-4 font-semibold text-slate-800">{taxi.driverName}</td>
                        <td className="py-4">{taxi.driverCell}</td>
                        <td className="py-4">{taxi.totalRides}</td>
                        <td className="py-4 font-bold text-green-700">R {taxi.totalEarnings}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${taxi.isAvailable ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                            {taxi.isAvailable ? "Available" : "Loading/On Trip"}
                          </span>
                        </td>
                        <td className="py-4 text-center flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenDriverModal(taxi)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                          >
                            Edit Driver
                          </button>
                          <button
                            onClick={() => handleDeleteTaxi(taxi.taxiId)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {taxis.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center py-10 text-slate-400">No taxis registered in your fleet yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Register Taxi */}
        {activeTab === "add" && (
          <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Register Fleet Taxi</h2>
            <form onSubmit={handleAddTaxi} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">Vehicle Registration Plate</label>
                  <input
                    type="text"
                    value={taxiForm.registrationNumber}
                    onChange={(e) => setTaxiForm({ ...taxiForm, registrationNumber: e.target.value })}
                    placeholder="e.g. BFN 101 NC"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">Target Taxi Rank</label>
                  <select
                    value={taxiForm.rankId}
                    onChange={(e) => setTaxiForm({ ...taxiForm, rankId: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    required
                  >
                    {ranks.map(r => (
                      <option key={r.rankId} value={r.rankId}>{r.rankName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">Driver Full Name</label>
                  <input
                    type="text"
                    value={taxiForm.driverName}
                    onChange={(e) => setTaxiForm({ ...taxiForm, driverName: e.target.value })}
                    placeholder="Assign driver name"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">Driver Cell Number</label>
                  <input
                    type="tel"
                    value={taxiForm.driverCell}
                    onChange={(e) => setTaxiForm({ ...taxiForm, driverCell: e.target.value })}
                    placeholder="Assign driver cell"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">Standard Fare Amount (ZAR)</label>
                  <input
                    type="number"
                    value={taxiForm.fare}
                    onChange={(e) => setTaxiForm({ ...taxiForm, fare: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">Passenger Seating Capacity</label>
                  <input
                    type="number"
                    value={taxiForm.capacity}
                    onChange={(e) => setTaxiForm({ ...taxiForm, capacity: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white py-3.5 rounded-xl font-bold transition shadow-sm hover:shadow mt-4"
              >
                {loading ? "Registering Fleet..." : "Register Taxi & Driver"}
              </button>
            </form>
          </div>
        )}

        {/* Reassign Driver Modal Dialog */}
        {driverModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Reassign Driver</h3>
              <p className="text-slate-500 text-xs font-light mb-6">Taxi Plate: <span className="font-semibold text-slate-800">{driverModal.registrationNumber}</span></p>
              
              <form onSubmit={handleUpdateDriver} className="space-y-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">New Driver Name</label>
                  <input
                    type="text"
                    value={driverForm.driverName}
                    onChange={(e) => setDriverForm({ ...driverForm, driverName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">New Driver Cell Number</label>
                  <input
                    type="tel"
                    value={driverForm.driverCell}
                    onChange={(e) => setDriverForm({ ...driverForm, driverCell: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setDriverModal(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition shadow-sm text-sm"
                  >
                    {loading ? "Saving..." : "Save Details"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
