"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "../../../components/Navbar";

export default function MarshalDashboard() {
  const { user, role } = useAuth();
  const router = useRouter();

  const [rankId, setRankId] = useState("");
  const [queue, setQueue] = useState([]);
  const [taxis, setTaxis] = useState([]);
  const [activeTab, setActiveTab] = useState("queue");

  // Passenger capture form
  const [formData, setFormData] = useState({
    passengerName: "",
    passengerCell: "",
    nextOfKinName: "",
    nextOfKinCell: "",
    toLocation: "",
    taxiId: "",
    fare: "",
    isLongDistance: true,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || role !== "marshal") {
      router.push("/login");
      return;
    }

    const loadRankAndQueue = async () => {
      try {
        // Fetch all ranks to match user.rankName
        const ranksRes = await axios.get("/api/ranks");
        const matchedRank = ranksRes.data.find(r => r.rankName === user.rankName);
        
        if (matchedRank) {
          setRankId(matchedRank.rankId);
          
          // Fetch queue for this rank
          const qRes = await axios.get(`/api/queues/rank/${matchedRank.rankId}`);
          setQueue(qRes.data);

          // Fetch all taxis at this rank
          const taxiRes = await axios.get(`/api/taxis/rank/${encodeURIComponent(matchedRank.rankName)}`);
          setTaxis(taxiRes.data);
          
          if (taxiRes.data.length > 0) {
            setFormData(prev => ({ ...prev, taxiId: taxiRes.data[0].taxiId, fare: taxiRes.data[0].fare }));
          }
        }
      } catch (err) {
        console.error("Failed to load rank/queue details:", err);
      }
    };

    loadRankAndQueue();
  }, [user, role]);

  const fetchQueue = async () => {
    if (!rankId) return;
    try {
      const qRes = await axios.get(`/api/queues/rank/${rankId}`);
      setQueue(qRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispatchLocal = async (taxi) => {
    setError("");
    setMessage("");
    try {
      // Start local ride
      const res = await axios.post("/api/rides/start", {
        taxiId: taxi.taxiId,
        fromLocation: user.rankName,
        toLocation: "Local Destination",
        fare: taxi.fare || 25,
        isLongDistance: false
      });

      // Complete it right away or mock complete on driver side. Here we complete to clear the queue
      await axios.post("/api/rides/complete", { rideId: res.data.ride.rideId });

      // Remove from queue in database
      // In a real app, this is handled by database triggers. For mock, we update the queue status
      await axios.post("/api/qr/scan", { qrId: `qr-${rankId}`, driverCell: taxi.driverCell }); // Toggle scan clears or joins
      // Update local queue list
      // Let's filter out manually for responsiveness
      setQueue(prev => prev.filter(q => q.taxiId !== taxi.taxiId));
      setMessage(`Taxi ${taxi.registrationNumber} has been dispatched (local route).`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to dispatch taxi");
    }
  };

  const handleRegisterPassenger = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const selectedTaxi = taxis.find(t => t.taxiId === formData.taxiId);
      if (!selectedTaxi) {
        throw new Error("Please select a taxi");
      }

      // Create long-distance ride
      const res = await axios.post("/api/rides/start", {
        taxiId: formData.taxiId,
        passengerName: formData.passengerName,
        passengerCell: formData.passengerCell,
        nextOfKinName: formData.nextOfKinName,
        nextOfKinCell: formData.nextOfKinCell,
        fromLocation: user.rankName,
        toLocation: formData.toLocation,
        fare: formData.fare || selectedTaxi.fare,
        isLongDistance: true
      });

      setMessage(`Passenger registered. Shareable tracking link: ${res.data.ride.shareableLink}`);
      
      // Clear queue entries for this taxi
      setQueue(prev => prev.filter(q => q.taxiId !== formData.taxiId));

      setFormData({
        passengerName: "",
        passengerCell: "",
        nextOfKinName: "",
        nextOfKinCell: "",
        toLocation: "",
        taxiId: taxis[0]?.taxiId || "",
        fare: taxis[0]?.fare || "",
        isLongDistance: true
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to register passenger");
    } finally {
      setLoading(false);
    }
  };

  if (!user || role !== "marshal") return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Marshal Terminal</h1>
            <p className="text-slate-500 text-sm font-light mt-1">Rank: <span className="font-semibold text-blue-800">{user.rankName}</span></p>
          </div>
          <div className="bg-slate-200/60 p-1 rounded-xl flex gap-1 self-stretch sm:self-auto">
            <button
              onClick={() => { setActiveTab("queue"); setError(""); setMessage(""); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === "queue" ? "bg-white text-blue-900 shadow-sm" : "text-slate-600"}`}
            >
              QUEUE MANAGEMENT
            </button>
            <button
              onClick={() => { setActiveTab("boarding"); setError(""); setMessage(""); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === "boarding" ? "bg-white text-blue-900 shadow-sm" : "text-slate-600"}`}
            >
              LONG-DISTANCE BOARDING
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

        {/* Tab 1: Queue Manager */}
        {activeTab === "queue" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Active Loading Queue</h2>
              <button
                onClick={fetchQueue}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-semibold transition"
              >
                Refresh Queue
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="py-3 font-semibold">Position</th>
                    <th className="py-3 font-semibold">Reg Number</th>
                    <th className="py-3 font-semibold">Driver</th>
                    <th className="py-3 font-semibold">Driver Cell</th>
                    <th className="py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((entry, idx) => {
                    const taxiDetails = taxis.find(t => t.taxiId === entry.taxiId) || {};
                    return (
                      <tr key={entry.queueId} className="border-b border-slate-50 text-slate-600 hover:bg-slate-50/50">
                        <td className="py-4 font-bold text-slate-800">#{idx + 1}</td>
                        <td className="py-4 font-semibold text-blue-900">{taxiDetails.registrationNumber || entry.taxiId}</td>
                        <td className="py-4">{entry.driverName}</td>
                        <td className="py-4">{taxiDetails.driverCell || "N/A"}</td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => handleDispatchLocal(taxiDetails)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                          >
                            Dispatch (Local)
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {queue.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-slate-400">
                        No taxis currently waiting in the queue. Scan rank QR to join.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Long Distance Passenger Register */}
        {activeTab === "boarding" && (
          <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Register Long-Distance Passenger</h2>
            <form onSubmit={handleRegisterPassenger} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">Passenger Full Name</label>
                  <input
                    type="text"
                    value={formData.passengerName}
                    onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                    placeholder="e.g. Sindi Ndlovu"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">Passenger Cell Number</label>
                  <input
                    type="tel"
                    value={formData.passengerCell}
                    onChange={(e) => setFormData({ ...formData, passengerCell: e.target.value })}
                    placeholder="e.g. 0722334455"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">Next of Kin Name</label>
                  <input
                    type="text"
                    value={formData.nextOfKinName}
                    onChange={(e) => setFormData({ ...formData, nextOfKinName: e.target.value })}
                    placeholder="Family member full name"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">Next of Kin Cell Number</label>
                  <input
                    type="tel"
                    value={formData.nextOfKinCell}
                    onChange={(e) => setFormData({ ...formData, nextOfKinCell: e.target.value })}
                    placeholder="Family member cell number"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4 mt-2">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">Select Boarding Taxi</label>
                  <select
                    value={formData.taxiId}
                    onChange={(e) => {
                      const selected = taxis.find(t => t.taxiId === e.target.value);
                      setFormData({ ...formData, taxiId: e.target.value, fare: selected ? selected.fare : "" });
                    }}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    required
                  >
                    {taxis.map(t => (
                      <option key={t.taxiId} value={t.taxiId}>
                        {t.registrationNumber} ({t.driverName})
                      </option>
                    ))}
                    {taxis.length === 0 && (
                      <option value="">No taxis registered at this rank</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">Fare Price (ZAR)</label>
                  <input
                    type="number"
                    value={formData.fare}
                    onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-sm">Destination City</label>
                <input
                  type="text"
                  value={formData.toLocation}
                  onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                  placeholder="e.g. Pretoria"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || taxis.length === 0}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white py-3.5 rounded-xl font-bold transition shadow-sm hover:shadow mt-4"
              >
                {loading ? "Registering & Dispatching..." : "Confirm Boarding & Dispatch"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
