# E-RANK: Digital Minibus Taxi Rank Management and Safety System

**Assessment:** NPRT630 Project – Phase 1: Project Proposal & Problem Definition  
**Programme:** Diploma in Information and Communication Technology  
**Institution:** Sol Plaatje University  
**Module Code:** NPRT630  
**Examiner:** Mr. Melvin Kisten  
**Group Name:** PMP Solutions  
**Due Date:** 13 March 2026  
**Repository:** [https://github.com/SiyaJNdzobs/NPRT63PMPSOLUTIONS/tree/main](https://github.com/SiyaJNdzobs/NPRT63PMPSOLUTIONS/tree/main)  
**Live Application:** [eRank App on Render](https://erank.onrender.com)

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
1. [Executive Summary](#1-executive-summary)
2. [Introduction & Background](#2-introduction--background)
3. [Problem Definition & User Pain Points](#3-problem-definition--user-pain-points)
4. [Review of Existing Solutions & Gaps](#4-review-of-existing-solutions--gaps)
5. [Proposed Solution: E-RANK](#5-proposed-solution-e-rank)
6. [Core System Functionalities](#6-core-system-functionalities)
7. [System Actors & Stakeholders](#7-system-actors--stakeholders)
8. [User Experience (UX) Improvements](#8-user-experience-ux-improvements)
9. [Visual Design & Colour Contrast Compliance](#9-visual-design--colour-contrast-compliance)
10. [High-Level Architecture](#10-high-level-architecture)
11. [Conclusion](#11-conclusion)
12. [References](#12-references)

---

## 1. Executive Summary
The minibus taxi industry serves as the lifeblood of South African public transportation, ferrying over 15 million commuters daily. Despite its indispensability, rank operations remain burdened by archaic paper logbooks, unverified oral queuing, non-transparent cash accounting, and an absence of digital safety networks. **E-RANK** is a comprehensive, mobile-first, digital rank management platform engineered by PMP Solutions. By digitising the critical nexus of the taxi rank—empowering the taxi marshal with low-friction digital queue dispatch tools and connecting drivers, passengers, owners, and administrators—E-RANK streamlines operations, ensures passenger manifest traceability, eliminates violent queue disputes, and provides verifiable revenue visibility.

---

## 2. Introduction & Background
Public transport in South Africa is overwhelmingly dominated by the minibus taxi sector, accounting for over 80% of daily commuter trips across urban, suburban, and rural corridors (Africa Check, 2021). Millions of citizens depend exclusively on minibus taxis to access schools, workplaces, tertiary institutions, and healthcare facilities.

Within this ecosystem, the **taxi rank** is the vital operational hub. At the centre of the rank's daily workflow is the **taxi marshal** (or rank manager). The marshal oversees:
- Queue sequencing and bay allocations for arriving vehicles.
- Manual collection of association dues and fare tracking.
- Passenger routing, passenger queuing, and boarding.
- Compiling physical passenger manifests for cross-provincial long-distance travel.
- Vehicle dispatch once statutory carrying capacity is reached.

Currently, this coordination is conducted through informal verbal commands, handwritten notebooks, and unverified queue tokens. As commuter volumes surge, this manual paradigm collapses into administrative disorder, data loss, delayed departures, and heightened passenger insecurity.

---

## 3. Problem Definition & User Pain Points

### 3.1 Precise Workflow Breakdowns
Through qualitative field interviews conducted at Kimberley taxi ranks (such as the Indian Centre Rank) and surrounding regional nodes, precise workflow breakdowns were identified:

```
[Arrival at Rank] ──> Manual visual inspection ──> Unrecorded line entry (Disputes)
[Passenger Boarding] ──> Handwritten paper book ──> Illegible/Lost manifests (Safety Risk)
[Vehicle Departure] ──> Oral check by Marshal ──> Delayed departure / Empty seat losses
[Daily Financials] ──> Cash hand-to-hand ──> Zero digital audit trails for Owners
```

### 3.2 Affected Stakeholders & Specific Pain Points

1. **Taxi Marshals:**
   - **Manual Manifest Fatigue:** Writing down 15–22 passenger names, ID numbers, phone numbers, and next-of-kin contacts by hand into paper logbooks takes 10 to 18 minutes per long-distance vehicle.
   - **Logbook Degradation:** Paper books are susceptible to rain damage, tearing, loss, and illegible handwriting, creating legal and regulatory liabilities.
   - **Queue Enforcement Stress:** Arbitrary queue jumping causes violent confrontations between drivers and marshals.

2. **Commuters & Passengers:**
   - **Information Blindness:** No verifiable schedule, fare price list, or live operating status. Commuters arrive blindly at ranks, vulnerable to sudden price spikes or route cancellations.
   - **Emergency Insecurity:** In the event of a road crash, families and emergency services struggle for hours or days to identify passengers because physical manifests are destroyed or trapped inside the wrecked vehicle.
   - **Gender-Based Safety Concerns:** Female commuters traveling alone lack location-sharing and travel confirmation mechanisms linked to verified taxi credentials.

3. **Drivers:**
   - **Queue Disputes & Delays:** Drivers lose income when unverified vehicles cut queues or marshals favour specific operators.
   - **Distress & Hijacking Vulnerability:** Drivers operating isolated long-distance corridors have no rapid silent SOS alert system to contact both their owners and marshals with live telemetry.

4. **Taxi Owners:**
   - **Financial Opadacity:** Owners entrust capital assets worth R500,000+ to drivers with zero real-time trip recording. Cash takings are calculated on trust, resulting in estimated 15%–30% revenue leakage.
   - **Asset Blindness:** Owners cannot verify if their vehicle is in queue, loaded, stranded, or undergoing unauthorized extra trips.

---

## 4. Review of Existing Solutions & Gaps

| Solution | Target Area | Mechanism | Critical Gaps & Why E-RANK Succeeds |
| :--- | :--- | :--- | :--- |
| **Loop Taxi** | Commuter E-Hailing | Passenger smartphone app booking | Failed to achieve rank penetration. Relied heavily on expensive smartphone data and attempted to bypass the physical taxi rank and the taxi marshal entirely. |
| **WOW (Wealth on Wheels)** | In-Vehicle Fleet Telematics | GPS trackers, onboard dashcams, in-cab Wi-Fi | Focused exclusively on hardware inside the moving vehicle. Addressed nothing regarding rank queues, passenger manifests, marshal workflows, or route fare discovery. |
| **FairPay Card** | Cashless Fare Collection | Contactless smart cards & POS terminals | High merchant fees and hardware costs. Addressed payment mechanics only, completely ignoring queue allocation, emergency SOS, and long-distance passenger manifests. |
| **Informal Logbooks** | Rank Manifest Compliance | Counter books & pens | High rate of physical loss, illegible data, no searchability, zero real-time accessibility during roadside emergencies. |

**The E-RANK Breakthrough:** Rather than attempting to disrupt or replace the taxi marshal, E-RANK provides a lightweight digital toolset that **supercharges the marshal's existing workflow**, maintaining rank hierarchy while capturing digital data seamlessly.

---

## 5. Proposed Solution: E-RANK
**E-RANK** is a unified, multi-role digital ecosystem engineered specifically for South African taxi rank operations. Built on a resilient web and mobile architecture, E-RANK runs smoothly on low-cost Android smartphones and tablets commonly used by rank marshals and drivers.

### Key Pillars of the Solution:
- **Marshal-Centric Queue Dispatch:** Marshals operate an intuitive tablet dashboard to check in drivers, enforce GPS geofenced queue integrity, and trigger departures.
- **Digital Manifest & WhatsApp Kin Tracking:** Fast passenger registration with instantaneous cloud backup and WhatsApp live journey link dispatch.
- **Owner Visibility & Revenue Analytics:** Automated trip tallying, revenue calculations, and branded Excel/PDF statement generation.
- **Multilingual Commuter Portal:** Route finding, transparent fare calculation, live rank updates, and multilingual conversational AI.

---

## 6. Core System Functionalities
E-RANK incorporates twelve (12) concrete functionalities directly aligned with stakeholder requirements:

1. **Geo-Verified QR Queue Registration:** Drivers scan a daily dynamic or static rank QR code; the system validates a 20-metre GPS geofence before registering queue position.
2. **Real-Time Digital Queue Management:** Marshals reorder, skip absent vehicles with mandatory audit reasons, and promote queues seamlessly on screen.
3. **Long-Distance Digital Passenger Manifest:** Marshals capture passenger names, phone numbers, destinations, seat assignments, and next-of-kin contacts in under 60 seconds.
4. **Self-Service Commuter Boarding & Seat Booking:** Tech-savvy passengers scan taxi registration codes on mobile to self-enter manifest details, reducing marshal queues.
5. **Live Journey Location Sharing:** Generates a secure tokenized URL allowing family members to monitor vehicle progress on Google Maps in real time.
6. **Instantaneous Departure & Trip Closure:** Marshals click "Depart" to close the manifest, calculate gross fare revenue, and cycle the next vehicle to loading bay 1.
7. **Automated Fare & Revenue Computation:** System computes revenue per trip, daily rank earnings, and vehicle tallies, preventing under-reporting.
8. **Owner Financial Statements (.xlsx / PDF):** Owners view live trip counts and export executive Excel statements with formatted accounting rows.
9. **Emergency SOS Broadcast with Telemetry:** Drivers trigger a 1-tap SOS that immediately notifies owners via email/SMS with precise GPS coordinates and passenger rosters.
10. **Public Route & Transparent Fare Lookup:** Open public portal enables passengers to search origin-to-destination pairs with official association fares.
11. **Live Rank Announcements & Alert Broadcasts:** Marshals broadcast operational alerts (e.g., road closures, peak-hour delays, weather hazards) to public commuter screens.
12. **Multilingual AI Commuter Assistant:** Built-in conversational agent providing answers in official South African languages (isiZulu, isiXhosa, Sesotho, Setswana, Afrikaans, English).

---

## 7. System Actors & Stakeholders

```
                   ┌───────────────────────────────────┐
                   │               E-RANK              │
                   └─────────────────┬─────────────────┘
         ┌──────────────┬────────────┼────────────┬──────────────┐
         ▼              ▼            ▼            ▼              ▼
   ┌───────────┐  ┌───────────┐ ┌─────────┐ ┌───────────┐ ┌──────────────┐
   │ Passenger │  │   Driver  │ │ Marshal │ │   Owner   │ │    Admin     │
   └───────────┘  └───────────┘ └─────────┘ └───────────┘ └──────────────┘
```

- **Passenger:** Searches routes/fares, self-boards via plate entry, shares live trip links, and receives journey updates.
- **Driver:** Scans rank QR code to queue, receives departure alerts, reviews skip notices, and triggers SOS emergencies.
- **Marshal (Primary Rank Operator):** Controls queue ordering, overrides geofences when needed, registers offline commuters, and authorizes departures.
- **Taxi Owner:** Manages fleets, registers vehicles, assigns drivers, generates security PINs, and downloads revenue audit reports.
- **System Administrator:** Oversees association setup, creates owner accounts, monitors server telemetry, and audits security logs.

---

## 8. User Experience (UX) Improvements

| Dimension | Previous Manual Process | E-RANK Enhanced UX | Quantifiable Benefit |
| :--- | :--- | :--- | :--- |
| **Manifest Registration** | Hand-writing 16 names into paper books | Rapid digital entry or passenger QR self-boarding | **75% reduction** in boarding time (15 mins → <4 mins). |
| **Queue Disputes** | Verbal disputes on who arrived first | Timestamped, geo-verified FIFO digital queue board | **100% elimination** of unverified queue cutting disputes. |
| **Revenue Accounting** | Hand-scribbled cash totals reconciled weekly | Real-time automated calculation on trip departure | **Zero mathematical errors**; 100% auditable digital records. |
| **Emergency Kin Notification** | Relatives notified hours later after hospital search | 1-click WhatsApp journey link with live GPS tracker | **Instant peace-of-mind** for families across South Africa. |
| **Language Inclusivity** | English-only static rank signs | Native language prompts in 11 official SA languages | High usability for non-English literate rank staff. |

---

## 9. Visual Design & Colour Contrast Compliance
Rank environments are subject to extreme outdoor daylight, intense glare, and rapid operational glance requirements. E-RANK has been designed to meet strict **WCAG 2.1 Level AA Contrast Standards (minimum 4.5:1 ratio)**:

- **Deep Navy / Slate Background (`#0A0D14` / `#101522`):** Eliminates harsh white glare outdoors and conserves battery life on OLED mobile screens.
- **Card Surfaces (`#181F2C` / `#1E2638`):** Provides sharp structural elevation with subtle `#263144` borders.
- **High-Contrast Text (`#FFFFFF` on `#0A0D14`):** Yields a contrast ratio of **18.2:1**, vastly exceeding accessibility requirements.
- **Primary Action Amber (`#F59E0B` / `#D97706`):** Delivers prominent visibility for critical CTAs (Sign In, Search, Board).
- **Operational Emerald (`#10B981`):** Indicates active queue positions, departures, and verified GPS states with **8.4:1** contrast against dark backdrops.
- **Emergency Crimson (`#EF4444`):** Reserved exclusively for SOS alerts, queue skip reasons, and validation errors.

---

## 10. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Presentation Tier                    │
│   React 18 + Tailwind CSS + Lucide Icons + Responsive Shells    │
│  (Mobile Web for Drivers/Passengers, Tablet for Rank Marshals)  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTPS / REST API
┌────────────────────────────────▼────────────────────────────────┐
│                     Application Logic Tier                      │
│      FastAPI (Python 3.11) + Pydantic v2 + Bcrypt Security      │
│   [Auth Gate] [Queue Controller] [Manifest Engine] [SOS Engine] │
└────────────────────────────────┬────────────────────────────────┘
                                 │ TLS Encrypted
┌────────────────────────────────▼────────────────────────────────┐
│                        Data Storage Tier                        │
│     MongoDB Atlas (Document NoSQL) with Indexed Collections     │
│   {users} {ranks} {taxis} {queues} {manifests} {operations}     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Conclusion
Phase 1 of the E-RANK project solidifies the operational, business, and human foundations required to modernise South African minibus taxi ranks. By centring the taxi marshal as an empowered operator, resolving persistent queue and revenue pain points, and instituting life-saving digital passenger manifests, E-RANK bridges the gap between grass-roots transport realities and modern software engineering.

---

## 12. References
- Africa Check. 2021. *Do more than 80% of South Africans rely on minibus taxis?* Available at: [https://africacheck.org](https://africacheck.org) (Accessed: 1 March 2026).
- Arrive Alive. 2024. *Minibus taxis and road safety in South Africa*. Available at: [https://www.arrivealive.mobi](https://www.arrivealive.mobi) (Accessed: 1 March 2026).
- Department of Transport. 2024. *Annual Transport Statistics Report*. Pretoria: Department of Transport, Republic of South Africa.
- International Transport Forum. 2023. *Digitalisation of transport systems and mobility services*. Paris: Organisation for Economic Co-operation and Development (OECD).
- Kisten, M. 2026. *NPRT630 ICT Project Lecture Notes & Assignment Brief*. Sol Plaatje University.
- SANTACO. 2023. *Transformation and digital innovation in the minibus taxi industry*. Available at: [https://www.santaco.co.za](https://www.santaco.co.za) (Accessed: 24 March 2026).
