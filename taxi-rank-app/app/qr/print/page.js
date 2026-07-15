"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

/**
 * /qr/print?rankId=rank-bree&rankName=Bree+Street+Taxi+Rank&city=Johannesburg
 *
 * Displays a branded, printable QR-code poster matching the physical
 * E-RANK poster design (navy header, QR image, branded footer).
 * Works without any authentication — marshals/admins print directly.
 */
export default function QRPrintPage() {
  const params = useSearchParams();
  const rankId   = params.get("rankId");
  const rankName = params.get("rankName") || "Taxi Rank";
  const city     = params.get("city") || "";

  const [qrSrc, setQrSrc]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const printRef              = useRef(null);

  useEffect(() => {
    if (!rankId) {
      setError("No rankId supplied in the URL.");
      setLoading(false);
      return;
    }

    const fetchOrGenerate = async () => {
      try {
        // Try to fetch existing QR code first
        const existing = await axios.get(`/api/qr/rank/${rankId}`).catch(() => null);

        if (existing?.data?.qrCodeImage) {
          setQrSrc(existing.data.qrCodeImage);
        } else {
          // Generate a fresh one
          const res = await axios.post("/api/qr/generate", { rankId, rankName, city });
          setQrSrc(res.data.qrCode.qrCodeImage);
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to generate QR code");
      } finally {
        setLoading(false);
      }
    };

    fetchOrGenerate();
  }, [rankId, rankName, city]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Generating QR Code…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-md">
          <p className="text-red-600 font-semibold text-lg mb-2">Error</p>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print button — hidden when printing */}
      <div className="print:hidden flex justify-center gap-4 p-4 bg-slate-100">
        <button
          onClick={handlePrint}
          className="bg-[#1e3a5f] hover:bg-[#16304f] text-white px-8 py-3 rounded-xl font-bold shadow transition"
        >
          🖨️ Print This Poster
        </button>
        <a
          href="/dashboard/admin"
          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold transition"
        >
          ← Back to Dashboard
        </a>
      </div>

      {/* ── POSTER ────────────────────────────────────────────────────────── */}
      <div
        ref={printRef}
        className="qr-poster"
        style={{
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Segoe UI', Arial, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#1e3a5f",
            padding: "28px 24px 22px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              color: "#ffffff",
              fontSize: "36px",
              fontWeight: "900",
              letterSpacing: "4px",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            E-RANK
          </h1>
          <p
            style={{
              color: "#a8c5e0",
              fontSize: "15px",
              margin: "6px 0 0",
              fontWeight: "400",
              letterSpacing: "1px",
            }}
          >
            Scan to Join the Queue
          </p>
        </div>

        {/* QR Code body */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
            gap: "24px",
          }}
        >
          {qrSrc && (
            <img
              src={qrSrc}
              alt={`QR Code for ${rankName}`}
              style={{
                width: "260px",
                height: "260px",
                display: "block",
                border: "none",
              }}
            />
          )}

          <p
            style={{
              color: "#6b7280",
              fontSize: "13px",
              textAlign: "center",
              maxWidth: "220px",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            Drivers: scan with your phone camera or E-RANK app to join the queue
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            background: "#1e3a5f",
            padding: "20px 24px",
            textAlign: "center",
            borderTop: "4px solid #2ecc71",
          }}
        >
          <p
            style={{
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "16px",
              margin: "0 0 6px",
              letterSpacing: "0.5px",
            }}
          >
            {rankName}
            {city ? ` • ${city}` : ""} &nbsp;•&nbsp; Drivers Only
          </p>
          <p
            style={{
              color: "#a8c5e0",
              fontSize: "12px",
              margin: "0 0 4px",
            }}
          >
            © PMP Solutions 2024 &nbsp;•&nbsp; E-RANK System
          </p>
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontWeight: "600",
              margin: 0,
            }}
          >
            Do NOT modify or duplicate this QR code
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .qr-poster {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            page-break-after: avoid;
          }
        }
      `}</style>
    </>
  );
}
