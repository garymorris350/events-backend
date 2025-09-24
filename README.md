# Events Platform Backend

Express + TypeScript API for managing community events, signups, and payments.

## Features
- Create events (admin only, via passcode header).
- List events (public).
- Get event details (public).
- Record signups (public).
- Stripe Checkout integration (optional).

## Requirements
- Node 20+
- Firestore project
- Render account (for deploy)

## Environment
Create a `.env` file:

```
PORT=10000
ADMIN_PASSCODE=secret123
ALLOW_ORIGINS=http://localhost:3000,https://<frontend-site>.netlify.app
FRONTEND_URL=https://<frontend-site>.netlify.app
STRIPE_SECRET_KEY=sk_test_...
GOOGLE_APPLICATION_CREDENTIALS=serviceAccount.json
```

Notes:
- `ADMIN_PASSCODE`: required to create events.
- `ALLOW_ORIGINS`: comma-separated list of allowed frontends.
- `STRIPE_SECRET_KEY`: optional, leave unset if not using payments.

## Development
```bash
npm install
npm run dev
```

Runs with nodemon + ts-node/esm.

## Build & Start
```bash
npm run build
npm start
```

## API

- `POST /events` (admin)  
  Headers: `x-admin-passcode: <ADMIN_PASSCODE>`  
  Body: `{ title, description, location, start, end, priceType, pricePence? }`

- `GET /events` → `[ { id, title, ... } ]`

- `GET /events/:id`

- `POST /signups`  
  Body: `{ eventId, name, email, amountPence? }`

- `POST /checkout`  
  Body: `{ eventTitle, amountPence }` → `{ url }`

## Deployment
- Push to GitHub.  
- Connect repo to Render.  
- Set environment variables in Render dashboard.  
