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