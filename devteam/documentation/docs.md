# E-RANK: Digital Taxi Rank Management and Passenger Safety System

**Project Title:** E-RANK: Digital Taxi Rank Management and Passenger Safety System  
**Group Name:** PMP Solutions  
**Course:** NPRT630 ICT Project  
**Start Date:** Sunday, 19 April 2026  
**Target Completion:** 30 June 2026 (full working prototype + final documentation and submission)

---

## Development Plan and Guide

This document outlines the revised development plan for the **E-RANK** system based on the detailed **Work Breakdown Structure (WBS)** and **Gantt Chart** from Phase 2. All features identified in Phases 2 and 3 (Business Processes, Functional & Non-Functional Requirements, and UML diagrams) will be fully implemented.

### 1. Assigned Roles and Responsibilities

All team members are treated as equals in technical contributions. **Oarabetse Morata** serves as Project Manager with coordination responsibilities while contributing to her assigned modules.

**Members Roles and Responsibilities:**

- **Oarabetse Morata (202406427)** – Project Manager + Owner Dashboard & Passenger Interface Lead  
  - Overall project coordination, weekly progress tracking, risk management, and facilitation of team meetings.  
  - Develop the web-based Owner Dashboard (My Fleet summary, trip reports with bar charts, date range filters, export functionality – FR-03).  
  - Build the public Passenger interface (view routes, taxi availability, estimated wait times – FR-04).  
  - Implement authentication (MFA for owners, PIN + biometric for marshals).  
  - Organise weekly team meetings every Sunday starting 19 April 2026.

- **Phuti Setati (202435062)** – Backend Developer (Java Lead)  
  - Lead Java/Spring Boot backend development (REST APIs for all 5 business processes and 6 functional requirements).  
  - Implement business logic, push notifications, and SMS integration.  
  - Write unit and integration tests.

- **Kholofelo Phalakatsela (202306829)** – Marshal Tablet App Developer  
  - Develop the Android Tablet application for the Taxi Marshal (real-time queue, passenger registration, “Call Next Taxi”, fare recording).  
  - Ensure usability and offline/fallback mode.

- **Louisa Mdluli (202324412)** – Driver Mobile App Developer  
  - Develop the Driver mobile app (QR code scanning to join queue, notifications, “Complete Trip”).  
  - Handle GPS tracking and trip completion logic.

- **Siyabonga Ndzobondzobo (202441850)** – Database Lead + Repo Maintainer  
  - Lead Database design, implementation, cloud deployment, and data security (AES-256 encryption).  
  - Design and implement the full ERD based on the Class Diagram.  
  - Assist with repository maintenance and integration.

**Cross-cutting Responsibilities (All Members):**
- Work through feature branches and submit Pull Requests for every task.
- Participate in code reviews, testing, and bug fixing.
- Attend weekly Sunday meetings and keep the GitHub Projects board updated.

### 2. Technology Stack (Aligned with Lecture Requirements)

**Backend (Prescribed Java):**
- Java 17/21 + Spring Boot 3.x (REST APIs, Security, Scheduling)
- Spring Data JPA + Hibernate
- Spring Security + JWT + MFA support

**Database (Lecture Requirement):**
- PostgreSQL (with Oracle compatibility if needed) or Oracle Database Cloud
- Full ERD implementation matching the Class Diagram from Phase 2
- AES-256 encryption for sensitive passenger data

**Mobile & Frontend:**
- Marshal Tablet App: Kotlin + Jetpack Compose (Android)
- Driver Mobile App: Kotlin (Android)
- Owner Dashboard & Passenger Interface: React.js + TypeScript + Vite + Tailwind CSS
- Charts: Chart.js / Recharts

**Additional Tools:**
- Firebase Cloud Messaging / OneSignal (push notifications)
- Twilio (SMS alerts)
- GitHub Actions (CI/CD)
- Docker (optional for local setup)

### 3. Weekly Development Plan (Aligned with WBS & Gantt Chart)

- **Phase 1: Proposal** – Completed 03 March 2026 (M1)
- **Phase 2: Requirements Specification** – Completed 20 April 2026 (M2)
- **Phase 3: Design Specification** – 21 April – 12 May 2026 (M3)
- **Phase 4: Implementation (Development)** – 13 May – 30 June 2026
  - Database & Backend Foundation (13 May – 23 May)
  - Marshal Tablet App & Queue Management (24 May – 20 June)
  - Driver Mobile App & Trip Completion (21 June – 30 June)
- **Phase 5: Owner Dashboard, Passenger Features & Full Integration** – Completed by end of June where possible
- **Phase 6: Testing, Polish & Final Documentation** – Integrated into late June

**Final Milestone (M4):** 30 June 2026 – Fully tested prototype + documentation ready for submission.

### 4. GitHub Workflow Rules

- Always create feature branches (`feature/owner-dashboard`, `feature/database-schema`, `feature/marshal-tablet`, etc.).
- Submit a Pull Request for every task and request review from Oarabetse + at least one other member.
- Track all tasks using GitHub Issues and the Projects (Kanban) board.
- GitHub Actions will run automatically on PRs (build, test, lint).
- Never push directly to `main` without an approved PR.

### 5. General Advice for Success

- Prioritise core flows: digital queue management and long-distance passenger registration.
- Test frequently, especially offline mode and sunlight-readable tablet UI.
- Document code and decisions as you progress.
- Communicate any blockers immediately to Oarabetse.
- Leverage the existing repository structure.

**Oarabetse** – please review the repository this week, create the GitHub Projects board, assign initial issues, and lead the first team meeting on Sunday, 19 April 2026.

---

**Repository maintained by PMP Solutions**  
**Last updated:** April 2026
