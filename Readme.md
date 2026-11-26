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

## Project Structure

```text
shorty/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Readme.md
├── backend/
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   ├── vitest.config.mjs
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │       ├── migration_lock.toml
│   │       └── 20261123171358_init/
│   │           └── migration.sql
│   ├── scripts/
│   │   ├── check-db.js
│   │   ├── fix-coding2.js
│   │   ├── list-links.js
│   │   ├── seed-all-links.js
│   │   └── seed-clicks.js
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── logger.js
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   ├── notFound.js
│   │   │   ├── requireAuth.js
│   │   │   └── validate.js
│   │   └── modules/
│   │       ├── analytics/
│   │       │   ├── analytics.controller.js
│   │       │   ├── analytics.routes.js
│   │       │   └── analytics.service.js
│   │       ├── auth/
│   │       │   ├── auth.controller.js
│   │       │   └── auth.routes.js
│   │       ├── links/
│   │       │   ├── link.controller.js
│   │       │   ├── link.routes.js
│   │       │   └── link.service.js
│   │       └── redirect/
│   │           ├── click.service.js
│   │           └── redirect.routes.js
│   └── tests/
│       └── api.test.js
└── frontend/
    ├── .gitignore
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── postcss.config.js
    ├── README.md
    ├── tailwind.config.js
    ├── vite.config.js
    ├── vitest.config.js
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── App.css
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── api/
        │   └── client.js
        ├── assets/
        │   ├── hero.png
        │   ├── react.svg
        │   └── vite.svg
        ├── components/
        │   ├── CopyButton.jsx
        │   ├── CreateLinkModal.jsx
        │   ├── ProtectedRoute.jsx
        │   └── ui.jsx
        ├── contexts/
        │   ├── AuthContext.jsx
        │   └── ThemeContext.jsx
        ├── hooks/
        │   └── useApi.js
        ├── layouts/
        │   └── AppLayout.jsx
        ├── pages/
        │   ├── AccountPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── LandingPage.jsx
        │   ├── LinkDetailsPage.jsx
        │   ├── LinksPage.jsx
        │   ├── LoginPage.jsx
        │   ├── NotFoundPage.jsx
        │   ├── RegisterPage.jsx
        │   └── UnavailablePage.jsx
        └── test/
            ├── components.test.jsx
            └── setup.js
```

## File Summary

### Root
- `.env.example` — Template of environment variables (database URL, session secret, port, CORS origin, short code length, rate limits, visitor hash secret).
- `.gitignore` — Git ignore rules for dependencies, build outputs, logs, and local environment files.
- `docker-compose.yml` — Defines the `shorty-postgres` PostgreSQL 16 Alpine Docker service, persistent volume, and healthcheck.
- `Readme.md` — Main project documentation, setup instructions, API reference, file structure, and architecture notes.

### Backend (`backend/`)
- `backend/.env` — Local development environment configuration loaded by `dotenv`.
- `backend/package.json` — Backend dependencies, CommonJS configuration, and npm scripts (`dev`, `start`, `migrate`, `test`, etc.).
- `backend/package-lock.json` — Locked dependency tree for reproducible backend installs.
- `backend/vitest.config.mjs` — Vitest configuration for running backend integration tests.

#### Prisma & Database (`backend/prisma/`)
- `backend/prisma/schema.prisma` — Prisma schema defining `User`, `Campaign`, `Link` (`LinkStatus`), `ClickEvent`, and `Session` models.
- `backend/prisma/migrations/migration_lock.toml` — Prisma migration provider lock file (`postgresql`).
- `backend/prisma/migrations/20261123171358_init/migration.sql` — Initial SQL migration creating tables, enums, indexes, and foreign keys.

#### Utility & Seed Scripts (`backend/scripts/`)
- `backend/scripts/check-db.js` — Quick script to verify PostgreSQL connectivity and print the current user count.
- `backend/scripts/fix-coding2.js` — One-off maintenance script updating the `coding2` short link's destination URL.
- `backend/scripts/list-links.js` — Lists all links in the database with their status, URL, deletion state, and click counts.
- `backend/scripts/seed-all-links.js` — Seeds 2,000–4,000 realistic click events (referrers, devices, browsers, OS, cities, bots) for every link in the database.
- `backend/scripts/seed-clicks.js` — Seeds ~3,000 realistic click events spread across the last 90 days.

