# OLREADY V8 — AI assistant, discovery and artist pages

This is the complete cumulative source package, including V7.1. No deployment or live OpenAI connection has been made. Existing Supabase workspace JSON accommodates these additions; no new SQL migration is required.

## Install locally

Stop the previous server. Extract this archive into a new folder. Copy your existing `.env.local`, `.data` and `public/uploads` into its `olready` folder. Do not copy `.next` or `node_modules`.

```sh
npm ci
npm run sales:update
npm run dev -- --port 4173
```

The banner reads OLREADY Sales V8. The updater backs up local state and preserves existing customer records and subsequent admin edits. It installs office hours once and adds the community page.

## Connect the AI assistant

Add these values to `.env.local` on your own computer, then restart:

```env
OPENAI_API_KEY=your_openai_project_api_key
OPENAI_ASSISTANT_ENABLED=true
OPENAI_MODEL=gpt-4.1-mini
OPENAI_DAILY_REQUEST_LIMIT=200
```

Keep the key server-side and outside Git. Set the same values in Vercel when deploying. Model is configurable; use one available to your API project that supports Responses and File Search. Configure billing in the OpenAI API project. No key needs to be pasted into this chat.

Admin → Sales assistant:
1. Check connection (verifies key/model access).
2. Create document library in that OpenAI project.
3. Upload customer-facing PDF, DOCX, TXT or MD files, up to 4 MB each / 20 files. Text-based documents work best; convert scanned documents to readable text first.
4. Refresh processing status. Completed files can be enabled for answers. Uploads start inactive.
5. Test a question and inspect the returned mode and source filenames.

Enabling/disabling documents takes effect for new requests immediately, independently of website publishing. New requests only search explicitly enabled, processed document IDs. Requests already in flight may complete using the prior selection. Removing a document disables it before attempting deletion from OpenAI; if deletion fails, retry removal. Files are not stored in public/uploads or exposed as download links. Their enabled content may appear in public answers: only upload approved sales material. Document storage persists at OpenAI until removal and can incur charges.

The assistant uses the published guidance, approved plans, FAQs and office hours plus retrieved document facts. Prompt rules prioritize published pricing over old documents. It receives up to eight recent chat turns, limits generated output, and returns cited document names where available. It has no payment/activation tools. Browser voice input/read-aloud remains; this is not a realtime voice-agent integration.

Missing configuration, upstream failure, empty/incomplete response or the daily generation limit falls back to the existing guided answers. The visitor UI identifies fallback mode. The daily limit is an attempt count in UTC, not a rupee budget; it does not limit storage/upload charges. Per-IP assistant requests are limited to 30/hour. AI can still make mistakes: check representative sales answers and use the API project's own spend controls before launch.

## Office hours and editable SEO

Footer and Help show: Monday to Saturday, 10:00 am–6:30 pm IST. Edit through Site & media → Brand & contact.

- Site & media → SEO & social sharing: global keyword tags and social image upload.
- Page content → select page → Search preview: title, description and page-specific keyword tags.
- Top Grossing Artists: name, city, confirmed services and additional SEO tags.
- About: published names such as Kanika's and team members appear in structured data; their actual text remains readable in HTML.

The code emits server-rendered title/description, canonical URL, Open Graph title/type/URL/image/description, locale and site name, Twitter cards, and Organization/WebSite/Person structured data. Metadata is delivered in the HTML head, including for Meta crawler user agents. Public pages and assets are allowed by robots.txt. Admin, API, checkout, recovery and other private/utility routes remain excluded and noindexed.

Set APP_URL to the final public HTTPS origin before production build/deployment. It drives canonical URLs, share-image URLs and sitemap links. A localhost site cannot be crawled by Meta. After launch, check the actual domain with Meta Sharing Debugger and Search Console; hosting access protection and bot rules must allow public pages. Meta's documentation fetch returned a rate limit during this work; Open Graph protocol requirements were checked, but this is not a Meta certification or live crawler approval.

Keywords do not force indexing or ranking. Google ignores the meta-keywords tag. Useful visible profiles, descriptions, internal links, structured data and the sitemap are the substantive discovery improvements. Do not add unrelated city or service terms.

## Automatic individual pages

Every approved, consented, unexpired Top Grossing Artist gets a stable `/artists/{id}` URL. The ID-based URL survives a name change; titles and name tags update on publication. Full pages include biography, city, confirmed services, result context, media, testimonial text, gallery and existing profile link. Artist names link to their individual pages.

Admin → Previous customers manages a separate directory for artist customers who need no gross-revenue claim. Each published customer gets `/community/{id}`, automatic name/city/service tags, biography, photo, Instagram and existing OLREADY profile link. The index lives at `/community` and appears in the footer when profiles are public.

Download the CSV template in admin. Columns:

`name,city,bio,profileUrl,image,instagram,services,keywords`

- Import CSV up to 500 rows / 200 KB per batch; this release supports 2,000 customer directory entries.
- Separate services using `|`; quote cells containing commas or line breaks.
- Enter a handle in instagram and a full HTTPS URL in profileUrl/image. Images may instead be uploaded after import.
- Duplicate profile links are skipped; without a link, duplicate name/city pairs are skipped.
- Imports are atomic drafts: an invalid row prevents that batch being added. Existing entries are not overwritten.
- Phone/email columns are ignored. Imports do not infer publication permission from having been a customer.
- Review each profile, confirm permission, approve it, then Save draft → Review & publish. Publication requires a name, city and short bio.
- Unpublishing removes the profile from the sitemap and public listings; its URL returns 404. Search-engine cached copies can take time to disappear.

City pages at `/makeup-artists/{city}` are generated only for cities with published artists/customers. They list real profiles and confirmed service labels. Airbrush makeup in a city and HD makeup in a city become automatic tags only when those services are entered for an actual profile. No empty city or service pages are generated. Customer directory and top-grossing entries remain separate; avoid adding the same person twice.

## Validation

41 automated tests passed. Typecheck and production build passed. Local HTTP verification covered marketing, About, individual artist/customer and city pages; Meta-user-agent head tags; canonical/Open Graph output; JSON-LD; sitemap and robots; private draft 404/exclusion; office hours; contact request/status flow; guided assistant; AI configuration output and invalid-origin rejection; local media upload/read-back.

Live OpenAI generation, indexing and billing were not tested without your API key. Live Supabase uploads and live Meta crawling were not tested. Fresh browser visual verification remains unavailable in this environment. Razorpay remains disabled.

## References

- OpenAI File Search: https://developers.openai.com/api/docs/guides/tools-file-search
- Open Graph protocol: https://ogp.me/
- Meta sharing guide: https://developers.facebook.com/docs/sharing/webmasters/
- Google supported meta tags: https://developers.google.com/search/docs/crawling-indexing/special-tags
