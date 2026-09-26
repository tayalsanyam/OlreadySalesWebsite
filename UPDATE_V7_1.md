# OLREADY V7.1 — About and team

About Us now appears in the top navigation, mobile menu and footer.

Admin → Page content → About → Content:
- Kanika: name, designation, photo, bio and a separate personal message. Paragraph breaks are retained; leave the message blank to hide it.
- Team members: Add team member, enter name/designation, upload photo and optionally write a bio. Remove employees as needed. The team heading appears only when employees have been added.
- Message heading and team introduction are editable on the same page.
- Save draft, then Review & publish.

No fabricated photos, employees or personal statements have been added. Upload genuine portraits and enter the approved message.

Install the complete archive into a new folder. Copy your existing .env.local, .data and public/uploads into its olready folder. Run npm ci, npm run sales:update, then npm run dev -- --port 4173. The banner reads OLREADY Sales V7.1. Do not copy node_modules or .next.

No new SQL migration or deployment is required. Typecheck, production build and message/designation schema round-trip passed. Browser visual verification remains unavailable here.
