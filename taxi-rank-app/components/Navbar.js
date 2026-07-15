"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="bg-slate-950 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-black tracking-wider flex items-center gap-2 text-blue-400">
              E-RANK
            </Link>
            <div className="hidden md:block ml-10 flex items-baseline space-x-4">
              <Link href="/" className="hover:bg-slate-900 px-3 py-2 rounded-md text-sm font-medium transition">
                Home
              </Link>
              <Link href="/about" className="hover:bg-slate-900 px-3 py-2 rounded-md text-sm font-medium transition">
                About
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-slate-400">
                  {user.fullName} ({role?.toUpperCase()})
                </span>
                <Link
                  href={`/dashboard/${role}`}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition border border-slate-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:bg-slate-900 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
