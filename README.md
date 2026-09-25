# E-RANK - Taxi Rank Management & Operations Platform

> **Digitising South Africa's minibus taxi ranks — one queue at a time.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?logo=render&logoColor=white)](https://erank.onrender.com)

---

**Group Name:** PMP Solutions
**Course:** NPRT630
**Institution:** Sol Plaatje University
**Assessment:** Project
**Lecturer:** Mr Melvin
**Submission Date:** 01 October 2026

**Live Application:** [https://erank.onrender.com](https://erank.onrender.com)

> ⚠️ *Hosted on Render's free tier — the first load may take up to ~30 seconds while the service spins up.*

---

## Table of Contents

1. [Development Team](#development-team)
2. [Overview](#overview)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Tech Stack & Architecture](#tech-stack--architecture)
5. [Security & Protection](#security--protection)
6. [End-to-End Use Case Scenario](#e-rank-end-to-end-use-case-scenario)
7. [Project Structure](#project-structure)
8. [Setup & Running Locally](#setup--running-locally)
9. [Environment Variables](#environment-variables)
10. [API Documentation](#api-documentation)
11. [Testing](#testing)
12. [Screenshots](#screenshots)
13. [Known Limitations & Future Work](#known-limitations--future-work)
14. [License & Acknowledgements](#license--acknowledgements)

---

## Development Team

| Name                        | Student Number | GitHub                                                     |
| :-------------------------- | :------------- | :--------------------------------------------------------- |
| Oarabetse Morata            | 202406427      | [@Oarabetse-pixel](https://github.com/Oarabetse-pixel)     |
| Phuti Setati                | 202435062      | [@SetatiPhillipine](https://github.com/SetatiPhillipine)   |
| Kholofelo Phalakatsela      | 202306829      | [@IamKholofeloPhala](https://github.com/IamKholofeloPhala) |
| Louisa Mdluli               | 202324412      | [@Louisa322](https://github.com/Louisa322)                 |
| Siyabonga José Ndzobondzobo | 202441850      | [@SiyaJNdzobs](https://github.com/SiyaJNdzobs)             |

---

## Overview

**E-RANK** is a taxi rank management and operations platform designed for the South African minibus taxi industry. It digitises daily rank operations across **5 roles**: **Admin, Owner, Marshal, Driver, and Passenger**.

### Core Features by Role

**👤 Passenger**
- Search routes and fares
- View public taxi and rank information
- Board taxis and complete a digital manifest with next-of-kin details
- Share live journey and location with family via WhatsApp
- Opt in/out of location sharing
- Chat with the multilingual AI Assistant (routes, fares, ranks)

**🧑‍✈️ Driver**
- Scan the rank QR code to join the queue (GPS geo-verified)
- Trigger SOS alerts with live location
- Scan the destination rank's QR to join the return queue (long-distance)
- View assigned taxi and trip history

**🛡️ Marshal**
- Display rank QR code for driver check-ins
- Publish real-time rank updates
- Manage the 20-metre GPS geofence
- Capture passenger details for those without smartphones
- Press **Depart** to close a trip and trigger revenue calculation

**🚐 Owner**
- Register local and long-distance taxis
- Assign drivers to taxis
- Configure routes and fares
- View revenue reports and export to Excel (`.xlsx`)

**⚙️ Admin**
- Create and manage Owner accounts
- Oversee platform operations
- Manage users, ranks, and system configuration

---

## User Roles & Permissions

| Capability                        | Admin | Owner | Marshal | Driver | Passenger |
| :-------------------------------- | :---: | :---: | :-----: | :----: | :-------: |
| Create Owner accounts             |  ✅   |  ❌   |   ❌    |   ❌   |    ❌     |
| Register taxis                    |  ❌   |  ✅   |   ❌    |   ❌   |    ❌     |
| Assign drivers                    |  ❌   |  ✅   |   ❌    |   ❌   |    ❌     |
| Configure routes & fares          |  ❌   |  ✅   |   ❌    |   ❌   |    ❌     |
| Export revenue (Excel)            |  ❌   |  ✅   |   ❌    |   ❌   |    ❌     |
| Display rank QR                   |  ❌   |  ❌   |   ✅    |   ❌   |    ❌     |
| Manage GPS geofence               |  ❌   |  ❌   |   ✅    |   ❌   |    ❌     |
| Publish rank updates              |  ❌   |  ❌   |   ✅    |   ❌   |    ❌     |
| Capture offline passenger details |  ❌   |  ❌   |   ✅    |   ❌   |    ❌     |
| Depart a trip                     |  ❌   |  ❌   |   ✅    |   ❌   |    ❌     |
| Join queue (QR scan)              |  ❌   |  ❌   |   ❌    |   ✅   |    ❌     |
| Trigger SOS                       |  ❌   |  ❌   |   ❌    |   ✅   |    ❌     |
| Join return queue                 |  ❌   |  ❌   |   ❌    |   ✅   |    ❌     |
| Search routes & fares             |  ✅   |  ✅   |   ✅    |   ✅   |    ✅     |
| Submit digital manifest           |  ❌   |  ❌   |   ❌    |   ❌   |    ✅     |
| Share live location               |  ❌   |  ❌   |   ❌    |   ✅   |    ✅     |
| Use AI Assistant                  |  ✅   |  ✅   |   ✅    |   ✅   |    ✅     |

---

## Tech Stack & Architecture

| Layer               | Technology                    | Why We Chose It                                                                                                  |
| :------------------ | :---------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **Frontend**        | React + Craco                 | Component-based and responsive — suited to multiple user roles and screen sizes.                                 |
| **UI & Styling**    | Tailwind CSS + shadcn/ui      | Responsive layouts and reusable, consistent UI components.                                                       |
| **Icons & QR**      | Lucide React + HTML5 QR Code  | Lightweight icons and camera-based QR scanning without a separate app.                                           |
| **Backend API**     | FastAPI (Python 3.11+)        | Fast, scalable, with built-in request validation and auto-generated API documentation.                           |
| **Database**        | MongoDB Atlas + Motor         | Flexible cloud database — ideal for evolving schemas across queues, manifests, trips, users, and operational records. |
| **Authentication**  | bcrypt + PyJWT                | Secure password/PIN hashing and token-based authentication.                                                      |
| **Maps & Location** | Google Maps + Geolocation API | Familiar maps, directions, and browser-based live location sharing.                                              |
| **AI & Voice**      | AI Assistant + Web Speech API | Multilingual assistance with voice input and text-to-speech.                                                     |
| **Excel Export**    | openpyxl                      | Allows owners to generate structured revenue reports in Excel format.                                            |
| **Deployment**      | Render                        | Cloud hosting so E-RANK can be accessed remotely.                                                                |

---

## Security & Protection

- **Cryptographic Hashing:** Passwords and PINs are securely hashed using `bcrypt`.
- **Token Authentication:** Authenticated requests use signed JSON Web Tokens (`PyJWT`).
- **Role-Based Access Control:** Users can only access features permitted for their role.
- **Mandatory First-Login Credential Reset:** Users with temporary credentials must create their own password/PIN before accessing their dashboard.
- **GPS Geo-Fencing:** Driver QR check-ins are verified against the rank's 20-metre GPS radius.
- **Duplicate Queue Prevention:** The system prevents duplicate active queue entries for the same taxi.
- **Location Consent:** Passengers must choose whether to share their live location.
- **Credential Protection:** Sensitive credentials and secrets are not exposed in the client or repository.

---

## E-RANK End-to-End Use Case Scenario

An **Admin** creates a taxi Owner account. The **Owner** registers local and long-distance taxis, assigns drivers, and configures fares.

At the rank, the **Marshal** displays the QR code, publishes rank updates, and manages the GPS geofence. The **Driver** scans the QR code to join the queue.

**Passengers** search routes and fares, board taxis, and complete a digital manifest with next-of-kin details. They can share their journey and live location with family through WhatsApp. Marshals can capture details for passengers without smartphones.

When the Marshal presses **Depart**, E-RANK records the trip and automatically calculates revenue based on actual passengers for long-distance trips or vehicle seats for local routes.

During the journey, the Driver can trigger an **SOS** alert containing live location information. At the destination, a long-distance taxi can scan the return rank's QR code and join the return queue.

---

## Project Structure

```
erank/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── models/              # Pydantic & DB models
│   │   ├── routes/              # API route handlers (auth, queues, trips, etc.)
│   │   ├── services/            # Business logic (geo-fencing, revenue, AI assistant)
│   │   ├── auth/                # JWT, bcrypt, RBAC dependencies
│   │   └── db/                  # MongoDB Motor client & collections
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/          # Reusable UI (shadcn/ui + custom)
│   │   ├── pages/               # Role dashboards (Admin, Owner, Marshal, Driver, Passenger)
│   │   ├── hooks/               # Custom hooks (auth, geolocation, QR)
│   │   ├── services/            # API client
│   │   ├── context/             # Auth & role context
│   │   └── App.js
│   ├── package.json
│   ├── craco.config.js
│   └── .env.example
│
├── docs/                        # Screenshots, diagrams
└── README.md
```

*(Adjust the tree to match your actual repository layout.)*

---

## Setup & Running Locally

### Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.11+
- **MongoDB Atlas** account (or local MongoDB instance)
- **Google Maps API key** (Maps JavaScript API + Geolocation enabled)
- **Git**

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/erank.git
cd erank
```

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in `backend/` (see [Environment Variables](#environment-variables)), then run:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`.

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in `frontend/`, then run:

```bash
npm start
```

Frontend will be available at `http://localhost:3000`.

### 4. First-time login

- The **Admin** account is seeded on first backend startup (or via a seed script).
- Owners created by the Admin receive temporary credentials and **must reset their password/PIN on first login**.
- See `backend/scripts/seed_admin.py` (or equivalent) for default admin credentials.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable               | Description                                     | Example                              |
| :--------------------- | :---------------------------------------------- | :----------------------------------- |
| `MONGO_URI`            | MongoDB Atlas connection string                 | `mongodb+srv://user:pass@cluster/...` |
| `MONGO_DB_NAME`        | Database name                                   | `erank`                              |
| `JWT_SECRET`           | Secret key for signing JWTs                     | `a-long-random-string`               |
| `JWT_ALGORITHM`        | JWT signing algorithm                           | `HS256`                              |
| `JWT_EXPIRE_MINUTES`   | Token lifetime in minutes                       | `60`                                 |
| `GOOGLE_MAPS_API_KEY`  | Server-side Maps key (if used)                  | `AIza...`                            |
| `AI_ASSISTANT_API_KEY` | Key for the AI Assistant provider (if external) | `sk-...`                             |

### Frontend (`frontend/.env`)

| Variable                  | Description                     | Example                          |
| :------------------------ | :------------------------------ | :------------------------------- |
| `REACT_APP_API_URL`       | Base URL of the backend API     | `http://localhost:8000`          |
| `REACT_APP_GOOGLE_MAPS_KEY` | Google Maps JS API key        | `AIza...`                        |

> 🔒 **Never commit `.env` files.** Use `.env.example` with placeholders in the repo.

---

## API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI:** `http://localhost:8000/docs` (or `https://erank.onrender.com/docs`)
- **ReDoc:** `http://localhost:8000/redoc`

These cover all endpoints, request/response schemas, and authentication requirements.

**Main endpoint groups:**

- `/auth` — login, token refresh, first-login credential reset
- `/admin` — owner account management
- `/owners` — taxis, drivers, routes, fares, revenue reports
- `/marshal` — rank QR, updates, geofence, depart trip, offline passenger capture
- `/driver` — join queue, return queue, SOS
- `/passenger` — route search, manifests, live location sharing
- `/assistant` — AI Assistant (routes, fares, ranks)

---

## Testing

*(Update this section to reflect your actual test setup.)*

- **Backend:** `pytest` for API and unit tests
  ```bash
  cd backend
  pytest
  ```
- **Frontend:** React Testing Library
  ```bash
  cd frontend
  npm test
  ```

**Tested areas include:**
- Authentication and RBAC enforcement
- Duplicate queue prevention
- GPS geo-fencing (20 m radius validation)
- Revenue calculation (local vs long-distance)
- Manifest creation and next-of-kin capture

---

## Screenshots

> Add screenshots here for maximum impact. Suggested images:

| Screen                          | Description                                      |
| :------------------------------ | :----------------------------------------------- |
| `docs/login.png`                | Login / first-time credential reset              |
| `docs/admin-dashboard.png`      | Admin — owner account management                 |
| `docs/owner-dashboard.png`      | Owner — taxis, drivers, routes, revenue          |
| `docs/marshal-qr.png`           | Marshal — QR display and rank updates            |
| `docs/driver-queue.png`         | Driver — QR check-in and queue status            |
| `docs/passenger-manifest.png`   | Passenger — digital manifest + next-of-kin       |
| `docs/ai-assistant.png`         | Multilingual AI Assistant with voice input       |
| `docs/sos-alert.png`            | Driver SOS alert with live location              |

```markdown
![Admin Dashboard](docs/admin-dashboard.png)
![Marshal QR](docs/marshal-qr.png)
```

---

## Known Limitations & Future Work

**Current Limitations**
- Requires an internet connection — ranks often have poor connectivity
- Web-based (PWA) rather than a native mobile app
- Revenue is *tracked*, not *collected* — no payment integration yet
- Passengers without smartphones rely on the Marshal for manifest capture
- No SMS fallback for passengers without data

**Planned Enhancements**
- Offline-first mode with background sync
- Native Android/iOS app
- Integrated mobile payments (SnapScan, Yoco, etc.)
- SMS/USSD fallback for feature phones
- Advanced analytics dashboards for Owners and Admins
- Push notifications for queue position and trip updates

---

## License & Acknowledgements

**License:** Academic project — Sol Plaatje University, NPRT630. Not for commercial use.

**Acknowledgements:**
- Course: **NPRT630** — Project
- Lecturer: **Mr Melvin**
- Institution: **Sol Plaatje University**
- Open-source libraries: FastAPI, React, Tailwind CSS, shadcn/ui, MongoDB Motor, bcrypt, PyJWT, openpyxl, Lucide React, HTML5 QR Code
- South African minibus taxi industry — for inspiring a real-world problem worth solving

---

*Built with ❤️ by **PMP Solutions** — NPRT630, Sol Plaatje University.*
