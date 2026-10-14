import assert from "node:assert/strict";
import { CATALOG, gbpToUsdCents } from "../lib/catalog";
import { walletPriceCents } from "../lib/pricing";
import {
  SUPPLIER_ROUTES,
  dispatchEnabled,
  routeHold,
  supplierLink,
} from "../lib/supplier/routing";
import { validateLiveListing } from "../lib/supplier/preflight";
import { serviceAvailability } from "../lib/serviceAvailability";

assert.deepEqual(
  Object.keys(SUPPLIER_ROUTES).sort(),
  CATALOG.map((service) => service.slug).sort(),
);
let mapped = 0,
  held = 0;
for (const service of CATALOG) {
  const route = SUPPLIER_ROUTES[service.slug];
  if (
    service.platformId === "tiktok" &&
    !["tiktok-auto-likes", "tiktok-auto-views", "tiktok-uk-likes"].includes(
      service.slug,
    )
  )
    assert.equal(route.provider, "tiksta");
  assert.equal(route.kind || "standard", service.kind);
  for (const tier of service.tiers) {
    const hold = routeHold(route, tier.qty);
    assert.equal(
      Boolean(hold),
      Boolean(serviceAvailability(service.slug, tier.qty)),
      `${service.slug} ${tier.qty}: checkout must agree with routing`,
    );
    if (hold) held++;
    else {
      mapped++;
      assert.ok(route.id);
      assert.equal(
        routeHold(
          route,
          tier.qty,
          30,
          walletPriceCents(gbpToUsdCents(tier.gbp)),
        ),
        null,
        `${service.slug}: base plan cost`,
      );
      for (const [posts, extra] of Object.entries(tier.posts || {}))
        assert.equal(
          routeHold(
            route,
            tier.qty,
            Number(posts),
            walletPriceCents(gbpToUsdCents(tier.gbp + extra)),
          ),
          null,
          `${service.slug}: ${posts}-post plan cost`,
        );
    }
  }
}
for (const slug of [
  "instagram-likes",
  "tiktok-likes",
  "facebook-post-likes",
  "twitter-likes",
])
  assert.equal(
    routeHold(SUPPLIER_ROUTES[slug], 50),
    null,
    `${slug}: 50-like bonus`,
  );
assert.equal(SUPPLIER_ROUTES["tiktok-uk-likes"].id, "32791");
assert.equal(SUPPLIER_ROUTES["tiktok-auto-likes"].id, "10264");
assert.equal(SUPPLIER_ROUTES["tiktok-auto-views"].id, "10265");
assert.ok(routeHold(SUPPLIER_ROUTES["instagram-uk-likes"], 5000));
assert.deepEqual(CATALOG.find(service => service.slug === "instagram-uk-likes")!.tiers.map(tier => tier.qty), [500, 1000, 1500, 2000]);
assert.equal(serviceAvailability("instagram-uk-likes", 2000), null);
assert.equal(routeHold(SUPPLIER_ROUTES["instagram-uk-likes"], 2000), null);
assert.equal(
  new URL(
    supplierLink(
      "https://x.com/name/status/123?vote=1",
      3,
      SUPPLIER_ROUTES["twitter-votes"],
    ),
  ).searchParams.get("vote"),
  "3",
);
assert.throws(() =>
  supplierLink(
    "https://x.com/name/status/123",
    5,
    SUPPLIER_ROUTES["twitter-votes"],
  ),
);
const listing = {
  service: "34466",
  name: "Auto Likes",
  category: "Instagram",
  type: "Subscriptions",
  rate: "0.0952",
  min: "50",
  max: "200000",
};
const route = SUPPLIER_ROUTES["instagram-auto-likes"];
assert.equal(validateLiveListing(route, listing, "USD", 1000, 120, 5000), null);
assert.ok(validateLiveListing(route, listing, "GBP", 1000, 30, 5000));
assert.ok(
  validateLiveListing(
    route,
    { ...listing, type: "Default" },
    "USD",
    1000,
    30,
    5000,
  ),
);
assert.ok(validateLiveListing(route, listing, "USD", 20, 30, 5000));
assert.ok(
  validateLiveListing(
    route,
    { ...listing, rate: "100" },
    "USD",
    1000,
    120,
    5000,
  ),
);
assert.ok(validateLiveListing(route, undefined, "USD", 1000, 30, 5000));
delete process.env.SMM_DISPATCH_ENABLED;
assert.equal(dispatchEnabled(), false);
process.env.SMM_DISPATCH_ENABLED = "true";
assert.equal(dispatchEnabled(), true);
console.log(
  `PASS: all 34 routes, ${mapped} compatible base packages, ${held} held base packages, bonus quantities, poll encoding, live API type/currency/limits/cost guards, and activation switch.`,
);
