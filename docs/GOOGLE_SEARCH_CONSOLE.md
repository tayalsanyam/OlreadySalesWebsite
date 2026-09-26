# Google Search Console — [mua.olready.in](https://mua.olready.in/)

Use this once for the initial Google listing. The site already ships crawlable pages, canonical URLs, Open Graph tags, JSON-LD, `robots.txt`, and `sitemap.xml`.

## 1. Vercel environment

| Variable | Value |
|----------|--------|
| `APP_URL` | `https://mua.olready.in` (no trailing slash) |

Redeploy after changing `APP_URL` so canonical links, sitemap URLs, and share images use the custom domain.

## 2. Verify ownership (HTML tag)

1. Open [Google Search Console](https://search.google.com/search-console) → **Add property** → **URL prefix** → `https://mua.olready.in`
2. Choose **HTML tag** verification. Copy only the **content** value from the meta tag (not the full tag).
3. In Vercel → Project → **Settings → Environment Variables** add:

   ```env
   GOOGLE_SITE_VERIFICATION=paste-content-value-here
   ```

4. Redeploy, then in Search Console click **Verify**.

The app emits `<meta name="google-site-verification" content="…" />` from `app/layout.tsx` when this variable is set.

## 3. Submit the sitemap

In Search Console → **Sitemaps** → add:

```text
https://mua.olready.in/sitemap.xml
```

Status should move to **Success** within a few hours. The sitemap includes primary pages, artist profiles, and city hubs.

## 4. Request indexing (homepage + money pages)

**URL inspection** → enter each URL → **Request indexing** (optional but useful at launch):

- `https://mua.olready.in/`
- `https://mua.olready.in/plans`
- `https://mua.olready.in/how-it-works`
- `https://mua.olready.in/top-grossing-artists`

`/checkout` is `noindex` by design — do not expect it in results.

## 5. What Google should see

Check **View crawled page** or `curl` for the homepage:

- `<title>` — e.g. `OLREADY | Verified enquiries for makeup artists`
- `<meta name="description" …>`
- `<link rel="canonical" href="https://mua.olready.in/">`
- `application/ld+json` with `Organization`, `WebSite`, and `WebPage`

Live robots file: [mua.olready.in/robots.txt](https://mua.olready.in/robots.txt)

## 6. CMS edits (optional)

Admin → **Settings → SEO & social sharing** updates global keywords. Per-page titles and descriptions are under **Pages**. Homepage **heading** stays customer-facing; **page title** (search/social) can differ.

## 7. After verification

- Monitor **Pages** and **Indexing** for errors.
- Use **Performance** after 3–7 days for queries and impressions.
- When you add approved artist profiles, republish so new `/artists/…` URLs appear in the next sitemap generation.

No Google Analytics is required for Search Console; add GA4 separately if you want on-site analytics.
