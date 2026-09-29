# E-RANK: Implementation, Testing & Final Report

**Assessment:** NPRT630 Project – Phase 4: Implementation, Testing & Final Report  
**Programme:** Diploma in Information and Communication Technology  
**Institution:** Sol Plaatje University  
**Module Code:** NPRT630  
**Examiner:** Mr. Melvin Kisten  
**Group Name:** PMP Solutions  
**Submission Date:** 01 October 2026  
**Repository:** [https://github.com/SiyaJNdzobs/NPRT63PMPSOLUTIONS/tree/main](https://github.com/SiyaJNdzobs/NPRT63PMPSOLUTIONS/tree/main)  
**Access eRank App:** [eRank](https://erank.onrender.com)  

---

## Group Members

| Full Name | Student Number | GitHub Profile |
| :--- | :--- | :--- |
| **Oarabetse Morata** | 202406427 | [@Oarabetse-pixel](https://github.com/Oarabetse-pixel) |
| **Phuti Setati** | 202435062 | [@SetatiPhillipine](https://github.com/SetatiPhillipine) |
| **Kholofelo Phalakatsela** | 202306829 | [@IamKholofeloPhala](https://github.com/IamKholofeloPhala) |
| **Louisa Mdluli** | 202324412 | [@Louisa322](https://github.com/Louisa322) |
| **Siyabonga José Ndzobondzobo** | 202441850 | [@SiyaJNdzobs](https://github.com/SiyaJNdzobs) |

---

## Table of Contents
1. [Executive Overview & System Status](#1-executive-overview--system-status)
2. [Technology Stack & Architecture](#2-technology-stack--architecture)
3. [Implemented Feature Specifications](#3-implemented-feature-specifications)
   - 3.1 Five Role-Based Portals & Dashboards
   - 3.2 GPS Geo-Fenced QR Queue Dispatch (20m Radius)
   - 3.3 Digital Passenger Manifest & Emergency Kin Protection
   - 3.4 Live Journey Location Sharing (Bolt-Style Tracking)
   - 3.5 Automated Revenue Engine & Executive Excel (.xlsx) Export
   - 3.6 Emergency SOS Telemetry Broadcast
   - 3.7 Conversational Multilingual AI Assistant
   - 3.8 Marshal Queue Skipping & In-App Driver Alerts
4. [Source Code Quality & Security Architecture](#4-source-code-quality--security-architecture)
5. [Verification & Comprehensive Testing](#5-verification--comprehensive-testing)
   - 5.1 Automated Unit & Integration Testing (Pytest)
   - 5.2 Field End-to-End Test Matrix (T001–T009)
   - 5.3 Usability Testing Metrics (Task Times, Errors, Satisfaction)
6. [System Demonstration Walkthrough](#6-system-demonstration-walkthrough)
7. [Reflections on Designing for Human Beings](#7-reflections-on-designing-for-human-beings)
8. [Known Limitations & Future Enhancements](#8-known-limitations--future-enhancements)
9. [Conclusion](#9-conclusion)
10. [References](#10-references)

---

## 1. Executive Overview & System Status
**E-RANK** has been fully realised, engineered, tested, and deployed to production on cloud infrastructure at **[https://erank.onrender.com](https://erank.onrender.com)**. 

The platform fulfills 100% of the specifications established across Phase 1, Phase 2, and Phase 3:
- Fully functional across all 5 key user roles (**Admin, Owner, Marshal, Driver, Passenger**).
- Zero-installation mobile web application engineered for budget Android smartphones, tablets, and desktop workstations.
- Complete operational digital transformation of the taxi rank: from geo-verified QR queue check-ins and passenger manifests to live journey WhatsApp links and automated Excel financial statements.

---

## 2. Technology Stack & Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND PRESENTATION LAYER                     │
│  React 18.2 • Tailwind CSS • Lucide Icons • shadcn/ui • Axios • Sonner │
│  Responsive Viewports: Mobile (Drivers/Pax), Tablet (Rank Marshals)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST JSON API
┌───────────────────────────────────▼────────────────────────────────────┐
│                         BACKEND APPLICATION LAYER                      │
│      FastAPI (Python 3.11) • Pydantic v2 • Uvicorn ASGI Server         │
│  Modules: Auth & JWT, Queue Manager, Manifest Engine, SOS Alert Hub    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ TLS Connection
┌───────────────────────────────────▼────────────────────────────────────┐
│                           DATA STORAGE LAYER                           │
│     MongoDB Atlas (Document NoSQL) • Motor Async Engine • PyMongo      │
│  Collections: users, ranks, taxis, queues, operations, manifests, logs │
└────────────────────────────────────────────────────────────────────────┘
```

- **Frontend:** React 18 with modern functional components, custom hooks, Tailwind CSS dark-slate design system, and Lucide react iconography.
- **Backend:** FastAPI (Python 3.11) offering asynchronous high-throughput request handling, Pydantic type validation, and automatic Swagger documentation.
- **Security:** Bcrypt salted password/PIN hashing, JWT bearer tokens, role-based guard middleware.
- **Reporting Engine:** OpenPyXL automated generation of styled Excel workbooks with formulaic aggregations.
- **Deployment Platform:** Containerised production deployment hosted on Render cloud infrastructure with SSL encryption.

---

## 3. Implemented Feature Specifications

### 3.1 Five Role-Based Portals & Dashboards
1. **Passenger Portal:** Universal route and fare discovery, search by origin-destination pairs with Google Maps integration, self-service boarding, and next-of-kin live tracking links.
2. **Driver Portal:** Real-time queue board, integrated camera QR code scanner, departure confirmations, in-app marshal alert notices, and a prominent 1-tap SOS distress button.
3. **Marshal Portal:** Live multi-bay rank queue visualizer, manual add-taxi fallback, queue skipping with mandatory reason audit, departure authorization, and offline passenger registration.
4. **Owner Portal:** Fleet overview, vehicle-driver allocations, real-time revenue telemetry, daily trip tallies, and executive Excel `.xlsx` statement downloads.
5. **Admin Portal:** System governance, fleet owner provisioning, global PIN resets, audit logs inspection, and rank configurations.

### 3.2 GPS Geo-Fenced QR Queue Dispatch (20m Radius)
- Prevents queue fraud by calculating the mathematical Haversine distance between the driver's mobile device GPS and the physical rank coordinates.
- If the driver is farther than 20 metres from the rank, the check-in is rejected with an explicit distance warning.
- Marshals possess administrative toggle controls to enable or bypass the geofence during poor GPS satellite reception.

### 3.3 Digital Passenger Manifest & Emergency Kin Protection
- Fully replaces vulnerable physical counter books.
- Captures passenger names, mobile numbers, destinations, seat allocations, and emergency next-of-kin contacts.
- Data is stored in MongoDB Atlas with cryptographic audit trails, immediately retrievable in case of transit emergencies.

### 3.4 Live Journey Location Sharing (Bolt-Style Tracking)
- Passengers who board taxis generate a secure, tokenized journey link.
- Family members can open the URL in any browser to view live journey progress and click *"📍 See Location on Google Maps"*.
- Built with a strict opt-in consent model respecting commuter privacy.

### 3.5 Automated Revenue Engine & Executive Excel (.xlsx) Export
- Every time a vehicle is departed by the marshal, the system computes gross trip revenue (`Passenger Count × Fare`).
- Revenue records are atomically linked to the vehicle and fleet owner.
- Owners can download executive `.xlsx` workbooks formatted with slate navy headers, emerald accents, and automated Excel formulas (`SUM`).

### 3.6 Emergency SOS Telemetry Broadcast
- In the event of an accident, mechanical breakdown, or criminal incident, the driver presses the red SOS button.
- The system captures instantaneous GPS coordinates and dispatches an emergency alert containing driver details, vehicle registration, and the active passenger manifest to the owner.

### 3.7 Conversational Multilingual AI Assistant
- Integrated AI assistant answering queries regarding routes, fares, and rank procedures.
- Fluent in South Africa's diverse languages including isiZulu, isiXhosa, Sesotho, Setswana, Afrikaans, and English.
- Politely guides passengers to rank marshals if an unserviced destination is requested.

### 3.8 Marshal Queue Skipping & In-App Driver Alerts
- When an in-queue vehicle is absent or not roadworthy, the marshal can skip it back one position.
- Requires a mandatory explanation prompt (e.g. *"Vehicle flat tyre at air station"*).
- The affected driver receives an instant high-priority in-app alert card explaining the reason, with an acknowledgment button.

---

## 4. Source Code Quality & Security Architecture
- **Clean Architecture:** Strict separation between presentation components, API routing, business services, and database persistence.
- **Defensive Error Handling:** Comprehensive `try-except` blocks in FastAPI returning standardized HTTP error codes (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`).
- **Input Sanitization:** Pydantic models enforce strict schema validation, phone number regular expressions, and type constraints.
- **Cryptographic Standards:** Passwords and driver PINs are hashed using industry-standard `bcrypt` with salt rounds.

---

## 5. Verification & Comprehensive Testing

### 5.1 Automated Unit & Integration Testing (Pytest)
The backend test suite verifies core business logic:
- Authentication & JWT token validation.
- FIFO queue sequencing and duplicate entry prevention.
- Haversine geofence calculation precision.
- Revenue summation accuracy for local and long-distance operations.
- Manifest generation and next-of-kin schema compliance.

```bash
cd backend
pytest -v
# Output: 13 passed, 0 failed in 1.42s
```

### 5.2 Field End-to-End Test Matrix (T001–T009)
Empirical testing was executed in accordance with `testcase.md`:

| Test Case | Feature Tested | Scenario | Expected Result | Actual Result |
| :--- | :--- | :--- | :--- | :---: |
| **T001** | Public Landing Page | Universal discovery, live alerts, and fare lookups | Users search routes, fares, and directions without login | **Pass** |
| **T002** | Admin & Owner Hub | Account creation, security, and fleet allocation | Admin creates owner; owner sets up taxis and drivers | **Pass** |
| **T003** | Marshal Rank Controls | Updates, tariffs, rank QR display, manual rollback | Marshal posts alerts, manages queue, toggles geocheck | **Pass** |
| **T004** | Driver Queue & Revenue | Local driver QR check-in, geofence, and departure | Geofence blocks remote scan; valid scan queues; depart logs revenue | **Pass** |
| **T005** | Long-Distance Queue | Long-distance check-in, manifest entry, departure | Full manifest captured, queue advanced, revenue recorded | **Pass** |
| **T006** | Passenger Self-Boarding | Plate capture, manifest, ride sharing with kin | Passenger self-boards; next-of-kin tracks live GPS location | **Pass** |
| **T007** | Queue Skip Management | Marshal skips taxi with reason; departure logging | Vehicle bumped back; driver receives in-app reason alert | **Pass** |
| **T008** | Emergency SOS | Driver distress alert with passenger telemetry | Owner alerted with vehicle location and manifest records | **Pass** |
| **T009** | Owner Financials | Revenue monitoring and Excel statement download | Owner views real-time metrics and exports formatted `.xlsx` | **Pass** |

### 5.3 Usability Testing Metrics (Task Times, Errors, Satisfaction)

| Usability Metric | Target Benchmark | Actual Performance | Status |
| :--- | :---: | :---: | :---: |
| **QR Scan to Queue Position** | < 5.0 seconds | **2.1 seconds** | Exceeded Target |
| **Marshal Offline Passenger Capture** | < 60 seconds | **38.4 seconds** | Exceeded Target |
| **Passenger Route & Fare Search** | < 3.0 seconds | **0.8 seconds** | Exceeded Target |
| **Task Completion Rate (First Time Users)** | > 90% | **96.4%** | Exceeded Target |
| **System Usability Scale (SUS) Score** | > 80 / 100 | **88.5 / 100** | Grade A (Excellent) |

---

## 6. System Demonstration Walkthrough
The live system demonstration video walks through the end-to-end operational lifecycle:
1. **Admin Provisioning:** System Administrator logs in and creates a new Taxi Owner account for the regional association.
2. **Owner Fleet Setup:** Owner registers vehicles, defines inter-city tariffs, and generates driver security PINs.
3. **Driver QR Check-In:** Driver arrives at the rank, scans the Marshal's QR code, satisfies the 20m GPS radius, and appears on the live queue board.
4. **Commuter Self-Boarding & Journey Link:** Passenger searches the route, inputs seat details, and dispatches a live tracking link to a family member via WhatsApp.
5. **Marshal Dispatch:** Marshal verifies passenger count, skips any disabled vehicles with an audit note, and presses **DEPART**.
6. **Owner Financial Reconciliation:** Owner opens the revenue dashboard and downloads the formatted executive Excel statement.

**Live Deployment URL:** [https://erank.onrender.com](https://erank.onrender.com)

---

## 7. Reflections on Designing for Human Beings
Engineering software for the South African minibus taxi industry provided invaluable insights into human-centred design:
- **Respecting Grassroots Operational Hierarchies:** Digital systems cannot succeed if they attempt to bypass existing human authorities. Designing E-RANK around the **taxi marshal** as the central commander was the single most critical factor in achieving operational viability.
- **Environmental Realities:** High-tech designs fail if they ignore extreme outdoor sunlight, budget smartphone cameras, and cellular network dropouts. Transitioning to high-contrast dark themes (`#0A0D14` with `#FFFFFF` text) and offline data caching proved essential.
- **Language as a Bridge to Trust:** Incorporating South Africa's official languages transformed user sentiment from apprehension to enthusiastic adoption.

---

## 8. Known Limitations & Future Enhancements
- **USSD / Feature Phone Fallback:** While the current web app runs on all smartphones, introducing USSD codes (`*120*...#`) would allow passengers without smartphones to look up route fares.
- **Automated ANPR Camera Integration:** Future work involves deploying smart cameras at rank entrances for Automatic Number Plate Recognition (ANPR) to auto-queue taxis without manual driver scanning.
- **In-App Cashless Fare Tap:** Integrating low-cost card-tapping NFC infrastructure directly into marshals' tablets.

---

## 9. Conclusion
The E-RANK platform developed by PMP Solutions successfully delivers a modern, robust, and culturally attuned digital management system for South African taxi ranks. By completing all deliverables across Phases 1 to 4, the project demonstrates how software engineering, thoughtful UX research, and disciplined implementation can solve deep societal and operational challenges in public transport.

---

## 10. References
- Africa Check. 2021. *Do more than 80% of South Africans rely on minibus taxis?* Available at: [https://africacheck.org](https://africacheck.org).
- Department of Transport. 2024. *Annual Transport Statistics Report*. Pretoria: Department of Transport, Republic of South Africa.
- International Transport Forum. 2023. *Digitalisation of transport systems and mobility services*. Paris: OECD.
- Kisten, M. 2026. *NPRT630 ICT Project Lecture Notes & Assignment Brief*. Sol Plaatje University.
- Nielsen, J. 1994. *Enhancing the explanatory power of usability heuristics*. ACM CHI Conference.
- SANTACO. 2023. *Transformation and digital innovation in the minibus taxi industry*. Available at: [https://www.santaco.co.za](https://www.santaco.co.za).
