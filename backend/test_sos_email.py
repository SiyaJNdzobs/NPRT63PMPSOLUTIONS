"""
Quick diagnostic: tests whether _assert_safe_email blocks the SOS email HTML.
Run with: python test_sos_email.py
"""
import sys
sys.path.insert(0, '.')

from emailer import _assert_safe_email
from html import escape

# Simulate the exact HTML the SOS function builds
owner_name = "Lousa Mdluli"
driver_name = "Siya Ndzobs"
taxi_reg = "CA 123 456"
rank_name = "Kimberly Rank"
route = "Kimberly - Cape Town"
driver_cell = "+27821234567"
created_at = "2026-10-16T12:00:00Z"
subject = f"E-RANK SOS \u2013 {taxi_reg}"

driver_cell_link = f"<a href='tel:{driver_cell}' style='color:#38bdf8;text-decoration:none;font-weight:bold;'>{driver_cell}</a>"

pax_table = (
    "<div style='margin-top:16px;padding:12px 14px;background-color:#f8fafc;"
    "border:1px dashed #cbd5e1;border-radius:6px;color:#64748b;font-size:12px;'>"
    "ℹ️ No passenger manifest recorded for this trip."
    "</div>"
)

html = (
    f"<table role='presentation' width='100%' style='background-color:#f8fafc;padding:20px;font-family:Arial,sans-serif;'>"
    f"<tr><td align='center'>"
    f"<table role='presentation' width='600' style='background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);'>"
    f"<tr><td style='background-color:#b91c1c;padding:18px 24px;color:#ffffff;'>"
    f"<div style='font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#fecaca;'>EMERGENCY DISTRESS SIGNAL</div>"
    f"<h1 style='margin:6px 0 0 0;font-size:22px;color:#ffffff;font-weight:bold;'>SOS ALERT FROM DRIVER</h1>"
    f"</td></tr>"
    f"<tr><td style='padding:24px;'>"
    f"<table role='presentation' width='100%' style='background-color:#0f172a;border-radius:8px;padding:14px;color:#ffffff;font-size:13px;'>"
    f"<tr><td style='color:#94a3b8;padding:4px 8px;width:32%;'>Driver:</td><td style='padding:4px 8px;font-weight:bold;color:#ffffff;'>{escape(driver_name)}</td></tr>"
    f"<tr><td style='color:#94a3b8;padding:4px 8px;'>Driver Contact:</td><td style='padding:4px 8px;'>{driver_cell_link}</td></tr>"
    f"<tr><td style='color:#94a3b8;padding:4px 8px;'>Taxi Reg:</td><td style='padding:4px 8px;font-weight:bold;font-size:15px;color:#ffffff;letter-spacing:0.5px;'>{escape(taxi_reg)}</td></tr>"
    f"<tr><td style='color:#94a3b8;padding:4px 8px;'>Rank:</td><td style='padding:4px 8px;color:#ffffff;'>{escape(rank_name)}</td></tr>"
    f"<tr><td style='color:#94a3b8;padding:4px 8px;'>Route:</td><td style='padding:4px 8px;color:#ffffff;'>{escape(route)}</td></tr>"
    f"<tr><td style='color:#94a3b8;padding:4px 8px;'>Triggered At:</td><td style='padding:4px 8px;color:#fbbf24;font-family:monospace;'>{escape(created_at)}</td></tr>"
    f"</table>"
    f"{pax_table}"
    f"<div style='margin-top:20px;padding:12px;background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;font-size:12px;color:#991b1b;'>"
    f"<strong>Emergency Action:</strong> Contact driver immediately. If unable to reach driver, contact the next-of-kin contacts listed above and inform emergency services."
    f"</div>"
    f"<p style='margin-top:20px;font-size:11px;color:#94a3b8;text-align:center;'>Sent automatically by E-RANK Operations. We never ask for passwords or sensitive payment info by email.</p>"
    f"</td></tr></table>"
    f"</td></tr></table>"
)

print("Testing _assert_safe_email with SOS HTML...")
print(f"Subject: {subject}")
print("-" * 60)
try:
    _assert_safe_email(subject, html)
    print("✅ PASSED — email safety check passed. The HTML is fine.")
    print("   → The problem is NOT in _assert_safe_email.")
    print("   → The problem is either: owner not found in DB, OR the email service is failing.")
except ValueError as e:
    print(f"❌ BLOCKED by _assert_safe_email: {e}")
    print("   → This is WHY email_sent = False. The email HTML is being rejected.")
