This Dev guide and plan is yet to be alter roles rotated and languages and tool updated then confirmed:


Revised Development Plan and Guide for E-RANK App
Project Title: E-RANK: Digital Taxi Rank Management and Passenger Safety System 
Group Name: PMP Solutions 
Course: NPRT630 ICT Project Start 
Date: Sunday, 19 April 2026 Target 
Completion: 30 August 2026 (full working prototype + documentation) 
Version Control: All work will be done on the existing GitHub repository
Use Pull Requests (PRs), GitHub Issues, GitHub Projects (Kanban board), and GitHub Actions for CI/CD workflows.
1. Assigned Roles and Responsibilities
All team members are treated as equals in technical contributions. Oarabetse Morata serves as Project Manager with coordination responsibilities while contributing to her assigned modules. All members are expected to assist and adhere to all professional requests made by Project Manager and also must adhere booked meetings Project Manager will take record of Professional Conduct and work ethic.
Members Roles and Responsibilities:
Oarabetse Morata (202406427) – Project Manager + Owner Dashboard & Passenger Interface Lead Responsibilities:
	Overall project coordination, weekly progress tracking, risk management, and facilitation of team meetings.
	Develop the web-based Owner Dashboard (My Fleet summary, trip reports with bar charts, date range filters, export functionality – FR-03).
	Build the public Passenger interface (view routes, taxi availability, estimated wait times – FR-04).
	Implement authentication (MFA for owners, PIN + biometric for marshals, simpler methods for drivers/passengers).
	Assist with repository maintenance (documentation, README updates, and general GitHub hygiene).
	Organise weekly team meetings every Sunday starting 19 April 2026 and prepare status reports.
	Ensure all non-functional requirements are met and coordinate final integration, testing, and submission preparation.
Phuti Setati (202435062) – Backend Developer (Java Lead) Responsibilities:
	Lead Java/Spring Boot backend development (REST APIs for queue management, passenger registration, notifications, and fare recording).
	Implement business logic from the 5 business processes and 6 functional requirements (FR-01 to FR-06).
	Integrate with the Database using JPA/Hibernate.
	Develop push notification service and SMS gateway integration.
	Write unit and integration tests; configure GitHub Actions workflows.
Kholofelo Phalakatsela (202306829) – Marshal Tablet App Developer Responsibilities:
	Develop the Android Tablet application for the Taxi Marshal (real-time queue display, passenger registration form, “Call Next Taxi” button, fare recording).
	Ensure usability requirements (maximum 2 screen taps, 44x44 pixel touch targets, sunlight-readable interface at minimum 500 nits).
	Implement offline/fallback mode with local data sync when connectivity is lost.
	Integrate with Backend APIs.
Louisa Mdluli (202324412) – Driver Mobile App Developer Responsibilities:
•	Develop the Driver mobile app (QR code scanning to join queue, receive push notifications, view active trips, “Complete Trip” button).
•	Handle optional GPS tracking and trip completion logic (Processes 1 and 4).
•	Ensure smooth integration with Backend for queue position updates and ride verification.
Siyabonga Ndzobondzobo (202441850) – Database Lead + Repo Maintainer Responsibilities:
	Lead Database design, implementation, cloud deployment, and data security (AES-256 encryption for passenger records, zero data loss).
	Design and implement the full ERD based on the Class Diagram (User, Taxi, QueueEntry, Passenger, Trip entities).
	Set up cloud-hosted PostgreSQL and ensure reliability requirements (99.9% queue accuracy, auto-save every 5 seconds).
	Assist with repository maintenance (documentation, README updates, and general GitHub hygiene) alongside Oarabetse.
	Support integration of all modules with the Database.
Cross-cutting Responsibilities (All Members):
	Work through feature branches and submit Pull Requests for every task.
	Participate in code reviews, testing, and bug fixing.
	Document your modules (inline comments + docs folder in the repo).
	Attend weekly Sunday meetings and keep the GitHub Projects board updated.
	Contribute equally to the success of the project.
2. Full Stack Technology & Tools (Java as Leading Language)
Backend (Java Leading Led by Setati):
	Java 17/21 + Spring Boot 3.x (REST APIs, Security, Scheduling)
	Spring Data JPA + Hibernate
	Spring Security + JWT + MFA support
	AES-256 encryption for sensitive passenger data (handled in Database layer)
	PostgreSQL (cloud-hosted)
Database (Led by Siyabonga):
	PostgreSQL with cloud hosting (Supabase, Neon, AWS RDS, or Azure PostgreSQL)
	Full ERD implementation matching the Class Diagram from Phase 2
	Firebase Cloud Messaging or OneSignal for push notifications
	Twilio or equivalent for SMS alerts
