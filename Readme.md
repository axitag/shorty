# Shorty — URL Shortener & Link Analytics

A full-stack URL shortening and analytics platform built with React + Vite, Node.js + Express, PostgreSQL (Docker), and Prisma.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, Recharts, React Router v7, Axios |
| Backend | Node.js, Express 5, CommonJS, Prisma, PostgreSQL |
| Database | PostgreSQL 16 in Docker |
| Auth | Argon2id password hashing, server-managed sessions (HttpOnly cookie) |

## Prerequisites

- Node.js ≥ 18
- Docker Desktop

## Quick Start

### 1. Start PostgreSQL

```sh
docker compose up -d postgres
```

### 2. Backend setup

```sh
cd backend
cp ../env.example .env   # already provided as .env in dev
npm install
npx prisma migrate dev --name init
npm run dev
```

Backend runs on **http://localhost:3001**

### 3. Frontend setup

```sh
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

## Environment Variables

See `.env.example` in the root. Backend reads from `backend/.env`.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for session signing (min 32 chars) |
| `SESSION_MAX_AGE_MS` | Session lifetime in milliseconds |
| `PORT` | Backend port (default 3001) |
| `CORS_ORIGIN` | Frontend URL for CORS |
| `SHORT_CODE_LENGTH` | Length of generated short codes (default 7) |
| `VISITOR_HASH_SECRET` | Secret for privacy-preserving visitor hashing |
| `AUTH_RATE_LIMIT_MAX` | Max auth attempts per window |

## Running Tests

```sh
# Backend (requires running PostgreSQL)
cd backend
npm test

# Frontend (unit tests, no DB required)
cd frontend
npm test
```

## Migration Commands

```sh
cd backend
npx prisma migrate dev --name <migration-name>   # dev
npx prisma migrate deploy                         # production
npx prisma studio                                 # DB GUI
```

## API Overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | Public | Create user |
| POST | /api/auth/login | Public | Authenticate |
| POST | /api/auth/logout | ✓ | End session |
| GET | /api/auth/me | ✓ | Current user |
| POST | /api/links | ✓ | Create link |
| GET | /api/links | ✓ | List own links |
| GET | /api/links/:id | ✓ owner | Get link |
| PATCH | /api/links/:id | ✓ owner | Update link |
| DELETE | /api/links/:id | ✓ owner | Soft delete |
| GET | /:shortCode | Public | Redirect |
| GET | /api/analytics/overview | ✓ | Account overview |
| GET | /api/analytics/links/:id | ✓ owner | Link analytics |
| GET | /api/analytics/timeseries | ✓ | Time series |
| GET | /api/analytics/referrers | ✓ | Referrer data |
| GET | /api/analytics/devices | ✓ | Device breakdown |
| GET | /api/analytics/locations | ✓ | Geographic data |
| GET | /api/analytics/campaigns | ✓ | UTM campaigns |
| GET | /api/analytics/export.csv | ✓ owner | CSV export |

## Architecture Notes

- **Soft deletion**: Links are soft-deleted (`deletedAt` set). Analytics history is preserved.
- **Bot detection**: Transparent heuristics using known crawler UA patterns. Classification is approximate.
- **Unique visitors**: Daily-rotating keyed hash of IP + UA. Privacy-preserving estimate, not exact unique-person count.
- **IP storage**: Raw IP is never persisted. Visitor hashes rotate daily.
- **Redirect**: Always 302 (never cached 301). Click tracking is async via `setImmediate` and never blocks the redirect.
- **Rate limiting**: Auth endpoints limited to 10 req/15min. Global: 100 req/15min.
- **Sessions**: Stored in PostgreSQL via `connect-pg-simple`. Cookie is HttpOnly, SameSite=lax (dev) / strict (prod).

## Known Limitations

1. **Geolocation**: Country/city analytics require a local MaxMind GeoLite2 database (not configured). Columns exist in DB.
2. **Unique visitor estimation**: Approximate; daily-rotating hash cannot distinguish all humans from bots perfectly.
3. **Bot detection**: Heuristic pattern matching. Zero false negatives are impossible.
4. **No CSRF token**: State-changing API calls are protected by SameSite cookie policy and Origin checking via CORS. For production, add explicit CSRF token middleware if deploying cross-origin.
5. **Password reset**: Not implemented in MVP. Requires email sending infrastructure.
6. **No admin console**: No user-facing admin interface.