#### Core Server & Config (`backend/src/`)
- `backend/src/server.js` — HTTP server entry point; connects Prisma to PostgreSQL, starts listening on `PORT`, and handles graceful `SIGTERM`/`SIGINT` shutdown.
- `backend/src/app.js` — Configures Express middleware (`helmet`, `cors`, JSON/URL-encoded parsers, `pinoHttp`, `express-session` with `connect-pg-simple`), mounts API and redirect routes, and registers error handlers.
- `backend/src/config/database.js` — Instantiates and exports the Prisma client (`prisma`) and raw `pg` connection `pool` for the session store.
- `backend/src/config/logger.js` — Configures the Pino logger with `pino-pretty` in development and redaction for sensitive headers/body fields.

#### Middleware (`backend/src/middleware/`)
- `backend/src/middleware/errorHandler.js` — Defines `AppError` and global Express error-handling middleware that hides internal details in production.
- `backend/src/middleware/notFound.js` — Catch-all 404 handler returning a structured JSON `NOT_FOUND` error.
- `backend/src/middleware/requireAuth.js` — Session authentication guard ensuring `req.session.userId` is present.
- `backend/src/middleware/validate.js` — Zod validation middleware validating `req.body`, `req.query`, and `req.params`.

#### Modules (`backend/src/modules/`)
- `backend/src/modules/auth/auth.routes.js` — Mounts `/register`, `/login`, `/logout`, and `/me` routes with rate limiting and auth guards.
- `backend/src/modules/auth/auth.controller.js` — Handles registration (Argon2id hashing), login, logout, current-user lookup, Zod validation, and auth rate limiting.
- `backend/src/modules/links/link.routes.js` — Mounts authenticated CRUD routes (`/`, `/:id`) for user links.
- `backend/src/modules/links/link.controller.js` — Validates link creation, listing, retrieval, update, and deletion requests with Zod and delegates to `link.service.js`.
- `backend/src/modules/links/link.service.js` — Implements URL validation, short code generation, reserved-code checks, ownership enforcement, pagination/search, and soft deletion.
- `backend/src/modules/analytics/analytics.routes.js` — Mounts authenticated analytics endpoints (`/overview`, `/links/:id`, `/timeseries`, `/referrers`, `/devices`, `/locations`, `/campaigns`, `/export.csv`).
- `backend/src/modules/analytics/analytics.controller.js` — Parses date-preset/query parameters with Zod and delegates to `analytics.service.js`.
- `backend/src/modules/analytics/analytics.service.js` — Runs Prisma/SQL aggregations for overview metrics, period-over-period growth, time series, referrers, devices, locations, UTM campaigns, and CSV export.
- `backend/src/modules/redirect/redirect.routes.js` — Public `GET /:shortCode` handler performing 302 redirects (or redirecting to `/link-unavailable` when missing/inactive/expired) and triggering async click recording.
- `backend/src/modules/redirect/click.service.js` — Asynchronously parses User-Agent (`ua-parser-js`), detects bots, computes daily-rotating HMAC visitor hashes, extracts UTM/referrer metadata, and inserts `ClickEvent` rows.

#### Backend Tests (`backend/tests/`)
- `backend/tests/api.test.js` — Supertest/Vitest integration test suite covering auth, link CRUD, redirects, and analytics endpoints.

