import type {
  SupplierClient,
  SubmitOrderInput,
  SubmitOrderResult,
  OrderStatusResult,
} from "./types";
import { MockSupplierClient } from "./mockSupplierClient";
import { PeakerrSupplierClient } from "./peakerrSupplierClient";
import { providerConfig, type ProviderId } from "./providers";

export function getProviderClient(provider: ProviderId) {
  const config = providerConfig(provider);
  if (!config.configured) throw new Error(`${provider} is not configured`);
  return new PeakerrSupplierClient(config.apiKey, provider);
}

export function getSupplierClient(): SupplierClient {
  const apiKey = (process.env.PEAKERR_API_KEY || "").trim();
  const isSandbox = process.env.PEAKERR_SANDBOX === "true";

  if (apiKey || isSandbox) {
    return new PeakerrSupplierClient(apiKey || "peakerr-sandbox");
  }

  return new MockSupplierClient();
}

export function getPeakerrClient(): PeakerrSupplierClient {
  return getProviderClient("peakerr");
}

export const supplierClient: SupplierClient = {
  submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
    return getSupplierClient().submitOrder(input);
  },
  getOrderStatus(supplierOrderId: string): Promise<OrderStatusResult> {
    return getSupplierClient().getOrderStatus(supplierOrderId);
  },
};

export type { SupplierClient } from "./types";
export { PeakerrSupplierClient } from "./peakerrSupplierClient";
export { MockSupplierClient } from "./mockSupplierClient";
