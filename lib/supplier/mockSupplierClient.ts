import { randomUUID } from "crypto";
import type {
  SupplierClient,
  SubmitOrderResult,
  OrderStatusResult,
} from "./types";

export class MockSupplierClient implements SupplierClient {
  async submitOrder(): Promise<SubmitOrderResult> {
    return {
      supplierOrderId: `mock-${randomUUID()}`,
      status: "processing",
    };
  }

  async getOrderStatus(): Promise<OrderStatusResult> {
    return { status: "processing" };
  }
}
