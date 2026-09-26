# OLREADY — sales journey and admin redesign

This release replaces the flat brochure flow and the long generic admin forms with a guided visitor journey and focused editing screens.

## Install over your existing local version

1. Stop the dev server with Control-C and back up the existing olready folder.
2. Merge this package's olready files into it. Keep your existing .env.local and .data folder.
3. In that folder, run:

```sh
npm ci
npm run redesign:update
npm run dev -- --port 4173
```

The update command adds the new copy, changes the original default homepage CTA to “Find my plan”, and backs up your local state. Existing customised wording and customer records are preserved. Do not run content:update again for this redesign: that command is the older brochure content release.

No new Supabase tables or schema migration are needed. Existing database content receives missing shared-copy defaults when read by the updated app. If using LOCAL_DEMO=false, change the homepage primary button to “Find my plan” and its destination to /#find-your-plan through Page content → Homepage → Buttons, then publish. The local update command deliberately operates on local demo records only.

## Visitor experience

- Original white/pink hero and subtle portrait depth retained.
- Clear “Find my plan” entry point and differentiated plan cards.
- Interactive preference-based starting recommendation: Pro for selected states, Phoenix for national reach, Privy invitation for visitors interested in that offer. This is a simple guide, not AI suitability assessment.
- Plans comparison table, common questions at the decision point and contextual WhatsApp contact.
- Plan-finder selections and next-step clicks join the existing consent-based tracking.
- Artist cards appear on the homepage once real, approved records exist. No fabricated testimonials or income figures.
- New public-facing sales copy is editable under Buttons & shared copy, grouped by homepage, plan finder, comparison and decision/contact.

## Admin experience

- Dashboard with direct actions, editorial readiness checklist and real activity counts.
- Page selector with Content / Buttons / Search preview tabs and a draft content preview. The preview reflects content; it is not a pixel-perfect live page rendering.
- Plan editor with rupee inputs, editable inclusions and an offer-card preview.
- Artist editor with contextual media upload, result evidence, permission, period and expiry fields; optional video.
- Statistics editor with display preview and clear verification requirements.
- Offer editor with rupee or percentage discounts, India-time date boundaries, plan eligibility and usage limits.
- Email editor with template selection, message preview and sample-personalisation rendering. Preview sends no emails.
- Searchable FAQ editor, grouped site settings and shared wording.
- Review & publish lists changed content areas, saves unsaved changes first and retains prior published versions. Keyboard focus stays inside its dialog; Escape returns to editing.

## Verified

Production build, TypeScript and all 20 tests passed. Browser checks verified:

- Publishing an edited headline updates the public page; original headline restored afterwards.
- Entering ₹19,000 stores 1,900,000 paise in the draft while published price stays ₹18,999; final price restored.
- Phoenix recommendation links to its checkout; Privy leads to the invitation WhatsApp URL.
- The 390px mobile preview renders and the Pro recommendation links to its checkout.
- Email sample rendering substitutes the test artist and plan without delivery.

See docs/redesign/REVIEW.md and the included screenshots.

## Remaining launch inputs and integrations

This release completes the local UX redesign. It does not measure or guarantee sales uplift. Live conversion performance still needs real traffic.

Razorpay remains disabled as requested. Full real-time voice AI and Zoho billing are not connected. Live email requires provider configuration. First-admin setup still needs your chosen email: run npm run admin:setup privately on your Mac with the Supabase environment values configured, then set LOCAL_DEMO=false and enrol MFA.

The original audit evidence, approved artist records and testimonial videos, written Privy assurance conditions, tax treatment and final policies remain launch inputs. None has been invented to make the design look more complete.
