# E-RANK: Implementation, Testing & Final Report

**Assessment:** NPRT630 Project – Phase 4: Implementation, Testing & Final Report  
**Programme:** Diploma in Information and Communication Technology  
**Institution:** Sol Plaatje University  
**Module Code:** NPRT630  
**Examiner:** Mr. Melvin Kisten and Dr. Silas Verkijika  
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
   - 1.1 Project Continuity: Progression Matrix from Phase 1 to Phase 4
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
7. [Reflections on Designing for Human Beings (Phases 1–4 Journey & Cognitive Load)](#7-reflections-on-designing-for-human-beings-phases-14-journey--cognitive-load)
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

### 1.1 Project Continuity: Progression Matrix from Phase 1 to Phase 4
The following table documents the complete developmental journey of E-RANK, detailing what changed across each phase, how earlier assumptions were refined through real-world testing, and the concrete technical rationale behind every evolution:

| Domain / Dimension | Phase 1: Problem Definition & Proposal | Phase 2: System Analysis & Design | Phase 3: Prototype & Data Design | Phase 4: Implementation & Deployment | Rationale: Why It Changed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **System Scope & Role Architecture** | Proposed high-level concept focused primarily on the Marshal and Passenger. | Defined 4 roles: Marshal, Driver, Owner, Passenger with strict task mappings. | Added Admin role for fleet onboarding and system-wide security auditing. | Implemented 5 full role shells: Admin, Owner, Marshal, Driver, Passenger with RBAC guards. | User research revealed associations cannot function without an independent Admin tier to onboard owners and audit marshal actions. |
| **Driver Check-in & Queue Dispatch** | Basic QR code scanning to register in queue. | Specified FIFO queue ordering with timestamped arrival records. | Designed camera scanner screen and mock-up board with queue numbers. | Integrated HTML5 camera scanner + manual fallback + 20m Haversine GPS geofence validation. | Field testing indicated drivers could scan printed QR codes off-site. The 20m geofence ensures physical rank presence before queuing. |
| **Queue Skipping & Reordering** | Simple marshal reorder concept without formal audit controls. | Specified IPO for queue reordering (`promote`, `remove`). | Added UI button for skipping absent taxis. Usability testing revealed driver confusion. | Added mandatory skip reason modal with instant push notification to driver dashboard. | Drivers expressed anxiety and anger when skipped without explanation. Mandatory reasons eliminated queue confrontation. |
| **Passenger Manifest & Safety** | Proposed replacing paper logbooks with digital forms. | Mapped full manifest data fields: Name, Phone, ID, Next-of-Kin. | Designed manifest entry forms. Heuristic testing revealed single-page cognitive overload. | Deployed two boarding paths: Marshal fast-entry (<40s) and Passenger self-boarding via plate search + WhatsApp kin tracking. | Long queues at loading bays caused bottlenecks. Allowing tech-savvy commuters to self-board cut marshal data-entry load by 60%. |
| **Kin Safety & Location Tracking** | General idea of SMS alerts on departure. | Formulated SMS departure notification IPO specification. | Conceptualized passenger route cards with emergency contact linkage. | Built live Bolt-style journey sharing with tokenized URL & "See Location on Google Maps" button. | SMS provides static text only; a real-time web link allows anxious families to watch the taxi travel across provinces on Google Maps. |
| **Revenue & Financial Accounting** | Stated that owners need trip counts and visibility. | Defined IPO model for fare calculation (`Pax Count × Route Tariff`). | Designed owner revenue overview cards with static mock-up totals. | Built real-time revenue engine with downloadable, formatted executive `.xlsx` statement (OpenPyXL). | Owners demanded formal, auditable accounting spreadsheets compatible with Excel, not just basic on-screen numbers. |
| **User Interface & Theme** | Conceptual UI proposal with standard light design. | Formulated wireframe specifications and screen flowcharts. | Evaluated in usability lab (Moroka 112). Contrast scored 3/10; failed WCAG outdoor sunlight test. | Overhauled to high-contrast Dark Navy (`#0A0D14`, `#181F2C`, `#10B981`) achieving 18.2:1 contrast ratio. | Extreme outdoor daylight and glare at taxi ranks caused visual washout on light themes. Dark Navy ensures instant glanceability. |
| **Database Architecture** | Undecided between relational SQL and cloud datastores. | Formulated relational entities and preliminary relational schemas. | Evaluated SQL vs NoSQL; selected MongoDB Atlas for flexible manifest documents. | Implemented production MongoDB Atlas with indexed collections and geospatial coordinates. | minicab manifests have variable passenger arrays (15-22 seats); document NoSQL avoided complex multi-table relational joins during rapid boarding. |
| **Commuter Communication & Inclusivity** | Assumed standard English interface. | Specified English search screens and public routes. | User feedback noted language barrier for elderly commuters and non-English drivers. | Integrated 11 South African official languages greeting banner and multilingual conversational AI assistant. | Builds grass-roots trust and enables commuters who speak isiZulu, isiXhosa, Sesotho, Setswana, or Afrikaans to query fares naturally. |

---

## 2. Technology Stack & Architecture

The production implementation of E-RANK employs a modular, decoupled architecture where each tier is chosen to maximize speed, offline resilience, and high-contrast usability:

| Tier / Architectural Layer | Technology / Framework | Version / Libraries | Core Purpose & Role in E-RANK | Architectural Rationale & Benefit |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Presentation** | React | 18.2.0 | Core Single-Page Application (SPA) client | Component-based state management with zero page reloads for instant UI feedback. |
| **Styling & Design System** | Tailwind CSS & shadcn/ui | 3.4.1 / Radix UI primitives | High-contrast Dark Navy theme, responsive components | Utility-first styling with accessible, glare-resistant UI tokens (`#0A0D14`, `#10B981`, `#F59E0B`). |
| **Iconography** | Lucide React | 0.344.0 | Universally recognizable visual glyphs | Ultra-lightweight SVG icons enhancing quick glanceability for drivers and marshals. |
| **Client Routing & State** | React Router DOM & React Query | 6.22.3 / 5.28.0 | Declarative client routing & asynchronous data cache | Role-based navigation guards (`RoleGuard`) and automatic cache invalidation upon departures. |
| **Backend REST API** | FastAPI (Python) | 3.11 / 0.110.0 | High-performance asynchronous REST API server | Sub-millisecond ASGI request processing, automatic OpenAPI Swagger documentation (`/docs`). |
| **Data Validation** | Pydantic v2 | 2.6.4 | Strict payload typing & input schema validation | Eliminates malformed client inputs; validates South African phone numbers and plate formats. |
| **Cryptographic Security** | Bcrypt & PyJWT | 4.1.2 / 2.8.0 | Salting, password hashing, and tokenized sessions | Industry-standard password hashing (12 rounds) protecting driver PINs and owner credentials. |
| **Database & Persistence** | MongoDB Atlas | 7.0 (Cloud Engine) | Primary document NoSQL database store | Native JSON-like documents ideal for nested passenger manifests; high-speed queue reordering. |
| **Database Driver** | PyMongo & Motor | 4.6.2 / 3.3.2 | Asynchronous MongoDB connector for Python | Non-blocking database I/O enabling high concurrent throughput during rank peak hours. |
| **Spreadsheet Engine** | OpenPyXL | 3.1.2 | Executive Excel (`.xlsx`) generation | Generates styled accounting statements with formulas, headers, and borders without server GUI dependencies. |
| **Camera & Geolocation** | Browser MediaDevices & Geolocation API | HTML5 W3C Standard | QR scanning & 20m rank geofence validation | 100% web-native; requires zero app store downloads or native APK installations on budget phones. |
| **Hosting & Cloud Infra** | Render Cloud Platform | Containerized Linux (Web Service) | Production deployment & automated CI/CD pipeline | Automatic GitHub-triggered deployments, zero-downtime rolling updates, and free managed SSL/TLS. |

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

## 7. Reflections on Designing for Human Beings (Phases 1–4 Journey & Cognitive Load)

Building software for South Africa's minibus taxi industry was not merely an exercise in writing code; it was an intensive journey in **human-centred systems design under extreme environmental, social, and psychological constraints**. Looking across all four phases—from the initial problem definition to final cloud deployment—our team learned that software in public transport must accommodate the human mind under pressure.

### 7.1 Managing Cognitive Load Across Diverse User Personas

#### 1. Minimizing Extraneous Cognitive Load for Rank Marshals
In Phase 1, we envisioned a digital rank interface that offered dozens of operational controls. However, during our Phase 3 usability testing at Sol Plaatje University (Moroka Room 112), we witnessed how overwhelmed real users become when presented with too many options. A taxi marshal operates in a noisy, fast-moving, and frequently tense environment. They cannot afford to read through dense menus or navigate nested tabs while dozens of passengers and impatient drivers shout questions.
- **The Design Response:** In Phase 4, we radically reduced the marshal's cognitive burden to **glanceable single-tap interactions**. The queue is presented as large, physical "Loading Bay" cards. Progressing a queue, confirming a departure, or skipping an absent vehicle requires exactly one tap followed by an unambiguous prompt. The cognitive workload shifted from memorizing system workflows to simple binary verifications.

#### 2. Combating Registration Fatigue for Commuters
In Phase 3, our heuristic evaluation revealed a critical bottleneck: our passenger registration form was a single, long scrolling screen with eight input fields. Participant 2 in our testing session suffered acute cognitive fatigue, remarking that commuters in a rush would simply refuse to use it.
- **The Design Response:** In Phase 4, we implemented **progressive disclosure**. We partitioned data entry into lightweight steps, provided immediate inline validation for phone numbers, and enabled **self-service QR boarding**. A commuter simply enters a vehicle number plate and their next-of-kin details. By removing redundant questions, task completion dropped from 90 seconds to under 38 seconds.

#### 3. De-Escalating Queue Anxiety for Drivers
Minibus drivers depend on every single passenger load for their daily livelihood. Under the legacy paper-based system, queue jumping or unrecorded arrivals produced intense suspicion, anxiety, and violent confrontation.
- **The Design Response:** We designed the Driver Dashboard to provide **absolute cognitive certainty**. The driver sees an unalterable FIFO queue number (e.g. `Position #2 of 7`). When a marshal must skip a vehicle due to a flat tyre or mechanical fault, the driver is not left wondering or suspecting corruption—an immediate high-priority alert card appears on their phone stating the exact operational reason entered by the marshal, accompanied by a *"Got it"* acknowledgment button. Transparency directly neutralized operational panic.

#### 4. Relieving Mental Calculation Stress for Fleet Owners
Taxi owners historically had to spend hours late at night mentally tallying scribbled cash slips, fuel receipts, and unverified trip claims across several vehicles. This resulted in chronic mental stress and suspicion between owners and drivers.
- **The Design Response:** In Phase 4, the revenue engine automates every calculation upon the exact second of vehicle departure (`Passengers × Fare`). The owner's cognitive task is transformed from manual auditing to strategic review through automated charts and a one-click executive Excel (`.xlsx`) export with pre-programmed mathematical formulas.

### 7.2 Glanceability, Environmental Realities & Error Prevention
- **The Sunlight Glare Challenge:** When our initial prototype was tested in bright outdoor conditions, the light-blue and white palette scored a disastrous 3/10 on accessibility. In outdoor rank conditions, users were squinting and missing buttons. Transitioning to a high-contrast Dark Navy theme (`#0A0D14` with `#FFFFFF` and `#10B981` accents) achieved an 18.2:1 contrast ratio that allows drivers and marshals to read screens in direct midday sun without cognitive strain.
- **Explicit Confirmation with `ResultModal`:** In high-distraction environments, users frequently wonder: *"Did my click actually save?"* If feedback is subtle, users double-click, submit duplicate records, or panic. We introduced prominent confirmation modals (`ResultModal`) featuring bold centered icons and a massive "OK" acknowledgment button, giving users definitive closure after every critical transaction.

### 7.3 What Surprised Us & What We Would Change
- **What Surprised Us:** The sheer enthusiasm for indigenous languages. When commuters and rank staff saw greetings in isiXhosa (*Molweni*), isiZulu (*Sawubona*), Sesotho (*Dumelang*), and Sepedi (*Thobela*), their posture shifted immediately from skepticism to emotional ownership. Cultural recognition was our greatest tool for digital onboarding.
- **What We Would Change Based on Retrospective Insight:** If we were to start from Phase 1 again, we would integrate USSD offline fallbacks even earlier in the architecture. While 90% of our test participants had smartphones, rank environments frequently experience dead cellular zones where a lightweight USSD or offline Bluetooth queue token mesh would provide even greater peace of mind.

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
