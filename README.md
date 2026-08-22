# Taxi Operations App

A cross-platform Flutter + Firebase application for managing minibus taxi rank operations.

## Five User Roles

| Role | Description | Code Location | Platforms |
|------|-------------|---------------|-----------|
| **Admin** | System overview, owner management, revenue exports, Excel bulk import | lib/roles/admin/ | Desktop + Mobile |
| **Owner** | Manage own fleet: taxis, drivers, revenue table | lib/roles/owner/ | Mobile only |
| **Marshal** | Queue control, QR generation, long-distance trip forms, alerts | lib/roles/marshal/ | Mobile only |
| **Driver** | QR scan to join queue, fare entry, departure | lib/roles/driver/ | Mobile only |
| **Passenger** | No login required — fare search, rank lookup, news feed | lib/roles/passenger/ | Mobile + Web |

> **Desktop note**: Only the Admin role supports desktop builds (Windows/macOS/Linux).
> Owner, Marshal, and Driver features depend on QR camera scanning and GPS,
> which are not available on desktop — those pages are mobile-only.

## Tech Stack

- **Flutter** (stable) — Android, iOS, Windows/macOS/Linux (Admin only)
- **Firebase** — Firestore, Cloud Functions, Storage, Messaging
- **Authentication** — Custom (cell number / email + 6-digit PIN via Cloud Functions, no FirebaseAuth email/password)
- **Maps** — Google Maps Flutter + Geolocator
- **Email** — SendGrid via Cloud Functions (OTP reset + next-of-kin notifications)
- **Offline** — Firestore offline persistence enabled in main.dart

## Project Structure

\\\
lib/
  main.dart               # App entry point, Firebase init, Firestore offline config
  core/                   # Theme, constants, shared utilities
  custom_auth/            # Cell/email + PIN auth, AuthGate, OTP reset flow
  roles/
    admin/                # Admin shell and pages
    owner/                # Owner shell and pages (mobile only)
    marshal/              # Marshal shell and pages (mobile only)
    driver/               # Driver shell and pages (mobile only)
    passenger/            # Passenger landing — no auth (mobile + web)
  models/                 # UserModel, OwnerModel, TaxiModel, DriverModel,
                          #   MarshalModel, RankModel, TripModel, AlertModel
  services/
    firestore_service.dart    # Firestore CRUD, queue, revenue
    functions_service.dart    # Cloud Functions callables
    maps_service.dart         # GPS, radius validation, live tracking
    email_service.dart        # Trigger Email / SendGrid wrapper
    excel_import_service.dart # Excel upload + import trigger
functions/
  src/index.ts            # Cloud Functions: validatePin, hashAndStorePin,
                          #   sendOtpEmail, verifyOtp, processExcelImport,
                          #   aggregateRevenue, onLongDistanceTripCreated
test/                     # Unit and widget tests
\\\

## Getting Started

### Prerequisites

- Flutter SDK >= 3.22 (stable channel): https://docs.flutter.dev/get-started/install
- Firebase CLI: \
pm install -g firebase-tools\
- FlutterFire CLI: \dart pub global activate flutterfire_cli\
- A Firebase project created at https://console.firebase.google.com

### Setup

\\\ash
# 1. Install Flutter dependencies
flutter pub get

# 2. Link to your Firebase project (generates lib/firebase_options.dart)
flutterfire configure

# 3. Install Cloud Functions dependencies
cd functions && npm install

# 4. (Optional) Start emulators for local dev
firebase emulators:start

# 5. Run the app
flutter run                       # pick a connected device
flutter run -d windows            # Windows desktop (Admin only)
\\\

### Environment Variables

Copy \.env.example\ to \.env\ (never commit \.env\).

| Variable | Purpose |
|----------|---------|
| \SENDGRID_API_KEY\ | SendGrid key for OTP + next-of-kin emails (Cloud Functions) |
| \GOOGLE_MAPS_API_KEY\ | Google Maps SDK key for mobile |

## Status

This repository is at the **scaffold stage** — structure and stubs only.
All business logic is marked with \// TODO\ comments pointing to the next implementation step.
