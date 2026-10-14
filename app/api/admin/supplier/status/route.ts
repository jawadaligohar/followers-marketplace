import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { getProviderClient } from "@/lib/supplier";
import {
  PROVIDERS,
  PROVIDER_LABELS,
  providerConfig,
} from "@/lib/supplier/providers";
export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  });
}
