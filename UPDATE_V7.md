# OLREADY Sales V7

Cumulative local source release. Razorpay remains disabled. No new database schema migration is required: contact requests use the existing private workspace state. No live Supabase or deployment changes were made.

## Install

Stop the previous server. Extract OLREADY_Sales_V7.zip into a new folder. Copy your existing `.env.local`, `.data`, and `public/uploads` into the new `olready` folder. Do not copy `.next` or `node_modules`.

```sh
npm ci
npm run sales:update
npm run dev -- --port 4173
```

Expect the OLREADY Sales V7 terminal banner. The updater backs up existing local state. It adds About, all-budget access to plans, updated benefit wording, and enables the contact popup once for this release. Later admin changes are preserved. Existing remote workspace state receives the compatible content upgrade when read; subsequent admin save/publish persists it.

## Changes

- Larger navigation with active pills; redesigned FAQ, closing CTA, newsletter and footer.
- Benefits comparison includes three-stage verification, delisting to limit repeated outreach, active dashboard leads, relationship managers and eligible lead reversal per policy. Other-provider columns are questions to verify, not unsubstantiated ratings.
- RM now appears as prominent lettering with the full relationship-manager label.
- Removed the demo budget filter. Client budgets remain visible on sample enquiry cards; location/date filters remain.
- Audience numbers are integrated into dimensional badges with consistent card spacing.
- All lead budgets accessible added to plan inclusions.
- Interactive earnings illustration: select a plan, vary conversion from 5–10% and edit average booking value. Default Pro example: 60 enquiries × 5% = 3 bookings; 3 × ₹25,000 = ₹75,000 gross booking value; less ₹18,999 plan price = ₹56,001 before all other costs. This is not profit, a forecast or guaranteed ROI. Plan pricing and allowances come from current admin records.
- Contact popup replaces the old newsletter popup. It appears after approximately 25 seconds across eligible pages, once per browser until its local storage is cleared. Checkout and policy pages do not trigger it. Browser-native modal provides keyboard focus containment and Escape dismissal. Contact remains available any time on Help & contact.
- Contact forms validate and store requests with consent, rate limiting, same-origin checking, and recent-submission deduplication. Admin → Contact requests provides manual follow-up statuses (New, Contacted, Closed); admin and sales roles can update status. Requests do not subscribe people to marketing and do not automatically email staff.
- About Us linked in footer: editable Kanika Khanna feature plus additional team members. Initials are used until genuine photos are uploaded; no substitute portrait or invented career history. The initial bio is draft editorial copy for owner review.

## Where to edit

- Admin → Page content → About: name, role label, bio, uploaded photo, button, add/remove team members.
- Admin → Page content → Benefits: comparison, RM and demo copy.
- Admin → Page content → Plans: illustration wording. Plans & pricing controls price, allowances and inclusions.
- Admin → Page content → Help: contact wording.
- Buttons & shared copy → Contact & earnings illustration: contact, calculator and footer labels.
- Site & media: popup enabled/title/body/delay, newsletter and contact settings.
- Save draft → Review & publish.

## Verification

33 automated tests passed; production build and typecheck passed. Local HTTP checks passed for eight pages, stylesheet/hero media, comparison and RM markup, absent budget filter, illustrated values, invalid consent/origin rejection, contact creation and admin status update, and local media upload/read-back. Fresh visual browser QA remains unavailable due to the preview environment restriction. Live Supabase media delivery and Razorpay payment flow have not been tested in this release.
