"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "../../../components/Navbar";

export default function AdminDashboard() {
  const { user, role } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [reviews, setReviews] = useState([]);
  
  // Forms state
  const [newsForm, setNewsForm] = useState({ title: "", content: "", type: "general", priority: "medium" });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || role !== "admin") {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [statsRes, overviewRes, reviewsRes] = await Promise.all([
          axios.get("/api/admin/stats"),
          axios.get("/api/admin/overview"),
          axios.get("/api/admin/reviews")
        ]);
        setStats(statsRes.data);
        setOverviewData(overviewRes.data);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.error("Failed to load admin data:", err);
      }
    };

    fetchData();
  }, [user, role]);

  const handlePostNews = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post("/api/news/add", {
        ...newsForm,
        author: user?.fullName || "Admin"
      });
      setMessage("News announcement published successfully!");
      setNewsForm({ title: "", content: "", type: "general", priority: "medium" });
      
      // Reload overview
      const overviewRes = await axios.get("/api/admin/overview");
      setOverviewData(overviewRes.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to post news");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await axios.post("/api/auth/change-password", {
        email: user.email,
        newPassword: passwordForm.newPassword
      });
      setMessage("Password changed successfully!");
      setPasswordForm({ newPassword: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (!user || role !== "admin") return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Admin Control Panel</h1>
            <p className="text-slate-500 text-sm font-light mt-1">Platform management and analytics</p>
          </div>
          {/* Tabs */}
          <div className="bg-slate-200/60 p-1.5 rounded-xl flex gap-1 self-stretch md:self-auto">
            {["overview", "reviews", "publish", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setError("");
                  setMessage("");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-white text-blue-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        {message && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg mb-8 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-8 text-sm">
            {error}
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-10">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Total Taxis</span>
                <span className="text-3xl font-extrabold text-slate-800">{stats?.totalTaxis || 0}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Total Trips/Rides</span>
                <span className="text-3xl font-extrabold text-slate-800">{stats?.totalRides || 0}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Total Platform Revenue</span>
                <span className="text-3xl font-extrabold text-blue-700">R {stats?.totalRevenue || 0}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Ranks & Marshals</span>
                <span className="text-3xl font-extrabold text-slate-800">
                  {stats?.totalMarshals || 0} / {overviewData?.ranks?.length || 0}
                </span>
              </div>
            </div>

            {/* Overview Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ranks listing */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Active Taxi Ranks</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400">
                        <th className="py-2.5 font-semibold">Rank Name</th>
                        <th className="py-2.5 font-semibold">Location</th>
                        <th className="py-2.5 font-semibold">Marshal ID</th>
                        <th className="py-2.5 font-semibold">QR Poster</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overviewData?.ranks?.map((rank) => (
                        <tr key={rank.rankId} className="border-b border-slate-50 text-slate-600">
                          <td className="py-3 font-semibold text-slate-800">{rank.rankName}</td>
                          <td className="py-3">{rank.city}, {rank.province}</td>
                          <td className="py-3 text-slate-400 text-xs">{rank.marshalId || "None"}</td>
                          <td className="py-3">
                            <a
                              href={`/qr/print?rankId=${rank.rankId}&rankName=${encodeURIComponent(rank.rankName)}&city=${encodeURIComponent(rank.city)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-[#1e3a5f] hover:bg-[#16304f] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              🖨️ Print QR
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Owners listing */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Registered Owners</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400">
                        <th className="py-2.5 font-semibold">Owner Name</th>
                        <th className="py-2.5 font-semibold">Cell Phone</th>
                        <th className="py-2.5 font-semibold">Rank Area</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overviewData?.owners?.map((owner) => (
                        <tr key={owner.ownerId} className="border-b border-slate-50 text-slate-600">
                          <td className="py-3 font-semibold text-slate-800">{owner.fullName}</td>
                          <td className="py-3">{owner.cellNumber}</td>
                          <td className="py-3">{owner.rankName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Reviews Table */}
        {activeTab === "reviews" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6">User Reviews & Ratings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-400">
                    <th className="py-3 font-semibold">User</th>
                    <th className="py-3 font-semibold">Role</th>
                    <th className="py-3 font-semibold">Rating</th>
                    <th className="py-3 font-semibold">Comment</th>
                    <th className="py-3 font-semibold">Rank Reviewed</th>
                    <th className="py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((rev) => (
                    <tr key={rev.reviewId} className="border-b border-slate-50 text-slate-600 hover:bg-slate-50/50">
                      <td className="py-4 font-semibold text-slate-800">{rev.userName}</td>
                      <td className="py-4"><span className="bg-slate-100 px-2.5 py-1 rounded text-xs">{rev.userRole}</span></td>
                      <td className="py-4 text-yellow-500 font-bold">{"★".repeat(rev.rating)}{"☆".repeat(5-rev.rating)} ({rev.rating})</td>
                      <td className="py-4 text-slate-500">{rev.comment}</td>
                      <td className="py-4 font-semibold">{rev.rankName || "N/A"}</td>
                      <td className="py-4 text-slate-400 text-xs">{new Date(rev.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {reviews.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-400">No user reviews submitted yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Publish News */}
        {activeTab === "publish" && (
          <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Publish Service Announcement</h3>
            <form onSubmit={handlePostNews} className="space-y-5">
              <div>
                <label className="block text-slate-700 font-semibold mb-2 text-sm">News Headline</label>
                <input
                  type="text"
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  placeholder="e.g. Strike Notice: Bloemfontein CBD area"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2 text-sm">Details & Description</label>
                <textarea
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                  placeholder="Provide all relevant details for passengers and drivers..."
                  rows="4"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-2 text-sm">Category Type</label>
                  <select
                    value={newsForm.type}
                    onChange={(e) => setNewsForm({ ...newsForm, type: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                  >
                    <option value="general">General Update</option>
                    <option value="strike">Taxi Strike</option>
                    <option value="price_increase">Price Increase</option>
                    <option value="disturbance">Disturbance / Delay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-2 text-sm">Priority Alert level</label>
                  <select
                    value={newsForm.priority}
                    onChange={(e) => setNewsForm({ ...newsForm, priority: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority (Urgent Alert)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-850 hover:bg-blue-900 text-white bg-blue-800 py-3.5 rounded-xl font-bold transition shadow-sm hover:shadow"
              >
                {loading ? "Publishing Alert..." : "Publish Announcement"}
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Settings (Change Password) */}
        {activeTab === "settings" && (
          <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Change Security Credentials</h3>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="block text-slate-700 font-semibold mb-2 text-sm">New Secure Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-xl font-bold transition shadow-sm"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
