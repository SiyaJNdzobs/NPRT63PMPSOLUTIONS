Here is the **full updated `README.md`**, with the AI Assistant included in the Overview and all the changes we discussed.

# E-RANK - Taxi Rank Management & Operations Platform

## Development Team

| Name                        | Student Number | GitHub                                                     |
| :-------------------------- | :------------- | :--------------------------------------------------------- |
| Oarabetse Morata            | 202406427      | [@Oarabetse-pixel](https://github.com/Oarabetse-pixel)     |
| Phuti Setati                | 202435062      | [@SetatiPhillipine](https://github.com/SetatiPhillipine)   |
| Kholofelo Phalakatsela      | 202306829      | [@IamKholofeloPhala](https://github.com/IamKholofeloPhala) |
| Louisa Mdluli               | 202324412      | [@Louisa322](https://github.com/Louisa322)                 |
| Siyabonga José Ndzobondzobo | 202441850      | [@SiyaJNdzobs](https://github.com/SiyaJNdzobs)             |

**Group Name:** PMP Solutions
**Course:** NPRT630
**Live Application:** [https://erank.onrender.com](https://erank.onrender.com)

---

## Overview

**E-RANK** is a taxi rank management and operations platform designed for the South African minibus taxi industry. It digitizes daily rank operations across 5 roles: **Admin, Owner, Marshal, Driver, and Passenger**.

Key features include live taxi queues, QR-code rank check-ins, GPS geo-verification, route and fare management, digital passenger manifests, revenue tracking, emergency SOS alerts, live ride sharing, public taxi and rank information, and a **multilingual AI Assistant** for route, fare, and rank-related assistance.

---

## Tech Stack & Architecture

| Layer               | Technology                    | Why We Chose It                                                                                |
| :------------------ | :---------------------------- | :--------------------------------------------------------------------------------------------- |
| **Frontend**        | React + Craco                 | Component-based and responsive, making it suitable for multiple user roles and screen sizes.   |
| **UI & Styling**    | Tailwind CSS + shadcn/ui      | Provides responsive layouts and reusable, consistent UI components.                            |
| **Icons & QR**      | Lucide React + HTML5 QR Code  | Lightweight icons and camera-based QR scanning without requiring a separate app.               |
| **Backend API**     | FastAPI (Python 3.11+)        | Fast, scalable, and provides built-in request validation and API documentation.                |
| **Database**        | MongoDB Atlas + Motor         | Flexible cloud database suitable for queues, manifests, trips, users, and operational records. |
| **Authentication**  | bcrypt + PyJWT                | Provides secure password/PIN hashing and token-based authentication.                           |
| **Maps & Location** | Google Maps + Geolocation API | Provides familiar maps, directions, and browser-based live location sharing.                   |
| **AI & Voice**      | AI Assistant + Web Speech API | Enables multilingual assistance together with voice input and text-to-speech.                  |
| **Excel Export**    | openpyxl                      | Allows owners to generate structured revenue reports in Excel format.                          |
| **Deployment**      | Render                        | Provides cloud hosting so E-RANK can be accessed remotely.                                     |

---

## Security & Protection

* **Cryptographic Hashing:** Passwords and PINs are securely hashed using `bcrypt`.
* **Token Authentication:** Authenticated requests use signed JSON Web Tokens (`PyJWT`).
* **Role-Based Access Control:** Users can only access features permitted for their role.
* **Mandatory First-Login Credential Reset:** Users with temporary credentials must create their own password/PIN before accessing their dashboard.
* **GPS Geo-Fencing:** Driver QR check-ins are verified against the rank's 20-metre GPS radius.
* **Duplicate Queue Prevention:** The system prevents duplicate active queue entries for the same taxi.
* **Location Consent:** Passengers must choose whether to share their live location.
* **Credential Protection:** Sensitive credentials and secrets are not exposed in the client or repository.

---

## E-RANK End-to-End Use Case Scenario

An **Admin** creates a taxi Owner account. The **Owner** registers local and long-distance taxis, assigns drivers, and configures fares.

At the rank, the **Marshal** displays the QR code, publishes rank updates, and manages the GPS geofence. The **Driver** scans the QR code to join the queue.

Passengers search routes and fares, board taxis, and complete a digital manifest with next-of-kin details. They can share their journey and live location with family through WhatsApp. Marshals can capture details for passengers without smartphones.

When the Marshal presses **Depart**, E-RANK records the trip and automatically calculates revenue based on actual passengers for long-distance trips or vehicle seats for local routes.

During the journey, the Driver can trigger an **SOS** alert containing live location information. At the destination, a long-distance taxi can scan the return rank's QR code and join the return queue.

---


## E-RANK Investor Test Cases — End-to-End Test Cases

> **Notice:** The comprehensive End-to-End Test Suite is broken down into structured, modular test cases and is uploaded directly in this repository in [`TEST_CASES.md`](./TEST_CASES.md).

**Date:** 2026-09-18
**Created by:** PMP Solutions Quality Assurance Team
**Conducted by:** Antigravity Automated & Field Verification Suite

| Test Case ID | Role / Feature Area                    | Test Scenario                                      | Expected Result                                                                                                                                            | Result   |
| :----------- | :------------------------------------- | :------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- |
| **TC-01**    | **Public Landing Page**                | Universal discovery, live alerts, and fare lookups | Commuters can look up real-time fares, directions, and rank alerts without an account; logging in unlocks the AI assistant and ride-sharing features.      | **Pass** |
| **TC-02**    | **Admin & Owner Management**           | Account setup, security, and fleet creation        | Admin creates an Owner account; Owner changes the initial password, registers local and long-distance taxis, sets fares, and assigns drivers successfully. | **Pass** |
| **TC-03**    | **Marshal Rank Controls**              | Operational updates, fares, and rank QR display    | Rank notices post in real time, fares update across the platform, the GPS geofence is active, and the live QR code is displayed.                           | **Pass** |
| **TC-04**    | **Driver Queue & Geofence**            | Driver check-in and queue positioning              | Scans outside 20 metres are blocked with a clear distance alert; scans at the rank succeed and place the taxi into the live queue.                         | **Pass** |
| **TC-05**    | **Passenger Self-Boarding & Manifest** | Digital manifest capture and safe ride sharing     | Passengers complete the manifest and can share verified taxi and journey information; Marshals can capture passengers without smartphones.                 | **Pass** |
| **TC-06**    | **Accurate Revenue Departure**         | Fair revenue accounting upon trip departure        | Long-distance revenue is calculated using actual boarded passengers, while local trips use vehicle capacity.                                               | **Pass** |
| **TC-07**    | **Dual-Rank QR Scanning**              | Long-distance round trips across two cities        | Long-distance taxis can scan and join queues at both ranks; local taxis remain restricted to their home rank.                                              | **Pass** |
| **TC-08**    | **Emergency SOS & Tracking**           | In-transit safety and next-of-kin live tracking    | Owner and Admin receive SOS alerts with vehicle and GPS data; next-of-kin can access the shared journey and location.                                      | **Pass** |
| **TC-09**    | **Credential Reset & Super Admin**     | Centralized password recovery and governance       | Authorized administrators can reset user credentials, while administrator credential management remains restricted to the appropriate authority.           | **Pass** |
| **TC-10**    | **Multilingual AI Assistant**          | User queries rank, route, or fare information      | AI Assistant provides supported E-RANK information in English, isiZulu, isiXhosa, Sesotho, Setswana, and Afrikaans.                                        | **Pass** |
| **TC-11**    | **AI Assistant Voice Controls**        | Microphone input and text-to-speech                | User speech is converted into a query and the assistant can read responses aloud using browser speech features.                                            | **Pass** |
| **TC-12**    | **Owner Revenue Reporting**            | Revenue viewing and Excel export                   | Owner can view revenue and download a structured `.xlsx` statement containing taxi, driver, trip, fare, and revenue information.                           | **Pass** |
| **TC-13**    | **Action Confirmation**                | User completes an important system action          | A high-contrast confirmation dialogue displays the result with a clear **OK** button.                                                                      | **Pass** |
