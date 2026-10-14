# MegaFollowers SMM architecture verification

Verified on 14 October 2026 using read-only requests to public resources. No login, private API access, provider keys or paid orders were used.

## Confirmed public evidence

- The [dashboard entry page](https://dashboard.megafollowers.uk/) serves a React bundle at `/static/js/main.4e7ff84d.js`. Its provider configuration UI defines JAP, Peakerr and Tiksta service IDs, service defaults, package/duration overrides and TikTok-only validation for Tiksta. The bundle also contains provider balance monitoring and a threshold of USD 25. Its SHA-256 and individual feature checks are recorded in `smm-architecture-evidence.json`.
- The [Social Fetch OpenAPI schema](https://social-api.megafollowers.uk/openapi.json) documents Instagram, TikTok and Twitter fetch routes with an `X-API-Key` requirement. This supports the existence of a separate profile/post-fetch service.
- [JAP](https://justanotherpanel.com/api), [Peakerr](https://peakerr.com/api) and [Tiksta](https://tiksta.com/api) publish compatible SMM API v2 documentation. Provider order, balance and service operations use server-held credentials.

The dashboard proves these configuration and management features exist in shipped frontend code. It does not expose live provider configuration or establish that every feature is enabled.

## Claims that remain inference

Follow-up inspection found that the dashboard's provider-normalization function falls back to JAP when its input is missing or unrecognized. This confirms JAP as the frontend code's default fallback and strengthens the inference that JAP is the original/default integration. It does not establish the live backend's configured default or which provider receives most orders. Gemini's claims about Peakerr serving as automatic failover and actual service-to-provider routing also remain unverified. Browserless's root returned HTTP 401 with a Caddy header; that does not prove the product behind it or its relationship to Social Fetch. The OpenAPI admin route names do not establish account rotation, proxy behavior or any rate-limit bypass. Hosting, database, queue implementation and backend framework claims were not independently established.

## Implementation in this repository

The existing Next.js and MongoDB backend now provides equivalent verified supplier behavior without replatforming:

- Server-only JAP, Peakerr and Tiksta adapters and explicit sandbox switches.
- Default provider and per-package provider service mappings. Existing `supplierServiceId` remains a Peakerr fallback, and seed updates preserve routing overrides.
- Paid-only dispatch, persistent provider/service/order identity, atomic submission claims and manual reconciliation after uncertain network failures. Automatic cross-provider retries are intentionally absent because acceptance may be unknown.
- Admin provider overrides, live balance checks, low-credit warnings, status synchronization, cancellation requests and refill requests. Provider cancellation does not issue a customer refund; staff use the separate refund workflow. Refill/cancel submission locks prevent concurrent duplicate requests. Ambiguous actions stay locked for staff investigation rather than being resent automatically.
- A separate configurable Social Fetch-compatible gateway, short-lived cache, per-client/global request budgets and a public-post selector on applicable order forms. The gateway is disabled until `SOCIAL_FETCH_API_URL` and `SOCIAL_FETCH_API_KEY` point to an operator-owned service. It expects a `success` response with a data array or `posts`/`items`/`videos` list containing public `url`, `post_url`, `web_url` or `permalink` fields. A service returning a different record format needs a normalizer. No competitor endpoint or browser cluster is used.

Provider keys, credit and correct wholesale service IDs must be supplied by the site operator. No production routing mappings or credentials were invented, no production seed was run, and no supplier order was placed for verification. The separately hosted profile-fetch service is an external deployment requirement; this repository provides its gateway and checkout integration, not a reconstructed private scraper implementation.

Run `npm run test:suppliers` against a local replica-set database named `followers_suppliers_test`. Tests intercept every external request and never spend supplier credit.