Marshal Tablet App (Led by Kholofelo):
	Kotlin + Jetpack Compose (Android-focused)
	Android Studio
	Retrofit for API calls + Room for local caching (offline mode)
	QR scanning with ZXing or ML Kit
Driver Mobile App (Led by Louisa):
	Kotlin (Android) + Swift/SwiftUI (iOS) or Kotlin Multiplatform where time permits
	Camera support for QR code scanning
Owner Dashboard & Passenger Interface (Led by Oarabetse):
	React.js + TypeScript + Vite
	Tailwind CSS or Material-UI for responsive design
	Chart.js or Recharts for daily trip bar charts
	Axios for API calls
Development & Collaboration Tools:
	Existing GitHub repository – Issues, Projects board, Actions (CI/CD: build, test, lint)
	IntelliJ IDEA (for Java/Spring Boot)
	Android Studio (for tablet and driver Android apps)
	Xcode (for iOS components)
	Postman/Insomnia for API testing
	Docker (optional for local backend setup)
3. Weekly Development Plan (Starting Sunday, 19 April 2026)
Week 0: Project Kick-off & Repo Alignment (19 Apr – 25 Apr 2026)
	Oarabetse: Review current repository structure, create GitHub Projects Kanban board, define branch protection rules, and assign initial issues based on the WBS.
	Siyabonga: Review and document current Database-related files (if any) and prepare initial ERD.
	All members: Pull the latest code, explore the existing files, and submit a small test PR.
	Hold the first team meeting on Sunday 19 April to confirm roles and plan.
	Deadline: 25 April – GitHub Projects board live and team aligned.
Phase 1: Database & Backend Foundation (Weeks 1-4: 26 Apr – 23 May)
	Siyabonga: Design and implement core Database schema, add AES-256 encryption, auto-save mechanisms, and basic CRUD operations.
	Phuti: Initialise Spring Boot structure and develop core REST APIs for queue and passenger management.
	All: Review wireframes aligned with Phase 2 UML diagrams.
	Deadline: 23 May – Database deployed and basic backend endpoints functional.
Phase 2: Marshal Tablet App & Queue Management (Weeks 5-8: 24 May – 20 Jun)
	Kholofelo: Build Marshal tablet UI and integrate with backend (real-time queue, registration form – Processes 2 & 3).
	Phuti: Complete backend logic for FR-01, FR-02, FR-05, FR-06.
	Oarabetse & Siyabonga: Support integration and perform PR reviews.
	Deadline: 20 June – Marshal app functional with queue and passenger registration.
Phase 3: Driver Mobile App & Trip Completion (Weeks 9-12: 21 Jun – 18 Jul)
	Louisa: Develop Driver app features (QR scanning to join queue, notifications, Complete Trip – Processes 1 & 4).
	Phuti: Enhance backend for trip completion and fare handling.
	Siyabonga: Ensure Database integration for trip records.
	Deadline: 18 July – Driver app working end-to-end.
Phase 4: Owner Dashboard & Passenger Features (Weeks 13-16: 19 Jul – 15 Aug)
	Oarabetse: Implement Owner Dashboard (FR-03 with bar charts and reports) and Passenger availability interface (FR-04).
	All: Perform full system integration, authentication setup, and performance optimisation (<3s QR scan, <5s dashboard load).
	Deadline: 15 August – All modules integrated and usable.
Phase 5: Testing, Polish & Final Documentation (Weeks 17-19: 16 Aug – 30 Aug)
	All members: Conduct functional, performance, usability, and security testing.
	Oarabetse: Coordinate bug fixes, final merges to main, prepare deployment guide, and complete project documentation.
	Siyabonga: Verify Database reliability and security requirements.
	Deadline: 30 August 2026 – Fully tested prototype, clean GitHub repository, and submission-ready materials.
4. GitHub Workflow Rules
	Always create feature branches (e.g., feature/owner-dashboard, feature/database-schema).
	Submit a Pull Request for every task. Use clear titles, link to GitHub Issues, and request review from Oarabetse + at least one other member.
	Track all tasks using GitHub Issues and the Projects board.
	GitHub Actions will run automatically on PRs for building, testing, and linting.
	Write descriptive commit messages.
	Never push directly to main or develop without an approved PR.
5. General Advice for Success
	Attend every weekly Sunday meeting and keep tasks updated on the GitHub Projects board.
	Prioritise core flows (digital queue and long-distance passenger registration) in early phases.
	Test frequently, especially offline mode and sunlight-readable tablet UI.
	Document code and decisions as you progress.
	Communicate any blockers immediately to Oarabetse for quick resolution.
	Leverage the existing repository structure.
Oarabetse – please review the repository this week, create the GitHub Projects board, assign initial issues, and lead the first team meeting on Sunday, 19 April 2026.


