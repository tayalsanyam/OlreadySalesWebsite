# Current status: V10

The payment implementation and admin records are now in V10. Follow **UPDATE_V10.md** for the current setup and validation requirements. The older planning notes below are historical.

# OLREADY — Razorpay integration handoff

Status: implementation plan, not an enabled payment integration. Artist/media changes are delivered separately in this release. `/api/payments` still returns a disabled response.

## Inputs we need

1. Razorpay test Key ID and test Key Secret, entered in your local environment. Live keys only after acceptance testing and account activation. Never put a secret in a `NEXT_PUBLIC_` variable or commit it to Git.
2. A separate webhook signing secret, configured both in Razorpay and our server environment.
3. The final HTTPS website URL, support contact, and published terms, refund/cancellation and privacy pages. Local order tests work locally; webhook delivery needs an accessible HTTPS test endpoint or a deployed staging environment.
4. Auto-capture configuration. The website will only mark a purchase paid after captured payment is confirmed and order, amount and currency match.
5. Verified transactional email sender/provider credentials. The current project has a Resend adapter, but payment confirmation jobs still need to be wired into the new payment flow.
6. Legal business/invoice details: legal name, address, GSTIN and approved service classification; fields needed from the buyer for invoicing. All current plan prices include 18% GST.
7. Optional Zoho Billing: organisation ID, account region, authorised OAuth connection and invoice numbering/tax setup. This is optional and should not delay payment acknowledgement.
8. Privy remains invitation-only. Plan: a staff-approved checkout invitation tied to the approved offer, rather than a publicly purchasable Privy button.

## Proposed payment flow

- Customer selects a plan. Server validates the current plan price, availability, coupon and inclusive GST. Freeze the offer snapshot on an internal order; do not trust a browser-supplied amount.
- Create and persist a Razorpay order on the server in INR, using integer paise. Prevent concurrent duplicate order creation for the same checkout intent.
- Open Razorpay Standard Checkout with that order ID.
- On callback, verify the signature server-side using the stored order ID. Fetch the payment to check ownership, currency, amount and captured status.
- A signature-validated webhook feeds the same transition function. Deduplicate event IDs and payment IDs; tolerate repeated and out-of-order events. Never downgrade a captured purchase because an earlier failure event arrives late.
- Persist the captured payment and transactional email/outbox job atomically. Mark the cart paid, stop abandoned-cart reminders, and show the thank-you page.
- Send the editable thank-you email with the plan, payment/order reference, merchant profile link and support contact. Offer the create-profile/login redirect on the thank-you page.
- Staff handles plan activation in the existing merchant backend. No automatic activation is performed by this website and no activation timing is advertised.
- If Zoho is connected, create the invoice as a separate retryable job. Receipt acknowledgement is immediate once paid; invoice availability must never change whether the payment is considered successful.

## Fallback and recovery

| Situation | Intended behaviour |
| --- | --- |
| Customer closes checkout | Keep the saved cart; check payment status before offering retry. Closing a modal is not proof that the payment failed. |
| Confirmed failed attempt | Keep plan/contact details. Offer another attempt/payment method and WhatsApp support. Reconcile the existing order first. |
| Money debited but browser loses connection | Show “Checking your payment” with order reference. Do not ask them to pay again while status is uncertain. Webhook/API reconciliation determines the outcome. |
| Browser callback never arrives | Signed webhook completes the recorded payment independently. |
| Webhook delayed or unavailable | Server status fetch and scheduled reconciliation recover unresolved orders. Alert staff if uncertainty persists. |
| Duplicate callback or webhook | Idempotent processing: one paid transition and one confirmation/invoice job. |
| Email/Zoho outage | Keep order paid. Retry the failed delivery/invoice job and expose failure in admin. Never charge again. |
| Customer leaves without paying | Recovery only for opted-in, eligible recipients. Recheck payment state immediately before sending and stop for paid/pending payments. |
| Multiple independently captured orders | Flag for staff review; do not fulfil twice. Refund only through an authorised refund action. |
| Refund | Track separately from original successful payment and reconcile signed provider updates. Do not infer refund success from a browser action. |

## Implementation scope for the next phase

Create a migration with private orders, payment attempts, webhook event deduplication and an outbox. Add server order creation, callback verification, raw-body webhook validation, order status and reconciliation endpoints. Keep credentials server-only, bind order status to the customer’s secure checkout session, and add admin payment/reconciliation views. Existing CMS storage is not a substitute for a transactional payment ledger.

Test successful payment; failed payment; cancellation; late capture; forged signature; wrong amount/order/currency; duplicated events; reversed event order; repeated Pay clicks; coupon changes; email failure; invoice failure; abandoned cart after payment; and permission checks. Then replace test credentials with live credentials and separately validate the live configuration.

Official references checked for this plan:
- https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
- https://razorpay.com/docs/webhooks/validate-test/
