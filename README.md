# E-RANK - Taxi Rank Management & Operations Platform

## Development Team

| Name | Student Number | GitHub |
|:-----|:---------------|:-------|
| Oarabetse Morata | 202406427 | [@Oarabetse-pixel](https://github.com/Oarabetse-pixel) |
| Phuti Setati | 202435062 | [@SetatiPhillipine](https://github.com/SetatiPhillipine) |
| Kholofelo Phalakatsela | 202306829 | [@IamKholofeloPhala](https://github.com/IamKholofeloPhala) |
| Louisa Mdluli | 202324412 | [@Louisa322](https://github.com/Louisa322) |
| Siyabonga José Ndzobondzobo | 202441850 | [@SiyaJNdzobs](https://github.com/SiyaJNdzobs) |

**Group Name:** PMP Solutions  
**Course:** NPRT630  
**Live Application:** [https://erank.onrender.com](https://erank.onrender.com)

---

## Overview

**E-RANK** is a comprehensive operations and queue management platform engineered for the South African minibus taxi industry. It digitizes day-to-day rank operations across 5 dedicated roles: **Admin**, **Owner**, **Marshal**, **Driver**, and **Passenger**. Key capabilities include real-time queue boards, dynamic QR-code rank check-ins, GPS geo-verification, automated fare snapshots, revenue tracking with Excel exports, emergency SOS alerts, and public safety lookup for passengers.

---

## Tech Stack & Architecture

| Layer | Technology | Architectural Rationale |
| :--- | :--- | :--- |
| **Frontend** | React (SPA) + Craco | Modular component architecture enabling clean, responsive interfaces across mobile and desktop devices. |
| **UI & Styling** | Tailwind CSS + shadcn/ui | High-contrast dark-mode theme designed for maximum visibility in diverse field lighting conditions. |
| **Icons & QR** | Lucide React + HTML5 QR Code | Lightweight vector icons and browser-native camera QR scanning without requiring external app downloads. |
| **Backend API** | FastAPI (Python 3.11+) | High-throughput asynchronous endpoints (`async`/`await`) with automatic OpenAPI schema validation. |
| **Database** | MongoDB Atlas (via Motor) | Flexible document store capable of handling nested passenger manifests, live queues, and operational logs. |
| **Export Engine** | openpyxl | Server-side generation of structured `.xlsx` spreadsheets for owner revenue auditing. |

---

## Security & Protection

* **Cryptographic Hashing:** Passwords and user PINs are hashed using industry-standard `bcrypt` with unique salts before persisting to storage.
* **Stateless Token Authentication:** Authenticated requests use signed JSON Web Tokens (`PyJWT`) with role claims and expiration validation.
* **Role-Based Access Control (RBAC):** Every backend endpoint is protected by strict dependency guards (`require_role`) ensuring users can only access their authorized resources.
* **Mandatory First-Login Credential Reset:** Users with temporary system-generated credentials must establish a custom password/PIN upon initial login before dashboard access is granted.
* **Anti-Fraud & Geo-Fencing:** Driver queue check-ins utilize dynamic QR tokens verified against rank coordinates within a 20-meter radius, alongside duplicate queue entry prevention.
* **Credential Protection:** Zero sensitive credentials, database keys, or secrets are exposed to client code or repository history.

---

## Updated Use Cases

* **UC-01: Smart Origin-to-Destination & Rank Discovery (with Google Maps)**
  Commuters search for city pairs (e.g. *"Kimberley to Johannesburg"*) or city/rank names. The system matches ranks, routes, fares, and active vehicles, embedding direct Google Maps location and direction links.
* **UC-02: Passenger Live Ride Tracking with Next-of-Kin (Bolt-Style)**
  Passengers inspecting a verified ride receive an explicit consent prompt to share their phone's live GPS location. When accepted, coordinates stream live; next-of-kin viewing the public share link (`/t/:registration`) can click **"📍 See Location on Google Maps"** to track the passenger's journey (100% free, browser-native).
* **UC-03: Marshal "Skip Taxi in Queue" & Driver In-App Notification**
  Marshals can skip absent or delayed taxis in queue with a mandatory reason. The taxi is bumped down 1 position, the next taxi advances, and the driver immediately receives an in-app alert with the marshal's reason and an acknowledgment button.
* **UC-04: ChatGPT-Style Multilingual & Voice AI Assistant**
  Users interact with an in-app AI Assistant that answers factual questions using real database records (ranks, routes, fares). For towns not on E-RANK (e.g. Durban, Cape Town), it advises users to liaise with the rank marshal. Features speech-to-text mic input and text-to-speech audio readout across 6 languages (English, isiZulu, isiXhosa, Sesotho, Setswana, Afrikaans).
* **UC-05: Executive Branded Revenue Statement Excel Export**
  Owners download styled `.xlsx` statements with Slate Navy headers, emerald accents, driver names, taxi registrations, and revenue formulas.
* **UC-06: High-Contrast Confirmation Dialogue with OK Button**
  Critical actions render an enlarged, high-contrast modal (`ResultModal`) with status icon, summary, and explicit "OK" confirmation button.

---

## eRank Test Cases — End-to-End Test Cases

> **Notice:** The comprehensive End-to-End Test Suite is broken down into structured, modular test cases and is uploaded directly in this repository in [`TEST_CASES.md`](./TEST_CASES.md).

**Date:** 2026-09-17  
**Created by:** PMP Solutions Quality Assurance Team  
**Conducted by:** Antigravity Automated & Field Verification Suite  

| Test Case ID | Test Case | Expected Result | Result | Comments |
| :--- | :--- | :--- | :--- | :--- |
| **TC-E001** | Admin creates owner → owner adds taxi → driver is assigned | All records are correctly linked with secure bcrypt hashing, role separation, and automatic taxi allocation. | **Pass** | Core RBAC and fleet ownership verified. |
| **TC-E002** | Driver scans rank QR → joins queue → views queue board & in-app notifications → presses DEPART | 20m geo-fence verified, taxi joins queue, driver monitors queue position, taxi leaves queue upon departure, operation record created, and revenue recorded. | **Pass** | Supports camera QR scanner and manual fallback. |
| **TC-E003** | Marshal searches taxi → adds it to queue → skips absent taxi with reason → presses DEPART | Correct taxi is queued; absent taxi is skipped back 1 position with reason sent to driver; next taxi advances; departure recorded. | **Pass** | Swaps queue order atomically and logs operation. |
| **TC-E004** | Taxi departs → revenue is calculated → owner views revenue & downloads styled Excel statement | Owner sees updated revenue totals; downloads executive `.xlsx` statement featuring Slate Navy headers, emerald accents, driver names, taxi registrations, and formulas. | **Pass** | Formatted using openpyxl with high-class executive styling. |
| **TC-E005** | Marshal posts rank update → passenger opens public page | Passenger can see the published update with status badge and message in real-time across the rank. | **Pass** | Instant broadcast to all commuters. |
| **TC-E006** | Passenger searches origin-to-destination (e.g. "Kimberley to Johannesburg") → accepts live location sharing → views taxi/route on Google Maps → shares with next-of-kin | System parses city pairs, returns matching ranks/routes with Google Maps links; passenger accepts Bolt-style phone GPS tracking; next-of-kin sees verified details and "📍 See Location on Google Maps" button. | **Pass** | 100% free browser-native GPS; includes opt-out decline flow. |
| **TC-E007** | Driver sends SOS → owner receives email | Correct emergency information, driver identity, taxi registration, and GPS coordinates reach the owner via email immediately. | **Pass** | Rapid dispatch to registered owner email. |
| **TC-E008** | Long-distance taxi → passenger manifest captured with next-of-kin contacts → taxi departs → SOS protected | Passenger names, next-of-kin names, and contact numbers remain correctly linked to vehicle departure operation; emergency manifest archived for protection. | **Pass** | Long-distance cross-provincial commuter protection. |
| **TC-E009** | Marshal clicks "Skip Taxi in Queue" → enters mandatory reason → driver receives in-app alert banner | Taxi position bumps back 1 slot; next vehicle advances; driver dashboard instantly renders high-priority alert card displaying marshal's reason; driver acknowledges with "Got it" button. | **Pass** | In-app notification delivery verified end-to-end. |
| **TC-E010** | User opens ChatGPT-Style AI Assistant → queries rank, route, or fare in preferred language | AI Assistant answers query accurately using real in-app database records (e.g. fares, rank locations); supports English, isiZulu, isiXhosa, Sesotho, Setswana, and Afrikaans. | **Pass** | Real database knowledgebase with personalized user greeting. |
| **TC-E011** | User asks AI Assistant about unlisted city/town (e.g. "Do you have taxis to Durban or Cape Town?") | Assistant politely states that the town's taxi ranks have not joined E-RANK yet and advises user to liaise directly with the rank marshal on site. | **Pass** | Prevents misinformation and routes users to station marshals. |
| **TC-E012** | User utilizes Web Speech voice controls on AI Assistant (Microphone input & Text-to-Speech readout) | Hands-free microphone transcribes user speech into query; assistant speaks responses aloud using native browser speech synthesis (100% free). | **Pass** | Fully accessible for commuters and drivers on the move. |
| **TC-E013** | User completes action (skip, depart, update, save) → views ResultModal confirmation | Large high-contrast modal appears with clear status icon, prominent message summary, and bold centered "OK" confirmation button. | **Pass** | Explicit confirmation dialog ensures message receipt. |