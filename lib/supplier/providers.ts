export const PROVIDERS = ["jap", "peakerr", "tiksta"] as const;
export type ProviderId = (typeof PROVIDERS)[number];
export type ProviderMappings = Partial<Record<ProviderId, string | null>>;
export const PROVIDER_LABELS: Record<ProviderId, string> = {
  jap: "JAP",
  peakerr: "Peakerr",
  tiksta: "Tiksta",
};
export const PROVIDER_ENDPOINTS: Record<ProviderId, string> = {
  jap: "https://justanotherpanel.com/api/v2",
  peakerr: "https://peakerr.com/api/v2",
  tiksta: "https://tiksta.com/api/v2",
};
export function providerConfig(provider: ProviderId) {
  const prefix = provider.toUpperCase();
  const apiKey = process.env[`${prefix}_API_KEY`]?.trim() || "";
  const sandbox = process.env[`${prefix}_SANDBOX`] === "true";
  return {
    apiKey,
    sandbox,
    configured: Boolean(apiKey || sandbox),
    endpoint: process.env[`${prefix}_API_BASE`] || PROVIDER_ENDPOINTS[provider],
  };
}

export function resolveProviderMapping(
  service: {
    platformId: string;
    defaultProvider?: ProviderId;
    providerMappings?: ProviderMappings;
    supplierServiceId?: string | null;
    tiers?: {
      qtyValue: number;
      defaultProvider?: ProviderId | null;
      providerMappings?: ProviderMappings;
    }[];
  },
  qtyValue: number,
  override?: ProviderId,
  overrideId?: string,
) {
  const tier = service.tiers?.find((tier) => tier.qtyValue === qtyValue);
  const provider =
    override || tier?.defaultProvider || service.defaultProvider || "peakerr";
  if (provider === "tiksta" && service.platformId !== "tiktok")
    throw new Error("Tiksta is only available for TikTok services");
  const serviceId =
    overrideId?.trim() ||
    tier?.providerMappings?.[provider]?.trim() ||
    service.providerMappings?.[provider]?.trim() ||
    (provider === "peakerr" ? service.supplierServiceId?.trim() : null) ||
    null;
  return { provider, serviceId };
}
