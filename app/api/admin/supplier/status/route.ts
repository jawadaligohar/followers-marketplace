import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { getProviderClient } from "@/lib/supplier";
import { dbConnect } from "@/lib/db/connect";
import { Service } from "@/lib/db/models/Service";
import {
  dispatchEnabled,
  SUPPLIER_ROUTES,
  routeHold,
} from "@/lib/supplier/routing";
import { resolveProviderMapping } from "@/lib/supplier/providers";
import {
  PROVIDERS,
  PROVIDER_LABELS,
  providerConfig,
} from "@/lib/supplier/providers";
export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();
  const services = await Service.find({ active: true });
  const routing = services.map((service) => {
    const route = SUPPLIER_ROUTES[service.slug];
    const packages = service.tiers.map(
      (tier: { qtyValue: number; priceCents: number }) => {
        const mapping = resolveProviderMapping(service, tier.qtyValue);
        const reviewed =
          route?.provider === mapping.provider &&
          route.id === mapping.serviceId;
        return {
          quantity: tier.qtyValue,
          provider: mapping.provider,
          serviceId: mapping.serviceId,
          refillPolicy:
            reviewed && route.merchantRefill
              ? "Merchant replacement"
              : "Provider refill terms",
          durationMinutes: reviewed ? route.durationMinutes : undefined,
          hold: !mapping.serviceId
            ? route?.hold || "No mapping"
            : reviewed
              ? routeHold(route, tier.qtyValue, 30, tier.priceCents)
              : "Custom mapping: verify supplier limits and type",
        };
      },
    );
    return { slug: service.slug, packages };
  });
  const providers = await Promise.all(
    PROVIDERS.map(async (provider) => {
      const config = providerConfig(provider);
      const base = {
        provider,
        label: PROVIDER_LABELS[provider],
        mode: config.sandbox ? "sandbox" : "live",
        apiKeyConfigured: Boolean(config.apiKey),
        configured: config.configured,
      };
      if (!config.configured)
        return { ...base, connected: false, error: "Not configured" };
      try {
        const balance = await getProviderClient(provider).getBalance();
        return {
          ...base,
          connected: true,
          ...balance,
          lowBalance:
            balance.currency.toUpperCase() === "USD" && balance.balance < 25,
        };
      } catch {
        return {
          ...base,
          connected: false,
          error: "Balance check failed. Check provider credentials and credit.",
        };
      }
    }),
  );
  return NextResponse.json({
    ...providers.find((provider) => provider.provider === "peakerr"),
    providers,
    dispatchEnabled: dispatchEnabled(),
    routing,
  });
}