### Frontend (`frontend/`)
- `frontend/.gitignore` — Frontend-specific git ignore rules.
- `frontend/eslint.config.js` — ESLint configuration for React and modern JS.
- `frontend/index.html` — Root HTML shell mounting the React `#root` element.
- `frontend/package.json` — Frontend dependencies (React 19, Vite, Tailwind CSS, Recharts, Pika Icons, Axios, Vitest) and scripts.
- `frontend/package-lock.json` — Locked frontend dependency tree.
- `frontend/postcss.config.js` — PostCSS configuration enabling Tailwind CSS and Autoprefixer.
- `frontend/README.md` — Default Vite + React template README.
- `frontend/tailwind.config.js` — Tailwind CSS configuration (`darkMode: 'class'` and content paths).
- `frontend/vite.config.js` — Vite configuration including `/api` and short-link proxy settings for local development.
- `frontend/vitest.config.js` — Vitest configuration with `jsdom` environment for frontend component tests.
- `frontend/public/favicon.svg` — Application favicon SVG.
- `frontend/public/icons.svg` — Public SVG icon sprite/asset.

#### Source (`frontend/src/`)
- `frontend/src/main.jsx` — Application entry point wrapping `<App />` in `<ThemeProvider>` and importing `index.css`.
- `frontend/src/App.jsx` — Defines public and protected routes via React Router and wraps the app in `<AuthProvider>`.
- `frontend/src/App.css` — Supplemental component/app styles.
- `frontend/src/index.css` — Tailwind directives and global light/dark theme styling rules.
- `frontend/src/api/client.js` — Configured Axios client (`withCredentials: true`, error normalizer) exporting `authApi`, `linksApi`, and `analyticsApi`.
- `frontend/src/assets/` — Static image/SVG assets (`hero.png`, `react.svg`, `vite.svg`).
- `frontend/src/components/CopyButton.jsx` — Reusable clipboard copy button with temporary "Copied!" feedback state.
- `frontend/src/components/CreateLinkModal.jsx` — Dark-mode-ready modal form for creating short links with optional title, custom alias, and expiration date.
- `frontend/src/components/ProtectedRoute.jsx` — Route guard redirecting unauthenticated users to `/login` while preserving intended destination.
- `frontend/src/components/ui.jsx` — Shared UI primitives (`Spinner`, `PageLoading`, `ErrorMessage`, `EmptyState`, badges).
- `frontend/src/contexts/AuthContext.jsx` — Authentication context providing `user`, `loading`, `login`, `register`, and `logout`.
- `frontend/src/contexts/ThemeContext.jsx` — Theme context managing light/dark state in `localStorage` and syncing the `dark` class on `<html>` and `<body>`.
- `frontend/src/hooks/useApi.js` — Custom hooks (`useApi`, `useAsyncData`) for managing async loading, data, and error states.
- `frontend/src/layouts/AppLayout.jsx` — Authenticated shell with sidebar navigation (Dashboard, Links, Settings), bottom user profile/logout menu, and header theme toggle.
- `frontend/src/pages/LandingPage.jsx` — Public marketing landing page with hero section and sign-in/get-started links.
- `frontend/src/pages/LoginPage.jsx` — User sign-in page with email/password form and error display.
- `frontend/src/pages/RegisterPage.jsx` — User registration page creating an account and navigating to `/dashboard`.
- `frontend/src/pages/DashboardPage.jsx` — Overview dashboard featuring metric cards with growth badges, clicks-over-time line chart, date-range filters, traffic sources, top links, and smooth refresh.
- `frontend/src/pages/LinksPage.jsx` — Paginated, searchable table of user links with status toggles, copy actions, analytics links, delete actions, and link creation modal.
- `frontend/src/pages/LinkDetailsPage.jsx` — Per-link analytics view with time-series chart, referrers, devices/browsers/OS, locations, and CSV export.
- `frontend/src/pages/AccountPage.jsx` — Settings & Preferences page with explicit Light/Dark theme selector and account sign-out.
- `frontend/src/pages/UnavailablePage.jsx` — Branded error page displayed when a short link is `inactive`, `expired`, or `not_found`.
- `frontend/src/pages/NotFoundPage.jsx` — Fallback 404 page for unmatched frontend routes.
- `frontend/src/test/setup.js` — Vitest setup file configuring `@testing-library/jest-dom`.
- `frontend/src/test/components.test.jsx` — Frontend unit tests for UI components.

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
