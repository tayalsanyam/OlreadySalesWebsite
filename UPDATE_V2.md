# Content update and admin setup

The September 15 plan image has now been transcribed into editable content:

| Plan | Price | Duration | Allowance | Reach |
| --- | --- | --- | --- | --- |
| Pro — best seller | ₹18,999 | 3 months | 60 verified enquiries | 3 states |
| Phoenix — premium | ₹35,000 | 6 months | 100 verified leads | Pan-India |
| Privy — invite only | ₹50,000 | 6 months | 120 verified leads | Pan-India |

Phoenix and Privy include lead reversal and a dedicated relationship manager. Privy lists ₹50,000 assured business subject to terms. The written conditions and tax treatment are not supplied in the brochure and have not been invented. Payments remain disabled.

Home, benefits, how it works, artist-page introduction, checkout, help, newsletter and popup copy are populated. Eleven FAQs explain the offer. Verified artist profiles/videos and the original audit evidence remain required; no artist names, earnings or additional audit figures have been fabricated.

## Update your existing local copy

Stop your dev server with Control-C. Back up your folder, then merge the files from this package into the existing olready folder, keeping your .env.local and .data folders. Do not replace your environment file with the example.

Run in the olready folder:

```sh
npm ci
npm run content:update
npm run dev -- --port 4173
```

content:update backs up existing demo content, retains carts/subscribers/events and populates the new content once. Subsequent runs leave your admin edits alone. It updates the specified editorial content fields, so review custom page/plan edits before first running it.

## Supabase status

Checked project xjwsbrczdipvhhdbgsmw. partner_workspace and partner_staff exist with RLS. The supplied content update was applied and verified remotely: revision 2, three plan prices and eleven FAQs. Do not rerun the original combined migration to update content. OLREADY_Content_Update.sql is retained for reproducibility and guarded to affect only the original revision-1 workspace.

No Auth users or staff accounts existed at inspection. An account cannot be assigned to you until you provide an email or run the private setup command below. No default shared password has been added to source code.

## Create your admin login

Ensure .env.local includes your project URL, publishable key and server secret under the names in .env.example. Then run:

```sh
npm run admin:setup
```

Enter your own admin email. The command creates the account without sending email, grants its admin membership and displays a randomly generated password once. Save it in your password manager. It refuses to run if an active administrator already exists.

Then set LOCAL_DEMO=false in .env.local and restart the server. At /admin, sign in with those credentials, scan the authenticator QR code and verify the code. MFA is required for real admin access. The local preview admin bypass is used only while LOCAL_DEMO=true.

The setup script's syntax was checked; live account creation/MFA cannot be verified until the admin email is provided and setup is run. Never send your password or authenticator codes in chat.

## Verification

Production build and 20 tests passed after this update. Browser plan page shows all three correct prices and features, with Pro featured and Privy linked to a WhatsApp invitation request. Supabase query confirmed persisted prices [1899900,3500000,5000000] in paise and 11 FAQs. This browser controls a cloud preview, not the server running on your Mac.
