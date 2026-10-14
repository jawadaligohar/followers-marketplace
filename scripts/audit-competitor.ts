import { mkdir, writeFile } from "node:fs/promises";
import { CATALOG, GBP_TO_USD } from "../lib/catalog";

const origin = "https://www.megafollowers.uk";
function attribute(tag: string, name: string) {
  const raw = new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1] ?? "";
  return raw
    .replace(/&#x([a-f\d]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&pound;/g, "£");
}
async function main() {
  const results: {
    slug: string;
    source: string;
    matched: boolean;
    packages: { qty: number; gbp: number; usdCents: number; sourceCheckout: string; postUpgrades: { posts: number; gbpSurcharge: number; totalUsdCents: number }[] }[];
    differences: string[];
  }[] = [];
  for (let index = 0; index < CATALOG.length; index += 4) {
    const batch = await Promise.all(
      CATALOG.slice(index, index + 4).map(async (service) => {
        const source = `${origin}/buy-${service.slug}`;
        const response = await fetch(source, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${source}`);
        const html = await response.text();
        const tags =
          html.match(/<a\b[^>]*class="[^"]*\bmf-qty-tile\b[^"]*"[^>]*>/g) ?? [];
        const packages = tags
          .map((tag) => ({
            qty: Number(attribute(tag, "data-qty").replace(/,/g, "")),
            gbp: Number(attribute(tag, "data-price").replace(/[^\d.]/g, "")),
            sourceCheckout: new URL(attribute(tag, "href"), origin).toString(),
            postUpgrades: [] as { posts: number; gbpSurcharge: number; totalUsdCents: number }[],
          }))
          .filter((tier) => tier.qty > 0 && tier.gbp > 0);
        const differences: string[] = [];
        if (packages.length !== service.tiers.length)
          differences.push(
            `Package count: source ${packages.length}, local ${service.tiers.length}`,
          );
        for (const tier of packages) {
          const local = service.tiers.find((t) => t.qty === tier.qty);
          if (!local || local.gbp !== tier.gbp)
            differences.push(
              `${tier.qty}: source GBP ${tier.gbp}, local ${local?.gbp ?? "missing"}`,
            );
        }
        if (service.kind === "auto") {
          for (let start = 0; start < packages.length; start += 4) {
            await Promise.all(packages.slice(start, start + 4).map(async tier => {
              if (new URL(tier.sourceCheckout).hostname !== new URL(origin).hostname) throw new Error("Unexpected package host");
              const response = await fetch(tier.sourceCheckout, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30000) });
              if (!response.ok) throw new Error(`HTTP ${response.status}: ${tier.sourceCheckout}`);
              const html = await response.text();
              const options = [...html.matchAll(/data-posts="(\d+)"\s+data-delta="([\d.]+)"/g)].filter(match => Number(match[1]) !== 30);
              tier.postUpgrades = options.map(match => ({ posts: Number(match[1]), gbpSurcharge: Number(match[2]), totalUsdCents: Math.round((tier.gbp + Number(match[2])) * GBP_TO_USD * 100) }));
              const local = service.tiers.find(candidate => candidate.qty === tier.qty)?.posts || {};
              if (options.length !== Object.keys(local).length) differences.push(`${tier.qty}: post-upgrade count differs`);
              for (const option of tier.postUpgrades) if (local[option.posts] !== option.gbpSurcharge) differences.push(`${tier.qty}, ${option.posts} posts: source upgrade GBP ${option.gbpSurcharge}, local ${local[option.posts] ?? "missing"}`);
            }));
          }
        }
        return {
          slug: service.slug,
          source,
          matched: differences.length === 0,
          packages: packages.map((tier) => ({
            ...tier,
            usdCents: Math.round(tier.gbp * GBP_TO_USD * 100),
          })),
          differences,
        };
      }),
    );
    results.push(...batch);
    for (const result of batch)
      console.log(
        `${result.matched ? "MATCH" : "DIFFERENCE"} ${result.slug}: ${result.packages.length} packages${result.differences.length ? ` (${result.differences.join("; ")})` : ""}`,
      );
  }
  const extraPages = await Promise.all(
    [
      "/",
      "/free-instagram-likes",
      "/free-tiktok-likes",
      "/free-facebook-likes",
      "/free-twitter-likes",
      "/rewards",
    ].map(async (path) => {
      const response = await fetch(`${origin}${path}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(30000),
      });
      const html = await response.text();
      const content = html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");
      return {
        source: `${origin}${path}`,
        status: response.status,
        bonusLikes: /50 free likes|50 Free.*Likes/i.test(content) ? 50 : null,
        walletSavingsPercent:
          Number(/Save (\d+)% paying from your balance/i.exec(content)?.[1]) ||
          null,
        loyaltyReturnPercent:
          /Every £1 you spend earns a point, worth 1p/i.test(content)
            ? 1
            : null,
        bonusRequiresPaidOrder:
          /every paid order|placed an order|every order/i.test(content),
      };
    }),
  );
  await mkdir("reports", { recursive: true });
  await writeFile(
    "reports/catalog-parity.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        conversionRate: GBP_TO_USD,
        services: results,
        extraPages,
      },
      null,
      2,
    ),
  );
  const total = results.reduce((sum, r) => sum + r.packages.length, 0);
  console.log(
    `Checked ${results.length} services and ${total} packages. ${results.filter((r) => !r.matched).length} services differ. Report: reports/catalog-parity.json`,
  );
  if (results.some((r) => !r.matched)) process.exitCode = 1;
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Catalog audit failed",
  );
  process.exitCode = 1;
});
