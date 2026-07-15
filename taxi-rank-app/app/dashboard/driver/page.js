"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../../../components/Navbar";

export default function DriverTerminal() {
  const [cellNumber, setCellNumber] = useState("");
  const [isIdentified, setIsIdentified] = useState(false);
  const [driverState, setDriverState] = useState(null);
  const [ranks, setRanks] = useState([]);
  const [selectedRankId, setSelectedRankId] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load ranks for scanning option
    const fetchRanks = async () => {
      try {
        const res = await axios.get("/api/ranks");
        setRanks(res.data);
        if (res.data.length > 0) {
          setSelectedRankId(res.data[0].rankId);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRanks();
  }, []);

  const handleIdentify = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.get(`/api/drivers/${cellNumber}`);
      setDriverState(res.data);
      setIsIdentified(true);
    } catch (err) {
      setError(err.response?.data?.error || "Driver profile not found. Make sure your owner has registered you.");
    } finally {
      setLoading(false);
    }
  };

  const reloadStatus = async () => {
    if (!cellNumber) return;
    try {
      const res = await axios.get(`/api/drivers/${cellNumber}`);
      setDriverState(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinQueue = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const rank = ranks.find(r => r.rankId === selectedRankId);
      await axios.post("/api/qr/scan", {
        qrId: `qr-${selectedRankId}`,
        driverCell: cellNumber
      });
      setMessage(`Successfully joined queue at ${rank?.rankName}!`);
      reloadStatus();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to join queue");
    } finally {
      setLoading(false);
    }
  };

  const handleDepart = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await axios.post("/api/rides/start", {
        taxiId: driverState.taxi.taxiId,
        fromLocation: driverState.taxi.rankName,
        toLocation: "Dispatched Destination",
        fare: driverState.taxi.fare,
        isLongDistance: false
      });
      
      // Update queue entry status to completed (removes from queue)
      if (driverState.queue) {
        await axios.post("/api/rides/complete", { rideId: res.data.ride.rideId }); // Mock complete to auto-conclude or let them click
      }

      setMessage("Ride started! Drive safely.");
      reloadStatus();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to start ride");
    } finally {
      setLoading(false);
    }
  };

  const handleConclude = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (driverState.activeRide) {
        await axios.post("/api/rides/complete", {
          rideId: driverState.activeRide.rideId
        });
      }
      setMessage("Ride completed successfully. Your earnings have been updated.");
      reloadStatus();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to complete ride");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        {!isIdentified ? (
          <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-md border border-slate-700 shadow-xl">
            <div className="text-4xl text-center mb-4">🚕</div>
            <h2 className="text-2xl font-bold text-center mb-2">Driver Terminal</h2>
            <p className="text-slate-400 text-xs font-light text-center mb-8">Enter cell number to access your taxi controls</p>

            {error && (
              <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleIdentify} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-2 text-sm">Driver Cellphone Number</label>
                <input
                  type="tel"
                  value={cellNumber}
                  onChange={(e) => setCellNumber(e.target.value)}
                  placeholder="e.g. 0829876543"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition shadow-md disabled:opacity-50"
              >
                {loading ? "Checking..." : "Access Terminal"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-md border border-slate-700 shadow-xl space-y-6">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-700 pb-4">
              <div>
                <h2 className="text-xl font-bold">{driverState.driver.fullName}</h2>
                <p className="text-slate-400 text-xs mt-0.5">Taxi Plate: <span className="text-yellow-400 font-semibold">{driverState.taxi?.registrationNumber}</span></p>
              </div>
              <button
                onClick={() => { setIsIdentified(false); setDriverState(null); }}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                Log Out
              </button>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/30 text-red-200 p-3 rounded-lg text-xs">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-900/30 border border-green-500/30 text-green-200 p-3 rounded-lg text-xs">
                {message}
              </div>
            )}

            {/* Dynamic content depending on status */}
            {driverState.activeRide ? (
              // Case 1: Driver is on a ride
              <div className="space-y-4 text-center">
                <div className="text-red-400 font-semibold animate-pulse text-sm">● TRIP IN-PROGRESS</div>
                <div className="bg-slate-700/50 p-4 rounded-xl text-left text-sm space-y-2 border border-slate-600/50">
                  <div><span className="text-slate-400">From:</span> {driverState.activeRide.fromLocation}</div>
                  <div><span className="text-slate-400">To:</span> {driverState.activeRide.toLocation}</div>
                  <div><span className="text-slate-400">Fare:</span> R {driverState.activeRide.fare}</div>
                </div>
                <button
                  onClick={handleConclude}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold transition shadow-md"
                >
                  Conclude Ride
                </button>
              </div>
            ) : driverState.queue ? (
              // Case 2: Driver is waiting in the queue
              <div className="space-y-6 text-center">
                <div className="bg-blue-900/30 border border-blue-500/30 p-6 rounded-2xl">
                  <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Queue Position</span>
                  <span className="text-5xl font-extrabold text-blue-400">#{driverState.queue.queuePosition}</span>
                  <span className="text-slate-400 text-xs block mt-2">Rank: {driverState.queue.rankName}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={reloadStatus}
                    className="flex-1 bg-slate-700 hover:bg-slate-650 text-white py-3 rounded-xl font-bold transition text-xs"
                  >
                    Check Position
                  </button>
                  <button
                    onClick={handleDepart}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition text-xs shadow-md"
                  >
                    Depart
                  </button>
                </div>
              </div>
            ) : (
              // Case 3: Idle driver. Needs to join queue
              <div className="space-y-6">
                <div className="text-slate-400 text-xs text-center">Your taxi is currently out of service. Select rank and scan QR code to join the queue.</div>
                
                <div className="space-y-3">
                  <label className="block text-slate-300 font-semibold text-xs">Select Rank Location</label>
                  <select
                    value={selectedRankId}
                    onChange={(e) => setSelectedRankId(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm"
                  >
                    {ranks.map(r => (
                      <option key={r.rankId} value={r.rankId}>{r.rankName}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleJoinQueue}
                    disabled={loading}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-blue-900 py-3.5 rounded-xl font-bold transition shadow-md mt-2"
                  >
                    Scan QR to Join Queue
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
