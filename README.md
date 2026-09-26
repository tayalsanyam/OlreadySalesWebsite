Latest release: [UPDATE_V6.md](UPDATE_V6.md) — artists/media, expanded Benefits, enquiry demo and plan upgrades. Payment preparation: [RAZORPAY_NEXT_STEPS.md](RAZORPAY_NEXT_STEPS.md).

Latest release: [UPDATE_V5.md](UPDATE_V5.md) — start here for the sales rebuild and GST-inclusive pricing. Older release guides are historical.

Latest release: see [UPDATE_V4.md](UPDATE_V4.md) for the redesigned Plans and How it works pages.

# OLREADY partner website

**Current version: V3 redesign.** Start with [UPDATE_V3.md](UPDATE_V3.md) for update steps and the new sales/admin experience. V2 notes below describe the earlier content import.

**Latest release:** see [UPDATE_V2.md](UPDATE_V2.md) for supplied plan content, confirmed Supabase installation and the new `npm run admin:setup` command. The project now has revision-2 content installed.

Local implementation of the seven-page artist website with an editable admin workspace. Next.js App Router, React, TypeScript and Supabase. White/pink design with an artist portrait and restrained chrome depth/parallax.

## Run locally

Use Node.js 22 LTS or newer supported LTS.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:4170 and /admin. With LOCAL_DEMO=true, development stores changes in .data/state.json and grants local admin access. Keep this preview on your own computer. Local mode never sends email or takes payment. Production and Vercel cannot enable this demo bypass. Remove .data/state.json to reset the demo.

## Install Supabase in one operation

1. Open the SQL editor of your OLREADY Website project.
2. Run **OLREADY_Combined_Migration.sql**. This includes schema, RLS, access grants, public media bucket and initial content. Do not separately run bootstrap or seed afterwards. Repeating this migration preserves the existing workspace content.
3. Create your staff user in Supabase Authentication using your own email and password.
4. Edit the email placeholder in `supabase/create-first-admin.sql`, then run that file. No staff access is granted automatically by the main migration.
5. Copy the project URL and publishable key to NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Put the secret key in SUPABASE_SERVICE_ROLE_KEY (server only). Set LOCAL_DEMO=false and APP_URL to the exact website origin.
6. Restart development. Sign in at /admin and enrol/verify an authenticator app. Staff access requires MFA. Test saving a draft and publishing it; then verify the public page.

The Supabase plugin confirmed the installed schema and revision-2 content. The app's live database persistence and live MFA flow still need verification after you run the migration. The schema was installed by the owner; the content update was applied and verified remotely. Local demo changes are deliberately not included in the migration; it seeds clean initial content.

## What is editable

Admin includes seven page content blocks, shared navigation/button copy, metrics/evidence/expiry, artist listings and selected videos, media, Pro/Phoenix/Privy pricing and inclusions, coupons, FAQs, merchant/WhatsApp links, popup, email templates, recovery settings and assistant settings. Save draft then Publish. History supports restore; audit entries record changes. Some mechanical form/status labels remain code-defined.

Prices are integer paise. Plan prices and inclusions are transcribed from your September 15 brochure; tax treatment and detailed commercial conditions still need confirmation. Candidate metrics are shown only in development until evidence, reporting period and expiry are approved. Artist records start empty rather than publishing invented earnings or testimonials. Add only media you have permission to publish. The public media bucket must never contain private evidence or customer documents.

## Email, analytics and cart recovery

Double opt-in mailing list, signed preference links, consent-aware page/event collection, cart capture, coupon calculation, recovery queue and admin campaign queue are implemented. Tracking is first-party and opt-in; it does not track activity inside the merchant site. Abandonment is based on inactivity, not a guaranteed browser-close event.

To send email later, configure RESEND_API_KEY, verified EMAIL_FROM, a strong LINK_SIGNING_SECRET, APP_URL and EMAIL_DELIVERY_ENABLED=true. Use /admin to process the queue or schedule authenticated GET /api/jobs with Authorization: Bearer CRON_SECRET. Scheduling is not installed automatically. Jobs use leases, retries and provider idempotency, and recheck consent/cart status. Local processing renders messages for inspection without delivery. No real customer messages have been sent or external provider delivery verified.

## Deliberately pending integrations

- Razorpay: payment API remains disabled, even if environment keys are provided. Add server-created orders, signature-verified and idempotent webhooks, reconciliation, refunds and tests before enabling payment. Never trust a browser success callback. The purchase thank-you template is ready but purchase-triggered delivery awaits this integration.
- Zoho invoices: not connected.
- Full conversational voice sales agent: not connected. Current assistant uses approved FAQ/plan matching with optional browser speech recognition and read-aloud. It is not a real-time language-model agent. Microphone requires user action; browser support varies.
- Profile creation and plan activation remain on the existing merchant/backend system. This app never activates a plan or advertises an activation deadline.
- Approved audit figures, artist permissions/video URLs, final prices/inclusions and legal/refund copy are business inputs still required for launch.

## Validation and release

```sh
npm test
npm run typecheck
npm run build
```

20 tests passed, including repeatable migration execution in a local PostgreSQL-compatible engine, role isolation, quotation rules and consent/recovery cases. Production build passed. Browser checks covered homepage desktop/mobile, plans, cart save and admin draft/publish. See docs/VERIFICATION.md for limits.

Push this directory to GitHub, import into Vercel, set production environment values and install the migration before serving traffic. Never commit .env.local, .data, node_modules or .next. Credentials are excluded from this package. Rotate previously shared secret credentials before release.

## Architecture and scale boundary

The first version stores the versioned CMS and private operational state in a single service-only JSONB workspace row using optimistic locking. Staff membership has separate RLS. This is a pilot architecture: move carts, events, subscribers and delivery jobs to separate indexed tables and transactional queue operations before substantial traffic. Do not describe it as a high-volume analytics warehouse. Raw events are bounded/retained for 90 days; operational data needs a business retention policy and deletion workflow before broad production rollout.
