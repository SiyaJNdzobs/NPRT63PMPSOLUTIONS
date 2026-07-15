import Link from "next/link";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-24 px-4 text-center shadow-inner">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            E-RANK SYSTEM
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Modernizing South Africa's minibus taxi industry through digital queue management, fleet oversight, and passenger accountability.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 px-10 py-4 rounded-full font-bold text-lg transition duration-200 transform hover:scale-105 shadow-md"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="border-2 border-white/60 hover:border-white bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-full font-semibold text-lg transition duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Services Grid */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-slate-800 mb-16">
          Core Digital Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 transition hover:shadow-md">
            <div className="text-4xl bg-blue-100 text-blue-700 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              🚕
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Queue Management</h3>
            <p className="text-slate-600 leading-relaxed">
              Drivers join the queue instantly by scanning QR codes at the ranks. Real-time updates prevent disputes and optimize passenger loading workflows.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 transition hover:shadow-md">
            <div className="text-4xl bg-indigo-100 text-indigo-700 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              👥
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Passenger Safety</h3>
            <p className="text-slate-600 leading-relaxed">
              Captures seat logs, next-of-kin contact info for long-distance routes, and generates secure ride-sharing tracking links for friends and family.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 transition hover:shadow-md">
            <div className="text-4xl bg-yellow-100 text-yellow-700 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              📊
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Fleet Reporting</h3>
            <p className="text-slate-600 leading-relaxed">
              Provides taxi owners with transparent insights into fleet utilization, trip logs, and total earnings calculations directly from rank load cycles.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 text-center py-8 border-t border-slate-700">
        <p className="text-sm">© 2024 E-Rank System. Property of PMP Solutions. Founded in 2024 in Kimberley.</p>
      </footer>
    </div>
  );
}
