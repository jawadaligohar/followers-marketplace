export interface SubmitOrderInput {
  supplierServiceId: string;
  link: string;
  quantity: number;
  /** Custom-comments services: one comment per entry. */
  comments?: string[];
  /** Poll services: which option receives the votes. */
  pollOption?: number;
  /** Auto (subscription) services: deliver `quantity` to each of the next `posts` posts. */
  subscription?: { username: string; posts: number };
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
