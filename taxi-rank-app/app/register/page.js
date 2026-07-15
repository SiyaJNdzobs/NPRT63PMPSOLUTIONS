"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Navbar from "../../components/Navbar";

export default function Register() {
  const { register, user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    cellNumber: "",
    password: "",
    role: "passenger",
    adminCode: "",
    rankName: "",
  });

  const [ranks, setRanks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available ranks for registration dropdown
    const fetchRanks = async () => {
      try {
        const res = await axios.get("/api/ranks");
        setRanks(res.data);
        if (res.data.length > 0) {
          setFormData((prev) => ({ ...prev, rankName: res.data[0].rankName }));
        }
      } catch (err) {
        console.error("Failed to load ranks:", err);
      }
    };
    fetchRanks();
  }, []);

  // If already logged in, redirect
  if (user) {
    const role = localStorage.getItem("role");
    if (role) {
      router.push(`/dashboard/${role}`);
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await register(formData);
      if (res.success) {
        router.push(`/dashboard/${res.role}`);
      }
    } catch (err) {
      setError(err.message || "Failed to create account. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-md">
          <h2 className="text-3xl font-extrabold text-center text-slate-800 mb-2">Create Account</h2>
          <p className="text-center text-slate-500 mb-8 font-light text-sm">Join the E-Rank network</p>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 text-sm">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Thabo Molefe"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 text-sm">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="thabo@gmail.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 text-sm">Cellphone Number</label>
              <input
                type="tel"
                name="cellNumber"
                value={formData.cellNumber}
                onChange={handleChange}
                placeholder="e.g. 0821234567"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 text-sm">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 text-sm">Select Your Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              >
                <option value="passenger">Passenger</option>
                <option value="marshal">Marshal (Rank Coordinator)</option>
                <option value="owner">Taxi Owner</option>
                <option value="admin">System Admin</option>
              </select>
            </div>

            {/* Conditionally show Rank selection for Marshals and Owners */}
            {(formData.role === "marshal" || formData.role === "owner") && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5 text-sm">Assigned Taxi Rank</label>
                <select
                  name="rankName"
                  value={formData.rankName}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                >
                  {ranks.map((r) => (
                    <option key={r.rankId} value={r.rankName}>
                      {r.rankName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Conditionally show Admin Secret Code input */}
            {formData.role === "admin" && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5 text-sm">Admin Secret Activation Code</label>
                <input
                  type="password"
                  name="adminCode"
                  value={formData.adminCode}
                  onChange={handleChange}
                  placeholder="Enter 4-digit code"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 hover:bg-blue-900 text-white py-3.5 rounded-xl font-bold transition shadow-sm hover:shadow disabled:opacity-50 mt-4"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-slate-600 mt-6 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>

      <footer className="bg-slate-800 text-slate-400 text-center py-6">
        <p className="text-sm">© 2024 E-Rank System. Property of PMP Solutions.</p>
      </footer>
    </div>
  );
}
