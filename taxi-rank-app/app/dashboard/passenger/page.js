"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "../../../components/Navbar";

export default function PassengerDashboard() {
  const { user, role } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("taxis");
  const [ranks, setRanks] = useState([]);
  const [selectedRank, setSelectedRank] = useState(null);
  const [taxis, setTaxis] = useState([]);
  const [news, setNews] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "", rankName: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [taxiLoading, setTaxiLoading] = useState(false);

  useEffect(() => {
    if (!user || role !== "passenger") {
      router.push("/login");
      return;
    }

    const fetchInitialData = async () => {
      try {
        const [ranksRes, newsRes, reviewsRes] = await Promise.all([
          axios.get("/api/ranks"),
          axios.get("/api/news/active"),
          axios.get("/api/reviews/all"),
        ]);
        setRanks(ranksRes.data);
        setNews(newsRes.data);
        setReviews(reviewsRes.data);

        if (ranksRes.data.length > 0) {
          setSelectedRank(ranksRes.data[0]);
          setReviewForm((prev) => ({ ...prev, rankName: ranksRes.data[0].rankName }));
        }
      } catch (err) {
        console.error("Failed to load passenger data:", err);
      }
    };

    fetchInitialData();
  }, [user, role]);

  const loadTaxisForRank = async (rank) => {
    setSelectedRank(rank);
    setTaxiLoading(true);
    setTaxis([]);
    try {
      const res = await axios.get(`/api/taxis/rank/${encodeURIComponent(rank.rankName)}`);
      setTaxis(res.data);
    } catch (err) {
      console.error("Failed to load taxis:", err);
    } finally {
      setTaxiLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await axios.post("/api/reviews/add", {
        userId: user?.uid || "guest",
        userRole: "passenger",
        userName: user?.fullName || "Anonymous Passenger",
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        rankName: reviewForm.rankName,
      });
      setMessage("Review submitted! Thank you for your feedback.");
      setReviewForm((prev) => ({ ...prev, rating: 5, comment: "" }));

      // Refresh reviews
      const reviewsRes = await axios.get("/api/reviews/all");
      setReviews(reviewsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const priorityColor = (priority) => {
    if (priority === "high") return "bg-red-100 text-red-800 border-red-200";
    if (priority === "medium") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  if (!user || role !== "passenger") return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Passenger Dashboard</h1>
            <p className="text-slate-500 text-sm font-light mt-1">
              Welcome, <span className="font-semibold text-blue-800">{user.fullName}</span>
            </p>
          </div>
          <div className="bg-slate-200/60 p-1.5 rounded-xl flex flex-wrap gap-1 self-stretch sm:self-auto">
            {["taxis", "news", "reviews", "write-review"].map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(""); setMessage(""); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition ${
                  activeTab === tab ? "bg-white text-blue-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab === "write-review" ? "Leave Review" : tab}
              </button>
            ))}
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

        {/* Tab 1: Find Taxis at Rank */}
        {activeTab === "taxis" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Rank Selector Sidebar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 lg:col-span-1">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Select a Rank</h3>
              <div className="space-y-2">
                {ranks.map((rank) => (
                  <button
                    key={rank.rankId}
                    onClick={() => loadTaxisForRank(rank)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition font-medium ${
                      selectedRank?.rankId === rank.rankId
                        ? "bg-blue-800 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {rank.rankName}
                    <span className={`block text-xs mt-0.5 font-light ${selectedRank?.rankId === rank.rankId ? "text-blue-200" : "text-slate-400"}`}>
                      {rank.city}, {rank.province}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Taxis Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">
                  Available Taxis at{" "}
                  <span className="text-blue-800">{selectedRank?.rankName || "..."}</span>
                </h3>
                {selectedRank && (
                  <button
                    onClick={() => loadTaxisForRank(selectedRank)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-semibold transition"
                  >
                    Refresh
                  </button>
                )}
              </div>

              {taxiLoading ? (
                <div className="text-center py-12 text-slate-400">Loading taxis...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400">
                        <th className="py-3 font-semibold">Registration</th>
                        <th className="py-3 font-semibold">Driver</th>
                        <th className="py-3 font-semibold">Capacity</th>
                        <th className="py-3 font-semibold">Fare (ZAR)</th>
                        <th className="py-3 font-semibold">Status</th>
                        <th className="py-3 font-semibold">Total Trips</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxis.map((taxi) => (
                        <tr key={taxi.taxiId} className="border-b border-slate-50 text-slate-600 hover:bg-slate-50/50">
                          <td className="py-4 font-bold text-blue-900">{taxi.registrationNumber}</td>
                          <td className="py-4 font-semibold text-slate-800">{taxi.driverName}</td>
                          <td className="py-4">{taxi.capacity} seats</td>
                          <td className="py-4 font-bold text-green-700">R {taxi.fare}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              taxi.isAvailable ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                            }`}>
                              {taxi.isAvailable ? "Available" : "On Route"}
                            </span>
                          </td>
                          <td className="py-4">{taxi.totalRides} rides</td>
                        </tr>
                      ))}
                      {!taxiLoading && taxis.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-12 text-slate-400">
                            No taxis registered at this rank yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Active News / Alerts */}
        {activeTab === "news" && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Live Service Announcements</h2>
            {news.length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100">
                No active news or alerts at the moment.
              </div>
            )}
            {news.map((item) => (
              <div
                key={item.newsId}
                className={`border rounded-2xl p-6 ${priorityColor(item.priority)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider opacity-70 block mb-1">
                      {item.type.replace("_", " ")} · {item.priority} priority
                    </span>
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-sm opacity-80 leading-relaxed">{item.content}</p>
                  </div>
                  <div className="text-right text-xs opacity-60 whitespace-nowrap">
                    <div>By {item.author}</div>
                    <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Reviews from others */}
        {activeTab === "reviews" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Community Rank Reviews</h2>
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.reviewId} className="border border-slate-100 rounded-2xl p-5">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="font-bold text-slate-800">{rev.userName}</div>
                      <div className="text-slate-400 text-xs">{rev.rankName || "General"}</div>
                    </div>
                    <div className="text-yellow-500 font-bold text-sm whitespace-nowrap">
                      {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm mt-3 leading-relaxed">{rev.comment}</p>
                  <div className="text-slate-400 text-xs mt-2">{new Date(rev.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="text-center py-10 text-slate-400">No reviews yet. Be the first to leave one!</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Write a Review */}
        {activeTab === "write-review" && (
          <div className="max-w-lg bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Write a Rank Review</h2>
            <form onSubmit={handleSubmitReview} className="space-y-5">
              <div>
                <label className="block text-slate-700 font-semibold mb-2 text-sm">Select Taxi Rank</label>
                <select
                  value={reviewForm.rankName}
                  onChange={(e) => setReviewForm({ ...reviewForm, rankName: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                >
                  {ranks.map((r) => (
                    <option key={r.rankId} value={r.rankName}>{r.rankName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2 text-sm">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className={`text-3xl transition ${star <= reviewForm.rating ? "text-yellow-500" : "text-slate-300"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2 text-sm">Your Experience</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Share your experience with this rank..."
                  rows="4"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white py-3.5 rounded-xl font-bold transition shadow-sm hover:shadow"
              >
                {loading ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        )}
      </div>

      <footer className="bg-slate-800 text-slate-400 text-center py-8">
        <p className="text-sm">© 2024 E-Rank System. Property of PMP Solutions.</p>
      </footer>
    </div>
  );
}
