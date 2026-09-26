# OLREADY — sales pages, version 4

This release develops the Plans and How it works pages around the approved white, black and pink direction, with restrained dimensional graphics.

## Install on your Mac

Stop the running development server with Control-C. Extract OLREADY_Sales_Pages_v4.zip to a separate folder. Copy your existing `.env.local` and `.data` folder into the extracted `olready` directory so your credentials and local content are preserved. Do not overwrite them with example files.

From that new `olready` folder:

```sh
npm ci
npm run dev -- --port 4173
```

Open `http://localhost:4173/plans` and `http://localhost:4173/how-it-works`.

New copy defaults load automatically, preserving existing custom values. No content reset, new SQL migration or live Supabase update is required for this release. The original migrations remain included for fresh installations. This archive does not include your credentials, local customer records or installed dependencies.

## What changed

- Plans: layered membership cards, pearl/pink/gold/lilac surfaces, an interactive Pro/Phoenix/Privy selector, large enquiry allowances, prominent plan prices, clear inclusions and a stronger benefit story.
- How it works: portrait-led introduction, five selectable steps, an illustrative dashboard, audience cards and a stronger next-step invitation.
- Motion: short entry transitions and subtle card perspective; reduced-motion preferences and the admin motion setting disable animation.
- Navigation: plan-specific checkout links, Privy invitation through WhatsApp, merchant profile redirect, and direct comparison anchor.

## Where to edit

| Content | Admin location |
| --- | --- |
| New Plans headings, benefit story and buttons | Buttons & shared copy → Plans sales page |
| Five process steps, How it works headings and audience copy | Buttons & shared copy → How it works story |
| Plan names, pricing, enquiry allowance, geography and inclusions | Plans & pricing |
| Portrait, motion, WhatsApp and merchant destinations | Site & media |
| Search titles and descriptions | Page content |

Save draft, then Review & publish. Existing How it works page sections remain stored, but the new layout uses the dedicated shared-copy group instead. Legacy Plans page sections still appear below the main sales content if populated.

The large allowance is derived from the first plan feature containing a number and “enquiries” or “leads”. Keep that feature explicit, e.g. “60 verified enquiries”.

## Content provenance and boundaries

The supplied sales-summary image informs the five-stage enquiry process, three-stage verification claim, client categories and selected-plan RM support. It does not describe the internal verification checks; those have not been invented. The existing plan brochure remains the source for prices and allowances. Homepage audit metrics and evidence approval rules remain intact. The dashboard graphic is explicitly illustrative, not a screenshot or live client activity.

Razorpay remains disabled pending your integration. Plan activation remains on the merchant backend. No payment, booking, earnings, fabricated scarcity or conversion guarantee is introduced. Privy remains invitation-only with its existing written-terms caveat. This release has not been deployed to Vercel or copied onto your Mac.

## Verification

- TypeScript validation passed.
- All 20 existing automated tests passed, including migration isolation, pricing, permissions and recovery checks.
- Production build passed.
- Browser checks: desktop and 390px mobile; Phoenix selection routes to its checkout, Privy routes to the invitation contact, walkthrough selection and next-step controls work, final walkthrough CTA points to Plans.
- New admin copy groups confirmed present. Existing save/publish workflow is reused.

Screenshots: `docs/pitch-v4/`.
