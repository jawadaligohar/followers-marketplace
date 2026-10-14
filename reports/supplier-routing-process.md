# Supplier routing and activation

The configured database now has routing for the 34 storefront services. TikTok
prefers Tiksta. Its UK Likes use Peakerr #32791 (England users), and its auto
plans use JAP native subscriptions #10264/#10265. Instagram, Facebook and X
prefer Peakerr. JAP also supplies UK services, polls and retweets where the
reviewed Peakerr listings did not fit. There is no
automatic cross-provider retry: an uncertain submission must be reconciled with
the original provider before any replacement order.

## Current state

- Dispatch is paused by default. `SMM_DISPATCH_ENABLED` must be exactly `true`.
- Existing local Peakerr sandbox configuration cannot bypass that pause.
- All 34 services have supplier IDs.
- All 219 current base packages pass the reviewed quantity/offer checks. Instagram
  UK Likes is capped at 2,000, with 500/1,000/1,500/2,000 packages. This count excludes
  additional holds caused by pricing or live API
  validation. Auto upgrades are checked against the actual ordered post count.
- No API keys were collected and no supplier orders or deposits were made.
- Existing order records, retail prices, admin credentials and service IDs were
  preserved. Previous mappings are backed up under the ignored local directory
  `reports/provider-catalogs/backups/`.

Read the admin supplier panel for each package's current mapping and hold reason.
Credentials and the global pause are separate from package readiness.

## Resolved offer differences

| Service | Resolution |
| --- | --- |
| Instagram UK Likes | Capped at 2,000 to match JAP #1037/#8052. Larger packages were removed from the storefront and database; existing orders remain intact. The new 2,000 tier uses GBP44.99, interpolated between the former 1,500/2,500 prices, converted to USD59.60. Stale requests above 2,000 are rejected before payment. |
| Instagram UK Auto Likes | JAP #1771 is a native subscription. Merchant replacement workflow covers the supplier's no-refill policy. All post upgrades pass the quoted-cost check. |
| TikTok UK Likes | Peakerr #32791: England users, 10–100,000, quoted $1.4868/1,000, 30-day warranty. All eight packages fit. It was missed by an earlier search that did not include “England”. |
| TikTok Auto Likes / Auto Views | JAP native subscriptions replace incompatible fixed Tiksta bundles. Minimums 10/100 cover every sold quantity. Username, min/max, post count and expiry use the existing subscription adapter. |
| TikTok Comments / UK Views | Merchant-funded replacement workflow covers no-refill listings. Custom-comments type is checked against the live API before submission. |
| TikTok Live Views / X Space Listeners | The existing public descriptions already disclose 30 minutes, matching the reviewed supplier listings. Redundant holds removed. |
| X Female Followers | JAP #1879 supplies female NFT-focused profiles; the offer description discloses this audience. Merchant replacement workflow covers its no-refill policy. |

The runtime limits are defined in `lib/supplier/routing.ts`; purchase restrictions
are shared by the storefront and server in `lib/serviceAvailability.ts`. Changing
an admin mapping does not establish compatibility with the new supplier listing.

## Activation, when APIs are supplied

1. Keep dispatch paused. Configure each provider's server-side API key and set all
   provider sandbox flags to `false` for live use. Restart the app after env changes.
2. Check authenticated balances in the admin supplier panel. Confirm USD account
   currency, rates, order types, limits and sufficient credit. Listing quality,
   drop rates and delivery speed are supplier claims until tested.
3. Verify delivery quality, the 50-like bonus and exact auto-plan quantities and
   30/60/90/120 post counts. The code tests package limits, all advertised upgrade
   costs and the 120-post native subscription payload with mocked API responses.
4. With separately authorized test spending, use controlled public targets to test
   delivery, status sync, cancellations, refills, custom comments and poll choice.
5. Set `SMM_DISPATCH_ENABLED=true` only when ready to submit live orders, then
   restart. Paused orders are not automatically replayed: review and dispatch them
   individually in admin to avoid sending old or duplicate orders.

Before each reviewed live dispatch, the system reads the provider API catalog and
balance currency. Missing services, incompatible API types, invalid current
limits, failed checks and supplier costs at or above the order's paid amount queue
for staff without an add-order request. Quoted rates in the saved page snapshots
are provisional; the live API check supplies the current rate and currency.
This cost guard prevents obvious losses; it does not calculate payment fees,
refund reserves, taxes or a target profit margin.

## Merchant replacement workflow

No-refill supplier listings do not automatically invalidate our own 30-day refill
offer. Support verifies a drop and uses **Queue merchant replacement** on the
completed admin order. Record the missing quantity and verification evidence;
auto plans require the specific public post URL and may request replacements
while the plan is running. Cumulative replacements for a given post cannot exceed
the original per-post quantity. The order must be paid, non-refunded and within
30 days of creation. Concurrent or duplicate active refill requests are rejected;
completed requests are retained in a history before a later request is opened.

The **replacements** admin queue lists outstanding requests. Staff arranges the
merchant-funded replacement with the original provider, then uses **Verify
completed replacement** with its separate provider order ID. The API must report
completion before the request closes. Original supplier IDs, payments and revenue
remain intact. Queueing a request does not place or charge for a supplier order.
This workflow deliberately requires staff to verify losses; it does not infer a
drop from an unverified social count or claim the supplier offers free refills.

## Maintenance and checks

- `npm run map:suppliers` previews the import; append `-- --apply` to save.
  Existing independently configured mappings are preserved. Apply requires the
  dispatch switch to be paused and writes a local backup first.
  `-- --resolve-reviewed --apply` additionally migrates only the three exact
  previous TikTok mappings documented above; unrelated admin mappings remain intact.
- `npm run test:routing` checks all 34 slugs, package constraints, bonus minimums,
  poll URL encoding and live catalog guards without network calls.
- `npm run test:suppliers` requires the guarded local test database and uses mocked
  provider responses; it tests concurrency, reconciliation and the pause switch.
- `reports/provider-catalogs/reviewed-routing.json` records only the selected
  listings and their source pages. No credentials or browser sessions are stored.
