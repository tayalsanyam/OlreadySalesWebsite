# OLREADY V10 — Orders & Payments

Complete cumulative source, including the V9 responsive improvements. Development is local; nothing has been deployed and no real payment has been made. Razorpay remains disabled until configured. Supabase keeps orders inside the existing private `partner_workspace.state` record using the existing compare-and-swap updates. **No new migration is required for this release.**

## Install

Stop the old dev server. Extract this ZIP into a new folder. Copy your existing `.env.local`, `.data` and `public/uploads` into the new `olready` folder. Keep a backup. Do not copy `.next` or `node_modules`.

```sh
npm ci
npm run dev -- --port 4173
```

The banner reads **OLREADY Sales V10**. Do not run a database seed over your existing data.

## Where payments appear

**Admin → Activity → Orders & payments** (on mobile: Workspace section → Orders & payments). Overview also links to it.

- Search customer name, business, email, phone, coupon or payment/order reference.
- Filter by plan, payment status, test/live mode and order-created dates in IST.
- Live mode is the default; test payments never inflate live totals.
- See collected, refunded, net after refunds, successful orders, pending orders and failed/review counts. These are customer payment amounts before gateway fees, **not bank settlements**. All totals follow the current filters.
- Export the filtered orders as CSV with customer, plan, amounts, coupon, tax, date, method, references and follow-up state. CSV fields are escaped against spreadsheet formula injection.
- Open any order for the original purchased plan, version, duration, inclusions, enquiry allowance, reach, customer details, coupon, discount, included GST and total.
- Payment attempts retain method (UPI/card/netbanking/etc.), bank/wallet when supplied, provider reference, attempt time, verification time and failure description. No full card number, CVV or UPI address is stored.
- Captured payments, partial/full refunds, email queue status, invoice status and the order timeline are visible.
- Save internal follow-up status and notes. This is separate from plan activation.
- Admin/commercial staff can check the provider's current status, reconcile an existing provider order, and requeue eligible failed/previewed purchase emails. Sales staff can view records/export and save follow-ups. Editors cannot access the orders API.
- The screen refreshes stored records every 30 seconds. “Refresh records” rereads OLREADY data; “Check Razorpay status” fetches provider data.

## Payment flow implemented

1. Customer saves their selection, customer details, optional business name, coupon and acceptance of terms.
2. Clicking Pay creates one immutable local order for that cart, reserves the coupon and creates a Razorpay order server-side. The payable amount is calculated from the published plan and coupon. Unsaved changes must be saved first.
3. Razorpay Standard Checkout opens. A browser result alone never marks the purchase paid: the server verifies its signature and fetches the payment. Only verified captured/refunded payments count as collected; authorization alone is pending.
4. Signed server-to-server webhooks update the order even if the customer closes the browser. Duplicate delivery does not duplicate records or the purchase-email job. Late failure notifications cannot downgrade a captured attempt.
5. Verified live captures queue one thank-you email through the existing delivery system. The customer is linked to the existing merchant website. **Profile creation and backend plan activation remain separate.** No activation time is advertised.
6. The customer can use Check payment status after interruption. Staff can also reconcile. Do not ask a debited customer to pay again while verification is pending.

An existing Razorpay order is reused on retry. If provider order creation times out, the order is marked for review rather than automatically creating another charge. Search the local UUID/receipt in Razorpay; enter that provider order ID in the order detail. The server checks the receipt, amount and currency before linking it and reconciling payments.

Pro and Phoenix support checkout when approved. **Privy remains invitation/conversation-only.** Zero-value/under-₹1 orders are not sent to Razorpay. Changing plans/pricing in admin does not alter old purchases. After payment starts, the cart is locked to its order; plan changes require assistance rather than silently changing a payable purchase.

Coupon limits include reserved, still-payable orders, not only captured payments. Reservations do not automatically expire or restore after a refund, because an old provider order may remain payable. Review unused reservations operationally; this release does not implement automatic order cancellation/release.

## Configure Razorpay — test first

Put these in your own `.env.local`; use the same server-only settings in Vercel later. Do not commit secrets or paste them into chat.

```env
RAZORPAY_ENABLED=false
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_test_secret
RAZORPAY_WEBHOOK_SECRET=your_independent_webhook_secret
```

