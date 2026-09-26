# OLREADY Sales V5 — install this version

This is the full project, including `public/hero.png` and the new styles. It replaces the previous public sales layouts. It has not been copied to your Mac or deployed.

## Run locally

1. Stop your old dev server with Control-C.
2. Extract `OLREADY_Sales_V5.zip` into a **new folder**. Open the `olready` folder inside it in Terminal.
3. Copy your existing `.env.local` and `.data` folder into this `olready` folder. Keep a backup of your old folder. **Do not copy `.next` or `node_modules`.**
4. Run:

```sh
npm ci
npm run sales:update
npm run dev -- --port 4173
```

The console should say **OLREADY Sales V5 — bundled image and stylesheet found.** If it does not, you are running the old project folder.

Open `http://localhost:4173/`. Refresh the browser after stopping the old server. You should see **Your artistry. More client conversations.**, the chrome-ribbon artist portrait, and a visual enquiry card further down. `http://localhost:4173/hero.png` should show the bundled portrait directly.

If this is your first installation, copy `.env.example` to `.env.local` instead and configure it as described in README. Local demo requires `LOCAL_DEMO=true`. Existing Supabase mode can remain configured; do not replace your credentials with the example file.

## Sales journey

- Homepage: explicit verified-enquiry proposition → illustrative enquiry card → three-stage service explanation → approved artist proof when available → concise plan cards → practical questions → decisive CTA.
- Benefits: visual enquiry preview, editorial artist portrait, graphical benefit panels, and prominent relationship-manager support.
- Plans: one side-by-side comparison of Pro, Phoenix and Privy. No repeated selector, table and quiz. Each plan displays price, inclusive GST, allowance, duration, inclusions and terms.
- How it works: the five enquiry stages plus separate joining steps. No public backend activation timing.
- Checkout: selected-plan inclusions, final inclusive total visible before saving, discount disclosure and included GST breakdown. After saving, an explicit WhatsApp handoff includes the selection reference. Saving does not take payment or activate a plan.
- Artist results: the page remains available, but its main navigation link and homepage results section appear only when approved, unexpired artist evidence is available. No fabricated testimonials or earnings.
- Help: updated service/GST FAQs and an explicit no-results response.
- Guided assistant: direct service, plan, profile and GST answers; quick question buttons. A profile question no longer accidentally triggers Pro. It remains a guided assistant with optional browser speech, not a connected realtime AI salesperson.

## GST correction

The existing advertised prices are unchanged:

| Plan | Price including 18% GST |
| --- | ---: |
| Pro | ₹18,999 |
| Phoenix | ₹35,000 |
| Privy | ₹50,000 |

`pricePaise` is the GST-inclusive price. After a valid discount, total = inclusive price − discount. Included GST = round(total × taxPercent / (100 + taxPercent)). GST is extracted, never added again. Cart tax amounts display two decimals. Admin prices are explicitly labelled inclusive. This is a checkout calculation, not a Zoho invoice integration.

## Admin and existing content

Page content now exposes the fields actually used by Homepage, Benefits, Plans and How it works. Pricing and inclusions remain in Plans & pricing; all new shared copy is also in Buttons & shared copy → Sales journey. Save draft, then Review & publish.

The content upgrade deliberately replaces the previous stock sales copy and corrects GST once. It preserves plan prices, uploaded artists, metrics, customers, subscribers and orders. `sales:update` backs up the previous local state before applying the upgrade. Later admin edits are protected by a version marker.

No database schema migration is required. Existing Supabase workspace content is upgraded by the application on read, and persisted on the next authorized workspace save. No remote database change was executed during this release. Paid/pending historical cart records are not rewritten; old open selections are recalculated when saved again. Future payment integration must always revalidate the current server quote.

## Validation and limits

- 27 automated tests pass, including GST inclusion, discount handling, upgrade idempotence and guided answers.
- Production build passes.
- Local HTTP checks confirm all seven routes render, the bundled portrait and stylesheet are served, and legacy tax wording is absent.
- Fresh interactive browser screenshots could not be verified because this environment's preview service is blocked. This is not a claim of completed visual/accessibility testing. Responsive styles and reduced-motion support are implemented.
- Razorpay remains disabled, by request. Actual artist evidence, verification/sharing rules, reversal rules and Privy written terms still need your approved business inputs before a full sales launch.

Optional local smoke check, from this project folder:

```sh
npm run verify:sales
```

This starts a temporary local dev server on port 4180, checks routes/assets and a guided answer, then stops it. It does not send emails or take payments.
