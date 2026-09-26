# Launch checklist (Supabase · Razorpay · artists · SEO)

## 1. Supabase

- Project URL and keys live in `.env.local` (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`).
- Schema installed: `partner_workspace` + `partner_staff` (via `OLREADY_Combined_Migration.sql`).
- **`LOCAL_DEMO=false`** so the site uses Supabase, not `.data/state.json`.
- Push latest CMS content: `npm run sync:supabase` (after editing in local demo) **or** save/publish in `/admin`.
- Create staff: Supabase Auth user → run `supabase/create-first-admin.sql` → sign in at `/admin` with MFA.

Verify: `npm run verify:stack`

## 2. Razorpay

Add to `.env.local` (test keys first):

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...   # from Razorpay dashboard, not the API secret
RAZORPAY_ENABLED=true          # only after webhook works on HTTPS
```

In Razorpay: auto-capture, webhook `https://YOUR_DOMAIN/api/payments/webhook`, events per `UPDATE_V10.md`.

In admin: **Settings → Terms, privacy & refunds** → enable **policies approved** → publish.

Checkout requires approved Pro/Phoenix plans and saved cart with terms accepted.

Localhost cannot receive webhooks — use staging/tunnel for end-to-end payment tests.

## 3. Top Grossing Artists (MUA profiles)

Admin → **Top Grossing Artists** → add portrait, city, bio, services, result + evidence, consent, expiry → **Approve**.

Each approved artist gets:

- Listing on `/top-grossing-artists`
- Dedicated page `/artists/{slug}` (SEO slug from name+city or custom slug field)
- City hub `/makeup-artists/{city}`
- Sitemap + JSON-LD ProfilePage + `llms.txt` entry

## 4. SEO / Meta / LLM discovery

- Per-page metadata via CMS + auto keywords for artist/city pages.
- `/sitemap.xml`, `/robots.txt` (allows major AI crawlers), `/llms.txt` site map for assistants.
- Set production **`APP_URL`** to the live HTTPS origin before deploy (e.g. `https://mua.olready.in`).
- Initial Google listing: **`docs/GOOGLE_SEARCH_CONSOLE.md`** (`GOOGLE_SITE_VERIFICATION` + sitemap submit).

## Commands

```sh
npm run verify:stack
npm run sync:supabase   # optional: push .data demo content to Supabase
npm test && npm run typecheck && npm run build
npm run verify:payments # local payment/webhook behaviour (no real Razorpay)
```
