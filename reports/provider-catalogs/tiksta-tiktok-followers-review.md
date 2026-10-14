# Tiksta mapping review: TikTok Followers

Collected on 14 October 2026 from `https://tiksta.com/services` in the connected Chrome context. The catalog is publicly accessible and explicitly shows **USD**. It was refreshed after the user reported signing in, but its visible navigation remained public-facing; account-specific discounts and authenticated checkout prices have not been independently verified. No signup form, account settings, credentials or API keys were read or modified.

The snapshot contains 14 follower listings, including targeted and verified-account products. Unlike the JAP and Peakerr reviews, this is for **TikTok**, not Instagram: compare it only with TikTok follower services from other providers.

## Candidates for our ordinary TikTok Followers packages

| Tiksta ID | Tier | USD / 1,000 | Table minimum | Table maximum | Listed refill |
| --- | --- | ---: | ---: | ---: | --- |
| 2 | Eco | $0.99 | 10 | 10,000,000 | 30 days |
| 3 | Pro / real-looking accounts | $4.39 | 10 | 750,000 | 30 days |
| 4 | Pro / aged accounts | $4.80 | 10 | 50,000 | 30 days |

All three cover our seven quantities: 100, 250, 500, 1,000, 2,000, 5,000 and 10,000. Their descriptions state global coverage, a public profile requirement, the profile URL format `tiktok.com/@username`, and a claimed 0–6 hour start window. These are supplier statements, not independently verified delivery results.

**Draft first quality-test candidate: ID 3.** Its explicit account-appearance positioning is closer to the storefront description than selecting the cheapest product solely on price. The phrase real-looking is not evidence of genuine active people. The more expensive Pro label also does not prove it performs better. **ID 2** is the budget test alternative.

## Conflicts and exclusions

- ID 2's table maximum is 10 million, but its title/description indicate 1 million. Both exceed our current 10,000 maximum; use the lower limit until confirmed.
- ID 3's title advertises 1,000–5,000/day, while its description says 5,000–10,000/day. Use the slower title range for planning.
- ID 4's table allows 50,000, but its title and description say 10,000. Conservatively cap at 10,000 pending verification.
- ID 1 is cheaper at $0.78/1,000 but has no refill. It is unsuitable as a direct match for our 30-day refill offer.
- ID 210 costs $28/1,000 and is advertised as organic/non-drop. Its claims are unverified and its cost is incompatible with our current retail ladder: 1,000 followers alone would cost more than the seeded storefront price.
- Country-targeted services are separate products. No UK targeting is established for the global candidates.
- Verified-account products 132–136 have fixed package quantities. The generic table heading is insufficient to establish per-1,000 billing for those products; their normalized `ratePer1000` is deliberately null and they are excluded from the ordinary mapping.

## Estimated supplier cost at advertised rates

| Our quantity | ID 2 Eco | ID 3 Pro |
| --- | ---: | ---: |
| 100 | $0.099 | $0.439 |
| 250 | $0.2475 | $1.0975 |
| 500 | $0.495 | $2.195 |
| 1,000 | $0.99 | $4.39 |
| 2,000 | $1.98 | $8.78 |
| 5,000 | $4.95 | $21.95 |
| 10,000 | $9.90 | $43.90 |

These are unrounded rate calculations, not final charges or profit. Billing precision and any account-level pricing must be checked before activation.

## Status

The snapshot is `tiksta-tiktok-followers.json`; the reviewable draft is `tiksta-tiktok-followers-mapping.json`. **No production mappings, API settings, deposits or orders were changed.** API setup and separately authorized delivery tests remain later steps. The integration already restricts Tiksta routing to TikTok.
