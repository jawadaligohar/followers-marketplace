import type {
  SupplierClient,
  SubmitOrderInput,
  SubmitOrderResult,
  OrderStatusResult,
} from "./types";

// Not implemented yet -- no Peakerr account/API key exists at the time this was written.
// Peakerr's API is documented at https://peakerr.com/api (standard SMM-panel REST contract:
// POST with action=add for orders, action=status for status checks). Fill in the request/
// response mapping below once an API key is available; the rest of the app only depends on
// the SupplierClient interface in ./types, so no other files need to change.
export class PeakerrSupplierClient implements SupplierClient {
  constructor(private apiKey: string) {}

  async submitOrder(_input: SubmitOrderInput): Promise<SubmitOrderResult> {
    throw new Error("PeakerrSupplierClient.submitOrder is not implemented yet");
  }

  async getOrderStatus(_supplierOrderId: string): Promise<OrderStatusResult> {
    throw new Error("PeakerrSupplierClient.getOrderStatus is not implemented yet");
  }
}
