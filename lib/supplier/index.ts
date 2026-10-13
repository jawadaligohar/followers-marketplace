import type { SupplierClient, SubmitOrderInput, SubmitOrderResult, OrderStatusResult } from "./types";
import { MockSupplierClient } from "./mockSupplierClient";
import { PeakerrSupplierClient } from "./peakerrSupplierClient";

export function getSupplierClient(): SupplierClient {
  const apiKey = (process.env.PEAKERR_API_KEY || "").trim();
  const isSandbox = process.env.PEAKERR_SANDBOX === "true";

  if (apiKey || isSandbox) {
    return new PeakerrSupplierClient(apiKey || "peakerr-sandbox");
  }

  return new MockSupplierClient();
}

export function getPeakerrClient(): PeakerrSupplierClient {
  const apiKey = (process.env.PEAKERR_API_KEY || "").trim();
  return new PeakerrSupplierClient(apiKey || "peakerr-sandbox");
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
