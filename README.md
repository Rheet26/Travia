# Travia

Travia is a full-stack railway reservation web application inspired by real-world booking systems like IRCTC. It streamlines railway ticketing through intelligent seat allocation, automated RAC (Reservation Against Cancellation) and waitlist management, and real-time booking synchronization.

## Key Features

- **Passenger Console**: Express route timetable search, station-to-station fare calculation, berth preferences (Lower, Middle, Upper), live ticket booking, and boarding pass generation with PNR.
- **Admin Console**: Train timetable management, fleet capacity tuning (Seats, RAC, Waitlist limits), passenger reservation monitoring, and real-time queue administration.
- **Smart Allocation Engine**: Automated Lower/Middle/Upper berth assignment with senior citizen preference priority, contiguous RAC and Waitlist queue management.
- **Real-Time Upgrade Pipeline**: Automatic queue promotion upon ticket cancellations (RAC → CONFIRMED, Waitlist → RAC).
- **Authentication & Security**: Supabase authentication with Row Level Security (RLS) policies enforcing strict per-user booking isolation.
- **E-Ticket Generation**: Instant PDF ticket generation with verification QR codes and detailed route summaries.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or bun

### Installation
```sh
npm install
```

### Running Locally
```sh
npm run dev
```

The application runs locally on `http://localhost:8080/`.

### Production Build
```sh
npm run build
```
