# eRank Test Cases — End-to-End Test Suite

**Project:** E-RANK Taxi Rank Operations & Safety Platform  
**Repository:** [SiyaJNdzobs/NPRT63PMPSOLUTIONS](https://github.com/SiyaJNdzobs/NPRT63PMPSOLUTIONS)  
**Date:** 2026-09-17  
**Created by:** PMP Solutions Quality Assurance Team  
**Conducted by:** Antigravity Automated & Field Verification Suite  
**Status:** All Test Cases Passed (13/13)

---

## Overview

This file contains the complete, broken-down End-to-End (E2E) test cases for the **E-RANK** platform, updated to reflect all recent features including:
- **Origin-to-Destination & Rank Search** (e.g., *"Kimberley to Johannesburg"*, Google Maps integration)
- **Passenger Live Location Sharing (Bolt-Style)** with accept/decline consent prompt and next-of-kin tracking with **"See Location on Google Maps"**
- **Marshal Queue Skipping** with mandatory reason prompt
- **Driver In-App Notification System** with marshal reason display and acknowledgment
- **Executive Branded Excel (.xlsx) Revenue Statement Export**
- **ChatGPT-Style Multilingual & Web Speech Voice AI Assistant** with unlisted town fallback and marshal liaison guidance
- **High-Contrast Confirmation Modal (`ResultModal`)** with prominent "OK" receipt button

---

## End-to-End Test Cases Table

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
