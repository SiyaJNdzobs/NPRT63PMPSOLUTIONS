# eRANK Test Cases

**Date:** 1 September 2026

**Created by:** PMP Solutions Team

**Conducted by:** Indian Centre Rank Staff and PMP Solutions Team

---

| Test Case | Role / Feature | Scenario | Expected Result | Result |
| :--- | :--- | :--- | :--- | :--- |
| **T001** | All Users – Public Landing Page | Universal discovery, live alerts, and fare lookups | Users search for taxis, route fares, and rank directions without logging in. | |
| **T002** | Admin & Owner Management | Account setup, security, and fleet creation | Admin creates an owner. Owner adds local and long-distance taxis, specifies routes, generates driver PINs, and assigns drivers. | |
| **T003** | Marshal Rank Controls | Operational updates, fares, rank QR display, and manual rollback | Marshal posts rank updates, updates taxi fares, turns geo-check on/off, manually adds a taxi, and displays the rank queue QR code. | |
| **T004** | Driver Queue, Geofence & Revenue | Driver check-in, queue positioning, and revenue recording | Local taxi driver scans the QR code while geo-check is on and is blocked with a reason. Driver scans again with geo-check off and joins the queue, then clicks Depart, exits the queue, and revenue is recorded. | |
| **T005** | Driver Queue, Geofence & Revenue | Driver check-in, queue positioning, and revenue recording | Long-distance driver scans the QR code while geo-check is on and is blocked with a reason. Driver scans again with geo-check off, joins the queue, waits for passengers to board and complete the travel manifest, while the marshal fills in details for passengers without smartphones and clicks Depart. | |
| **T006** | Passengers, Boarding & Travel Manifest | Passenger self-boarding, manifest filling, ride sharing, and location tracking | Passenger logs in, accepts location sharing, captures the taxi registration number, clicks Board, fills in the travel manifest, and shares travel details with next of kin via WhatsApp. Next of kin receives and opens the link to track the passenger's live location. Taxi capacity/seats are updated. | |
| **T007** | Marshal Queue Management & Long-Distance Management | Marshal skips a taxi, completes manifests for passengers without phones, and manages departure. | Marshal skips the taxi with a reason, fills in the manifest for passengers without phones, clicks Depart, and the long-distance taxi exits the queue with revenue recorded. | |
| **T008** | Emergency SOS | Driver and owner emergency alert and instructions | Driver sends an SOS. The owner receives it with instructions and the taxi travel manifest information, including passengers' next-of-kin details and contacts. | |
| **T009** | Owner Revenue Management | Owner views recorded revenue and downloads a revenue report. | Owner opens the Revenue tab, views the recorded revenue, and downloads the report. | |
