# OLREADY V9 — mobile and tablet responsiveness

Complete cumulative source package, including V8. This update changes presentation and mobile interactions; no Supabase migration or deployment is required.

## Install locally

Stop the old dev server. Extract this archive into a new folder. Copy your existing `.env.local`, `.data` folder and `public/uploads` into the new `olready` folder. Keep a backup of your existing project. Do not copy `.next` or `node_modules`.

From the new `olready` folder:

```sh
npm ci
npm run dev -- --port 4173
```

The terminal banner reads **OLREADY Sales V9**. Existing content, pricing, draft/published records and media remain yours. If upgrading from a release before V8, follow UPDATE_V8.md for the one-time content updater. This responsive update itself does not need that command.

## What changed

- Compact navigation on phones and intermediate tablet widths; larger touch controls, current-page labels, Escape/outside-click dismissal.
- Fluid typography, images and spacing across homepage, Benefits, How it works, Plans, checkout, Help/contact, About, artist/customer directories and legal pages.
- Plan cards, enquiry examples, checkout forms, team profiles and footer columns stack for phones.
- Wide comparison/data tables scroll within their own region rather than pushing the page sideways.
- Admin gets a labelled Workspace section selector on smaller screens. Page editors, pricing controls, media inputs, email-template choices, assistant settings and activity records adapt to narrow widths.
- Mobile text inputs use 16px text to avoid automatic iOS focus zoom. Checkboxes and primary controls have larger touch targets.
- Assistant fits the available viewport, responds to visual-viewport changes, scrolls long messages, and reduces prompt controls in short windows. Dialogs and cookie notices have bounded heights; safe-area padding is included.
- Reduced-motion preferences remain supported. Browser zoom is not disabled.

## Verification

- 41 automated tests passed.
- Local HTTP verification passed for public and individual/city pages, contact flow, assistant fallback, media uploads and SEO output.
- TypeScript check and clean production build passed. An initial build failed because the local Turbopack cache was corrupt; rebuilding with a fresh cache passed.
- Chrome responsive iframe checks: all 12 public routes plus admin overview at 320px; homepage, Benefits, Plans, checkout and admin also at 390px, 768px and 1024px. Document width matched viewport width; no whole-page horizontal overflow was observed.
- All 19 admin sections were opened at 320px. The email-template selector was changed from a horizontal strip to stacked choices during this review.
- Mobile menu opened/closed successfully. Assistant input, send and close controls remained visible in a 390×360 short viewport; no microphone or paid AI request was triggered.
- Public artist/customer listings currently have no approved real profiles; populated individual/city routes are covered by HTTP fixtures and shared responsive styles, not a real-content visual device test.
- Browser checks use Chrome in an iframe with a desktop scrollbar (15px less content width than the selected frame). This is not physical iPhone/Android, Safari or a real on-screen-keyboard certification.

A local-only responsive viewer is available at `/dev-preview` with page, width and height selectors and a live overflow report. It is unavailable when local demo mode is disabled. The included mobile screenshot is browser evidence, not a design mockup.

## Existing integration status

Razorpay remains deferred. Supabase, API credentials, stored records and uploaded media are not included in this archive. See UPDATE_V8.md for the AI assistant, document uploads and SEO/profile setup. No production services were changed for this update.
