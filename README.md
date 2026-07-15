# 🍽 ShareBite

**Reduce Food Waste. Feed Someone Today.**

ShareBite is a production-ready web platform that connects food donors (homes,
restaurants, bakeries) with recipients and NGOs — before good food goes to waste.

Built with a **Minimalist Dark** design system: layered slate surfaces, warm amber
accents, glass cards, and ambient glow.

---

## Features

| Area | What's included |
|---|---|
| **Roles** | Donor, Recipient, NGO, Admin — each with its own dashboard and role-based access control |
| **Auth** | Register (with map location picker), login, logout, forgot/reset password, email verification — JWT in httpOnly cookies, bcrypt hashing, rate limiting |
| **Donations** | Post food (category, quantity, expiry, pickup window, photos, map pin, instructions), edit, remove, auto expiry countdown |
| **Discovery** | Search + filters (category, distance, vegetarian, halal), card grid and interactive OpenStreetMap view, distance calculation, directions link |
| **Requests** | Request → donor accepts/rejects → 6-digit pickup code + QR → donor verifies code at handover → completed |
| **Chat** | Conversations, read receipts, unread badges (10s/5s polling — see “Real-time” below) |
| **Notifications** | Request received/accepted/rejected, completion, NGO approval, new messages — bell with unread badge |
| **NGO** | Verification workflow (admin approves), large-donation feed, claims, volunteers, impact analytics |
| **Admin** | User management (deactivate/delete), NGO approval, listing moderation, analytics dashboard with monthly-growth and category charts |
| **Community** | Reviews & ratings, favorite donors, leaderboard, achievements, weekly streaks, impact calculator (“You have helped feed N people”) |

## Tech stack

- **Next.js 15** (App Router) · **TypeScript** · **Tailwind CSS**
- **Prisma ORM** — SQLite in dev, PostgreSQL-ready (see below)
- **TanStack Query**, **React Hook Form + Zod**, **Framer Motion**
- **React Leaflet** + OpenStreetMap (no API key needed)
- **jose** (JWT) + **bcryptjs**, in-memory rate limiting
- **Recharts** (admin analytics), **qrcode** (pickup QR)

## Quick start

```bash
npm install
npx prisma db push     # create the SQLite database
npm run db:seed        # sample users, donations, requests, chat
npm run dev            # http://localhost:3000
```

### Demo accounts (all password `Password123!`)

| Role | Email |
|---|---|
| Admin | `admin@sharebite.app` |
| Donor | `donor@sharebite.app` |
| Recipient | `recipient@sharebite.app` |
| NGO (approved) | `ngo@sharebite.app` |
| NGO (pending) | `ngo2@sharebite.app` |

Try the full loop: log in as **recipient** → request a donation → log in as
**donor** → accept → recipient gets a pickup code + QR → donor verifies the code
→ recipient leaves a review.

## Environment variables

Copy `.env.example` to `.env`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `file:./dev.db` locally; a Postgres URL in production |
| `JWT_SECRET` | **Change in production** — signs session tokens |
| `NEXT_PUBLIC_APP_URL` | Used in email links |
| `SMTP_*` / `EMAIL_FROM` | Optional. Without SMTP, verification/reset links print to the server console (install `nodemailer` to enable SMTP) |
| `NEXT_PUBLIC_CLOUDINARY_*` | Optional. Local uploads go to `public/uploads/` by default |

## Deploying (Vercel + Supabase/Railway)

1. Create a PostgreSQL database (Supabase or Railway).
2. In `prisma/schema.prisma`, change `provider = "sqlite"` → `"postgresql"`.
3. Set `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL` on Vercel.
4. `npx prisma db push && npm run db:seed` against the production DB.
5. Deploy — the build runs `prisma generate` automatically.

> **Image uploads on Vercel:** the filesystem is read-only, so configure the
> Cloudinary env vars (or any object storage) for production uploads. Local dev
> works out of the box.

## Design decisions & trade-offs

- **SQLite in dev, Postgres in prod.** The schema avoids DB-specific features
  (string-based enums) so switching is a one-line provider change. This lets the
  app run end-to-end with zero external services.
- **Polling instead of Socket.io.** Chat and notifications refresh every 5–15s
  via TanStack Query. Socket.io requires a long-lived server, which Vercel's
  serverless model doesn't support; polling keeps deployment trivial. For true
  real-time, add Pusher/Ably or self-host with a custom server — the API layer
  won't need changes.
- **Security:** bcrypt password hashing, httpOnly SameSite cookies (CSRF-resistant
  for state-changing JSON APIs), Zod validation on every input, Prisma
  (parameterized queries — no SQL injection), per-IP rate limiting on auth and
  write endpoints, role middleware on protected routes, React's XSS-safe rendering.

## Project structure

```
prisma/            schema + seed
src/
  app/
    api/           REST endpoints (auth, donations, requests, chat, admin, stats…)
    dashboard/     role dashboards, browse, post-food, messages, profile…
    admin/         admin panel (analytics, users, donations)
    login|register|forgot-password|reset-password|verify-email/
  components/
    ui/            design-system primitives (button, card, input, dialog, toast…)
    map/           Leaflet map picker + donations map
    dashboard/     shell, sidebar, notifications bell
  hooks/           useMe and friends
  lib/             auth (JWT), prisma, validations (Zod), utils, rate-limit, email
  middleware.ts    route protection + role gates
```
