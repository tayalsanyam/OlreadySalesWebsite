# PayU (Hosted Checkout) — OLREADY sales site

Official PayU India docs index: [docs.payu.in/llms.txt](https://docs.payu.in/llms.txt)

This app uses **PayU Hosted Checkout** (server-built form POST to `_payment`), same flow as [Prebuilt Checkout Page Integration](https://docs.payu.in/docs/prebuilt-checkout-page-integration).

## Environment variables (required to test)

| Variable | Required | Notes |
|----------|----------|--------|
| `PAYU_ENABLED` | Yes | Must be `true` to allow checkout. |
| `PAYU_MERCHANT_KEY` | Yes | **Test**: PayU Dashboard → **Test Mode** → **Developers** → **API Keys** → **key**. [Generate test key & salt](https://docs.payu.in/docs/generate-test-merchant-key-and-salt) |
| `PAYU_MERCHANT_SALT` | Yes | **Salt v1** (32-character) from the same screen — not Salt v2. Never expose in the browser. |
| `PAYU_MODE` | Yes | `test` → `https://test.payu.in/_payment` and test verify URL. `live` → `https://secure.payu.in/_payment`. |
| `APP_URL` | Yes | Public **HTTPS** origin (no trailing slash). Used for `surl` / `furl`: `{APP_URL}/api/payments/payu/callback`. PayU requires reachable URLs ([redirect URLs](https://docs.payu.in/docs/handling-the-redirect-urls)). |
| `PAYMENT_GATEWAY` | For testing | Set to `payu` until Admin publishes **Payment gateway = PayU**. |
| Admin (published) | For checkout | **Settings → Plans & checkout** → **Payment gateway** = PayU, and **policies approved**. |

Optional: keep Razorpay vars unset/disabled while testing PayU only.

There is **no** separate PayU webhook secret in this integration — callback **reverse hash** and staff **verify_payment** use the salt.

## PayU dashboard (test)

1. Sign in: [onboarding.payu.in](https://onboarding.payu.in/app/account/signin)
2. Enable **Test Mode** (top toggle).
3. Copy **key** and **Salt v1** into `.env.local`.
4. Ensure return URLs match what the app sends (both success and failure can point to the same handler):

   ```text
   https://YOUR_APP_URL/api/payments/payu/callback
   ```

   The app sets `surl` and `furl` to that path automatically from `APP_URL`.

## Hashing (must match PayU)

**Payment request hash:**

```text
sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
```

**Return (reverse) hash:**

```text
sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
```

Implemented in `lib/payu.ts`. `udf1` carries the OLREADY order id.

## After payment

- PayU **POSTs** to `/api/payments/payu/callback`; user is redirected to `/checkout?payu=success|pending|failed`.
- Reconciliation: Admin → **Orders** → **Check PayU status** uses PayU [Verify Payment API](https://docs.payu.in/docs/prebuilt-checkout-page-integration) (`command=verify_payment`, hash `sha512(key|command|var1|salt)`).

## Local development

`http://localhost:4170` is usually **not** reachable by PayU’s servers. For end-to-end tests use staging (e.g. Vercel preview) or an HTTPS tunnel and set `APP_URL` to that host.

## Go live

1. Complete PayU onboarding / website verification for **production** key and salt.
2. Set `PAYU_MODE=live`, production key/salt, `APP_URL=https://olready.in` (or your live host).
3. Publish **Payment gateway = PayU** (or keep Razorpay and switch in admin when ready).

Reference: [Collect Payment API – Hosted Checkout](https://docs.payu.in/reference/_payment_payu_hosted_checkout)
