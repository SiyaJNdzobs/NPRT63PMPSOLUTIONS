import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
// import * as bcrypt from 'bcryptjs';
// import * as sgMail from '@sendgrid/mail';

admin.initializeApp();

// ─────────────────────────────────────────────────────────────────────────────
// validatePin
// Called by custom_auth/auth_service.dart to authenticate a user.
// Accepts: { identifier: string (cell or email), pin: string (6-digit) }
// Returns: { uid: string, role: string, displayName: string }
// TODO: look up user doc by cellNumber or email, compare bcrypt hash, return session info.
// ─────────────────────────────────────────────────────────────────────────────
export const validatePin = functions.https.onCall(async (data, context) => {
  // TODO: implement
  throw new functions.https.HttpsError('unimplemented', 'validatePin not yet implemented');
});

// ─────────────────────────────────────────────────────────────────────────────
// hashAndStorePin
// Called server-side when a user sets or resets their PIN.
// Accepts: { uid: string, newPin: string }
// TODO: bcrypt.hash(newPin, 12) and write pinHash to Firestore user doc.
// ─────────────────────────────────────────────────────────────────────────────
export const hashAndStorePin = functions.https.onCall(async (data, context) => {
  // TODO: implement — ensure caller is authenticated admin or the user themselves
  throw new functions.https.HttpsError('unimplemented', 'hashAndStorePin not yet implemented');
});

// ─────────────────────────────────────────────────────────────────────────────
// sendOtpEmail
// Generates a 6-digit OTP, stores it (TTL 10 min) in Firestore, emails it.
// Accepts: { email: string }
// TODO: implement via SendGrid (@sendgrid/mail) — set SENDGRID_API_KEY in .env.
// ─────────────────────────────────────────────────────────────────────────────
export const sendOtpEmail = functions.https.onCall(async (data, context) => {
  // TODO: implement
  throw new functions.https.HttpsError('unimplemented', 'sendOtpEmail not yet implemented');
});

// ─────────────────────────────────────────────────────────────────────────────
// verifyOtp
// Accepts: { email: string, otp: string }
// Returns: { valid: boolean }
// TODO: check Firestore OTP record, enforce TTL and single-use.
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOtp = functions.https.onCall(async (data, context) => {
  // TODO: implement
  throw new functions.https.HttpsError('unimplemented', 'verifyOtp not yet implemented');
});

// ─────────────────────────────────────────────────────────────────────────────
// processExcelImport
// Triggered when an Excel file lands in Firebase Storage (or called directly).
// Accepts: { storageRef: string }
// TODO: download file, parse with exceljs/xlsx, bulk-write owners + taxis to Firestore.
// ─────────────────────────────────────────────────────────────────────────────
export const processExcelImport = functions.https.onCall(async (data, context) => {
  // TODO: implement — restrict to admin role
  throw new functions.https.HttpsError('unimplemented', 'processExcelImport not yet implemented');
});

// ─────────────────────────────────────────────────────────────────────────────
// aggregateRevenue
// Accepts: { ownerId: string, period: 'day' | 'week' | 'month' }
// Returns: aggregated revenue totals per taxi/driver.
// TODO: query 'trips' collection, group and sum.
// ─────────────────────────────────────────────────────────────────────────────
export const aggregateRevenue = functions.https.onCall(async (data, context) => {
  // TODO: implement
  throw new functions.https.HttpsError('unimplemented', 'aggregateRevenue not yet implemented');
});

// ─────────────────────────────────────────────────────────────────────────────
// sendNextOfKinEmail  (Firestore trigger)
// Fires when a long-distance trip document is created with isLongDistance=true.
// TODO: send email to trip.nextOfKinEmail via SendGrid.
// ─────────────────────────────────────────────────────────────────────────────
export const onLongDistanceTripCreated = functions.firestore
  .document('trips/{tripId}')
  .onCreate(async (snap, context) => {
    const trip = snap.data();
    if (!trip.isLongDistance || !trip.nextOfKinEmail) return;
    // TODO: implement SendGrid email
  });
