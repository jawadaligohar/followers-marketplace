# Surgeon

Social media service storefront with USD checkout, a customer wallet, rewards, and order administration.

## Service catalog

The catalog in `lib/catalog.ts` contains 34 services and 222 quantity packages across Instagram, TikTok, Facebook, and X. GBP package prices are converted to USD using `GBP_TO_USD` (1.3247 in this snapshot). Runtime prices and availability come from MongoDB and can be managed at `/admin/services`.

Run `npm run seed:services` against the intended database to import the catalog. This updates package prices and service definitions, migrates legacy service slugs while preserving document IDs, and preserves active settings and supplier mappings. It does not create or reset an admin account. The configured environment may point at production, so verify the destination before running it. Newly imported services require a matching supplier service ID in admin for automatic fulfillment; unmapped orders queue for manual fulfillment.

Every service has a page under `/services/<slug>`. Links with `?qty=<quantity>` select that package. Automatic plans accept a posts limit, comment packages require one comment per unit, and poll packages accept options 1–4. Card and crypto checkout charge the listed USD price; wallet orders receive the existing 5% discount. Server pricing is derived from the service document, never a client price.

For isolated catalog tests, start a local MongoDB and set `MONGODB_URI=mongodb://127.0.0.1:27999/followers_catalog_test`, then run `npm run test:catalog`. The test refuses remote databases, uses only supplier sandbox fulfillment, and drops its dedicated test database before and after the run. It checks all prices, auto upgrades, validation, legacy migration, repeated seeding, and supplier mappings. `npm run lint` and `npm run build` verify the application.

Set `SUPPORT_EMAIL` to the inbox shown on the contact page; the package enquiry form opens an email draft and does not send mail automatically.

## Offers, payments, and rewards

Every confirmed paid checkout earns one 50-like bonus for the platform of its first item. Private, signed tracking and claim links are available on the payment-return page. Authenticated customers can also claim through `/dashboard/rewards`. Fully refunded or unpaid checkouts do not qualify. Claims are protected by a unique checkout key and a database transaction. Bonus orders are separate $0 orders and never earn further bonuses or loyalty credit.

Paid packages earn a 1% loyalty credit. Customers redeem that credit into their wallets; refunds reduce eligibility and any excess previously redeemed credit offsets future earnings. Rewards and wallet checkout use MongoDB transactions, requiring a replica set (Atlas provides one). One monthly draw entry is earned for each $132.47 of qualifying direct-payment spend or wallet top-ups. Spending a topped-up wallet is not counted again, and refunds reduce qualification. Entries close at UTC month-end. Admins run a completed month's draw from `/admin/benefits`, specifying the fixed USD wallet-credit prize; each ticket has equal weight and a month can be drawn only once. The bank receiving details and prize amount were deliberately deferred by the user.

Configure `BANK_TRANSFER_INSTRUCTIONS` with public USD receiving details to enable bank checkout and wallet top-ups. Pending transfers appear in `/admin/benefits`. Staff must verify the amount and reference before confirming; confirmation is idempotent and releases the order or credits the wallet. Until receiving instructions exist, bank payment is hidden and the API refuses to create a transfer.

Configure `RESEND_API_KEY` and `EMAIL_FROM` for transactional order/bonus, verification, and password-reset emails. Without them, messages remain in a persistent outbox and can be sent from `/admin/benefits` after configuration. Private order and bonus links remain accessible at checkout. A guest draw prize requires verification of the winning email address before redemption; a checkout token alone cannot authorize that prize. No real payment or email provider calls are required by the tests.

`npm run test:benefits` requires a local replica-set database named `followers_benefits_test`. It refuses remote connections and drops only its named test database. Tests cover concurrent bonus claims and reward redemptions, refunds, draw accounting and prizes, and repeat bank confirmations. `npm run audit:competitor` performs a read-only comparison against the competitor and saves structured evidence to `reports/catalog-parity.json`.

The older supplier/crypto integration scripts now refuse production databases and verify the target server's isolated database and sandbox modes before creating test records. This prevents the leftover E2E services previously shown in the live catalog from recurring. Provider refunds and staff-recorded refunds adjust loyalty credit; refund events reduce the posting month's draw qualification without changing closed-month entries. The admin rewards panel can issue agreed wallet-credit refunds or record money already returned through another channel.

## SMM providers and profile previews

The supplier layer supports JAP, Peakerr and Tiksta. Configure each provider's server-side `*_API_KEY` and set `*_SANDBOX=true` only for intentional simulation. Admin services support a default provider and optional package overrides. Tiksta is restricted to TikTok. Orders retain their original provider so status updates and cancellations keep using the correct panel after catalog changes. Balance checks, status refresh, cancellation/refill requests and unresolved-dispatch reconciliation are available in admin. Missing keys or mappings queue orders for manual fulfillment; uncertain network submissions must be checked before resending. Existing single-provider mappings remain compatible.

Optional profile preview uses your own `SOCIAL_FETCH_API_URL` and `SOCIAL_FETCH_API_KEY`. Preview stays hidden when unconfigured and manual post URLs always work. See [the architecture review](reports/smm-architecture-review.md) for verified competitor evidence, integration contracts and deployment requirements. `npm run test:suppliers` runs isolated provider-routing and preview tests against a local `followers_suppliers_test` replica-set database.

## Local development

Install dependencies with `npm ci`, copy `.env.example` to `.env`, and configure the database and authentication settings.

Run `npm run dev` and open http://localhost:3000. Use `npm run lint` and `npm run build` to validate changes.
