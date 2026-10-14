/** Explicit customer DTO: never expose supplier IDs, internal reasons or processor references. */
export function customerOrder(order: {
  _id: unknown;
  platformId: string;
  platformLabel: string;
  category: string;
  qtyValue: number;
  targetLink: string;
  serviceKind: string;
  postsCovered?: number | null;
  comments?: string[];
  pollOption?: number | null;
  priceCents: number;
  refundedCents?: number;
  paymentSource: string;
  status: string;
  createdAt: Date;
  paymentConfirmedAt?: Date | null;
}) {
  return {
    _id: String(order._id),
    platformId: order.platformId,
    platformLabel: order.platformLabel,
    category: order.category,
    qtyValue: order.qtyValue,
    targetLink: order.targetLink,
    serviceKind: order.serviceKind,
    postsCovered: order.postsCovered,
    comments: order.comments || [],
    pollOption: order.pollOption,
    priceCents: order.priceCents,
    refundedCents: order.refundedCents || 0,
    paymentSource: order.paymentSource,
    status: order.status,
    createdAt: order.createdAt,
    paymentConfirmedAt: order.paymentConfirmedAt,
  };
}
