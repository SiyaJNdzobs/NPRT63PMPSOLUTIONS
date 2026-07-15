import Link from "next/link";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      {/* Hero Section */}
      <header className="bg-slate-900 border-b border-slate-800 py-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 text-blue-500">
            E-RANK SYSTEM
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Modernizing South Africa's minibus taxi industry through digital queue management, fleet oversight, and passenger accountability.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition duration-200"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="border border-slate-700 hover:border-slate-600 bg-slate-800 hover:bg-slate-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Services Grid */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-slate-100 mb-16">
          Core Digital Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 transition hover:border-slate-700">
            <div className="text-blue-500 font-bold uppercase tracking-wider text-xs mb-4">
              Service 01
            </div>
            <h3 className="text-2xl font-bold text-slate-100 mb-3">Queue Management</h3>
            <p className="text-slate-400 leading-relaxed">
              Drivers join the queue instantly by scanning QR codes at the ranks. Real-time updates prevent disputes and optimize passenger loading workflows.
            </p>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 transition hover:border-slate-700">
            <div className="text-blue-500 font-bold uppercase tracking-wider text-xs mb-4">
              Service 02
            </div>
            <h3 className="text-2xl font-bold text-slate-100 mb-3">Passenger Safety</h3>
            <p className="text-slate-400 leading-relaxed">
              Captures seat logs, next-of-kin contact info for long-distance routes, and generates secure ride-sharing tracking links for friends and family.
            </p>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 transition hover:border-slate-700">
            <div className="text-blue-500 font-bold uppercase tracking-wider text-xs mb-4">
              Service 03
            </div>
            <h3 className="text-2xl font-bold text-slate-100 mb-3">Fleet Reporting</h3>
            <p className="text-slate-400 leading-relaxed">
              Provides taxi owners with transparent insights into fleet utilization, trip logs, and total earnings calculations directly from rank load cycles.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 text-center py-8 border-t border-slate-900">
        <p className="text-sm">© 2024 E-Rank System. Property of PMP Solutions. Founded in 2024 in Kimberley.</p>
      </footer>
    </div>
  );
}
