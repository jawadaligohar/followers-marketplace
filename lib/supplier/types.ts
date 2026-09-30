export interface SubmitOrderInput {
  supplierServiceId: string;
  link: string;
  quantity: number;
}

export interface SubmitOrderResult {
  supplierOrderId: string;
  status: string;
}

export interface OrderStatusResult {
  status: string;
  remains?: number;
  startCount?: number;
}

export interface SupplierClient {
  submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult>;
  getOrderStatus(supplierOrderId: string): Promise<OrderStatusResult>;
}
