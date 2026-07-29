/**
 * lib/constants.js — App-wide constants
 */

// ── SA Provinces ──────────────────────────────────────────────────────────────
export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
];

// ── Review categories ─────────────────────────────────────────────────────────
export const REVIEW_CATEGORIES = [
  'Queue Management',
  'Driver Conduct',
  'Vehicle Condition',
  'Wait Time',
  'Safety Concern',
  'Fare Issue',
  'General Feedback',
];

// ── Review statuses ───────────────────────────────────────────────────────────
export const REVIEW_STATUSES = ['new', 'acknowledged', 'resolved'];

// ── Queue entry statuses ──────────────────────────────────────────────────────
export const QUEUE_STATUSES = {
  WAITING:   'waiting',
  LOADING:   'loading',
  DEPARTED:  'departed',
};

// ── Internal auth email domain ────────────────────────────────────────────────
// Owner and Marshal Supabase Auth accounts use this domain internally.
// Users never see or type this — they only enter their cell number.
export const AUTH_EMAIL_DOMAIN = 'erank.app';

// ── Cell number regex (SA) ────────────────────────────────────────────────────
// Matches: 06XXXXXXXX, 07XXXXXXXX, 08XXXXXXXX
export const CELL_REGEX = /^0[6-8][0-9]{8}$/;

// ── Estimated wait per vehicle (minutes) ─────────────────────────────────────
export const ESTIMATED_LOAD_MINUTES = 8;

// ── Late trip passenger threshold ─────────────────────────────────────────────
export const LATE_TRIP_MIN_PASSENGERS = 5;

// ── WhatsApp deep link builder ────────────────────────────────────────────────
export const buildWhatsAppLink = (phoneNumber, message) => {
  // Strip leading zero, add country code for SA (+27)
  const intlNumber = phoneNumber.startsWith('0')
    ? `27${phoneNumber.slice(1)}`
    : phoneNumber;
  return `whatsapp://send?phone=${intlNumber}&text=${encodeURIComponent(message)}`;
};
