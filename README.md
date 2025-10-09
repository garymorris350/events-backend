# Events Platform (Launchpad Project)

## Overview
The **Events Platform** (FilmHub) is a web application designed for a small community business to create and share events with local members.  
It allows staff to post events, while community members can view details, register interest, and optionally add events to their personal calendar.

This project was developed as part of the **Tech Returners Launchpad (Software Engineering Track)**.  
It demonstrates skills in TypeScript, Express.js, Firestore, and deployment to Render.

---

## Features
- Create and manage community events (staff-only)
- View all events and individual event details
- Secure admin-only route for creating new events (protected by passcode)
- Firestore integration for event storage
- Hosted REST API on Render
- Ready for frontend integration (Netlify frontend: FilmHub)

---

## Tech Stack
- **Backend:** Node.js, Express, TypeScript
- **Database:** Firestore (Google Firebase)
- **Hosting:** Render
- **Validation:** Zod
- **Environment Variables:** Managed via `.env`

---

## Running Locally

### Prerequisites
- Node.js 18+
- Firebase service credentials

### Steps
1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/events-backend.git
   cd events-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file**
   Copy the example below into `.env`:
   ```bash
   ADMIN_PASSCODE=launchpad2025
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY="your_private_key"
   FIREBASE_CLIENT_EMAIL=your_service_account_email
   ALLOW_ORIGINS=http://localhost:3000,https://events-platform-frontend.netlify.app
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

5. The server will run on:
   ```
   http://localhost:10000
   ```

---

## Deployment
The backend is deployed on **Render** and connected to Firestore.  
To deploy updates:
```bash
git add .
git commit -m "Update project"
git push origin main
```
Render automatically rebuilds on push.

Live API: [https://events-platform-backend.onrender.com](https://events-platform-backend.onrender.com)

---

## Environment Example (`.env.example`)
```bash
ADMIN_PASSCODE=launchpad2025
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="your_private_key"
FIREBASE_CLIENT_EMAIL=your_service_account_email
ALLOW_ORIGINS=http://localhost:3000,https://events-platform-frontend.netlify.app
```

---

## Testing
Basic testing includes verifying:
- POST `/events` works with correct passcode.
- GET `/events` returns all events.
- GET `/events/:id` returns a single event.

Example using curl:
```bash
curl -X POST https://events-platform-backend.onrender.com/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Launchpad Demo","description":"Test event","location":"Community Hall","start":"2025-10-10T18:00:00.000Z","end":"2025-10-10T20:00:00.000Z","passcode":"launchpad2025"}'
```

Expected: `201 Created`

---

## Future Enhancements
- Add Google Calendar integration.
- Stripe checkout for paid events.
- Email confirmations for registrations.
- User authentication (Firebase Auth).

---

## Project Information
- **Project:** Events Platform (Launchpad SE Track)
- **Duration:** 4 weeks (~40 hours)
- **Hosted:** Render (Backend), Netlify (Frontend)
- **Created by:** Gary Morris
- **Date:** October 2025

---

## Notes for Assessors
- **Admin Passcode:** Provided privately via Launchpad submission notes (not stored in repo).  
- The project meets all Launchpad SE MVP and documentation requirements.  
- Live backend and frontend integrations verified prior to submission.

---

© 2025 Launchpad Project – Created for Tech Returners / Northcoders Programme.
