# OLREADY Sales V6 — artists, media, expanded benefits and upgrade comparison

Full cumulative source release. No new database schema migration is required for these additions. Razorpay is still disabled; see RAZORPAY_NEXT_STEPS.md for the proposed integration.

## Install

Stop your previous development server. Extract OLREADY_Sales_V6.zip into a new folder. Copy your existing `.env.local`, `.data` and, if present, `public/uploads` into the extracted `olready` folder. Local uploaded media must be copied along with the records that reference it. Do not copy `.next` or `node_modules`.

```sh
npm ci
npm run sales:update
npm run dev -- --port 4173
```

The terminal banner should say OLREADY Sales V6. The V5 sales update is versioned and preserves subsequent admin edits when already applied. New V6 copy defaults load automatically; save/publish your edits as usual.

## Artist admin

Admin → Top Grossing Artists → Add artist:

- Name, city, bio (up to 600 characters) and Instagram handle (with or without @).
- Portrait and optional artist/merchant profile link.
- Result amount, definition, reporting period, private evidence, consent and review/expiry date.
- Optional MP4 testimonial, video cover and transcript.
- Up to six portfolio images with editable captions; remove individual gallery images.
- Move an artist to first position, edit, unpublish through approval, or remove from the draft listing.

Save draft, then Review & publish. The homepage and navigation show artist results only when approved, consented, unexpired evidence exists. Bio and Instagram appear on cards; the full artist page exposes the gallery. Legacy artist records remain valid without these optional fields.

Uploads support JPG, PNG, WebP and MP4 up to 20 MB. Image fields exclude video and the testimonial upload accepts MP4. Local demo stores media under public/uploads. Production uses an authenticated server-created signed upload token and uploads directly to the existing Supabase partner-media bucket, without sending the media file through the hosting function. Bucket limits remain 20 MB with the existing MIME allowlist.

Media URLs are public immediately after upload; publishing controls the listing, not access to a known media URL. Upload approved promotional media only. Private evidence belongs in the private evidence text field, not the media uploader. Removing a listing/gallery item does not erase the stored file.

## Benefits and plans

Benefits preserves the existing design and adds prominent three-stage verification, relationship-manager support, location/date/budget preferences and a “See a live demo” anchor.

The demo is an interactive, clearly labelled example, not live merchant inventory. Location, preferred date and minimum client budget filters update three sample enquiries, with reset and empty states. Demo sample labels, cities, dates, budgets and surrounding copy are editable in Page content → Benefits or Buttons & shared copy → Benefits demo & upgrades.

Plans gains subtle hover elevation and dimensional icon effects; reduced-motion and the admin motion setting disable movement. A targeted Pro-to-Phoenix comparison calculates the price difference from current admin pricing and shows the actual enquiry counts, access periods, geography and manager support. At current prices the upgrade difference is ₹16,001 including GST. It includes both Review Phoenix and Stay with Pro options, with no invented discount or urgency. The comparison is hidden if either price is unapproved or Phoenix is not higher-priced.

## Verification

32 automated tests passed; production build passed. Local HTTP checks cover all seven routes, styles, bundled portrait, the guided GST answer and the local media signing/upload/read-back path. The test upload is removed afterwards.

Production signed uploads were implemented against the official Supabase API and existing bucket configuration but were not exercised against your live project. Fresh interactive browser verification remains unavailable in this environment. No production payment, email, invoice or remote database mutation was performed.

Payment integration checklist and success/failure/recovery design: RAZORPAY_NEXT_STEPS.md.
