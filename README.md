# NPRT63PMPSOLUTIONS

## Project Overview

NPRT63PMPSOLUTIONS is a modern digital taxi rank and queue management platform designed to improve the operation of taxi ranks through real-time queue management, passenger tracking, driver coordination, and operational reporting.

The platform aims to digitize and streamline traditional taxi rank processes while preserving existing workflows used by marshals, drivers, and owners within the South African minibus taxi industry.

## Project Structure

```
NPRT63PMPSOLUTIONS/ (Your Repository Root)
├── supabase/                   <-- Your local database configurations
│   ├── config.toml             <-- Supabase local settings
│   └── migrations/             <-- SQL initialization files (table setups, schemas)
│
├── taxi-rank-app/              <-- Your unified mobile-first Expo frontend application
│   ├── App.js                  <-- App entry point
│   ├── app.json                <-- Expo configurations
│   ├── package.json            <-- Project library dependencies
│   │
│   ├── components/             <-- Reusable layout blocks (buttons, modal windows)
│   ├── context/
│   │   └── AuthContext.js      <-- Handles Supabase unified login & session tokens
│   │
│   ├── lib/
│   │   └── supabaseClient.js   <-- Free connection hub connecting Expo to Supabase
│   │
│   └── screens/                <-- User-Specific UI layout views
│       ├── LoginScreen.js      <-- The unified 3-field login interface
│       ├── AdminDashboard.js   <-- Rank setup & printable QR sign download panels
│       ├── OwnerDashboard.js   <-- Coupled vehicle setup & on-the-spot password views
│       ├── MarshalDashboard.js <-- Long-distance manifests & public updates broadcasters
│       ├── DriverDashboard.js  <-- Position checkers & big tactile depart buttons
│       └── PassengerHome.js    <-- Info display board, AI context guide, & late pooling forms
│
├── .gitignore                  <-- Blocks internal secret keys from pushing to public web
├── LICENSE                     <-- Project licensing terms
└── README.md                   <-- This file
```

## Instructions

1. Make sure you have these installed:
   - Node.js and npm
   - Expo CLI
   - Supabase CLI (optional, for local development)

2. Clone this repository into your local machine:

   ```sh
   git clone https://github.com/SiyaJNdzobs/NPRT63PMPSOLUTIONS.git
   ```

3. Install dependencies:

   ```sh
   cd taxi-rank-app
   npm install
   ```

4. Configure Supabase:
   - Create a Supabase project at https://supabase.com
   - Copy your project URL and anon key
   - Update `lib/supabaseClient.js` with your credentials
   - Set up database tables using the migrations in `supabase/migrations/`

5. Run the app:

   ```sh
   npm start
   ```

## Author(s)

"Group members and lecturer"

[Melvin Kisten](https://github.com/iammelvink 'Melvin Kisten\'s GitHub page')

GitHub: @"Group members"

LinkedIn: [Melvin Kisten](https://www.linkedin.com/in/iammelvink 'Melvin Kisten\'s LinkedIn page')

## Acknowledgments




# E-RANK: Digital Taxi Rank Management System

## Project Overview

E-RANK is a modern digital taxi rank and queue management platform designed to improve the operation of taxi ranks through real-time queue management, passenger tracking, driver coordination, and operational reporting.

The platform aims to digitize and streamline traditional taxi rank processes while preserving existing workflows used by marshals, drivers, and owners within the South African minibus taxi industry.

E-RANK will function as:
- A responsive web application
- A mobile-friendly platform
- A real-time taxi queue management system
- A role-based management platform

The system will support:
- Taxi queue management
- Passenger management
- QR code queue joining
- Taxi owner fleet management
- Revenue and trip tracking
- Passenger safety and accountability
- Role-based dashboards and reporting

---

# Mission

To empower taxi marshals and streamline taxi rank operations through accessible digital tools that enhance passenger safety, queue efficiency, communication, and operational transparency.

---

# Vision

To become the leading digital platform revolutionizing taxi rank management and public transport operations across South Africa and beyond.

---

# Problem Statement

Traditional taxi rank systems rely heavily on manual processes which often lead to:
- Queue disputes
- Poor communication
- Passenger safety concerns
- Lack of operational transparency
- Difficult revenue tracking
- Poor trip monitoring
- Inefficient loading systems

E-RANK addresses these challenges through digital transformation while still respecting the existing operational structure of taxi ranks.

---

# Proposed Solution

E-RANK introduces:
- Real-time taxi queue management
- QR-based taxi queue joining
- Passenger registration and loading management
- Driver and owner coordination
- Revenue tracking and reporting
- Taxi availability tracking
- Rank-based management systems
- Secure role-based access

---

# Core System Features

## Queue Management
- Real-time taxi queue updates
- Automatic queue reordering
- Queue position tracking
- Taxi loading management
- Queue exit after loading completion

---

## Passenger Management
- Passenger registration
- Long-distance passenger tracking
- Next-of-kin information storage
- Route and seat assignment
- Passenger trip records

---

## Taxi Fleet Management
- Taxi registration management
- Fleet tracking
- Owner taxi assignment
- Taxi revenue tracking
- Taxi trip monitoring

---

## QR Code Functionality
Drivers will:
- Scan QR codes to join queues
- Rejoin queues automatically after trip completion
- Receive queue updates in real time

---

## Reporting & Analytics
The system will provide:
- Revenue reports
- Taxi trip statistics
- Queue analytics
- Passenger statistics
- Operational insights

---

# User Roles

The system will support the following user roles:

## Admin
Responsible for:
- Monitoring the entire platform
- Managing users
- Viewing reports
- Accessing analytics
- Viewing feedback and reviews

---

## Owner
Responsible for:
- Managing taxis
- Viewing fleet performance
- Monitoring taxi revenue
- Viewing completed trips

---

## Driver
Responsible for:
- Joining queues
- Selecting assigned taxis
- Managing trip loading process
- QR code queue participation

---

## Marshal
Responsible for:
- Passenger loading
- Queue coordination
- Taxi dispatching
- Marking taxis as loaded/full

---

## Passenger
Responsible for:
- Viewing taxi availability
- Route searching
- Viewing queue information
- Accessing estimated waiting information

---

## Development Team

| Name                                | Student Number | GitHub Profile                                               |
|------------------------------------|----------------|--------------------------------------------------------------|
| [Oarabetse Morata](https://github.com/Oarabetse-pixel)              | 202406427     | https://github.com/Oarabetse-pixel                                 |
| [Phuti Setati](https://github.com/PhutiSetati)                | 202435062     | https://github.com/PhutiSetati                               |
| [Kholofelo Phalakatsela](https://github.com/IamKholofeloPhala) | 202306829     | https://github.com/IamKholofeloPhala                     |
| [Louisa Mdluli](https://github.com/Louisa322)              | 202324412     | https://github.com/Louisa322                               |
| [Siyabonga José Ndzobondzobo](https://github.com/SiyaJNdzobs) | 202441850     | https://github.com/SiyaJNdzobs                                |

---


# System Architecture

```text
Frontend (React + Vite)
            ↓
Backend API (Java Spring Boot)
            ↓
Supabase PostgreSQL Database

To my lecturer [Melvin Kisten](https://www.linkedin.com/in/iammelvink 'Melvin Kisten\'s LinkedIn page') for their guidance

## More Stuff

Check out some other stuff on
[Melvin Kisten](https://github.com/iammelvink 'Melvin Kisten\'s GitHub page')
