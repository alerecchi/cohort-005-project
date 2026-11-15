# Research: Internal vs. External Notification Services for Cadence

**Ticket:** [#2 — Evaluate internal vs. external notification services](https://github.com/alerecchi/cohort-005-project/issues/2)
**Map:** [#1 — Map: Cadence In-App & Email Notifications Spec](https://github.com/alerecchi/cohort-005-project/issues/1)

---

## 1. Cadence Stack & Constraints

From `package.json`, `app/db/index.ts`, and `vitest.config.ts`:

- **Runtime & Framework:** Node + React 19 (`^19.2.7`) + React Router 8 (`8.3.0` with `@react-router/node` and `@react-router/serve`).
- **Database:** Local SQLite (`data.db`) via `better-sqlite3` (`^12.8.0`) + `drizzle-orm` (`^0.45.2`), initialized lazily with `journal_mode = WAL` and `foreign_keys = ON`.
- **UI Primitives:** `radix-ui`, `lucide-react`, `sonner` (toasts), Tailwind CSS v4.
- **Testing:** `vitest` (`^5.0.5`) with `vite-tsconfig-paths`.
- **Dev Ergonomics:** Local-first single-process app (`npm run dev`, `npm run db:seed`, `npm run test`) with no Docker Compose stack, Redis, or external message broker required today.
- **Notification Channels Needed (per #1):**
  1. **In-app notifications** (feed/popover, unread badge, deep links to lesson comments, Refund Requests, etc.).
  2. **Email** (off-platform re-engagement to bring Students back, plus transactional alerts for Instructors / Platform Admins / Team Admins).

---

## 2. High-Level Comparison

| Dimension | Internal (SQLite + React Router + Email Adapter) | Knock (Cloud) | Novu (Cloud or Self-Hosted) | OneSignal (Cloud) |
| :--- | :--- | :--- | :--- | :--- |
| **Architecture** | `notifications` & `notification_preferences` tables in `data.db`; React Router loaders/actions; pluggable `EmailSender` (Resend / Postmark / Nodemailer) | Managed SaaS orchestration; API calls from server + WebSocket/REST from `@knocklabs/react` | Managed SaaS or Docker self-hosted (API, Worker, WS, Dashboard + MongoDB + Redis + S3) | Managed SaaS focused on push, email, SMS, and modal/banner in-app messages |
| **Free Tier** | SQLite/React Router: \$0. Email: Resend **3,000/mo** (100/day); Postmark **100/mo**; Nodemailer+Mailpit **\$0** local | **10,000 messages/mo** (counted per channel per recipient); unlimited environments & workflows | Cloud: **10,000 workflow runs/mo**, 20 workflows, 24h activity retention. Self-hosted: MIT open-source (\$0 license, infra cost) | **10,000 emails/mo**; **1,000 MAU** cap for mobile push & in-app messaging |
| **Paid Tier Cliff** | Resend Pro starts at \$20/mo; Postmark Basic starts at \$15/mo | **Starter: \$250/mo** (steep jump after 10k messages) | **Pro: \$30/mo** (30k runs, 7-day retention); **Team: \$250/mo** (250k runs) | **Growth: \$19/mo** + per-MAU / per-1k email usage |
| **In-App Feed / Inbox** | Build ourselves (~1–2 routes/loaders/actions + Radix popover) | Native (`@knocklabs/react` `<NotificationFeedPopover />` + real-time WebSocket) | Native (`@novu/react` `<Inbox />` + WebSocket) | **Poor fit**: "In-App Messaging" is modal/banner campaigns, not a persistent per-user notification feed/inbox |
| **User Preferences** | Build ourselves (`notification_preferences` table + settings form action) | Native (`knock.users.setPreferences` + React hooks/UI) | Native (`<Preferences />` / `usePreferences` hook) | Basic subscription/tag opt-outs; not category × channel workflow prefs |
| **Batching / Digests** | Build ourselves (time-window query / coalescing key or lightweight cron/job) | Native (visual/code batch & digest steps with configurable windows) | Native (`step.digest()` in `@novu/framework`) | Not designed for transactional event batching |
| **Local Dev & Vitest** | **Excellent**: zero network, deterministic in-memory/temp SQLite, no API keys needed in tests | **Friction**: no local emulator; usage in dev/staging accrues against quota; requires mocking in Vitest | **Moderate friction**: `npx novu dev` uses a cloud tunnel; full local self-host needs Docker + MongoDB + Redis (8+ GB RAM) | **Friction**: cloud-only, requires mocking in Vitest, poor local loop |
| **Operational Overhead** | **Minimal**: lives inside existing `data.db` & Node process | **Low infra, medium vendor**: external API keys, user/preference sync, webhook/secret management | **Low (Cloud)** or **High (Self-hosted)**: 4+ containers + MongoDB + Redis + S3 | **Low infra, high mismatch** |

---

## 3. What Each Option Handles Natively vs. What We Build

### Option A: Internal / Built-in (SQLite + React Router 8 + Minimal Email Provider)

**Handled natively by existing stack:**
- **Storage & ACID consistency:** Notification creation happens in the **same SQLite transaction** as the domain write (e.g., inserting a `comments` row or updating a `refunds` status). No dual-write drift or out-of-sync user records.
- **Read/Write API:** React Router 8 `loader`s fetch unread count + feed items; `action`s mark as read/all-read and update preferences.
- **Testability:** Vitest tests exercise real Drizzle queries against SQLite and assert against an in-memory `EmailSender` fake (`sentEmails[]`) with zero network calls or secrets.
- **Domain alignment:** Schema uses Cadence's exact entities (`users`, `courses`, `lessons`, `comments`, `refunds`, `purchases`) with foreign keys enforced (`PRAGMA foreign_keys = ON`).

**What we build ourselves:**
- `notifications` table (recipient, category/type, actor, target deep link, `readAt`, optional `batchKey`/`groupKey`, `createdAt`) and `notification_preferences` table (per-user, per-category, per-channel toggles + email unsubscribe token).
- UI components: Bell icon + unread badge in the app header, notification feed popover/page using existing `radix-ui` + `lucide-react` primitives.
- Email delivery adapter (`EmailSender` interface) + HTML/text email templates + a lightweight batching/digest mechanism (e.g., cooldown/coalescing on write or a scheduled sweep for Student re-engagement digests).

---

### Option B: External Notification Orchestration Services

#### 1. Knock ([knock.app](https://knock.app/pricing), [docs.knock.app](https://docs.knock.app/))
- **Strengths:** Best-in-class developer API (`@knocklabs/node`), drop-in `@knocklabs/react` feed/popover/preferences UI, native batching/digest steps, multi-channel routing, and unlimited dev/staging environments.
- **Weaknesses for Cadence:**
  - **Pricing cliff:** Free tier is 10,000 messages/month (counted per channel per recipient — 1 email + 1 in-app = 2 messages), then jumps directly to **\$250/month** on the Starter plan.
  - **Local dev & testing:** No offline local emulator. Dev/staging usage counts toward monthly message limits, and Vitest integration tests must mock `@knocklabs/node`.
  - **Dual state:** User profiles and preferences live in Knock's cloud, requiring sync whenever users/emails change in `data.db`.

#### 2. Novu ([novu.co](https://novu.co/pricing), [docs.novu.co](https://docs.novu.co/))
- **Strengths:** Open-source (MIT) core, code-first workflows (`@novu/framework` with `step.digest()`), drop-in `@novu/react` `<Inbox />` and `<Preferences />` components, and a gentler **\$30/month Pro** tier (30,000 workflow runs) if using Cloud.
- **Weaknesses for Cadence:**
  - **Cloud free tier retention:** Only **24-hour** activity feed retention on the Free plan (7 days on Pro).
  - **Local dev (`npx novu dev`):** Replaces the old standalone local server with a secure tunnel proxying from Novu Cloud to localhost — requires internet and a Novu Cloud account.
  - **Self-hosting footprint:** Requires Docker Compose running Novu API, Worker, WebSocket, Dashboard, **MongoDB**, **Redis (with AOF)**, and **S3-compatible storage** (minimum ~8 GB RAM for a single-VM setup). This dwarfs Cadence's single-file SQLite architecture.

#### 3. OneSignal ([onesignal.com](https://onesignal.com/pricing), [documentation.onesignal.com](https://documentation.onesignal.com/))
- **Strengths:** Generous email free tier (10,000 emails/mo) and strong mobile/web push + marketing Journeys.
- **Weaknesses for Cadence:**
  - **Wrong abstraction for in-app feed:** OneSignal's "In-App Messaging" is designed for promotional popups/banners/modals (capped at 1,000 MAU on Free), **not** a persistent per-user notification inbox/bell feed with read/unread state and deep links.
  - **No transactional batching/digesting** for app events like lesson comment threads.

---

## 4. Transactional Email Providers (for the Internal Option)

If Cadence builds notification state & preferences in SQLite, email delivery only needs a thin `EmailSender` interface with environment-specific implementations:

| Provider | Free Tier | Paid Tier | Node SDK & Ergonomics | Local Dev / Vitest Story |
| :--- | :--- | :--- | :--- | :--- |
| **Resend** ([resend.com](https://resend.com/pricing)) | **3,000 emails/mo** (100/day), 3 verified domains | Pro: \$20/mo (50k emails) | `resend` npm package; clean TypeScript SDK; pairs naturally with React Email | Built-in test addresses (`delivered@resend.dev`, `bounced@resend.dev`); `onboarding@resend.dev` sandbox; mock `EmailSender` in Vitest |
| **Postmark** ([postmarkapp.com](https://postmarkapp.com/pricing)) | **100 emails/mo** (permanent Developer tier, hard cap) | Basic: \$15/mo (10k emails) | `postmark` npm package; industry-leading transactional deliverability | `POSTMARK_API_TEST` token validates payloads without sending; `test@blackhole.postmarkapp.com` & Sandbox Servers |
| **Nodemailer + Mailpit** ([nodemailer.com](https://nodemailer.com/)) | **\$0** (OSS) | N/A (uses any SMTP relay in prod) | `nodemailer` npm package; universal SMTP transport | **Mailpit** (`axllent/mailpit` on `:1025` SMTP / `:8025` Web UI) or **Ethereal** (`createTestAccount()`) for zero-Docker browser previews; in-memory transport in Vitest |

---

## 5. Recommendation & Trade-Off Summary

**Recommendation: Choose the Internal / Built-in architecture (SQLite + React Router 8 + pluggable `EmailSender` adapter).**

### Why Internal fits Cadence best:
1. **Zero architectural mismatch:** Cadence is a local-first SQLite (`better-sqlite3` + Drizzle) + React Router 8 app. Adding MongoDB/Redis (Novu self-hosted) or external SaaS state sync (Knock/Novu Cloud) introduces operational complexity and dual-write failure modes disproportionate to Cadence's scope.
2. **First-class Vitest & local-dev ergonomics:** With `notifications` and `notification_preferences` in `data.db` and an `EmailSender` interface (in-memory capture in Vitest, Mailpit/Ethereal or console logger in `npm run dev`, Resend or Postmark in production), every trigger, preference check, and deep link can be tested deterministically with `npm run test` — no API keys, tunnels, or cloud quotas burned.
3. **Avoids the \$250/mo Knock cliff & 24h Novu retention limit:** Resend's free tier (3,000 emails/mo) or Postmark's Basic tier (\$15/mo for 10k) handles email delivery at a fraction of orchestration SaaS pricing, while in-app notifications live in SQLite with unlimited retention.
4. **Clean domain modeling:** Notification triggers, batching windows, and opt-outs map directly to Cadence's `GLOSSARY.md` entities (`Student`, `Instructor`, `Platform Admin`, `Team Admin`, `Refund Request`, `comments`).

### Trade-offs we accept (and must design in subsequent tickets):
- We will specify and own the `notifications` and `notification_preferences` schema, the bell/popover UI, and a simple batching/digest rule for off-platform Student re-engagement emails.
- **When to reconsider:** If Cadence later expands to mobile push (APNs/FCM), SMS, Slack/Teams integrations, or non-engineering teams needing a visual workflow/copy editor without deploys, migrating `EmailSender`/dispatch behind a domain event emitter to **Knock** or **Novu** remains straightforward.

---

## Sources

- Knock Pricing & Plans: https://knock.app/pricing
- Knock Docs (Node SDK, React Feed, Preferences, Batching): https://docs.knock.app/
- Novu Pricing & Plans: https://novu.co/pricing
- Novu Docs (Self-Hosting, `@novu/framework` Digest, `@novu/react` Inbox & Preferences, `npx novu dev`): https://docs.novu.co/
- OneSignal Pricing & Plans: https://onesignal.com/pricing
- Resend Pricing & Node.js Docs: https://resend.com/pricing , https://resend.com/docs/send-with-nodejs
- Postmark Pricing & Test Mode Docs: https://postmarkapp.com/pricing , https://postmarkapp.com/developer/user-guide/send-email-with-nodejs
- Nodemailer & Ethereal Docs: https://nodemailer.com/