The webhook secret is set separately in Razorpay; it is not the API key secret. After setting up the webhook and capture settings, change `RAZORPAY_ENABLED=true` and restart to test. Local demo mode rejects live-key checkout.

In Razorpay:

1. Configure automatic capture for these Orders API payments. This application does not manually capture authorized payments.
2. Add the publicly reachable HTTPS webhook endpoint: `https://YOUR_DOMAIN/api/payments/webhook`.
3. Use the identical webhook secret on both sides.
4. Subscribe to `payment.authorized`, `payment.captured`, `payment.failed`, `order.paid`, `refund.created`, `refund.processed`, `refund.failed`.
5. Localhost is not reachable by Razorpay: use an HTTPS staging deployment/tunnel for gateway test callbacks.
6. Publish approved plans and approved terms/refund policies in OLREADY before testing checkout.
7. Complete test success, failure, dismissal, closed-browser callback, duplicate event, pending/late authorization, partial/full refund and email-delivery checks before enabling live keys.

For launch, configure the intended KATLYST account's keys and its live webhook, set `LOCAL_DEMO=false`, set the real APP_URL and verify staff authentication. Switching keys does not delete historical orders. Records retain their originating public key ID. Reconciliation intentionally rejects records from another key/account; temporarily restore the original configuration when resolving old records. Finish outstanding payments/refunds before switching accounts or design a separate legacy-account handler. There is no bulk import of past Razorpay sales in this release; it tracks orders originating from this website.

Webhooks remain able to update known orders while new checkout is disabled, provided the original keys and webhook secret remain configured. Do not remove those credentials while payments are still resolving.

## Thank-you email and invoices

Edit **Email templates → Purchase thank you**, then save and publish. Purchase emails do not require marketing-list opt-in. Marketing offers and cart-recovery consent rules remain unchanged. Test payments do not queue real purchase emails.

To send live email, configure `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_DELIVERY_ENABLED=true`, and the existing authenticated job runner (`GET /api/jobs` with `Authorization: Bearer CRON_SECRET`). Schedule that runner on your hosting platform or process the Delivery queue from admin. Without delivery enabled, jobs render as previews, not sent email. Requeue eligible previewed/failed emails from the order after configuring delivery. “Sent” means accepted by the email provider, not proof of inbox delivery.

**Zoho Billing is not integrated.** Invoice status explicitly says “not configured”; no invoice number or PDF is invented. The record has invoice fields ready for that separate integration. Refunds are initiated in Razorpay; OLREADY records their reported state. This admin cannot issue a refund or activate a merchant plan.

## Verification

- 51 automated tests passed: pricing/GST, permission-related helpers, purchase snapshots, coupon reservations, signature checks, duplicate/late events, refunds, test-mail suppression and CSV escaping.
- TypeScript and production build passed.
- Local HTTP verification passed for disabled checkout, signed webhook capture, duplicates, late failure, partial refund, invalid signature, public status isolation, admin notes and invalid-origin rejection. Uses synthetic local fixtures and makes no external Razorpay calls.
- Chrome desktop review covered the populated order list, test/live filtering, purchase detail and staff follow-up saving.
- Responsive checks passed at 320px and 390px for populated orders/details; checkout checked at 390px. Physical Safari/Android keyboard behaviour remains a device test.
- Screenshot uses clearly labelled TEST examples. Those fixtures were removed and original local records restored; no customer records or credentials are packaged.
- **Not tested yet:** actual Razorpay test/live API calls or hosted Checkout, real webhook delivery from Razorpay, real email delivery, production staff/MFA access, live Supabase writes or Zoho. Configure a staging account and run the gateway tests before taking real money.

The JSON workspace architecture remains appropriate for this existing small admin application. A high-volume ledger should move to dedicated indexed order/payment tables and server-side pagination before scaling; do not treat the current whole-workspace record as an unlimited transaction store.

## References checked

- https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
- https://razorpay.com/docs/webhooks/validate-test/
- https://razorpay.com/docs/api/orders/fetch-all/
- https://razorpay.com/docs/api/refunds/fetch-all/
- https://supabase.com/docs/guides/database/json
