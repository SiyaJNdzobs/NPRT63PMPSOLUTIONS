"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";

export default function Login() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      const role = localStorage.getItem("role");
      if (role) {
        router.push(`/dashboard/${role}`);
      }
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        router.push(`/dashboard/${res.role}`);
      }
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 w-full max-w-md">
          <h2 className="text-3xl font-black text-center text-slate-100 mb-2">Sign In</h2>
          <p className="text-center text-slate-500 mb-8 font-light text-sm">Access your E-Rank dashboard</p>

          {error && (
            <div className="bg-red-950/40 border-l-4 border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm border border-red-900/50">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 font-semibold mb-2 text-sm">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@taxirank.co.za"
                className="w-full border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-950/50 text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-2 text-sm">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-950/50 text-slate-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition shadow-sm hover:shadow disabled:opacity-50 mt-2"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-slate-400 mt-6 text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-400 font-semibold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </main>

      <footer className="bg-slate-950 text-slate-500 text-center py-6 border-t border-slate-900">
        <p className="text-sm">© 2024 E-Rank System. Property of PMP Solutions.</p>
      </footer>
    </div>
  );
}
