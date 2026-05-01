
# HaulNow — Hauling Marketplace MVP

## Overview
A two-sided marketplace where **Users** post haul requests (e.g., "pick up plywood from Home Depot and deliver to my house") and **Haulers** (truck/trailer owners) claim and fulfill those jobs with real-time GPS tracking.

---

## User Flows

### 1. Authentication & Onboarding
- Email/password + Google sign-in
- After signup, users choose their role: **User** or **Hauler**
- Haulers complete a vehicle profile: vehicle type (truck, truck + trailer), photos, capacity description
- Users provide basic profile info (name, phone, profile photo)

### 2. User Flow — Post a Haul Request
- **Create Request** form: pickup address, dropoff address, item description, estimated size/weight category (small, medium, large, extra-large), optional photo of items, desired timeframe (ASAP, scheduled)
- **Pricing**: User sees an estimated price based on distance + item size before posting
- **My Requests** dashboard showing active, completed, and cancelled requests with status indicators

### 3. Hauler Flow — Find & Claim Jobs
- **Job Feed**: List of nearby open haul requests, filterable by distance, size, and price
- **Job Detail**: Full request info with map showing pickup/dropoff, item photos, and estimated earnings
- **Claim Job**: Hauler taps to claim; user gets notified
- **My Jobs** dashboard: active job, upcoming, and completed history

### 4. Active Job — Real-Time Tracking
- Once a hauler claims a job, both parties see a **live map** with the hauler's GPS position
- Job status progression: **Claimed → En Route to Pickup → At Pickup → In Transit → Delivered**
- Hauler updates status at each step; user sees status + location in real time
- Both parties can message each other via in-app chat for the active job

### 5. Ratings & Reviews
- After delivery, both user and hauler rate each other (1-5 stars + optional comment)
- Ratings visible on profiles

---

## Pages & Navigation

| Page | Description |
|------|-------------|
| `/` | Landing page explaining the service, with CTA to sign up |
| `/login` | Login / signup |
| `/onboarding` | Role selection + profile setup |
| `/dashboard` | Role-based dashboard (user sees requests, hauler sees job feed) |
| `/request/new` | Create a new haul request (users) |
| `/request/:id` | Request detail with map + status tracking |
| `/jobs` | Available jobs feed (haulers) |
| `/job/:id` | Job detail + claim action (haulers) |
| `/tracking/:id` | Live tracking map for active jobs |
| `/messages/:id` | In-app chat for a specific job |
| `/profile` | User/hauler profile with ratings |
| `/history` | Past completed jobs |

---

## Key Features

- **Map Integration**: Interactive maps using Mapbox or Leaflet for pickup/dropoff selection and live tracking
- **Real-Time Updates**: Live hauler location and job status using Supabase Realtime subscriptions
- **Push-Style Notifications**: Toast/in-app notifications when a hauler claims your job, status changes, new messages
- **Responsive Design**: Mobile-first since most users will be on phones at a store

---

## Database (Lovable Cloud / Supabase)

Core tables:
- **profiles** — name, phone, avatar, role reference
- **user_roles** — role enum (user, hauler)
- **vehicles** — hauler's vehicle info (type, capacity, photos)
- **haul_requests** — pickup/dropoff locations, item details, size category, price estimate, status, timestamps
- **job_claims** — links hauler to request, status tracking
- **hauler_locations** — real-time GPS coordinates (for live tracking)
- **messages** — in-app chat per job
- **reviews** — ratings between users and haulers

All tables secured with Row-Level Security policies.

---

## What's Deferred (Future Phases)
- **In-app payments** via Stripe (platform fee model) — add after core flow works
- **Route optimization** and ETA calculations
- **Background checks** for haulers
- **Insurance verification**
- **Multi-stop hauls**
- **Native mobile app** (PWA-capable for now)

---

## Technical Notes
- Lovable Cloud (Supabase) for auth, database, real-time subscriptions, and edge functions
- Leaflet + OpenStreetMap for maps (free, no API key needed)
- Supabase Realtime channels for live GPS tracking and chat
- Mobile-first responsive design with Tailwind CSS
