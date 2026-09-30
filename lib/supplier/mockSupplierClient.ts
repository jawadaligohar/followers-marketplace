import { randomUUID } from "crypto";
import type {
  SupplierClient,
  SubmitOrderInput,
  SubmitOrderResult,
  OrderStatusResult,
} from "./types";

export class MockSupplierClient implements SupplierClient {
  async submitOrder(_input: SubmitOrderInput): Promise<SubmitOrderResult> {
    return {
      supplierOrderId: `mock-${randomUUID()}`,
      status: "processing",
    };
  }

  async getOrderStatus(_supplierOrderId: string): Promise<OrderStatusResult> {
    return { status: "processing" };
  }
}
